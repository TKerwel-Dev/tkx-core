import { World } from "./World.js";
import { SystemRegistry } from "./SystemRegistry.js";
import { GateReport, buildGateReport } from "./IntegrityReport.js";
import { LifecycleController, EngineState } from "./LifecycleController.js";
import { PersistenceService, Snapshot } from "../persistence/PersistenceService.js";
import { AudioSubsystem } from "./AudioSubsystem.js";

export class GameEngine {
    public readonly constructed: boolean = true;
    public loopRunning: boolean = false;
    public readonly world: World;
    public readonly registry: SystemRegistry;
    public readonly lifecycle: LifecycleController;
    private audio: AudioSubsystem;
    public readonly tickRate: number = 60;

    public tick: number = 0;
    public maxTicks: number = -1; // -1 = Infinite
    public stopReason: string = "";

    constructor() {
        this.world = new World();
        this.registry = new SystemRegistry();
        this.lifecycle = new LifecycleController(this);
        this.audio = new AudioSubsystem(this.world.events);
    }

    public start(): void {
        // Start Guard: Must be in READY state to start the loop
        if (this.lifecycle.currentState !== EngineState.READY) {
            throw new Error(`Engine loop may only start in READY state. Current state: ${this.lifecycle.currentState}`);
        }

        // READY -> RUNNING
        if (!this.lifecycle.transition(EngineState.RUNNING, "Engine Start")) return;

        // Run all initialization systems exactly once (Legacy mapping to INIT_ONCE behavior if needed)
        // Note: In L1, systems might be partitioned across INIT/LOAD/READY phases later.
        this.registry.runOnce(this.world);

        this.loopRunning = true;
        this.scheduleTick();
    }

    private scheduleTick(): void {
        if (!this.loopRunning || this.lifecycle.currentState === EngineState.SHUTDOWN) return;

        setTimeout(() => {
            if (this.loopRunning && this.lifecycle.currentState !== EngineState.SHUTDOWN) {
                this.step();
                this.scheduleTick();
            }
        }, 1000 / this.tickRate);
    }

    public stop(): void {
        this.shutdown("Stop Requested");
    }

    public step(): void {
        if (!this.loopRunning) return;

        // Check if limit reached
        if (this.maxTicks > 0 && this.tick >= this.maxTicks) {
            this.shutdown("Max Ticks Reached");
            return;
        }

        const state = this.lifecycle.currentState;

        if (state === EngineState.PAUSED) {
            // Idle, no update
            return;
        }

        if (state === EngineState.RUNNING) {
            this.registry.runAll(this.world, this.tick);
            this.world.events.clear();
            this.tick++;
        }
    }

    public pause(reason: string = "User Request"): void {
        if (this.lifecycle.currentState === EngineState.RUNNING) {
            this.lifecycle.transition(EngineState.PAUSED, reason);
        }
    }

    public resume(reason: string = "User Request"): void {
        if (this.lifecycle.currentState === EngineState.PAUSED) {
            this.lifecycle.transition(EngineState.RUNNING, reason);
        }
    }

    public shutdown(reason: string = "User Request"): void {
        if (this.lifecycle.currentState !== EngineState.SHUTDOWN) {
            // Can transition from RUNNING or PAUSED
            this.lifecycle.transition(EngineState.SHUTDOWN, reason);
        }
        this.stopReason = reason;
        this.loopRunning = false;
    }

    public performSnapshot(reason: string = "Snapshot Requested"): Snapshot | null {
        if (this.lifecycle.currentState !== EngineState.RUNNING) return null;

        // RUNNING -> SNAPSHOTTING
        if (!this.lifecycle.transition(EngineState.SNAPSHOTTING, reason)) return null;

        const snapshot = PersistenceService.serialize(this.world, this.tick);

        // SNAPSHOTTING -> RUNNING
        this.lifecycle.transition(EngineState.RUNNING, "Snapshot Complete");

        return snapshot;
    }

    public performRestore(snapshot: Snapshot, reason: string = "Restore Requested"): void {
        if (this.lifecycle.currentState !== EngineState.RUNNING) return;

        // RUNNING -> RESTORING
        if (!this.lifecycle.transition(EngineState.RESTORING, reason)) return;

        // Restore logic
        PersistenceService.deserialize(snapshot, this.world);
        this.tick = snapshot.tick;
        this.world.events.clear(); // Clear ephemeral events

        // RESTORING -> RUNNING
        this.lifecycle.transition(EngineState.RUNNING, "Restore Complete");
    }

    public getReport(gateName: string = "Gate 1"): GateReport {
        return buildGateReport(this, gateName);
    }
}
