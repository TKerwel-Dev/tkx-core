export interface ItemStack {
    itemId: string;
    quantity: number;
}

export class Inventory {
    public items: ItemStack[] = [];

    constructor(initialItems: ItemStack[] = []) {
        this.items = initialItems;
    }
}
