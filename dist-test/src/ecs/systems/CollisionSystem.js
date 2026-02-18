"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollisionSystem = CollisionSystem;
function CollisionSystem(world, tick) {
    const players = world.query("PlayerTag", "Position");
    const monsters = world.query("MonsterTag", "Position");
    if (players.length === 0 || monsters.length === 0)
        return;
    for (const player of players) {
        const pPos = world.getComponent(player, "Position");
        for (const monster of monsters) {
            const mPos = world.getComponent(monster, "Position");
            if (pPos.x === mPos.x && pPos.y === mPos.y) {
                // Collision detected -> Publish event
                world.events.publish({
                    type: "CollisionEvent",
                    tick,
                    entityA: player,
                    entityB: monster
                });
            }
        }
    }
}
