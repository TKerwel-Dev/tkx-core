export class StatModifier {
    constructor(
        public source: string,
        public stats: {
            damageBonus?: number;
            defenseBonus?: number;
        }
    ) { }
}
