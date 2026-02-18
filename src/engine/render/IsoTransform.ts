/**
 * IsoTransform handles conversion between 2D Isometric world space and screen space.
 */
export class IsoTransform {
    private halfWidth: number;
    private halfHeight: number;

    constructor(tileWidth: number, tileHeight: number) {
        this.halfWidth = tileWidth / 2;
        this.halfHeight = tileHeight / 2;
    }

    /**
     * Converts world coordinates to screen/pixel coordinates.
     */
    public worldToScreen(x: number, y: number): { x: number, y: number } {
        return {
            x: (x - y) * this.halfWidth,
            y: (x + y) * this.halfHeight
        };
    }

    /**
     * Calculates a depth value for sorting. 
     * Higher value = closer to viewer / drawn later (for back-to-front sorting).
     * x + y is the standard isometric depth metric.
     * Offset can be used for sub-tile layering (e.g. unit on a tile).
     */
    public calculateDepth(x: number, y: number, offset: number = 0): number {
        return x + y + offset;
    }
}
