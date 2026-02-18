export class MoveIntent {
    constructor(
        public dx: number,
        public dy: number,
        public sourceEntityId: number,
        public tickCreated: number
    ) { }
}
