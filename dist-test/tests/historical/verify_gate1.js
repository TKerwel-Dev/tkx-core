"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("../../src/engine/GameEngine.js");
const IntegrityReport_js_1 = require("../../src/engine/IntegrityReport.js");
const SpawnGridSystem_js_1 = require("../../src/ecs/systems/SpawnGridSystem.js");
const VisualSystem_js_1 = require("../../src/ecs/systems/VisualSystem.js");
async function verify() {
    console.log("Starting Gate 1 Verification...");
    const engine = new GameEngine_js_1.GameEngine();
    // Register Systems
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.start();
    // Wait for ticks to process
    await new Promise(resolve => setTimeout(resolve, 100));
    const report = engine.getReport("Render Pipeline (ASCII)");
    console.log((0, IntegrityReport_js_1.formatGateReport)(report));
    engine.stop();
    // Verification Logic
    let failed = false;
    const violations = [];
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
    }
    else {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
}
verify().catch(err => {
    console.error(err);
    process.exit(1);
});
