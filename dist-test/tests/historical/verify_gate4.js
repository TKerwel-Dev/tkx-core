"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("../../src/engine/GameEngine.js");
const IntegrityReport_js_1 = require("../../src/engine/IntegrityReport.js");
const SpawnGridSystem_js_1 = require("../../src/ecs/systems/SpawnGridSystem.js");
const InputSystem_js_1 = require("../../src/ecs/systems/InputSystem.js");
const MovementSystem_js_1 = require("../../src/ecs/systems/MovementSystem.js");
const CollisionSystem_js_1 = require("../../src/ecs/systems/CollisionSystem.js");
const CombatSystem_js_1 = require("../../src/ecs/systems/CombatSystem.js");
const VisualSystem_js_1 = require("../../src/ecs/systems/VisualSystem.js");
const UISystem_js_1 = require("../../src/ecs/systems/UISystem.js");
async function verify() {
    console.log("Starting Gate 4 Verification...");
    const engine = new GameEngine_js_1.GameEngine();
    // Register Systems
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.registry.register("UISystem", UISystem_js_1.UISystem);
    // Initialize
    engine.registry.runOnce(engine.world);
    engine.loopRunning = true;
    for (let i = 0; i < 4; i++) {
        engine.step();
    }
    const report = engine.getReport("Minimal UI (Query Only)");
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
    if (report.registeredSystems[report.registeredSystems.length - 1] !== "UISystem") {
        violations.push("FAIL: UISystem must be the last registered system");
        failed = true;
    }
    if (report.worldInstances !== 1) {
        violations.push(`FAIL: worldInstances (${report.worldInstances}) !== 1`);
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
