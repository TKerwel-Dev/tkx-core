"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const World_js_1 = require("./World.js");
const SystemRegistry_js_1 = require("./SystemRegistry.js");
const IntegrityReport_js_1 = require("./IntegrityReport.js");
const LifecycleController_js_1 = require("./LifecycleController.js");
const PersistenceService_js_1 = require("../persistence/PersistenceService.js");
class GameEngine {
    constructed = true;
    loopRunning = false;
    world;
    registry;
    lifecycle;
    tickRate = 60;
    tick = 0;
    maxTicks = -1; // -1 = Infinite
    stopReason = "";
    constructor() {
        this.world = new World_js_1.World();
        this.registry = new SystemRegistry_js_1.SystemRegistry();
        this.lifecycle = new LifecycleController_js_1.LifecycleController(this);
    }
    start() {
        if (this.lifecycle.currentState !== LifecycleController_js_1.EngineState.BOOT) {
            console.error("Engine already started or in invalid state for start().");
            return;
        }
        // BOOT -> INIT_ONCE
        if (!this.lifecycle.transition(LifecycleController_js_1.EngineState.INIT_ONCE, "Engine Start"))
            return;
        // Run all initialization systems exactly once
        this.registry.runOnce(this.world);
        // INIT_ONCE -> RUNNING
        if (!this.lifecycle.transition(LifecycleController_js_1.EngineState.RUNNING, "Initialization Complete"))
            return;
        this.loopRunning = true;
        this.scheduleTick();
    }
    scheduleTick() {
        if (!this.loopRunning || this.lifecycle.currentState === LifecycleController_js_1.EngineState.SHUTDOWN)
            return;
        setTimeout(() => {
            if (this.loopRunning && this.lifecycle.currentState !== LifecycleController_js_1.EngineState.SHUTDOWN) {
                this.step();
                this.scheduleTick();
            }
        }, 1000 / this.tickRate);
    }
    stop() {
        this.shutdown("Stop Requested");
    }
    step() {
        if (!this.loopRunning)
            return;
        // Check if limit reached
        if (this.maxTicks > 0 && this.tick >= this.maxTicks) {
            this.shutdown("Max Ticks Reached");
            return;
        }
        const state = this.lifecycle.currentState;
        if (state === LifecycleController_js_1.EngineState.PAUSED) {
            // Idle, no update
            return;
        }
        if (state === LifecycleController_js_1.EngineState.RUNNING) {
            this.registry.runAll(this.world, this.tick);
            this.world.events.clear();
            this.tick++;
        }
    }
    pause(reason = "User Request") {
        if (this.lifecycle.currentState === LifecycleController_js_1.EngineState.RUNNING) {
            this.lifecycle.transition(LifecycleController_js_1.EngineState.PAUSED, reason);
        }
    }
    resume(reason = "User Request") {
        if (this.lifecycle.currentState === LifecycleController_js_1.EngineState.PAUSED) {
            this.lifecycle.transition(LifecycleController_js_1.EngineState.RUNNING, reason);
        }
    }
    shutdown(reason = "User Request") {
        if (this.lifecycle.currentState !== LifecycleController_js_1.EngineState.SHUTDOWN) {
            // Can transition from RUNNING or PAUSED
            this.lifecycle.transition(LifecycleController_js_1.EngineState.SHUTDOWN, reason);
        }
        this.stopReason = reason;
        this.loopRunning = false;
    }
    performSnapshot(reason = "Snapshot Requested") {
        if (this.lifecycle.currentState !== LifecycleController_js_1.EngineState.RUNNING)
            return null;
        // RUNNING -> SNAPSHOTTING
        if (!this.lifecycle.transition(LifecycleController_js_1.EngineState.SNAPSHOTTING, reason))
            return null;
        const snapshot = PersistenceService_js_1.PersistenceService.serialize(this.world, this.tick);
        // SNAPSHOTTING -> RUNNING
        this.lifecycle.transition(LifecycleController_js_1.EngineState.RUNNING, "Snapshot Complete");
        return snapshot;
    }
    performRestore(snapshot, reason = "Restore Requested") {
        if (this.lifecycle.currentState !== LifecycleController_js_1.EngineState.RUNNING)
            return;
        // RUNNING -> RESTORING
        if (!this.lifecycle.transition(LifecycleController_js_1.EngineState.RESTORING, reason))
            return;
        // Restore logic
        PersistenceService_js_1.PersistenceService.deserialize(snapshot, this.world);
        this.tick = snapshot.tick;
        this.world.events.clear(); // Clear ephemeral events
        // RESTORING -> RUNNING
        this.lifecycle.transition(LifecycleController_js_1.EngineState.RUNNING, "Restore Complete");
    }
    getReport(gateName = "Gate 1") {
        return (0, IntegrityReport_js_1.buildGateReport)(this, gateName);
    }
}
exports.GameEngine = GameEngine;
