"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = void 0;
class Inventory {
    items = [];
    constructor(initialItems = []) {
        this.items = initialItems;
    }
}
exports.Inventory = Inventory;
