import { World } from "../engine/World.js";

export interface Snapshot {
    tick: number;
    entities: {
        id: number;
        components: Record<string, any>;
    }[];
}

export class PersistenceService {
    private static EXCLUDED_COMPONENTS = ["MoveIntent", "CombatIntent"];

    public static serialize(world: World, tick: number): Snapshot {
        const entitiesSnapshot: Snapshot["entities"] = [];
        const allComponents = world.getAllComponents();

        for (const [entityId, componentsMap] of allComponents.entries()) {
            const persistedComponents: Record<string, any> = {};

            for (const [name, data] of componentsMap.entries()) {
                if (!this.EXCLUDED_COMPONENTS.includes(name)) {
                    // Convert to plain object to ensure no prototypes/functions
                    persistedComponents[name] = JSON.parse(JSON.stringify(data));
                }
            }

            if (Object.keys(persistedComponents).length > 0) {
                entitiesSnapshot.push({
                    id: entityId,
                    components: persistedComponents
                });
            }
        }

        return {
            tick,
            entities: entitiesSnapshot
        };
    }

    public static deserialize(snapshot: Snapshot, world: World): void {
        world.clear();

        let maxId = 0;
        for (const entityData of snapshot.entities) {
            if (entityData.id > maxId) maxId = entityData.id;

            world.reconstituteEntity(entityData.id);
            for (const [name, data] of Object.entries(entityData.components)) {
                // Restore as plain objects
                world.addComponent(entityData.id, name, data);
            }
        }

        world.setEntityCount(maxId);
    }
}
