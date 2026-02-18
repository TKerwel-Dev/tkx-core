"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LootedFlag = void 0;
exports.LootSystem = LootSystem;
class LootedFlag {
    constructor() { }
}
exports.LootedFlag = LootedFlag;
function LootSystem(world, tick) {
    const monsters = world.query("MonsterTag", "Health");
    const players = world.query("PlayerTag");
    if (players.length === 0)
        return;
    const player = players[0];
    for (const monsterId of monsters) {
        const health = world.getComponent(monsterId, "Health");
        if (health && health.current <= 0) {
            // Check if already looted
            if (world.hasComponent(monsterId, "LootedFlag"))
                continue;
            // Mark as looted (persist state)
            world.addComponent(monsterId, "LootedFlag", new LootedFlag());
            // Publish Loot Event
            world.events.publish({
                type: "ItemAddedEvent",
                tick,
                targetEntityId: player,
                itemId: "monster_trophy",
                quantity: 1
            });
        }
    }
}
