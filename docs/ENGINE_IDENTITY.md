# Engine Identity: TKX Core

**Name:** TKX Core  
**Tagline:** Forge Your Worlds.  
**Version:** 0.1.0-alpha  

## Scope
TKX Core is a deterministic, high-performance ECS (Entity Component System) engine foundation explicitly designed for Action RPG (ARPG) worlds. It prioritizes state consistency, deterministic simulation, and clear abstraction boundaries between simulation and representation.

## Core Pillars
1. **Deterministic Execution**: The simulation (ECS) MUST remain pure and reproducible. No rendering or audio state may leak into the world state.
2. **Phase-Driven Lifecycle**: Formal state transitions ensure infrastructure is ready before the first tick.
3. **Decoupled Representation**: Subsystems (Audio, Rendering) communicate via events and interfaces, allowing hardware-agnostic logic.
4. **Isometric First**: Native support for isometric projection, depth sorting, and tile-based coordinate mapping.

## Non-Goals
- **Not a 3D Engine**: TKX Core is optimized for 2.5D isometric representation. 3D perspective or free-movement 3D is explicitly out of scope.
- **Not General-Purpose**: The engine is optimized for ARPG mechanics (inventory, combat, navigation). It is not designed for platformers, FPS, or UI-heavy simulations.
- **Not Genre-Agnostic**: Design decisions prioritize the specific performance and architectural needs of isometric Action RPGs.
