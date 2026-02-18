# Governance & Standards

## Versioning Policy
TKX Core follows **Semantic Versioning (SemVer)** (MAJOR.MINOR.PATCH).
Until `1.0.0`, APIs are considered fluid, but breaking changes must be documented in the `CHANGELOG.md`.

## Gate-Driven Development
No code is considered "Foundation" until it passes a **Gate Verification**.
A Gate requires:
1. **Headless Tests**: 100% coverage for logic in Node environment.
2. **Determinism Proof**: Evidence that simulation state is unchanged by the feature.
3. **Formal Report**: Automated or semi-automated verification output.

## Architectural Constraints
- **Zero ECS Coupling in Adapters**: Renderer and Audio adapters must not import ECS System types or World logic directly.
- **Stateless Renderers**: `IRenderer` implementations should ideally be stateless between `beginFrame` and `endFrame`.
- **Event Supremacy**: All communication from ECS to Subsystems must happen via `EventBus`.

## Coding Style
- Explicit typing is mandatory (TypeScript).
- No global variables or `window` hacks.
- Platform-specific code (DOM, Web Audio) must be guarded or isolated in adapters.
- Deterministic math libraries only (No `Math.random` inside ECS).
