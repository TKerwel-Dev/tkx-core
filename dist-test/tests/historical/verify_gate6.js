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
    console.log("Starting Gate 6 Verification (Combat Stabilization)...");
    const engine = new GameEngine_js_1.GameEngine();
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.registry.register("UISystem", UISystem_js_1.UISystem);
    engine.registry.runOnce(engine.world);
    engine.loopRunning = true;
    const intentsPerTick = { tick4: 0, tick5: 0, tick6: 0 };
    const hpTimeline = { tick4: 0, tick5: 0, tick6: 0 };
    // Run until Tick 3
    for (let i = 0; i < 3; i++) {
        engine.step();
    }
    // Tick 4 (Index 3)
    const world = engine.world;
    const monsters = world.query("MonsterTag");
    // Instead of runAll, run one by one to capture transient state
    (0, InputSystem_js_1.InputSystem)(world, engine.tick);
    (0, MovementSystem_js_1.MovementSystem)(world, engine.tick);
    (0, CollisionSystem_js_1.CollisionSystem)(world, engine.tick);
    intentsPerTick.tick4 = world.query("CombatIntent").length;
    (0, CombatSystem_js_1.CombatSystem)(world, engine.tick);
    (0, VisualSystem_js_1.VisualSystem)(world, engine.tick);
    (0, UISystem_js_1.UISystem)(world, engine.tick);
    hpTimeline.tick4 = world.getComponent(monsters[0], "Health").current;
    const snapshot = PersistenceService_js_1.PersistenceService.serialize(world, engine.tick);
    engine.tick++;
    // Ticks 5 and 6
    for (let t = 4; t <= 5; t++) {
        const currentTick = engine.tick;
        (0, InputSystem_js_1.InputSystem)(world, currentTick);
        (0, MovementSystem_js_1.MovementSystem)(world, currentTick);
        (0, CollisionSystem_js_1.CollisionSystem)(world, currentTick);
        const count = world.query("CombatIntent").length;
        if (t === 4)
            intentsPerTick.tick5 = count;
        if (t === 5)
            intentsPerTick.tick6 = count;
        (0, CombatSystem_js_1.CombatSystem)(world, currentTick);
        (0, VisualSystem_js_1.VisualSystem)(world, currentTick);
        (0, UISystem_js_1.UISystem)(world, currentTick);
        const mHP = world.getComponent(monsters[0], "Health").current;
        if (t === 4)
            hpTimeline.tick5 = mHP;
        if (t === 5)
            hpTimeline.tick6 = mHP;
        engine.tick++;
    }
    engine.stop();
    // Capture Snapshot at contact (Tick 4)
    // Analyze Snapshot captured at Tick 4 (when lock was set)
    const snapStr = JSON.stringify(snapshot);
    const snapshotContainsLock = snapStr.includes("ContactLock");
    const snapshotExcludedIntents = !snapStr.includes("CombatIntent");
    const results = {
        intentsPerTick,
        hpTimeline,
        snapshotContainsLock,
        snapshotExcludedIntents
    };
    const report = (0, IntegrityReport_js_1.buildCombatStabilizationReport)(engine, results);
    console.log((0, IntegrityReport_js_1.formatGateReport)(report));
    if (report.status === "PASS") {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
    else {
        console.error("=== VERIFICATION FAILED ===");
        process.exit(1);
    }
}
verify().catch(err => {
    console.error(err);
    process.exit(1);
});
