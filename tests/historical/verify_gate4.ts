import { GameEngine } from "../../src/engine/GameEngine.js";
import { formatGateReport } from "../../src/engine/IntegrityReport.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";
import { UISystem } from "../../src/ecs/systems/UISystem.js";

async function verify() {
    console.log("Starting Gate 4 Verification...");
    const engine = new GameEngine();

    // Register Systems
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("VisualSystem", VisualSystem);
    engine.registry.register("UISystem", UISystem);

    // Initialize
    engine.registry.runOnce(engine.world);

    engine.loopRunning = true;
    for (let i = 0; i < 4; i++) {
        engine.step();
    }

    const report = engine.getReport("Minimal UI (Query Only)");
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
    } else {
        console.log("=== VERIFICATION PASSED ===");
        process.exit(0);
    }
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
