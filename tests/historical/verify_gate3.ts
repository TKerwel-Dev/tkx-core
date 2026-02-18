import { GameEngine } from "../../src/engine/GameEngine.js";
import { formatGateReport } from "../../src/engine/IntegrityReport.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";

async function verify() {
    console.log("Starting Gate 3 Verification (Deterministic)...");
    const engine = new GameEngine();

    // Register Systems in order
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem);

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

    // Double check monster HP
    const monsters = engine.world.query("MonsterTag");
    const monsterHP = engine.world.getComponent<any>(monsters[0], "Health");
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
    } else {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
