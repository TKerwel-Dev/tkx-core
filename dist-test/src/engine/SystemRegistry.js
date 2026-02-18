"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemRegistry = void 0;
class SystemRegistry {
    systems = new Map();
    onceSystems = new Map();
    order = [];
    onceOrder = [];
    allSystems = new Set();
    register(name, systemFn) {
        if (!this.systems.has(name)) {
            this.order.push(name);
            this.allSystems.add(name);
        }
        this.systems.set(name, systemFn);
    }
    registerOnce(name, systemFn) {
        if (!this.onceSystems.has(name)) {
            this.onceOrder.push(name);
            this.allSystems.add(name);
        }
        this.onceSystems.set(name, systemFn);
    }
    list() {
        return Array.from(this.allSystems);
    }
    runOnce(world) {
        for (const name of this.onceOrder) {
            const fn = this.onceSystems.get(name);
            if (fn) {
                fn(world, 0); // Initialization systems run at tick 0
            }
        }
        // After running, we Clear onceOrder if we only want it to run once per "session"
        // but the engine calls this when it starts.
        this.onceOrder = [];
    }
    runAll(world, tick) {
        for (const name of this.order) {
            const fn = this.systems.get(name);
            if (fn) {
                fn(world, tick);
            }
        }
    }
}
exports.SystemRegistry = SystemRegistry;
