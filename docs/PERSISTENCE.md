# Persistence Layer

## Overview
The Persistence mechanism allows saving and loading the complete game state at any tick.

## Snapshot
A `Snapshot` contains:
*   `tick`: Current game tick count.
*   `entities`: List of active entities with ALL their components.
*   `maxId`: Implicit unique entity count.

## Restore
When restoring a Snapshot:
1.  **Cleared World**: All existing entities and components are wiped.
2.  **Reconstitute Entities**: Entities are recreated with their Original IDs.
3.  **Components Restored**: Components are JSON serialized/deserialized deeply. Deep copies avoid reference sharing.
4.  **Tick Set**: Engine tick set to snapshot tick.
5.  **Clean Slate**: EventBus is empty after restore.

## Excluded Components
Certain components are transient and NOT persisted:
*   `MoveIntent`: To prevent stale movement commands.
*   `CombatIntent`: To prevent state glitches.
*   `VisualEffects`: To ensure purely logical state per tick.

## Determinism Check
The `audit_gate9_extended.ts` and `audit_gate10_final.ts` tests verify that `restore(shutdown()) == start()` behaviorally.
