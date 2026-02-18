"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatSystem = CombatSystem;
const ContactLock_js_1 = require("../components/ContactLock.js");
function CombatSystem(world, tick) {
    const collisionEvents = world.events.getEvents("CollisionEvent");
    const activeCollisions = new Set();
    // 1. Process Collisions and potentially generate DamageEvents
    for (const event of collisionEvents) {
        const player = event.entityA;
        const monster = event.entityB;
        activeCollisions.add(player);
        if (!world.hasComponent(player, "ContactLock")) {
            // New contact: set lock and publish DamageEvent
            let damage = 1;
            const stats = world.getComponent(player, "DerivedStats");
            if (stats) {
                damage = stats.damage;
            }
            world.addComponent(player, "ContactLock", new ContactLock_js_1.ContactLock(monster, tick));
            world.events.publish({
                type: "DamageEvent",
                tick,
                attackerId: player,
                defenderId: monster,
                amount: damage
            });
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
    const damageEvents = world.events.getEvents("DamageEvent");
    for (const event of damageEvents) {
        const health = world.getComponent(event.defenderId, "Health");
        if (health) {
            health.current -= event.amount;
        }
    }
}
