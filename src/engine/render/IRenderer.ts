import { RenderTarget, DrawQuadCmd } from "./types.js";

/**
 * IRenderer defines the hardware-agnostic interface for the engine's rendering backend.
 */
export interface IRenderer {
    /**
     * Initializes the renderer with a target canvas.
     */
    init(target: RenderTarget): void;

    /**
     * Updates the internal viewport/resolution state.
     */
    resize(w: number, h: number): void;

    /**
     * Prepared the GPU for a new frame.
     */
    beginFrame(clear?: { r: number, g: number, b: number, a: number }): void;

    /**
     * Submits a quad drawing command.
     */
    drawQuad(cmd: DrawQuadCmd): void;

    /**
     * Finals the frame and submits it to the screen.
     */
    endFrame(): void;

    /**
     * Releases all GPU and system resources.
     */
    destroy(): void;
}
