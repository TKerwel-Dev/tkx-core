import { World } from "../../engine/World.js";
import { ItemAddedEvent } from "../../engine/EventBus.js";

export class LootedFlag {
    constructor() { }
}

export function LootSystem(world: World, tick: number): void {
    const monsters = world.query("MonsterTag", "Health");
    const players = world.query("PlayerTag");

    if (players.length === 0) return;
    const player = players[0];

    for (const monsterId of monsters) {
        const health = world.getComponent<any>(monsterId, "Health");

        if (health && health.current <= 0) {
            // Check if already looted
            if (world.hasComponent(monsterId, "LootedFlag")) continue;

            // Mark as looted (persist state)
            world.addComponent(monsterId, "LootedFlag", new LootedFlag());

            // Publish Loot Event
            world.events.publish({
                type: "ItemAddedEvent",
                tick,
                targetEntityId: player,
                itemId: "monster_trophy",
                quantity: 1
            } as ItemAddedEvent);
        }
    }
}
