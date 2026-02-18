"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemRegistry = void 0;
class ItemRegistry {
    static items = new Map();
    static register(def) {
        this.items.set(def.id, def);
    }
    static get(id) {
        return this.items.get(id);
    }
}
exports.ItemRegistry = ItemRegistry;
// Initial Registration
ItemRegistry.register({
    id: "monster_trophy",
    name: "Monster Trophy",
    type: "material",
    stackable: true
});
ItemRegistry.register({
    id: "rusty_sword",
    name: "Rusty Sword",
    type: "generic",
    stackable: false,
    modifiers: { damageBonus: 1 }
});
