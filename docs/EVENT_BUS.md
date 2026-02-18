# Event Bus

The Event Bus is for transient, decoupled communication between systems without direct dependencies.

## Key Design Principles
*   **Strict Typing**: All events must implement `BaseEvent` and have a unique `type` string constant.
*   **Transient**: Events exist only for **ONE tick**. This is critical for determinism and avoiding state accumulation.
*   **Clear per Tick**: The `GameEngine.step()` method clears `world.events` at the very end of every tick.

## Event Patterns
### Publish
Systems publish events via `world.events.publish(event)`.
Wait, this is WRONG. `EventBus` has `publish(event)`. Correct.
Example: `CollisionSystem` publishes `DamageEvent`.

### Subscribe
Systems subscribe by querying `world.events.getEvents<T>("Type")`.
Example: `CombatSystem` reads `DamageEvent` and applies damage.

### Common Events
*   `CollisionEvent`: When two entities overlap.
*   `DamageEvent`: When damage is dealt.
*   `EquipItemEvent`: When an item is equipped.
*   `UnequipItemEvent`: When an item is unequipped.
*   `ItemAddedEvent`, `ItemRemovedEvent`: Inventory changes.

## Persistence
Events are transient state and are *not* persisted in Snapshots by `PersistenceService` by default, because they should be cleared anyway. But `Snapshot` structure doesn't exclude them explicitly, yet `PersistenceService` iterates components, not `world.events`. So events are naturally ephemeral.
Wait, `world` has `events: EventBus`. `PersistenceService` serializes entities and components. It does NOT persist the EventBus queue. This is intentional.
