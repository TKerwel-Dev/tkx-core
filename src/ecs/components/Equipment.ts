export class Equipment {
    public slots: {
        weapon?: { itemId: string } | null;
        armor?: { itemId: string } | null;
    } = { weapon: null, armor: null };

    constructor() { }
}
