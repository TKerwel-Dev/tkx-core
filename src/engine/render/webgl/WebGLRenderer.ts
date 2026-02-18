import { IRenderer } from "../IRenderer.js";
import { RenderTarget, DrawQuadCmd } from "../types.js";
import { VERTEX_SHADER, FRAGMENT_SHADER } from "./glsl.js";
import { Camera } from "../Camera.js";

export class WebGLRenderer implements IRenderer {
    private gl: WebGL2RenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private quadVAO: WebGLVertexArrayObject | null = null;
    private positionBuffer: WebGLBuffer | null = null;

    private uViewLoc: WebGLUniformLocation | null = null;
    private uProjectionLoc: WebGLUniformLocation | null = null;
    private uColorLoc: WebGLUniformLocation | null = null;

    private width: number = 0;
    private height: number = 0;
    private camera: Camera | null = null;

    public init(target: RenderTarget): void {
        const gl = target.canvas.getContext("webgl2");
        if (!gl) {
            throw new Error("WebGL2 not available or could not be initialized.");
        }
        this.gl = gl;

        this.width = target.canvas.width;
        this.height = target.canvas.height;

        this.setupShaders();
        this.setupQuadBuffers();

        gl.viewport(0, 0, this.width, this.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    public setCamera(camera: Camera): void {
        this.camera = camera;
    }

    private setupShaders(): void {
        const gl = this.gl!;

        const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Link error: ${gl.getProgramInfoLog(program)}`);
        }

        this.program = program;
        this.uViewLoc = gl.getUniformLocation(program, "u_view");
        this.uProjectionLoc = gl.getUniformLocation(program, "u_projection");
        this.uColorLoc = gl.getUniformLocation(program, "u_color");
    }

    private compileShader(type: number, source: string): WebGLShader {
        const gl = this.gl!;
        const s = gl.createShader(type)!;
        gl.shaderSource(s, source);
        gl.compileShader(s);

        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(s);
            gl.deleteShader(s);
            throw new Error(`Shader compile error: ${log}`);
        }
        return s;
    }

    private setupQuadBuffers(): void {
        const gl = this.gl!;

        this.quadVAO = gl.createVertexArray();
        gl.bindVertexArray(this.quadVAO);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        // Standard 0,0 to 1,1 quad vertices
        const positions = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
    }

    public resize(w: number, h: number): void {
        this.width = w;
        this.height = h;
        if (this.gl) {
            this.gl.viewport(0, 0, w, h);
        }
    }

    public beginFrame(clear?: { r: number, g: number, b: number, a: number }): void {
        if (!this.gl) return;
        const gl = this.gl;

        if (clear) {
            gl.clearColor(clear.r, clear.g, clear.b, clear.a);
        } else {
            gl.clearColor(0, 0, 0, 1);
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);

        // Apply Camera Matrices
        if (this.camera) {
            const view = this.camera.getViewMatrix();
            const proj = this.camera.getProjectionMatrix(this.width, this.height);
            gl.uniformMatrix4fv(this.uViewLoc, false, view);
            gl.uniformMatrix4fv(this.uProjectionLoc, false, proj);
        } else {
            // Fallback: Identity View + Normal Projection
            const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
            const proj = new Float32Array(16);
            proj[0] = 2.0 / (this.width || 1);
            proj[5] = -2.0 / (this.height || 1);
            proj[10] = 1.0;
            proj[12] = -1.0;
            proj[13] = 1.0;
            proj[15] = 1.0;

            gl.uniformMatrix4fv(this.uViewLoc, false, identity);
            gl.uniformMatrix4fv(this.uProjectionLoc, false, proj);
        }
    }

    public drawQuad(cmd: DrawQuadCmd): void {
        if (!this.gl) return;
        const gl = this.gl;

        gl.bindVertexArray(this.quadVAO);

        const x1 = cmd.x;
        const x2 = cmd.x + cmd.w;
        const y1 = cmd.y;
        const y2 = cmd.y + cmd.h;

        const dynamicPositions = new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, dynamicPositions, gl.DYNAMIC_DRAW);

        gl.uniform4f(this.uColorLoc, cmd.color.r, cmd.color.g, cmd.color.b, cmd.color.a);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    public endFrame(): void {
    }

    public destroy(): void {
        const gl = this.gl;
        if (!gl) return;

        gl.deleteProgram(this.program);
        gl.deleteBuffer(this.positionBuffer);
        gl.deleteVertexArray(this.quadVAO);
        this.gl = null;
    }
}
