export type ItemType = "consumable" | "material" | "quest" | "generic";

export interface ItemDefinition {
    id: string;
    name: string;
    type: ItemType;
    stackable: boolean;
    modifiers?: {
        damageBonus?: number;
        defenseBonus?: number;
    };
}

export class ItemRegistry {
    private static items: Map<string, ItemDefinition> = new Map();

    public static register(def: ItemDefinition): void {
        this.items.set(def.id, def);
    }

    public static get(id: string): ItemDefinition | undefined {
        return this.items.get(id);
    }
}

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
