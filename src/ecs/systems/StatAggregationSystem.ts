
import { World } from "../../engine/World.js";
import { BaseStats } from "../components/BaseStats.js";
import { StatModifier } from "../components/StatModifier.js";
import { DerivedStats } from "../components/DerivedStats.js";

export function StatAggregationSystem(world: World, tick: number): void {
    const entities = world.getAllComponents();

    for (const [entityId, components] of entities.entries()) {
        const base = world.getComponent<BaseStats>(entityId, "BaseStats");
        if (!base) continue;

        let damage = base.damageBase;
        let defense = base.defenseBase;

        // Iterate all components to find StatModifiers
        for (const [key, component] of components.entries()) {
            if (key.startsWith("StatModifier_")) {
                const mod = component as StatModifier;
                if (mod.stats) {
                    if (mod.stats.damageBonus) damage += mod.stats.damageBonus;
                    if (mod.stats.defenseBonus) defense += mod.stats.defenseBonus;
                }
            }
        }

        // Write DerivedStats
        // Overwrite or create
        world.addComponent(entityId, "DerivedStats", new DerivedStats(damage, defense));
    }
}
