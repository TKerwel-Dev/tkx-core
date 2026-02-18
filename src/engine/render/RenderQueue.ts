import { RenderCommand } from "./RenderCommand.js";

/**
 * RenderQueue collects and sorts render commands for efficient back-to-front rendering.
 */
export class RenderQueue {
    private commands: RenderCommand[] = [];

    /**
     * Adds a command to the queue.
     */
    public push(cmd: RenderCommand): void {
        this.commands.push(cmd);
    }

    /**
     * Sorts the commands by depth (ascending).
     * We use a stable sort to maintain order for items at the same depth.
     */
    public sortByDepth(): void {
        this.commands.sort((a, b) => a.depth - b.depth);
    }

    /**
     * Returns all commands and clears the queue.
     */
    public flush(): RenderCommand[] {
        const out = this.commands;
        this.commands = [];
        return out;
    }

    public clear(): void {
        this.commands = [];
    }

    public get length(): number {
        return this.commands.length;
    }
}
