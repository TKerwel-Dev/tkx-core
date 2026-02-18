"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visual = void 0;
class Visual {
    char;
    layer;
    // Layer: 0=Tile, 1=Monster, 2=Player
    constructor(char, layer) {
        this.char = char;
        this.layer = layer;
    }
}
exports.Visual = Visual;
