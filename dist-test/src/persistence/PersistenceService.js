"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceService = void 0;
class PersistenceService {
    static EXCLUDED_COMPONENTS = ["MoveIntent", "CombatIntent"];
    static serialize(world, tick) {
        const entitiesSnapshot = [];
        const allComponents = world.getAllComponents();
        for (const [entityId, componentsMap] of allComponents.entries()) {
            const persistedComponents = {};
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
    static deserialize(snapshot, world) {
        world.clear();
        let maxId = 0;
        for (const entityData of snapshot.entities) {
            if (entityData.id > maxId)
                maxId = entityData.id;
            world.reconstituteEntity(entityData.id);
            for (const [name, data] of Object.entries(entityData.components)) {
                // Restore as plain objects
                world.addComponent(entityData.id, name, data);
            }
        }
        world.setEntityCount(maxId);
    }
}
exports.PersistenceService = PersistenceService;
