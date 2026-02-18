/**
 * Camera handles view and projection transformations for 2D rendering.
 */
export class Camera {
    public position = { x: 0, y: 0 };
    public zoom: number = 1.0;

    /**
     * Returns a 4x4 View Matrix (Col-Major).
     * Represents the inverse of the camera's transform.
     */
    public getViewMatrix(): Float32Array {
        const matrix = new Float32Array(16);

        // Identity
        matrix.fill(0);
        matrix[0] = 1;
        matrix[5] = 1;
        matrix[10] = 1;
        matrix[15] = 1;

        // Apply Zoom (Scale)
        matrix[0] = this.zoom;
        matrix[5] = this.zoom;

        // Apply Position (Translation)
        // Camera movement is inverted in view space
        matrix[12] = -this.position.x * this.zoom;
        matrix[13] = -this.position.y * this.zoom;

        return matrix;
    }

    /**
     * Returns a 4x4 Orthographic Projection Matrix (Col-Major).
     * Maps coordinate space to NDC (-1 to 1).
     */
    public getProjectionMatrix(width: number, height: number): Float32Array {
        const matrix = new Float32Array(16);
        matrix.fill(0);

        // 2D Ortho Matrix: maps [0, width] to [-1, 1] and [0, height] to [1, -1] (Y-down)
        matrix[0] = 2.0 / width;
        matrix[5] = -2.0 / height;
        matrix[10] = 1.0;
        matrix[12] = -1.0;
        matrix[13] = 1.0;
        matrix[15] = 1.0;

        return matrix;
    }
}
