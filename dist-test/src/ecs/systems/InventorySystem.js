"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventorySystem = InventorySystem;
const ItemRegistry_js_1 = require("../../items/ItemRegistry.js");
const Inventory_js_1 = require("../components/Inventory.js");
function InventorySystem(world, tick) {
    const itemAddedEvents = world.events.getEvents("ItemAddedEvent");
    const itemRemovedEvents = world.events.getEvents("ItemRemovedEvent");
    // Process Additions
    for (const event of itemAddedEvents) {
        let inv;
        if (world.hasComponent(event.targetEntityId, "Inventory")) {
            inv = world.getComponent(event.targetEntityId, "Inventory");
        }
        else {
            inv = new Inventory_js_1.Inventory();
            world.addComponent(event.targetEntityId, "Inventory", inv);
        }
        const def = ItemRegistry_js_1.ItemRegistry.get(event.itemId);
        let processed = false;
        // If stackable, try to find existing stack
        if (def && def.stackable) {
            const existing = inv.items.find(s => s.itemId === event.itemId);
            if (existing) {
                existing.quantity += event.quantity;
                processed = true;
            }
        }
        // If not stackable (or no existing stack found)
        if (!processed) {
            inv.items.push({ itemId: event.itemId, quantity: event.quantity });
        }
    }
    // Process Removals
    for (const event of itemRemovedEvents) {
        if (!world.hasComponent(event.targetEntityId, "Inventory"))
            continue;
        const inv = world.getComponent(event.targetEntityId, "Inventory");
        const index = inv.items.findIndex(s => s.itemId === event.itemId);
        if (index === -1)
            continue; // Item not found, no-op
        const stack = inv.items[index];
        if (event.quantity <= stack.quantity) {
            stack.quantity -= event.quantity;
        }
        // Remove empty stacks
        if (stack.quantity <= 0) {
            inv.items.splice(index, 1);
        }
    }
}
