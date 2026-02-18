# Engine API Reference

## Stable Core Interfaces
These interfaces are the primary points of integration for application logic.

### `LifecycleController`
- `transition(to: EngineState, reason: string): boolean`
  Linear state machine control (BOOT -> INIT -> LOAD -> READY -> RUNNING).
- `currentState: EngineState`

### `IRenderer`
Hardware-agnostic bridge. Custom backends must implement:
- `init(target: RenderTarget): void`
- `beginFrame(clearColor?: Color): void`
- `drawQuad(cmd: DrawQuadCmd): void`
- `endFrame(): void`

### `RenderPipeline`
- `execute(queue: RenderQueue): void`
  The official entry point for frame representation. Enforcement of depth sort.

## Experimental / Utility APIs
Subject to change as ARPG mechanics mature.

### `IsoTransform`
- `worldToScreen(x: number, y: number): {x, y}`
- `calculateDepth(x: number, y: number, offset?: number): number`

### `AudioSubsystem`
- `loadManifest(path: string): Promise<void>`
- `setVolume(bus: string, value: number): void`
- Event list: `AUDIO_PLAY_BGM`, `AUDIO_PLAY_SFX`, `AUDIO_FADE_IN_BGM`.

## Internal Only
- **WebGLAdapter**: Concrete GLSL shader logic and buffer management.
- **SystemRegistry**: Should only be interfaced with by the `GameEngine`.
- **IntegrityReport**: Used for gate-driven validation during development.
