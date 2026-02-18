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
async function verify() {
    console.log("Starting Gate 3 Verification (Deterministic)...");
    const engine = new GameEngine_js_1.GameEngine();
    // Register Systems in order
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    // Initialize (Run SpawnGridSystem)
    engine.registry.runOnce(engine.world);
    // Start simulation
    engine.loopRunning = true;
    // Run exactly 4 ticks (0, 1, 2, 3)
    // Tick 0: Move to (4,5)
    // Tick 1: Move to (3,5)
    // Tick 2: Move to (3,4)
    // Tick 3: Move to (3,3) -> Collision -> Intent -> Damage
    for (let i = 0; i < 4; i++) {
        engine.step();
    }
    const report = engine.getReport("Interaction / Combat Intent (Simulated)");
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
    // Double check monster HP
    const monsters = engine.world.query("MonsterTag");
    const monsterHP = engine.world.getComponent(monsters[0], "Health");
    if (monsterHP.current !== 2) {
        violations.push(`FAIL: Monster HP (${monsterHP.current}) !== 2`);
        failed = true;
    }
    // Ensure no CombatIntents left
    const intents = engine.world.query("CombatIntent");
    if (intents.length > 0) {
        violations.push(`FAIL: ${intents.length} CombatIntents still exist`);
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
