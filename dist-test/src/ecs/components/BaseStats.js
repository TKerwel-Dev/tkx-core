"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStats = void 0;
class BaseStats {
    damageBase;
    defenseBase;
    constructor(damageBase = 1, defenseBase = 0) {
        this.damageBase = damageBase;
        this.defenseBase = defenseBase;
    }
}
exports.BaseStats = BaseStats;
