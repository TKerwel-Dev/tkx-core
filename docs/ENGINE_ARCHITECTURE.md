# Engine Architecture Overview

## Module Hierarchy
TKX Core is organized into isolated layers to prevent non-deterministic leakage.

```
[ Application / main.ts ]
       |
[ GameEngine (Orchestrator) ]
       |
       +--- [ LifecycleController (SM) ]
       +--- [ World (ECS Container) ]
       |       |
       |       +--- [ EventBus (Transient State) ]
       |
       +--- [ SystemRegistry (Simulation Loop) ]
       |
       +--- [ Isolated Subsystems ]
               |
               +--- [ AudioSubsystem ]
               +--- [ RenderPipeline ] --> [ IRenderer Adapter ]
```

## Frame Lifecycle
1. **Simulation Phase**: Systems in `SystemRegistry` update the `World` based on `tick`.
2. **Event Dispatch**: Systems publish transient events to the `EventBus`.
3. **Subsystem Update**: Subsystems (Audio, Rendering) consume events and state.
4. **Post-Tick Cleanup**: `EventBus` is cleared; `tick` is incremented.

## Render Flow Discipline
The rendering follows a strict pipeline to ensure visual consistency:
1. **Cull**: Identify renderable entities.
2. **Transform**: Map World coordinates to Screen coordinates using `IsoTransform`.
3. **Queue**: Add `RenderCommand` objects to the `RenderQueue`.
4. **Sort**: `RenderPipeline` executes `queue.sortByDepth()` (stable sort).
5. **Draw**: `IRenderer` executes drawing commands in sorted order.

## Determinism Strategy
- **Isolation**: Subsystems like `AudioSubsystem` can read but never write to `World` or `SystemRegistry` state.
- **Transient Events**: `EventBus` communication is valid only for the current tick.
- **Snapshot Purity**: Only the `World` state and `tick` count are serialized. Renderer and Audio state are volatile.
- **Clock Separation**: Logic uses `tick`. Audio uses `AudioContext.currentTime`. Rendering uses `requestAnimationFrame`. They are never synchronized to block simulation.
