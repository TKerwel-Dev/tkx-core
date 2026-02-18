"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DerivedStats = void 0;
class DerivedStats {
    damage;
    defense;
    constructor(damage = 0, defense = 0) {
        this.damage = damage;
        this.defense = defense;
    }
}
exports.DerivedStats = DerivedStats;
