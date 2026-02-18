"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleController = exports.EngineState = void 0;
var EngineState;
(function (EngineState) {
    EngineState["BOOT"] = "BOOT";
    EngineState["INIT_ONCE"] = "INIT_ONCE";
    EngineState["RUNNING"] = "RUNNING";
    EngineState["PAUSED"] = "PAUSED";
    EngineState["SNAPSHOTTING"] = "SNAPSHOTTING";
    EngineState["RESTORING"] = "RESTORING";
    EngineState["SHUTDOWN"] = "SHUTDOWN";
})(EngineState || (exports.EngineState = EngineState = {}));
class LifecycleController {
    currentState = EngineState.BOOT;
    transitionLog = [];
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    transition(to, reason) {
        const from = this.currentState;
        let valid = false;
        switch (from) {
            case EngineState.BOOT:
                valid = (to === EngineState.INIT_ONCE);
                break;
            case EngineState.INIT_ONCE:
                valid = (to === EngineState.RUNNING); // INIT_ONCE -> RUNNING
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
            console.error(`Invalid Lifecycle Transition: ${from} -> ${to} (${reason})`);
            return false;
        }
        this.transitionLog.push({
            tick: this.engine.tick,
            from: from,
            to: to,
            reason: reason
        });
        this.currentState = to;
        return true;
    }
}
exports.LifecycleController = LifecycleController;
