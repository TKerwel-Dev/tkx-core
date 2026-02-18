import { GameEngine } from "../../src/engine/GameEngine.js";
import { formatGateReport } from "../../src/engine/IntegrityReport.js";

async function verify() {
    const engine = new GameEngine();

    // Checks before start
    const initialReport = engine.getReport();

    engine.start();

    // Wait for some ticks
    await new Promise(resolve => setTimeout(resolve, 100));

    const activeReport = engine.getReport();
    console.log(formatGateReport(activeReport));

    engine.stop();

    // Verification Logic
    let failed = false;
    const violations: string[] = [];

    if (activeReport.engineConstructed !== true) {
        violations.push("FAIL: engine.constructed !== true");
        failed = true;
    }
    if (activeReport.loopRunning !== true) {
        // Note: It was running when report was taken, but stop() might have been called.
        // But getReport was called before stop().
        violations.push("FAIL: engine.loopRunning !== true");
        failed = true;
    }
    if (activeReport.worldInstances !== 1) {
        violations.push(`FAIL: worldInstances (${activeReport.worldInstances}) !== 1`);
        failed = true;
    }
    if (!activeReport.registeredSystems) {
        violations.push("FAIL: registeredSystems missing");
        failed = true;
    }

    if (failed) {
        console.error("=== VERIFICATION FAILED ===");
        violations.forEach(v => console.error(v));
        process.exit(1);
    } else {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
