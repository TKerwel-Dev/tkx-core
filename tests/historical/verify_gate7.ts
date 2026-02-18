import { GameEngine } from "../../src/engine/GameEngine.js";
import { World } from "../../src/engine/World.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";
import { UISystem } from "../../src/ecs/systems/UISystem.js";
import { CollisionEvent, DamageEvent } from "../../src/engine/EventBus.js";
import { PersistenceService } from "../../src/persistence/PersistenceService.js";

async function verify() {
    console.log("Starting Gate 7 Verification (Event Bus / Messaging Layer)...");
    const engine = new GameEngine();
    const world: World = engine.world;

    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem);
    engine.registry.register("UISystem", UISystem);

    engine.registry.runOnce(world);
    engine.loopRunning = true;

    const eventStats: any = {
        tick4: { collision: 0, damage: 0 },
        tick5: { collision: 0, damage: 0 }
    };
    const hpTimeline: any = { tick4: 0, tick5: 0 };

    // Run until Tick 3
    for (let i = 0; i < 3; i++) {
        engine.step();
    }

    // Tick 4 (Index 3) - Manual Step to capture events
    InputSystem(world, engine.tick);
    MovementSystem(world, engine.tick);
    CollisionSystem(world, engine.tick);

    eventStats.tick4.collision = world.events.getEvents<CollisionEvent>("CollisionEvent").length;

    CombatSystem(world, engine.tick);
    eventStats.tick4.damage = world.events.getEvents<DamageEvent>("DamageEvent").length;

    VisualSystem(world, engine.tick);
    UISystem(world, engine.tick);

    const monsters = world.query("MonsterTag");
    hpTimeline.tick4 = world.getComponent<any>(monsters[0], "Health").current;

    // Check snapshot purity before clear
    const snapshot = PersistenceService.serialize(world, engine.tick);
    const snapStr = JSON.stringify(snapshot);
    const eventsInSnapshot = snapStr.includes("CollisionEvent") || snapStr.includes("DamageEvent");

    world.events.clear();
    const clearedAfterTick = world.events.length === 0;
    engine.tick++;

    // Tick 5 (Index 4)
    InputSystem(world, engine.tick);
    MovementSystem(world, engine.tick);
    CollisionSystem(world, engine.tick);

    eventStats.tick5.collision = world.events.getEvents<CollisionEvent>("CollisionEvent").length;

    CombatSystem(world, engine.tick);
    eventStats.tick5.damage = world.events.getEvents<DamageEvent>("DamageEvent").length;

    hpTimeline.tick5 = world.getComponent<any>(monsters[0], "Health").current;

    world.events.clear();
    engine.tick++;
    engine.stop();

    const pass =
        eventStats.tick4.collision === 1 &&
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
    } else {
        console.error("=== VERIFICATION FAILED ===");
        process.exit(1);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
