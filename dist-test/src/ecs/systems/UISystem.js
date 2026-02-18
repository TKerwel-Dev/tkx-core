"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UISystem = UISystem;
function UISystem(world, tick) {
    // Gate 4 requirement: UI runs exactly once after tick 4 (which is tick 3 in 0-indexed)
    if (tick !== 3)
        return;
    const players = world.query("PlayerTag", "Position", "Health");
    const monsters = world.query("MonsterTag", "Position", "Health");
    console.log("=== UI STATUS ===");
    console.log(`Tick: ${tick}`);
    if (players.length > 0) {
        const player = players[0];
        const pos = world.getComponent(player, "Position");
        const hp = world.getComponent(player, "Health");
        console.log(`Player Position: (${pos.x},${pos.y})`);
        console.log(`Player HP: ${hp.current}/${hp.max}`);
    }
    if (monsters.length > 0) {
        const monster = monsters[0];
        const pos = world.getComponent(monster, "Position");
        const hp = world.getComponent(monster, "Health");
        console.log(`Monster Position: (${pos.x},${pos.y})`);
        console.log(`Monster HP: ${hp.current}/${hp.max}`);
    }
    console.log("=================");
}
