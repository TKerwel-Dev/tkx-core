# Engine Architecture

## Overview
The Rune Engine is a deterministic, tick-based game engine built with strict architectural boundaries. It separates concerns into clear layers:

1.  **Engine Core**: Manages the main loop, lifecycle state, and system registry.
2.  **ECS (Entity Component System)**: Manages game state via Entities, Components, and Systems.
3.  **Event Bus**: Handles communication between systems via strictly typed events.
4.  **Lifecycle Controller**: Enforces valid state transitions (BOOT -> INIT -> RUNNING -> SHUTDOWN).
5.  **Persistence**: Handles serialization (Snapshots) and deserialization (Restore).

## Core Principles
*   **Determinism**: Given the same initial state and inputs, the engine produces the exact same output.
*   **Reversibility**: The entire game state can be snapshotted and restored perfectly.
*   **Isolation**: Systems are isolated and communicate only via components or events.
*   **No Global State**: State is encapsulated within the `World` instance.
*   **Hard Stop**: The engine enforces a clean shutdown with no dangling loops.

## Key Modules
*   `GameEngine`: The main entry point. Be sure to instantiate only one.
*   `World`: The container for all entities and components.
*   `SystemRegistry`: Manages execution order of systems.
*   `LifecycleController`: Finite State Machine for engine states.
