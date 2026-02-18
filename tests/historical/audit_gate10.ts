
import { GameEngine } from "../../src/engine/GameEngine.js";
import { EngineState } from "../../src/engine/LifecycleController.js";
import { PersistenceService } from "../../src/persistence/PersistenceService.js";

async function runAudit() {
    console.log("Starting Gate 10 Audit...");
    const engine = new GameEngine();

    // Register Dummy Systems
    engine.registry.register("DummySystem", (w, t) => { });
    engine.registry.registerOnce("InitSystem", (w, t) => { });

    // Override tickRate to be fast but controllable if possible, 
    // or just rely on sufficient waits. 
    // Default 60Hz = ~16ms.

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

    // Helper to wait for state
    const waitForState = async (state: EngineState, timeoutMs: number = 1000) => {
        const start = Date.now();
        while (engine.lifecycle.currentState !== state) {
            if (Date.now() - start > timeoutMs) throw new Error(`Timeout waiting for state ${state}. Current: ${engine.lifecycle.currentState}`);
            await new Promise(r => setTimeout(r, 10));
        }
    };

    try {
        // 1. Boot -> Start
        console.log("[1] Starting Engine...");
        engine.start();

        // Verify INIT_ONCE transition happened (log)
        await waitForState(EngineState.RUNNING);

        const log = engine.lifecycle.transitionLog;
        if (!log.find(t => t.from === EngineState.BOOT && t.to === EngineState.INIT_ONCE)) {
            violations.push("Missing transition BOOT -> INIT_ONCE");
        }
        if (!log.find(t => t.from === EngineState.INIT_ONCE && t.to === EngineState.RUNNING)) {
            violations.push("Missing transition INIT_ONCE -> RUNNING");
        }

        // 2. Run 2 ticks
        console.log("[2] Running 2 ticks...");
        await waitForTick(2);

        // 3. Pause
        console.log("[3] Pausing...");
        const tickAtPause = engine.tick;
        engine.pause();
        await waitForState(EngineState.PAUSED);

        // 4. Ensure no ticks (wait 100ms, approx 6 ticks)
        console.log("[4] Verify Pause (sleeping 100ms)...");
        await new Promise(r => setTimeout(r, 100));
        if (engine.tick !== tickAtPause) {
            violations.push(`Tick advanced during PAUSE! ${tickAtPause} -> ${engine.tick}`);
        }

        // 5. Resume
        console.log("[5] Resuming...");
        engine.resume();
        await waitForState(EngineState.RUNNING);

        // 6. Run 1 tick
        await waitForTick(tickAtPause + 1);

        // 7. Snapshot
        console.log("[6] Snapshotting...");
        const snapTick = engine.tick;
        const snapshot = engine.performSnapshot();
        if (!snapshot) violations.push("Snapshot failed (returned null)");

        // Verify transitions: RUNNING -> SNAPSHOTTING -> RUNNING
        const snapEntry = log.find(t => t.to === EngineState.SNAPSHOTTING && t.tick >= snapTick);
        const snapExit = log.find(t => t.from === EngineState.SNAPSHOTTING && t.to === EngineState.RUNNING && t.tick >= snapTick);

        if (!snapEntry) violations.push("Missing transition -> SNAPSHOTTING");
        if (!snapExit) violations.push("Missing transition SNAPSHOTTING -> RUNNING");

        // 8. Run 1 tick
        const tickAfterSnap = engine.tick;
        await waitForTick(tickAfterSnap + 1);

        // 9. Restore
        console.log("[7] Restoring...");
        if (snapshot) {
            engine.performRestore(snapshot);
            // Verify Restore
            // Tick should rewind to snapshot tick?
            // Snapshot was taken at `snapTick`.
            // Current tick is `tickAfterSnap + 1` (probably snapTick + 1 or 2).
            // restore(snapshot) sets `this.tick = snapshot.tick`.
            if (engine.tick !== snapshot.tick) {
                violations.push(`Tick did not restore correctly. Expected ${snapshot.tick}, got ${engine.tick}`);
            }
        }

        // Verify transitions: RUNNING -> RESTORING -> RUNNING
        const restoreEntry = log.find(t => t.to === EngineState.RESTORING);
        if (!restoreEntry) violations.push("Missing transition -> RESTORING");

        // 10. Run 1 tick
        console.log("[8] Running 1 tick after restore...");
        await waitForTick(engine.tick + 1);

        // 11. Shutdown
        console.log("[9] Shutting down...");
        engine.shutdown("Audit Complete");
        await waitForState(EngineState.SHUTDOWN);

        // Loop should stop
        await new Promise(r => setTimeout(r, 100));
        const finalTick = engine.tick;
        await new Promise(r => setTimeout(r, 100));
        if (engine.tick !== finalTick) {
            violations.push("Tick advanced after SHUTDOWN");
        }

        if (engine.loopRunning) {
            violations.push("loopRunning is true after SHUTDOWN");
        }

    } catch (e: any) {
        violations.push(`Exception during audit: ${e.message}`);
    }

    // Final Report
    const pass = violations.length === 0;

    console.log(`
=== GATE REPORT ===
Gate: Engine Lifecycle & State Control
Status: ${pass ? "PASS" : "FAIL"}
World Instances: 1
Engine Constructed: ${engine.constructed}
Loop Running: ${engine.loopRunning}
Current State: ${engine.lifecycle.currentState}
Tick Count: ${engine.tick}
MaxTicks Enabled: ${engine.maxTicks > 0}
Stop Reason: ${engine.stopReason}
State Transition Log:
${engine.lifecycle.transitionLog.map(t => `- ${t.tick} ${t.from} -> ${t.to} (${t.reason})`).join("\n")}
Registered Systems: ${engine.registry.list().join(", ")}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations)}
===================
`);

    process.exit(pass ? 0 : 1);
}

runAudit().catch(e => {
    console.error(e);
    process.exit(1);
});
