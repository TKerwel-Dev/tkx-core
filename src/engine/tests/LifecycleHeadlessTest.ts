import { GameEngine } from "../GameEngine.js";
import { EngineState } from "../LifecycleController.js";

/**
 * Headless Test for Engine Lifecycle (L1 Unified).
 * Verifies unified state machine transitions, start guards, and terminal shutdown.
 */
export function runLifecycleHeadlessTest() {
    const engine = new GameEngine();
    const assert = (condition: boolean, msg: string) => { if (!condition) throw new Error("FAIL: " + msg); };

    console.log("LifecycleHeadlessTest L1: Starting...");

    // 1) Initial state check
    assert(engine.lifecycle.currentState === EngineState.BOOT, "Engine must start in BOOT state");

    // 2-4) Valid transitions
    console.log("LifecycleHeadlessTest L1: Testing valid sequence...");
    engine.lifecycle.transition(EngineState.INIT, "Infrastruktur-Setup");
    engine.lifecycle.transition(EngineState.LOAD, "Asset-Laden");
    engine.lifecycle.transition(EngineState.READY, "System bereit");

    // 5) Start execution
    engine.start();

    // 6) Verify final running state
    assert(engine.lifecycle.currentState === EngineState.RUNNING, "Engine muss im RUNNING Zustand sein");

    // Negativ-Tests: Illegale Sprünge
    console.log("LifecycleHeadlessTest L1: Testing illegal transitions...");
    const engine2 = new GameEngine();
    try {
        engine2.lifecycle.transition(EngineState.LOAD, "SKIP INIT Test");
        throw new Error("Sollte Exception werfen bei ausgelassenem State");
    } catch (e: any) {
        assert(e.message.includes("Illegal Lifecycle transition"), "Fehlermeldung bei ungültigem Übergang erwartet");
    }

    // Negativ-Tests: Rückwärtssprünge
    try {
        engine.lifecycle.transition(EngineState.INIT, "BACK Test");
        throw new Error("Sollte Exception werfen bei Rückwärtssprung");
    } catch (e: any) {
        assert(e.message.includes("Illegal Lifecycle transition"), "Fehlermeldung bei Rückwärtssprung erwartet");
    }

    // Negativ-Tests: Start Guard
    const engine3 = new GameEngine();
    try {
        engine3.start(); // BOOT is not READY
        throw new Error("Sollte Exception werfen bei start() aus BOOT");
    } catch (e: any) {
        assert(e.message.includes("Engine loop may only start in READY state"), "Start-Guard Fehlermeldung erwartet");
    }

    // 7) Terminal Shutdown Test
    console.log("LifecycleHeadlessTest L1.1: Testing terminal shutdown...");
    const engine4 = new GameEngine();
    engine4.lifecycle.transition(EngineState.INIT, "Init");
    engine4.lifecycle.transition(EngineState.LOAD, "Load");
    engine4.lifecycle.transition(EngineState.READY, "Ready");
    engine4.start();
    engine4.shutdown("Test Shutdown");

    try {
        engine4.lifecycle.transition(EngineState.BOOT, "Illegal Reset");
        throw new Error("Should not allow transition after shutdown");
    } catch (e: any) {
        assert(
            e.message.includes("Engine is terminated"),
            "Expected terminal shutdown error"
        );
    }

    console.log("LifecycleHeadlessTest L1: All checks passed.");
    return true;
}

// Auto-run if executed directly
if (import.meta.url.endsWith(process.argv[1])) {
    try {
        runLifecycleHeadlessTest();
        console.log("\n=== GATE REPORT ===\nGate: Lifecycle L1.1 Terminal Shutdown\nStatus: PASS\nSingle State Authority: true\nShutdown Terminal: true\nIllegal Post-Shutdown Transitions Blocked: true\nIntegrity Violations: none\n===================");
        process.exit(0);
    } catch (err) {
        console.error("Test Failed:", err);
        process.exit(1);
    }
}
