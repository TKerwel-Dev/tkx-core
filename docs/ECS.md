# Entity Component System (ECS)

The core data management layer.

## World
The `World` class is the central repository for all game state. It contains:
*   **Entities**: Unique IDs (integers).
*   **Components**: Data attached to entities.
*   **Events**: Transient messages for inter-system communication.
*   **Entity Count**: Tracks the latest entity ID for unique creation.

## Components
Components are plain data objects (POJOs) attached to entities. They define "what" an entity is or has.
Examples: `Position`, `Health`, `MovementIntent`.

## Systems
Systems are functions that operate on entities with specific components. They define "how" entities behave.
Systems are stateless. All state is stored in components or the World.
Signature: `(world: World, tick: number) => void`
Systems run in a strict registration order each tick `GameEngine.steps()`.

## Queries
Systems use minimal ad-hoc queries:
*   `world.query("Tag")`
*   `world.getComponent(id, "Type")`
*   `world.getAllComponents().forEach(...)` (costly, use sparingly)

There is no complex query caching yet to maintain simplicity and determinism.
