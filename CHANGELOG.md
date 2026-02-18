# Changelog

All notable changes to the TKX Core engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2026-02-18

### Initial Engine Core Formalization

#### Lifecycle
- **Lifecycle L1 Unified**: Unified state machine (BOOT, INIT, LOAD, READY, RUNNING, PAUSED, SNAPSHOTTING, RESTORING, SHUTDOWN).
- **Terminal Shutdown**: Once in SHUTDOWN, no further transitions allowed.
- **Start Guards**: Engine loop can only start in READY state.

#### Audio Subsystem
- **EventBus Integration**: Complete decoupled audio control via events (BGM, SFX, Fades).
- **Audio Bus Structure**: Multi-bus routing (Master, Music, SFX, UI, Ambient).
- **Manifest Support**: JSON-based sound registration.

#### Rendering Core
- **Renderer Abstraction (IRenderer)**: Hardware-agnostic interface for rendering backends.
- **WebGL2 Adapter**: High-performance WebGL2 implementation with linear quad shaders.
- **Camera Foundation**: View and Projection matrix support with position and zoom.
- **Iso Projection & Depth Discipline**: World-to-screen conversion and deterministic depth sorting (back-to-front).
- **Render Pipeline Discipline**: Standardized frame cycle ensuring sort-before-render.

#### Quality & Testing
- **Deterministic Headless Tests**: Complete coverage for Audio, Lifecycle, Camera, IsoTransform, and Pipeline in Node.js environments.
- **Gate-Driven Development**: Formal verification reports for every core module extension.
