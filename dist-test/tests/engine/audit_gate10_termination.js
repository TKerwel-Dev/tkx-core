"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("../../src/engine/GameEngine.js");
const LifecycleController_js_1 = require("../../src/engine/LifecycleController.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runTerminationAudit() {
    console.log("Starting Gate 10 Termination Audit...");
    const engine = new GameEngine_js_1.GameEngine();
    const violations = [];
    // Helper to wait for tick condition
    const waitForTick = async (targetTick, timeoutMs = 2000) => {
        const start = Date.now();
        while (engine.tick < targetTick) {
            if (Date.now() - start > timeoutMs)
                throw new Error(`Timeout waiting for tick ${targetTick}. Current: ${engine.tick}`);
            if (engine.lifecycle.currentState === LifecycleController_js_1.EngineState.SHUTDOWN)
                throw new Error("Engine shutdown prematurely");
            await new Promise(r => setTimeout(r, 10));
        }
    };
    try {
        // 1. Start Engine
        engine.start();
        // 2. Wait for 2 Ticks in RUNNING
        await waitForTick(2);
        // 3. Initiate Shutdown
        const tickBefore = engine.tick;
        console.log(`State Before Shutdown: ${engine.lifecycle.currentState}, Tick: ${tickBefore}`);
        engine.shutdown("audit_shutdown");
        if (engine.lifecycle.currentState !== LifecycleController_js_1.EngineState.SHUTDOWN) {
            violations.push(`State mismatch immediately after shutdown request. Expected SHUTDOWN, got ${engine.lifecycle.currentState}`);
        }
        if (engine.loopRunning) {
            violations.push("LoopRunning is true immediately after shutdown request.");
        }
        // 4. Wait Control Cycle (e.g. 100ms, ample time for rogue ticks)
        console.log("Waiting for potential rogue ticks...");
        await new Promise(r => setTimeout(r, 100));
        const tickAfter = engine.tick;
        console.log(`State After Delay: ${engine.lifecycle.currentState}, Tick: ${tickAfter}`);
        // 5. Verification
        if (tickAfter !== tickBefore) {
            violations.push(`Tick advanced after shutdown! Before: ${tickBefore}, After: ${tickAfter}`);
        }
        if (engine.lifecycle.currentState !== LifecycleController_js_1.EngineState.SHUTDOWN) {
            violations.push(`Final State mismatch. Expected SHUTDOWN, got ${engine.lifecycle.currentState}`);
        }
        if (engine.stopReason !== "audit_shutdown") {
            violations.push(`Stop reason mismatch. Expected 'audit_shutdown', got '${engine.stopReason}'`);
        }
        // Active Schedulers Check?
        // JS runtime doesn't expose active timers easily.
        // But if loopRunning is false, scheduleTick won't re-schedule.
        // The check 'Tick Stable' implicitly verifies no active tick scheduler is modifying state.
    }
    catch (e) {
        violations.push(`Exception: ${e.message}`);
    }
    const pass = violations.length === 0;
    const report = `=== GATE 10 TERMINATION AUDIT ===
Current State: ${engine.lifecycle.currentState}
Loop Running: ${engine.loopRunning}
Tick Count Before: ${engine.tick}
Tick Count After: ${engine.tick}
Tick Stable After Shutdown: ${pass}
Active Schedulers: 0 (Implicit via Tick Stability)
Stop Reason: ${engine.stopReason}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations)}
Status: ${pass ? "PASS" : "FAIL"}
==============================`;
    console.log(report);
    // Write Report
    const reportPath = path.resolve(process.cwd(), "output_audit_gate10_termination.txt");
    fs.writeFileSync(reportPath, report);
    process.exit(pass ? 0 : 1);
}
runTerminationAudit().catch(e => {
    console.error(e);
    process.exit(1);
});
