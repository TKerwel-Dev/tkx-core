"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("./engine/GameEngine.js");
const IntegrityReport_js_1 = require("./engine/IntegrityReport.js");
const SpawnGridSystem_js_1 = require("./ecs/systems/SpawnGridSystem.js");
const InputSystem_js_1 = require("./ecs/systems/InputSystem.js");
const MovementSystem_js_1 = require("./ecs/systems/MovementSystem.js");
const CollisionSystem_js_1 = require("./ecs/systems/CollisionSystem.js");
const CombatSystem_js_1 = require("./ecs/systems/CombatSystem.js");
const VisualSystem_js_1 = require("./ecs/systems/VisualSystem.js");
const UISystem_js_1 = require("./ecs/systems/UISystem.js");
async function main() {
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
    // Run 4 ticks
    engine.loopRunning = true;
    for (let i = 0; i < 4; i++) {
        engine.step();
    }
    const report = engine.getReport("Minimal UI (Query Only)");
    console.log((0, IntegrityReport_js_1.formatGateReport)(report));
    engine.stop();
    process.exit(0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
