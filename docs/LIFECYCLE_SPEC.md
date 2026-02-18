# Lifecycle Specification v1

## State Machine Definition
The `LifecycleController` enforces a strict, linear progression of states.

| State | Responsibility | Next State |
| :--- | :--- | :--- |
| **BOOT** | Engine instance created. Basic members initialized. | INIT |
| **INIT** | Infrastructure setup (Subsystems, Registry). | LOAD |
| **LOAD** | Asset manifest loading. Initial config. | READY |
| **READY** | Pre-tick check complete. Hardware context bound. | RUNNING |
| **RUNNING** | Simulation loop active. `step()` execution allowed. | PAUSED, SHUTDOWN |
| **PAUSED** | Simulation halted. Rendering of static state allowed. | RUNNING, SHUTDOWN |
| **SHUTDOWN** | Terminal state. Resources released. | (Terminal) |

### Terminal Shutdown Rule
Once `SHUTDOWN` is entered, the engine instance is considered dead. Any attempt to transition to another state will throw an error. A new instance of `GameEngine` must be created.

## Frame Execution Order (v1)
A standard tick consists of:
1. `step()` called by scheduler.
2. Check `EngineState == RUNNING`.
3. `SystemRegistry.runAll(...)`.
4. `world.events.clear()`.
5. `tick++`.

## Snapshot Rules
- Snapshots are only valid in `RUNNING` or `PAUSED` states.
- The engine transitions to `SNAPSHOTTING` during the operation.
- Only the `World` (entities, components) and the `tick` counter are captured.
- Event queues and renderer state are discarded.
