# Lifecycle Management

## State Machine
The engine is driven by a strict Finite State Machine implemented in `LifecycleController`. Transitions are validated and logged.

### States
*   **BOOT**: Initial state upon construction.
*   **INIT_ONCE**: Initialization phase. `runOnce` systems execute here. Cannot return to this state.
*   **RUNNING**: The main game loop active state. Ticks advance.
*   **PAUSED**: Loop runs but no ticks/systems execute.
*   **SNAPSHOTTING**: Transient state for serialization. Returns to RUNNING.
*   **RESTORING**: Transient state for deserialization. Returns to RUNNING.
*   **SHUTDOWN**: Final terminal state. Loop stops permanently.

### Allowed Transitions
1.  BOOT -> INIT_ONCE -> RUNNING
2.  RUNNING <-> PAUSED
3.  RUNNING -> SNAPSHOTTING -> RUNNING
4.  RUNNING -> RESTORING -> RUNNING
5.  RUNNING -> SHUTDOWN
6.  PAUSED -> SHUTDOWN

Any other transition is an **Integrity Violation** and will cause audit failures.

## Shutdown Protocol
When `shutdown()` is called:
1.  State transitions to SHUTDOWN.
2.  `loopRunning` flag becomes `false`.
3.  `stopReason` is recorded.
4.  No further ticks or system updates occur.
5.  All active schedulers (timeouts) cease rescheduling.

## Init Once Guarantee
Systems registered with `registerOnce` run exactly once during the INIT_ONCE phase. This ensures resource loading or heavy setup happens only at startup, not per tick or after restore.
