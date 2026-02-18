"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatIntent = void 0;
class CombatIntent {
    attackerId;
    defenderId;
    tickCreated;
    damage;
    constructor(attackerId, defenderId, tickCreated, damage = 1) {
        this.attackerId = attackerId;
        this.defenderId = defenderId;
        this.tickCreated = tickCreated;
        this.damage = damage;
    }
}
exports.CombatIntent = CombatIntent;
