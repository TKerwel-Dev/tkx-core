import { World } from "../../engine/World.js";
import { Position } from "../components/Position.js";
import { MoveIntent } from "../components/MoveIntent.js";

export function MovementSystem(world: World, tick: number): void {
    const entities = world.query("Position", "MoveIntent");

    for (const entityId of entities) {
        const pos = world.getComponent<Position>(entityId, "Position")!;
        const intent = world.getComponent<MoveIntent>(entityId, "MoveIntent")!;

        // Apply movement
        pos.x += intent.dx;
        pos.y += intent.dy;

        // Remove intent after processing
        world.removeComponent(entityId, "MoveIntent");
    }
}
