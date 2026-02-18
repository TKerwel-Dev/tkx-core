export interface BaseEvent {
    tick: number;
    type: string;
}

export interface CollisionEvent extends BaseEvent {
    type: "CollisionEvent";
    entityA: number;
    entityB: number;
}

export interface DamageEvent extends BaseEvent {
    type: "DamageEvent";
    attackerId: number;
    defenderId: number;
    amount: number;
}

export interface ItemAddedEvent extends BaseEvent {
    type: "ItemAddedEvent";
    targetEntityId: number;
    itemId: string;
    quantity: number;
}

export interface ItemRemovedEvent extends BaseEvent {
    type: "ItemRemovedEvent";
    targetEntityId: number;
    itemId: string;
    quantity: number;
}

export interface EquipItemEvent extends BaseEvent {
    type: "EquipItemEvent";
    entityId: number;
    slot: "weapon" | "armor";
    itemId: string;
}

export interface UnequipItemEvent extends BaseEvent {
    type: "UnequipItemEvent";
    entityId: number;
    slot: "weapon" | "armor";
}

export type GameEvent = CollisionEvent | DamageEvent | ItemAddedEvent | ItemRemovedEvent | EquipItemEvent | UnequipItemEvent | BaseEvent;

export class EventBus {
    private events: GameEvent[] = [];

    public publish(event: GameEvent): void {
        this.events.push(event);
    }

    public getEvents<T extends GameEvent>(type: string): T[] {
        return this.events.filter(e => e.type === type) as T[];
    }

    public clear(): void {
        this.events = [];
    }

    public get length(): number {
        return this.events.length;
    }
}
