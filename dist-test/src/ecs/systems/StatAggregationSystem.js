"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatAggregationSystem = StatAggregationSystem;
const DerivedStats_js_1 = require("../components/DerivedStats.js");
function StatAggregationSystem(world, tick) {
    const entities = world.getAllComponents();
    for (const [entityId, components] of entities.entries()) {
        const base = world.getComponent(entityId, "BaseStats");
        if (!base)
            continue;
        let damage = base.damageBase;
        let defense = base.defenseBase;
        // Iterate all components to find StatModifiers
        for (const [key, component] of components.entries()) {
            if (key.startsWith("StatModifier_")) {
                const mod = component;
                if (mod.stats) {
                    if (mod.stats.damageBonus)
                        damage += mod.stats.damageBonus;
                    if (mod.stats.defenseBonus)
                        defense += mod.stats.defenseBonus;
                }
            }
        }
        // Write DerivedStats
        // Overwrite or create
        world.addComponent(entityId, "DerivedStats", new DerivedStats_js_1.DerivedStats(damage, defense));
    }
}
