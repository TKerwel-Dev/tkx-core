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
const PersistenceService_js_1 = require("../../src/persistence/PersistenceService.js");
async function verify() {
    console.log("Starting Gate 5 Verification (Deterministic Persistence)...");
    const engine = new GameEngine_js_1.GameEngine();
    // Register Systems (Registry logic remains separate from persistence)
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.registry.register("UISystem", UISystem_js_1.UISystem);
    // 1. Initial Simulation
    engine.registry.runOnce(engine.world);
    engine.loopRunning = true;
    for (let i = 0; i < 4; i++) {
        engine.step();
    }
    engine.stop();
    // 2. Capture Original State
    const originalState = {
        tick: engine.tick,
        entityCount: engine.world.entityCount,
        snapshot: undefined
    };
    // 3. Serialize
    const snapshot = PersistenceService_js_1.PersistenceService.serialize(engine.world, engine.tick);
    originalState.snapshot = snapshot;
    // 4. Reset engine/world (without destroying instances)
    // We already stopped the loop. We'll use deserialize to restore.
    // 5. Deserialize into existing world instance
    PersistenceService_js_1.PersistenceService.deserialize(snapshot, engine.world);
    engine.tick = snapshot.tick;
    // 6. Verify and Report
    const report = (0, IntegrityReport_js_1.buildPersistenceReport)(engine, originalState);
    console.log((0, IntegrityReport_js_1.formatGateReport)(report));
    if (report.status === "PASS") {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
    else {
        console.error("=== VERIFICATION FAILED ===");
        if (Array.isArray(report.integrityViolations)) {
            report.integrityViolations.forEach(v => console.error(v));
        }
        process.exit(1);
    }
}
verify().catch(err => {
    console.error(err);
    process.exit(1);
});
