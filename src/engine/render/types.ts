export type RenderTarget = {
    canvas: HTMLCanvasElement;
};

export type Color = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type DrawQuadCmd = {
    x: number;
    y: number;
    w: number;
    h: number;
    depth: number;
    color: Color;
};
