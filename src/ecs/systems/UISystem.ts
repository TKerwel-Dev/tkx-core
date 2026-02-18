import { World } from "../../engine/World.js";
import { Position } from "../components/Position.js";
import { Health } from "../components/Health.js";

export function UISystem(world: World, tick: number): void {
    // Gate 4 requirement: UI runs exactly once after tick 4 (which is tick 3 in 0-indexed)
    if (tick !== 3) return;

    const players = world.query("PlayerTag", "Position", "Health");
    const monsters = world.query("MonsterTag", "Position", "Health");

    console.log("=== UI STATUS ===");
    console.log(`Tick: ${tick}`);

    if (players.length > 0) {
        const player = players[0];
        const pos = world.getComponent<Position>(player, "Position")!;
        const hp = world.getComponent<Health>(player, "Health")!;
        console.log(`Player Position: (${pos.x},${pos.y})`);
        console.log(`Player HP: ${hp.current}/${hp.max}`);
    }

    if (monsters.length > 0) {
        const monster = monsters[0];
        const pos = world.getComponent<Position>(monster, "Position")!;
        const hp = world.getComponent<Health>(monster, "Health")!;
        console.log(`Monster Position: (${pos.x},${pos.y})`);
        console.log(`Monster HP: ${hp.current}/${hp.max}`);
    }
    console.log("=================");
}
