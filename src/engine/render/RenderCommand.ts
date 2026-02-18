import { Color } from "./types.js";

/**
 * A RenderCommand represents a single atomic drawing operation.
 */
export type RenderCommand = {
    type: "quad";
    x: number;
    y: number;
    w: number;
    h: number;
    depth: number;
    color: Color;
    // Future expansion: texture: Texture
};
