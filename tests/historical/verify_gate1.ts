import { GameEngine } from "../../src/engine/GameEngine.js";
import { formatGateReport } from "../../src/engine/IntegrityReport.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";

async function verify() {
    console.log("Starting Gate 1 Verification...");
    const engine = new GameEngine();

    // Register Systems
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("VisualSystem", VisualSystem);

    engine.start();

    // Wait for ticks to process
    await new Promise(resolve => setTimeout(resolve, 100));

    const report = engine.getReport("Render Pipeline (ASCII)");
    console.log(formatGateReport(report));

    engine.stop();

    // Verification Logic
    let failed = false;
    const violations: string[] = [];

    if (report.status === "FAIL") {
        failed = true;
        if (Array.isArray(report.integrityViolations)) {
            violations.push(...report.integrityViolations);
        }
    }

    if (report.entityCount !== 102) {
        violations.push(`FAIL: entityCount (${report.entityCount}) !== 102`);
        failed = true;
    }

    if (report.renderableCount !== 102) {
        violations.push(`FAIL: renderableCount (${report.renderableCount}) !== 102`);
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
