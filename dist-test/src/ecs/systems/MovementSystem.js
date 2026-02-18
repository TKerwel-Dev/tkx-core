"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovementSystem = MovementSystem;
function MovementSystem(world, tick) {
    const entities = world.query("Position", "MoveIntent");
    for (const entityId of entities) {
        const pos = world.getComponent(entityId, "Position");
        const intent = world.getComponent(entityId, "MoveIntent");
        // Apply movement
        pos.x += intent.dx;
        pos.y += intent.dy;
        // Remove intent after processing
        world.removeComponent(entityId, "MoveIntent");
    }
}
