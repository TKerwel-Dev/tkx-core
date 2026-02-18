"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const node_crypto_1 = require("node:crypto");
const EventBus_js_1 = require("./EventBus.js");
class World {
    id;
    entityCount = 0;
    events = new EventBus_js_1.EventBus();
    // Minimal ECS Storage
    // entityId -> ComponentName -> ComponentData
    components = new Map();
    constructor() {
        this.id = (0, node_crypto_1.randomUUID)();
    }
    createEntity() {
        this.entityCount++;
        this.components.set(this.entityCount, new Map());
        return this.entityCount;
    }
    clear() {
        this.components.clear();
        this.entityCount = 0;
    }
    setEntityCount(count) {
        this.entityCount = count;
    }
    reconstituteEntity(id) {
        if (!this.components.has(id)) {
            this.components.set(id, new Map());
        }
    }
    getAllComponents() {
        return this.components;
    }
    addComponent(entityId, componentName, data = {}) {
        const entityComponents = this.components.get(entityId);
        if (entityComponents) {
            entityComponents.set(componentName, data);
        }
    }
    removeComponent(entityId, componentName) {
        const entityComponents = this.components.get(entityId);
        if (entityComponents) {
            entityComponents.delete(componentName);
        }
    }
    getComponent(entityId, componentName) {
        return this.components.get(entityId)?.get(componentName);
    }
    hasComponent(entityId, componentName) {
        return this.components.get(entityId)?.has(componentName) ?? false;
    }
    query(...componentNames) {
        const results = [];
        for (const [entityId, entityComponents] of this.components.entries()) {
            const hasAll = componentNames.every(name => entityComponents.has(name));
            if (hasAll) {
                results.push(entityId);
            }
        }
        return results;
    }
    getRenderableCount() {
        let count = 0;
        for (const entityComponents of this.components.values()) {
            if (entityComponents.has("Visual")) {
                count++;
            }
        }
        return count;
    }
}
exports.World = World;
