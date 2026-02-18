"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentSystem = EquipmentSystem;
const ItemRegistry_js_1 = require("../../items/ItemRegistry.js");
const Equipment_js_1 = require("../components/Equipment.js");
const StatModifier_js_1 = require("../components/StatModifier.js");
function EquipmentSystem(world, tick) {
    const equipEvents = world.events.getEvents("EquipItemEvent");
    const unequipEvents = world.events.getEvents("UnequipItemEvent");
    for (const event of equipEvents) {
        let equipment = world.getComponent(event.entityId, "Equipment");
        if (!equipment) {
            equipment = new Equipment_js_1.Equipment();
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
        const itemDef = ItemRegistry_js_1.ItemRegistry.get(event.itemId);
        if (itemDef && itemDef.modifiers) {
            // "source" property in StatModifier matches requirement
            const mod = new StatModifier_js_1.StatModifier(`equipment:${event.slot}`, itemDef.modifiers);
            world.addComponent(event.entityId, modifierKey, mod);
        }
    }
    for (const event of unequipEvents) {
        const equipment = world.getComponent(event.entityId, "Equipment");
        if (!equipment)
            continue;
        equipment.slots[event.slot] = null;
        // Remove modifier
        world.removeComponent(event.entityId, `StatModifier_${event.slot}`);
    }
}
