import { World } from "./World.js";

export type SystemFn = (world: World, tick: number) => void;

export class SystemRegistry {
    private systems: Map<string, SystemFn> = new Map();
    private onceSystems: Map<string, SystemFn> = new Map();
    private order: string[] = [];
    private onceOrder: string[] = [];
    private allSystems: Set<string> = new Set();

    public register(name: string, systemFn: SystemFn): void {
        if (!this.systems.has(name)) {
            this.order.push(name);
            this.allSystems.add(name);
        }
        this.systems.set(name, systemFn);
    }

    public registerOnce(name: string, systemFn: SystemFn): void {
        if (!this.onceSystems.has(name)) {
            this.onceOrder.push(name);
            this.allSystems.add(name);
        }
        this.onceSystems.set(name, systemFn);
    }

    public list(): string[] {
        return Array.from(this.allSystems);
    }

    public runOnce(world: World): void {
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

    public runAll(world: World, tick: number): void {
        for (const name of this.order) {
            const fn = this.systems.get(name);
            if (fn) {
                fn(world, tick);
            }
        }
    }
}
