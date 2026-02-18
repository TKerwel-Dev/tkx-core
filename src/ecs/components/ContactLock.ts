export class ContactLock {
    constructor(
        public readonly targetId: number,
        public readonly startTick: number
    ) { }
}
