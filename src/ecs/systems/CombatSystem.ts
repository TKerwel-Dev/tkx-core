import { World } from "../../engine/World.js";
import { Health } from "../components/Health.js";
import { ContactLock } from "../components/ContactLock.js";
import { DerivedStats } from "../components/DerivedStats.js";
import { CollisionEvent, DamageEvent } from "../../engine/EventBus.js";

export function CombatSystem(world: World, tick: number): void {
    const collisionEvents = world.events.getEvents<CollisionEvent>("CollisionEvent");
    const activeCollisions = new Set<number>();

    // 1. Process Collisions and potentially generate DamageEvents
    for (const event of collisionEvents) {
        const player = event.entityA;
        const monster = event.entityB;
        activeCollisions.add(player);

        if (!world.hasComponent(player, "ContactLock")) {
            // New contact: set lock and publish DamageEvent
            let damage = 1;
            const stats = world.getComponent<DerivedStats>(player, "DerivedStats");
            if (stats) {
                damage = stats.damage;
            }

            world.addComponent(player, "ContactLock", new ContactLock(monster, tick));
            world.events.publish({
                type: "DamageEvent",
                tick,
                attackerId: player,
                defenderId: monster,
                amount: damage
            } as DamageEvent);
        }
    }

    // 2. Clean up ContactLocks for entities no longer in collision
    const entitiesWithLock = world.query("ContactLock");
    for (const entityId of entitiesWithLock) {
        if (!activeCollisions.has(entityId)) {
            world.removeComponent(entityId, "ContactLock");
        }
    }

    // 3. Process DamageEvents (Purely based on events now)
    const damageEvents = world.events.getEvents<DamageEvent>("DamageEvent");
    for (const event of damageEvents) {
        const health = world.getComponent<Health>(event.defenderId, "Health");
        if (health) {
            health.current -= event.amount;
        }
    }
}
