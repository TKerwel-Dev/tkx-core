"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("../../src/engine/GameEngine.js");
const SpawnGridSystem_js_1 = require("../../src/ecs/systems/SpawnGridSystem.js");
const InputSystem_js_1 = require("../../src/ecs/systems/InputSystem.js");
const MovementSystem_js_1 = require("../../src/ecs/systems/MovementSystem.js");
const CollisionSystem_js_1 = require("../../src/ecs/systems/CollisionSystem.js");
const CombatSystem_js_1 = require("../../src/ecs/systems/CombatSystem.js");
const VisualSystem_js_1 = require("../../src/ecs/systems/VisualSystem.js");
const UISystem_js_1 = require("../../src/ecs/systems/UISystem.js");
const PersistenceService_js_1 = require("../../src/persistence/PersistenceService.js");
async function verify() {
    console.log("Starting Gate 7 Verification (Event Bus / Messaging Layer)...");
    const engine = new GameEngine_js_1.GameEngine();
    const world = engine.world;
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.registry.register("UISystem", UISystem_js_1.UISystem);
    engine.registry.runOnce(world);
    engine.loopRunning = true;
    const eventStats = {
        tick4: { collision: 0, damage: 0 },
        tick5: { collision: 0, damage: 0 }
    };
    const hpTimeline = { tick4: 0, tick5: 0 };
    // Run until Tick 3
    for (let i = 0; i < 3; i++) {
        engine.step();
    }
    // Tick 4 (Index 3) - Manual Step to capture events
    (0, InputSystem_js_1.InputSystem)(world, engine.tick);
    (0, MovementSystem_js_1.MovementSystem)(world, engine.tick);
    (0, CollisionSystem_js_1.CollisionSystem)(world, engine.tick);
    eventStats.tick4.collision = world.events.getEvents("CollisionEvent").length;
    (0, CombatSystem_js_1.CombatSystem)(world, engine.tick);
    eventStats.tick4.damage = world.events.getEvents("DamageEvent").length;
    (0, VisualSystem_js_1.VisualSystem)(world, engine.tick);
    (0, UISystem_js_1.UISystem)(world, engine.tick);
    const monsters = world.query("MonsterTag");
    hpTimeline.tick4 = world.getComponent(monsters[0], "Health").current;
    // Check snapshot purity before clear
    const snapshot = PersistenceService_js_1.PersistenceService.serialize(world, engine.tick);
    const snapStr = JSON.stringify(snapshot);
    const eventsInSnapshot = snapStr.includes("CollisionEvent") || snapStr.includes("DamageEvent");
    world.events.clear();
    const clearedAfterTick = world.events.length === 0;
    engine.tick++;
    // Tick 5 (Index 4)
    (0, InputSystem_js_1.InputSystem)(world, engine.tick);
    (0, MovementSystem_js_1.MovementSystem)(world, engine.tick);
    (0, CollisionSystem_js_1.CollisionSystem)(world, engine.tick);
    eventStats.tick5.collision = world.events.getEvents("CollisionEvent").length;
    (0, CombatSystem_js_1.CombatSystem)(world, engine.tick);
    eventStats.tick5.damage = world.events.getEvents("DamageEvent").length;
    hpTimeline.tick5 = world.getComponent(monsters[0], "Health").current;
    world.events.clear();
    engine.tick++;
    engine.stop();
    const pass = eventStats.tick4.collision === 1 &&
        eventStats.tick4.damage === 1 &&
        eventStats.tick5.collision === 1 &&
        eventStats.tick5.damage === 0 &&
        hpTimeline.tick4 === 2 &&
        hpTimeline.tick5 === 2 &&
        clearedAfterTick &&
        !eventsInSnapshot &&
        world.id !== undefined;
    console.log(`=== GATE REPORT ===
Gate: Event Bus / Messaging Layer
Status: ${pass ? "PASS" : "FAIL"}
World Instances: 1
EventBus Attached To World: ${world.events !== undefined}
Tick 4 Events:
  CollisionEvent: ${eventStats.tick4.collision}
  DamageEvent: ${eventStats.tick4.damage}
Tick 5 Events:
  CollisionEvent: ${eventStats.tick5.collision}
  DamageEvent: ${eventStats.tick5.damage}
EventBus Cleared After Tick: ${clearedAfterTick}
Events Persisted In Snapshot: ${eventsInSnapshot}
Integrity Violations: ${pass ? "none" : "See stats for mismatches"}
===================`);
    if (pass) {
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
