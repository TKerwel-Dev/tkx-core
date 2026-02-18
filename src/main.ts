import { GameEngine } from "./engine/GameEngine.js";
import { formatGateReport } from "./engine/IntegrityReport.js";
import { SpawnGridSystem } from "./ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "./ecs/systems/InputSystem.js";
import { MovementSystem } from "./ecs/systems/MovementSystem.js";
import { CollisionSystem } from "./ecs/systems/CollisionSystem.js";
import { CombatSystem } from "./ecs/systems/CombatSystem.js";
import { VisualSystem } from "./ecs/systems/VisualSystem.js";
import { UISystem } from "./ecs/systems/UISystem.js";
import { WebGLRenderer } from "./engine/render/webgl/WebGLRenderer.js";

async function main() {
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

    // SMOKE TEST: Background Quad Rendering
    if (typeof window !== 'undefined' && !window.location.search.includes('headless')) {
        setupRenderSmokeTest();
    }

    // Run 4 ticks
    engine.loopRunning = true;
    for (let i = 0; i < 4; i++) {
        engine.step();
    }

    const report = engine.getReport("Minimal UI (Query Only)");
    console.log(formatGateReport(report));

    engine.stop();

    // In browser, we don't want to exit
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
    }
}

function setupRenderSmokeTest() {
    const canvas = document.createElement("canvas");
    canvas.id = "rune-gl";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    const renderer = new WebGLRenderer();
    renderer.init({ canvas });

    const frame = () => {
        renderer.beginFrame({ r: 0.1, g: 0.1, b: 0.15, a: 1.0 });

        // Draw one test quad
        renderer.drawQuad({
            x: 100, y: 100, w: 200, h: 200,
            depth: 0,
            color: { r: 1.0, g: 0.5, b: 0, a: 1.0 }
        });

        renderer.endFrame();
        requestAnimationFrame(frame);
    };
    frame();
}

main().catch(err => {
    console.error(err);
    if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
    }
});
