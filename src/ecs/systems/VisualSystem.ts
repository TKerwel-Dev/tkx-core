import { World } from "../../engine/World.js";
import { Position } from "../components/Position.js";
import { Visual } from "../components/Visual.js";

export function VisualSystem(world: World, tick: number): void {
    const entities = world.query("Position", "Visual");

    // Create empty 10x10 grid
    const grid: string[][] = Array.from({ length: 10 }, () => Array(10).fill(" "));

    // Sort by layer: highest layer wins if multiple entities on same tile
    const sortedEntities = entities.sort((a, b) => {
        const visualA = world.getComponent<Visual>(a, "Visual")!;
        const visualB = world.getComponent<Visual>(b, "Visual")!;
        return visualA.layer - visualB.layer;
    });

    for (const entityId of sortedEntities) {
        const pos = world.getComponent<Position>(entityId, "Position")!;
        const visual = world.getComponent<Visual>(entityId, "Visual")!;

        if (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
            grid[pos.y][pos.x] = visual.char;
        }
    }

    // Draw to console
    console.log("--- GRID START ---");
    for (let y = 0; y < 10; y++) {
        console.log(grid[y].join(" "));
    }
    console.log("--- GRID END ---");
}
