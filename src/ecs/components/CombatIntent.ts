export class CombatIntent {
    constructor(
        public attackerId: number,
        public defenderId: number,
        public tickCreated: number,
        public damage: number = 1
    ) { }
}
