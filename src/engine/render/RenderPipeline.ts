import { IRenderer } from "./IRenderer.js";
import { RenderQueue } from "./RenderQueue.js";

/**
 * RenderPipeline orchestrates the flow of data from a RenderQueue to an IRenderer.
 * It ensures commands are sorted by depth before being submitted to the hardware.
 */
export class RenderPipeline {
    private renderer: IRenderer;

    constructor(renderer: IRenderer) {
        this.renderer = renderer;
    }

    /**
     * Executes a full frame cycle for the given queue.
     * 1. Prepares the renderer
     * 2. Sorts the queue by depth
     * 3. Flushes and submits all commands
     * 4. Finalizes the frame
     */
    public execute(queue: RenderQueue, clearColor?: { r: number, g: number, b: number, a: number }): void {
        // 1. Prepare
        this.renderer.beginFrame(clearColor);

        // 2. Discipline: Sort before drawing
        queue.sortByDepth();

        // 3. Draw sorted commands
        const commands = queue.flush();
        for (const cmd of commands) {
            if (cmd.type === "quad") {
                this.renderer.drawQuad(cmd);
            }
        }

        // 4. Finalize
        this.renderer.endFrame();
    }
}
