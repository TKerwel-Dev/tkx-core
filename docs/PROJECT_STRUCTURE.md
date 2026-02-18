# Project Structure

## Directory Layout
*   `src/`: **Runtime Code**. Contains the game engine, ECS systems, and core logic.
    *   `ecs/`: Entity Component System definitions.
    *   `engine/`: Core engine classes (`GameEngine`, `World`, `EventBus`, `LifecycleController`).
    *   `persistence/`: Serialization logic.
    *   `items/`: Item definitions.
*   `tests/`: **Test & Audit Code**. STRICT separation from runtime.
    *   `engine/`: Active engine audits (e.g., Gate 9, Gate 10).
    *   `historical/`: Archived verification scripts (Gate 0-8).
*   `docs/`: **Documentation**. Architecture, lifecycle, and component guides.

## Governance Rules
1.  **Strict Separation**: Runtime code (`src`) MUST NOT import from `tests`.
2.  **No Loops**: Tests must terminate deterministically (Exit Code 0/1).
3.  **Clean Build**: `npm run build` must only compile `src` (or separate test config).
4.  **Audit Integrity**: Moving tests must create NO integrity violations.

## Building
To build runtime:
```bash
npm run build
```

To run audits:
```bash
node dist/tests/engine/audit_gate10_final.js
```
(Requires compilation of tests separately or via `tsc`)
