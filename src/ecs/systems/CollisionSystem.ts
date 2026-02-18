import { World } from "../../engine/World.js";
import { Position } from "../components/Position.js";
import { CollisionEvent } from "../../engine/EventBus.js";

export function CollisionSystem(world: World, tick: number): void {
    const players = world.query("PlayerTag", "Position");
    const monsters = world.query("MonsterTag", "Position");

    if (players.length === 0 || monsters.length === 0) return;

    for (const player of players) {
        const pPos = world.getComponent<Position>(player, "Position")!;

        for (const monster of monsters) {
            const mPos = world.getComponent<Position>(monster, "Position")!;

            if (pPos.x === mPos.x && pPos.y === mPos.y) {
                // Collision detected -> Publish event
                world.events.publish({
                    type: "CollisionEvent",
                    tick,
                    entityA: player,
                    entityB: monster
                } as CollisionEvent);
            }
        }
    }
}
