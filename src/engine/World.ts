import { randomUUID } from "node:crypto";
import { EventBus } from "./EventBus.js";

export class World {
    public readonly id: string;
    public entityCount: number = 0;
    public readonly events: EventBus = new EventBus();

    // Minimal ECS Storage
    // entityId -> ComponentName -> ComponentData
    private components: Map<number, Map<string, any>> = new Map();

    constructor() {
        this.id = randomUUID();
    }

    public createEntity(): number {
        this.entityCount++;
        this.components.set(this.entityCount, new Map());
        return this.entityCount;
    }

    public clear(): void {
        this.components.clear();
        this.entityCount = 0;
    }

    public setEntityCount(count: number): void {
        this.entityCount = count;
    }

    public reconstituteEntity(id: number): void {
        if (!this.components.has(id)) {
            this.components.set(id, new Map());
        }
    }

    public getAllComponents(): Map<number, Map<string, any>> {
        return this.components;
    }

    public addComponent(entityId: number, componentName: string, data: any = {}): void {
        const entityComponents = this.components.get(entityId);
        if (entityComponents) {
            entityComponents.set(componentName, data);
        }
    }

    public removeComponent(entityId: number, componentName: string): void {
        const entityComponents = this.components.get(entityId);
        if (entityComponents) {
            entityComponents.delete(componentName);
        }
    }

    public getComponent<T>(entityId: number, componentName: string): T | undefined {
        return this.components.get(entityId)?.get(componentName) as T;
    }

    public hasComponent(entityId: number, componentName: string): boolean {
        return this.components.get(entityId)?.has(componentName) ?? false;
    }

    public query(...componentNames: string[]): number[] {
        const results: number[] = [];
        for (const [entityId, entityComponents] of this.components.entries()) {
            const hasAll = componentNames.every(name => entityComponents.has(name));
            if (hasAll) {
                results.push(entityId);
            }
        }
        return results;
    }

    public getRenderableCount(): number {
        let count = 0;
        for (const entityComponents of this.components.values()) {
            if (entityComponents.has("Visual")) {
                count++;
            }
        }
        return count;
    }
}
