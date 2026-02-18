
import { World } from "../../engine/World.js";
import { ItemRegistry } from "../../items/ItemRegistry.js";
import { Inventory } from "../components/Inventory.js";
import { ItemAddedEvent, ItemRemovedEvent } from "../../engine/EventBus.js";

interface StoredInventory {
    items: { itemId: string; quantity: number }[];
}

export function InventorySystem(world: World, tick: number): void {
    const itemAddedEvents = world.events.getEvents<ItemAddedEvent>("ItemAddedEvent");
    const itemRemovedEvents = world.events.getEvents<ItemRemovedEvent>("ItemRemovedEvent");

    // Process Additions
    for (const event of itemAddedEvents) {
        let inv: Inventory;

        if (world.hasComponent(event.targetEntityId, "Inventory")) {
            inv = world.getComponent<Inventory>(event.targetEntityId, "Inventory")!;
        } else {
            inv = new Inventory();
            world.addComponent(event.targetEntityId, "Inventory", inv);
        }

        const def = ItemRegistry.get(event.itemId);
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
        if (!world.hasComponent(event.targetEntityId, "Inventory")) continue;

        const inv = world.getComponent<Inventory>(event.targetEntityId, "Inventory")!;
        const index = inv.items.findIndex(s => s.itemId === event.itemId);

        if (index === -1) continue; // Item not found, no-op

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
