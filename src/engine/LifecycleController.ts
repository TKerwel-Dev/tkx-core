import type { GameEngine } from "./GameEngine.js";

export enum EngineState {
    BOOT = "BOOT",
    INIT = "INIT",
    LOAD = "LOAD",
    READY = "READY",
    RUNNING = "RUNNING",
    PAUSED = "PAUSED",
    SNAPSHOTTING = "SNAPSHOTTING",
    RESTORING = "RESTORING",
    SHUTDOWN = "SHUTDOWN"
}

export interface StateTransition {
    tick: number;
    from: EngineState;
    to: EngineState;
    reason: string;
}

export class LifecycleController {
    public currentState: EngineState = EngineState.BOOT;
    public transitionLog: StateTransition[] = [];
    private engine: GameEngine;

    constructor(engine: GameEngine) {
        this.engine = engine;
    }

    public transition(to: EngineState, reason: string): boolean {
        if (this.currentState === EngineState.SHUTDOWN) {
            throw new Error("Engine is terminated. Create a new GameEngine instance.");
        }

        const from = this.currentState;
        let valid = false;

        switch (from) {
            case EngineState.BOOT:
                valid = (to === EngineState.INIT);
                break;
            case EngineState.INIT:
                valid = (to === EngineState.LOAD);
                break;
            case EngineState.LOAD:
                valid = (to === EngineState.READY);
                break;
            case EngineState.READY:
                valid = (to === EngineState.RUNNING);
                break;
            case EngineState.RUNNING:
                valid = (to === EngineState.PAUSED ||
                    to === EngineState.SNAPSHOTTING ||
                    to === EngineState.RESTORING ||
                    to === EngineState.SHUTDOWN);
                break;
            case EngineState.PAUSED:
                valid = (to === EngineState.RUNNING || to === EngineState.SHUTDOWN);
                break;
            case EngineState.SNAPSHOTTING:
                valid = (to === EngineState.RUNNING);
                break;
            case EngineState.RESTORING:
                valid = (to === EngineState.RUNNING);
                break;
            case EngineState.SHUTDOWN:
                valid = false;
                break;
        }

        if (!valid) {
            throw new Error(`Illegal Lifecycle transition: ${from} -> ${to} (${reason})`);
        }

        this.transitionLog.push({
            tick: this.engine.tick,
            from: from,
            to: to,
            reason: reason
        });

        console.log(`[Lifecycle] ${from} → ${to} (${reason})`);
        this.currentState = to;
        return true;
    }
}
