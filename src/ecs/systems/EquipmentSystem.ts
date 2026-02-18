
import { World } from "../../engine/World.js";
import { ItemRegistry } from "../../items/ItemRegistry.js";
import { Equipment } from "../components/Equipment.js";
import { StatModifier } from "../components/StatModifier.js";
import { EquipItemEvent, UnequipItemEvent } from "../../engine/EventBus.js";

export function EquipmentSystem(world: World, tick: number): void {
    const equipEvents = world.events.getEvents<EquipItemEvent>("EquipItemEvent");
    const unequipEvents = world.events.getEvents<UnequipItemEvent>("UnequipItemEvent");

    for (const event of equipEvents) {
        let equipment = world.getComponent<Equipment>(event.entityId, "Equipment");
        if (!equipment) {
            equipment = new Equipment();
            world.addComponent(event.entityId, "Equipment", equipment);
        }

        // 1. Remove old modifier for this slot (by convention key)
        const modifierKey = `StatModifier_${event.slot}`;
        if (world.hasComponent(event.entityId, modifierKey)) {
            world.removeComponent(event.entityId, modifierKey);
        }

        // 2. Update Equipment Slot
        equipment.slots[event.slot] = { itemId: event.itemId };

        // 3. Add new Modifier if Item has stats
        const itemDef = ItemRegistry.get(event.itemId);
        if (itemDef && itemDef.modifiers) {
            // "source" property in StatModifier matches requirement
            const mod = new StatModifier(`equipment:${event.slot}`, itemDef.modifiers);
            world.addComponent(event.entityId, modifierKey, mod);
        }
    }

    for (const event of unequipEvents) {
        const equipment = world.getComponent<Equipment>(event.entityId, "Equipment");
        if (!equipment) continue;

        equipment.slots[event.slot] = null;

        // Remove modifier
        world.removeComponent(event.entityId, `StatModifier_${event.slot}`);
    }
}
