import { GameEngine } from "../../src/engine/GameEngine.js";
import { buildPersistenceReport, formatGateReport } from "../../src/engine/IntegrityReport.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";
import { UISystem } from "../../src/ecs/systems/UISystem.js";
import { PersistenceService } from "../../src/persistence/PersistenceService.js";

async function verify() {
    console.log("Starting Gate 5 Verification (Deterministic Persistence)...");
    const engine = new GameEngine();

    // Register Systems (Registry logic remains separate from persistence)
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem);
    engine.registry.register("UISystem", UISystem);

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
        snapshot: undefined as any
    };

    // 3. Serialize
    const snapshot = PersistenceService.serialize(engine.world, engine.tick);
    originalState.snapshot = snapshot;

    // 4. Reset engine/world (without destroying instances)
    // We already stopped the loop. We'll use deserialize to restore.

    // 5. Deserialize into existing world instance
    PersistenceService.deserialize(snapshot, engine.world);
    engine.tick = snapshot.tick;

    // 6. Verify and Report
    const report = buildPersistenceReport(engine, originalState);
    console.log(formatGateReport(report));

    if (report.status === "PASS") {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    } else {
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
