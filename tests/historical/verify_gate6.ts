import { GameEngine } from "../../src/engine/GameEngine.js";
import { buildCombatStabilizationReport, formatGateReport } from "../../src/engine/IntegrityReport.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";
import { UISystem } from "../../src/ecs/systems/UISystem.js";
import { PersistenceService } from "../../src/persistence/PersistenceService.js";

async function verify() {
    console.log("Starting Gate 6 Verification (Combat Stabilization)...");
    const engine = new GameEngine();

    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem);
    engine.registry.register("UISystem", UISystem);

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
    InputSystem(world, engine.tick);
    MovementSystem(world, engine.tick);
    CollisionSystem(world, engine.tick);

    intentsPerTick.tick4 = world.query("CombatIntent").length;

    CombatSystem(world, engine.tick);
    VisualSystem(world, engine.tick);
    UISystem(world, engine.tick);

    hpTimeline.tick4 = world.getComponent<any>(monsters[0], "Health").current;
    const snapshot = PersistenceService.serialize(world, engine.tick);
    engine.tick++;

    // Ticks 5 and 6
    for (let t = 4; t <= 5; t++) {
        const currentTick = engine.tick;
        InputSystem(world, currentTick);
        MovementSystem(world, currentTick);
        CollisionSystem(world, currentTick);

        const count = world.query("CombatIntent").length;
        if (t === 4) intentsPerTick.tick5 = count;
        if (t === 5) intentsPerTick.tick6 = count;

        CombatSystem(world, currentTick);
        VisualSystem(world, currentTick);
        UISystem(world, currentTick);

        const mHP = world.getComponent<any>(monsters[0], "Health").current;
        if (t === 4) hpTimeline.tick5 = mHP;
        if (t === 5) hpTimeline.tick6 = mHP;

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

    const report = buildCombatStabilizationReport(engine, results);
    console.log(formatGateReport(report));

    if (report.status === "PASS") {
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
