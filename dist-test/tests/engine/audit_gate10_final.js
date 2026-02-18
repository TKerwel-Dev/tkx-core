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
async function runAudit() {
    const reportPath = path.resolve(process.cwd(), "output_audit_gate10_final.txt");
    const violations = [];
    let initRunCount = 0;
    // Metrics
    let pausedDelta = -1;
    let snapshotPerformed = false;
    let restorePerformed = false;
    let eventBusEmpty = false;
    console.log("Starting Gate 10 Final Audit...");
    const engine = new GameEngine_js_1.GameEngine();
    engine.maxTicks = 8; // Mandatory Hard Stop Budget
    // Register Systems
    engine.registry.register("DummySystem", (w, t) => { });
    engine.registry.registerOnce("InitSystem", (w, t) => { initRunCount++; });
    // Helper to wait for tick
    const waitForTick = async (target, timeoutMs = 3000) => {
        const start = Date.now();
        while (engine.tick < target) {
            if (Date.now() - start > timeoutMs)
                throw new Error(`Timeout waiting for tick ${target}. Current: ${engine.tick}`);
            if (engine.lifecycle.currentState === LifecycleController_js_1.EngineState.SHUTDOWN)
                throw new Error("Engine shutdown prematurely");
            await new Promise(r => setTimeout(r, 10));
        }
    };
    const waitForState = async (state, timeoutMs = 1000) => {
        const start = Date.now();
        while (engine.lifecycle.currentState !== state) {
            if (Date.now() - start > timeoutMs)
                throw new Error(`Timeout waiting for state ${state}. Current: ${engine.lifecycle.currentState}`);
            await new Promise(r => setTimeout(r, 10));
        }
    };
    try {
        // 1. Start (BOOT -> INIT_ONCE -> RUNNING)
        console.log("[1] Starting Engine...");
        engine.start();
        await waitForState(LifecycleController_js_1.EngineState.RUNNING);
        // 2. Wait for Tick 2
        console.log("[2] Waiting for Tick 2...");
        await waitForTick(2);
        // 3. Pause
        console.log("[3] Pausing...");
        engine.pause("audit_pause");
        await waitForState(LifecycleController_js_1.EngineState.PAUSED);
        // Verify Pause (Wait 500ms)
        const tickAtPause = engine.tick;
        await new Promise(r => setTimeout(r, 500));
        pausedDelta = engine.tick - tickAtPause;
        if (pausedDelta !== 0)
            violations.push(`Pause failed. Tick advanced by ${pausedDelta}`);
        // 4. Resume
        console.log("[4] Resuming...");
        engine.resume("audit_resume");
        await waitForState(LifecycleController_js_1.EngineState.RUNNING);
        // 5. Wait for Tick 3
        console.log("[5] Waiting for Tick 3...");
        await waitForTick(3);
        // 6. Snapshot
        console.log("[6] Snapshotting...");
        const snapshot = engine.performSnapshot("audit_snapshot");
        snapshotPerformed = !!snapshot;
        if (!snapshot)
            violations.push("Snapshot failed");
        // 7. Wait for Tick 4
        console.log("[7] Waiting for Tick 4...");
        await waitForTick(4);
        // 8. Restore
        console.log("[8] Restoring...");
        if (snapshot) {
            engine.performRestore(snapshot, "audit_restore_latest");
            restorePerformed = true;
            eventBusEmpty = engine.world.events['events'].length === 0;
            if (!eventBusEmpty)
                violations.push("EventBus not empty after restore");
        }
        // 9. Wait for Tick 5
        console.log("[9] Waiting for Tick 5...");
        await waitForTick(5); // This works even if tick regressed, assuming loop runs
        // 10. Shutdown
        console.log("[10] Shutting down...");
        engine.shutdown("audit_complete");
        await waitForState(LifecycleController_js_1.EngineState.SHUTDOWN);
        // Wait minor delay to ensure loop stops
        await new Promise(r => setTimeout(r, 100));
        // Final Validation
        if (engine.tick > 5) {
            // Strictly speaking "Tick 5" reached. If it overshoots to 6 before shutdown?
            // waitForTick returns when tick >= 5.
            // Shutdown immediately.
            // 100ms delay might allow 1 tick (60Hz = 16ms).
            // Ideally we want EXACTLY 5?
            // Prompt says: "Tick Count == 5 am Ende".
            // If loop runs fast, it might be 6.
            // How to ensure exactness?
            // "waitForTick(5)" returns AFTER tick becomes 5.
            // `shutdown` sets `loopRunning = false`.
            // Depending on where in `step` cycle, next step is prevented.
            // `step()` increments tick at END.
            // If `step` sees `SHUTDOWN` -> it won't run?
            // `GameEngine.ts`: `scheduleTick` -> `setTimeout` -> `step()` -> `runAll` -> `tick++`.
            // `shutdown` sets `loopRunning = false`.
            // `scheduleTick` won't reschedule.
            // But existing timeout might fire?
            // `setTimeout` lambda checks `loopRunning` AND `state !== SHUTDOWN`.
            // So if `shutdown` called, pending timeout aborts `step`.
            // So tick 5 is safe.
            // But if `waitForTick` caught it at 5, and loop was scheduled...
            // `shutdown` will block next step.
            // So tick should remain 5.
        }
    }
    catch (e) {
        violations.push(`Exception: ${e.message}`);
    }
    // Verify InitOnce
    if (initRunCount !== 1)
        violations.push(`InitRunCount expected 1, got ${initRunCount}`);
    // Verify State Log Logic match
    const log = engine.lifecycle.transitionLog;
    // Check specific transitions?
    // Start transitions
    if (!log.find(t => t.from === LifecycleController_js_1.EngineState.BOOT && t.to === LifecycleController_js_1.EngineState.INIT_ONCE))
        violations.push("Missing BOOT->INIT");
    // Snapshot
    if (!log.find(t => t.to === LifecycleController_js_1.EngineState.SNAPSHOTTING && t.reason === "audit_snapshot"))
        violations.push("Missing audit_snapshot transition");
    // Restore
    if (!log.find(t => t.to === LifecycleController_js_1.EngineState.RESTORING && t.reason === "audit_restore_latest"))
        violations.push("Missing audit_restore_latest transition");
    // Shutdown
    if (!log.find(t => t.to === LifecycleController_js_1.EngineState.SHUTDOWN && t.reason === "audit_complete"))
        violations.push("Missing audit_complete transition");
    // PASS Check
    const finalTick = engine.tick;
    // Allow strict 5?
    if (finalTick !== 5)
        violations.push(`Final Tick expected 5, got ${finalTick}`);
    const pass = violations.length === 0;
    const report = `=== GATE REPORT ===
Gate: Engine Lifecycle & State Control
Status: ${pass ? "PASS" : "FAIL"}
World Instances: 1
Engine Constructed: ${engine.constructed}
Loop Running: ${engine.loopRunning}
Current State: ${engine.lifecycle.currentState}
Tick Count: ${engine.tick}
MaxTicks Enabled: ${engine.maxTicks > 0}
MaxTicks Value: ${engine.maxTicks}
Stop Reason: ${engine.stopReason}
Paused Tick Count Delta: ${pausedDelta}
InitOnce Executed Once: ${initRunCount === 1}
Snapshot Performed: ${snapshotPerformed}
Restore Performed: ${restorePerformed}
EventBus Empty After Restore: ${eventBusEmpty}
State Transition Log:
${log.map(t => `- ${t.tick} ${t.from} -> ${t.to} (${t.reason})`).join("\n")}
Registered Systems: ${engine.registry.list().join(", ")}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations)}
===================`;
    console.log(report);
    fs.writeFileSync(reportPath, report);
    process.exit(pass ? 0 : 1);
}
runAudit().catch(e => {
    console.error(e);
    process.exit(1);
});
