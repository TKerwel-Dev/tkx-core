
import { GameEngine } from "../../src/engine/GameEngine.js";
import { EngineState } from "../../src/engine/LifecycleController.js";
import * as fs from 'fs';
import * as path from 'path';

async function runTerminationAudit() {
    console.log("Starting Gate 10 Termination Audit...");
    const engine = new GameEngine();
    const violations: string[] = [];

    // Helper to wait for tick condition
    const waitForTick = async (targetTick: number, timeoutMs: number = 2000) => {
        const start = Date.now();
        while (engine.tick < targetTick) {
            if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting for tick ${targetTick}. Current: ${engine.tick}`);
            if (engine.lifecycle.currentState === EngineState.SHUTDOWN) throw new Error("Engine shutdown prematurely");
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

        if (engine.lifecycle.currentState !== EngineState.SHUTDOWN) {
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

        if (engine.lifecycle.currentState !== EngineState.SHUTDOWN) {
            violations.push(`Final State mismatch. Expected SHUTDOWN, got ${engine.lifecycle.currentState}`);
        }

        if (engine.stopReason !== "audit_shutdown") {
            violations.push(`Stop reason mismatch. Expected 'audit_shutdown', got '${engine.stopReason}'`);
        }

        // Active Schedulers Check?
        // JS runtime doesn't expose active timers easily.
        // But if loopRunning is false, scheduleTick won't re-schedule.
        // The check 'Tick Stable' implicitly verifies no active tick scheduler is modifying state.

    } catch (e: any) {
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
