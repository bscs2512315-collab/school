// Polyfills for browser APIs needed by pdf-parse in Node.js environment
// These must be set up before pdf-parse is imported

// Ensure we're in a Node.js environment
if (typeof window === "undefined") {
  // Simple DOMMatrix polyfill for Node.js
  class DOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    m11: number;
    m12: number;
    m13: number;
    m14: number;
    m21: number;
    m22: number;
    m23: number;
    m24: number;
    m31: number;
    m32: number;
    m33: number;
    m34: number;
    m41: number;
    m42: number;
    m43: number;
    m44: number;

    constructor(init?: string | number[]) {
      if (typeof init === "string") {
        // Parse matrix string
        const values = init
          .replace(/matrix\(|\)/g, "")
          .split(",")
          .map((v) => parseFloat(v.trim()));
        this.a = values[0] || 1;
        this.b = values[1] || 0;
        this.c = values[2] || 0;
        this.d = values[3] || 1;
        this.e = values[4] || 0;
        this.f = values[5] || 0;
      } else if (Array.isArray(init)) {
        this.a = init[0] || 1;
        this.b = init[1] || 0;
        this.c = init[2] || 0;
        this.d = init[3] || 1;
        this.e = init[4] || 0;
        this.f = init[5] || 0;
      } else {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }

      // Initialize 4x4 matrix
      this.m11 = this.a;
      this.m12 = this.b;
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = this.c;
      this.m22 = this.d;
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = this.e;
      this.m42 = this.f;
      this.m43 = 0;
      this.m44 = 1;
    }

    multiply(other: DOMMatrix): DOMMatrix {
      const result = new DOMMatrix();
      // Simple 2D matrix multiplication
      result.a = this.a * other.a + this.c * other.b;
      result.b = this.b * other.a + this.d * other.b;
      result.c = this.a * other.c + this.c * other.d;
      result.d = this.b * other.c + this.d * other.d;
      result.e = this.a * other.e + this.c * other.f + this.e;
      result.f = this.b * other.e + this.d * other.f + this.f;
      return result;
    }

    translate(x: number, y: number): DOMMatrix {
      const translate = new DOMMatrix([1, 0, 0, 1, x, y]);
      return this.multiply(translate);
    }

    scale(x: number, y?: number): DOMMatrix {
      const scaleY = y !== undefined ? y : x;
      const scale = new DOMMatrix([x, 0, 0, scaleY, 0, 0]);
      return this.multiply(scale);
    }

    rotate(angle: number): DOMMatrix {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotate = new DOMMatrix([cos, sin, -sin, cos, 0, 0]);
      return this.multiply(rotate);
    }
  }

  // @ts-ignore
  globalThis.DOMMatrix = DOMMatrix;
  // @ts-ignore
  globalThis.DOMMatrixReadOnly = DOMMatrix;
}

// Polyfill for other potentially missing browser APIs
if (typeof globalThis.DOMParser === "undefined") {
  // Minimal DOMParser polyfill (may not be fully functional)
  class DOMParser {
    parseFromString(str: string, type: string): Document {
      // This is a minimal implementation - pdf-parse may not actually need it
      return {} as Document;
    }
  }
  // @ts-ignore
  globalThis.DOMParser = DOMParser;
}

// Export to make this a module
export {};

