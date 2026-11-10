var Yf = Object.defineProperty;
var Kf = (i, t, e) => t in i ? Yf(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var Fe = (i, t, e) => Kf(i, typeof t != "symbol" ? t + "" : t, e);
import * as Xe from "react";
import ze, { forwardRef as Xf, createElement as Va } from "react";
import { c as rl, R as qf } from "./react-reconciler-Dt87ynbv.mjs";
import { l as Qf } from "./lodash-D2K0Wssv.mjs";
var es = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function gs(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var nl = { exports: {} }, Er = {}, _r = {}, le = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i._registerNode = i.Konva = i.glob = void 0;
  const t = Math.PI / 180;
  function e() {
    return typeof window < "u" && ({}.toString.call(window) === "[object Window]" || {}.toString.call(window) === "[object global]");
  }
  i.glob = typeof es < "u" ? es : typeof window < "u" ? window : typeof WorkerGlobalScope < "u" ? self : {}, i.Konva = {
    _global: i.glob,
    version: "9.3.22",
    isBrowser: e(),
    isUnminified: /param/.test((function(s) {
    }).toString()),
    dblClickWindow: 400,
    getAngle(s) {
      return i.Konva.angleDeg ? s * t : s;
    },
    enableTrace: !1,
    pointerEventsEnabled: !0,
    autoDrawEnabled: !0,
    hitOnDragEnabled: !1,
    capturePointerEventsEnabled: !1,
    _mouseListenClick: !1,
    _touchListenClick: !1,
    _pointerListenClick: !1,
    _mouseInDblClickWindow: !1,
    _touchInDblClickWindow: !1,
    _pointerInDblClickWindow: !1,
    _mouseDblClickPointerId: null,
    _touchDblClickPointerId: null,
    _pointerDblClickPointerId: null,
    _fixTextRendering: !1,
    pixelRatio: typeof window < "u" && window.devicePixelRatio || 1,
    dragDistance: 3,
    angleDeg: !0,
    showWarnings: !0,
    dragButtons: [0, 1],
    isDragging() {
      return i.Konva.DD.isDragging;
    },
    isTransforming() {
      var s;
      return (s = i.Konva.Transformer) === null || s === void 0 ? void 0 : s.isTransforming();
    },
    isDragReady() {
      return !!i.Konva.DD.node;
    },
    releaseCanvasOnDestroy: !0,
    document: i.glob.document,
    _injectGlobal(s) {
      i.glob.Konva = s;
    }
  };
  const n = (s) => {
    i.Konva[s.prototype.getClassName()] = s;
  };
  i._registerNode = n, i.Konva._injectGlobal(i.Konva);
})(le);
var Pe = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Util = i.Transform = void 0;
  const t = le;
  class e {
    constructor(C = [1, 0, 0, 1, 0, 0]) {
      this.dirty = !1, this.m = C && C.slice() || [1, 0, 0, 1, 0, 0];
    }
    reset() {
      this.m[0] = 1, this.m[1] = 0, this.m[2] = 0, this.m[3] = 1, this.m[4] = 0, this.m[5] = 0;
    }
    copy() {
      return new e(this.m);
    }
    copyInto(C) {
      C.m[0] = this.m[0], C.m[1] = this.m[1], C.m[2] = this.m[2], C.m[3] = this.m[3], C.m[4] = this.m[4], C.m[5] = this.m[5];
    }
    point(C) {
      const $ = this.m;
      return {
        x: $[0] * C.x + $[2] * C.y + $[4],
        y: $[1] * C.x + $[3] * C.y + $[5]
      };
    }
    translate(C, $) {
      return this.m[4] += this.m[0] * C + this.m[2] * $, this.m[5] += this.m[1] * C + this.m[3] * $, this;
    }
    scale(C, $) {
      return this.m[0] *= C, this.m[1] *= C, this.m[2] *= $, this.m[3] *= $, this;
    }
    rotate(C) {
      const $ = Math.cos(C), N = Math.sin(C), G = this.m[0] * $ + this.m[2] * N, T = this.m[1] * $ + this.m[3] * N, M = this.m[0] * -N + this.m[2] * $, L = this.m[1] * -N + this.m[3] * $;
      return this.m[0] = G, this.m[1] = T, this.m[2] = M, this.m[3] = L, this;
    }
    getTranslation() {
      return {
        x: this.m[4],
        y: this.m[5]
      };
    }
    skew(C, $) {
      const N = this.m[0] + this.m[2] * $, G = this.m[1] + this.m[3] * $, T = this.m[2] + this.m[0] * C, M = this.m[3] + this.m[1] * C;
      return this.m[0] = N, this.m[1] = G, this.m[2] = T, this.m[3] = M, this;
    }
    multiply(C) {
      const $ = this.m[0] * C.m[0] + this.m[2] * C.m[1], N = this.m[1] * C.m[0] + this.m[3] * C.m[1], G = this.m[0] * C.m[2] + this.m[2] * C.m[3], T = this.m[1] * C.m[2] + this.m[3] * C.m[3], M = this.m[0] * C.m[4] + this.m[2] * C.m[5] + this.m[4], L = this.m[1] * C.m[4] + this.m[3] * C.m[5] + this.m[5];
      return this.m[0] = $, this.m[1] = N, this.m[2] = G, this.m[3] = T, this.m[4] = M, this.m[5] = L, this;
    }
    invert() {
      const C = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]), $ = this.m[3] * C, N = -this.m[1] * C, G = -this.m[2] * C, T = this.m[0] * C, M = C * (this.m[2] * this.m[5] - this.m[3] * this.m[4]), L = C * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
      return this.m[0] = $, this.m[1] = N, this.m[2] = G, this.m[3] = T, this.m[4] = M, this.m[5] = L, this;
    }
    getMatrix() {
      return this.m;
    }
    decompose() {
      const C = this.m[0], $ = this.m[1], N = this.m[2], G = this.m[3], T = this.m[4], M = this.m[5], L = C * G - $ * N, U = {
        x: T,
        y: M,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
        skewX: 0,
        skewY: 0
      };
      if (C != 0 || $ != 0) {
        const B = Math.sqrt(C * C + $ * $);
        U.rotation = $ > 0 ? Math.acos(C / B) : -Math.acos(C / B), U.scaleX = B, U.scaleY = L / B, U.skewX = (C * N + $ * G) / L, U.skewY = 0;
      } else if (N != 0 || G != 0) {
        const B = Math.sqrt(N * N + G * G);
        U.rotation = Math.PI / 2 - (G > 0 ? Math.acos(-N / B) : -Math.acos(N / B)), U.scaleX = L / B, U.scaleY = B, U.skewX = 0, U.skewY = (C * N + $ * G) / L;
      }
      return U.rotation = i.Util._getRotation(U.rotation), U;
    }
  }
  i.Transform = e;
  const n = "[object Array]", s = "[object Number]", a = "[object String]", l = "[object Boolean]", c = Math.PI / 180, u = 180 / Math.PI, d = "#", p = "", v = "0", b = "Konva warning: ", y = "Konva error: ", _ = "rgb(", S = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 132, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 255, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 203],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [119, 128, 144],
    slategrey: [119, 128, 144],
    snow: [255, 255, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    transparent: [255, 255, 255, 0],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 5]
  }, E = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;
  let P = [];
  const A = typeof requestAnimationFrame < "u" && requestAnimationFrame || function(m) {
    setTimeout(m, 60);
  };
  i.Util = {
    _isElement(m) {
      return !!(m && m.nodeType == 1);
    },
    _isFunction(m) {
      return !!(m && m.constructor && m.call && m.apply);
    },
    _isPlainObject(m) {
      return !!m && m.constructor === Object;
    },
    _isArray(m) {
      return Object.prototype.toString.call(m) === n;
    },
    _isNumber(m) {
      return Object.prototype.toString.call(m) === s && !isNaN(m) && isFinite(m);
    },
    _isString(m) {
      return Object.prototype.toString.call(m) === a;
    },
    _isBoolean(m) {
      return Object.prototype.toString.call(m) === l;
    },
    isObject(m) {
      return m instanceof Object;
    },
    isValidSelector(m) {
      if (typeof m != "string")
        return !1;
      const C = m[0];
      return C === "#" || C === "." || C === C.toUpperCase();
    },
    _sign(m) {
      return m === 0 || m > 0 ? 1 : -1;
    },
    requestAnimFrame(m) {
      P.push(m), P.length === 1 && A(function() {
        const C = P;
        P = [], C.forEach(function($) {
          $();
        });
      });
    },
    createCanvasElement() {
      const m = document.createElement("canvas");
      try {
        m.style = m.style || {};
      } catch {
      }
      return m;
    },
    createImageElement() {
      return document.createElement("img");
    },
    _isInDocument(m) {
      for (; m = m.parentNode; )
        if (m == document)
          return !0;
      return !1;
    },
    _urlToImage(m, C) {
      const $ = i.Util.createImageElement();
      $.onload = function() {
        C($);
      }, $.src = m;
    },
    _rgbToHex(m, C, $) {
      return ((1 << 24) + (m << 16) + (C << 8) + $).toString(16).slice(1);
    },
    _hexToRgb(m) {
      m = m.replace(d, p);
      const C = parseInt(m, 16);
      return {
        r: C >> 16 & 255,
        g: C >> 8 & 255,
        b: C & 255
      };
    },
    getRandomColor() {
      let m = (Math.random() * 16777215 << 0).toString(16);
      for (; m.length < 6; )
        m = v + m;
      return d + m;
    },
    getRGB(m) {
      let C;
      return m in S ? (C = S[m], {
        r: C[0],
        g: C[1],
        b: C[2]
      }) : m[0] === d ? this._hexToRgb(m.substring(1)) : m.substr(0, 4) === _ ? (C = E.exec(m.replace(/ /g, "")), {
        r: parseInt(C[1], 10),
        g: parseInt(C[2], 10),
        b: parseInt(C[3], 10)
      }) : {
        r: 0,
        g: 0,
        b: 0
      };
    },
    colorToRGBA(m) {
      return m = m || "black", i.Util._namedColorToRBA(m) || i.Util._hex3ColorToRGBA(m) || i.Util._hex4ColorToRGBA(m) || i.Util._hex6ColorToRGBA(m) || i.Util._hex8ColorToRGBA(m) || i.Util._rgbColorToRGBA(m) || i.Util._rgbaColorToRGBA(m) || i.Util._hslColorToRGBA(m);
    },
    _namedColorToRBA(m) {
      const C = S[m.toLowerCase()];
      return C ? {
        r: C[0],
        g: C[1],
        b: C[2],
        a: 1
      } : null;
    },
    _rgbColorToRGBA(m) {
      if (m.indexOf("rgb(") === 0) {
        m = m.match(/rgb\(([^)]+)\)/)[1];
        const C = m.split(/ *, */).map(Number);
        return {
          r: C[0],
          g: C[1],
          b: C[2],
          a: 1
        };
      }
    },
    _rgbaColorToRGBA(m) {
      if (m.indexOf("rgba(") === 0) {
        m = m.match(/rgba\(([^)]+)\)/)[1];
        const C = m.split(/ *, */).map(($, N) => $.slice(-1) === "%" ? N === 3 ? parseInt($) / 100 : parseInt($) / 100 * 255 : Number($));
        return {
          r: C[0],
          g: C[1],
          b: C[2],
          a: C[3]
        };
      }
    },
    _hex8ColorToRGBA(m) {
      if (m[0] === "#" && m.length === 9)
        return {
          r: parseInt(m.slice(1, 3), 16),
          g: parseInt(m.slice(3, 5), 16),
          b: parseInt(m.slice(5, 7), 16),
          a: parseInt(m.slice(7, 9), 16) / 255
        };
    },
    _hex6ColorToRGBA(m) {
      if (m[0] === "#" && m.length === 7)
        return {
          r: parseInt(m.slice(1, 3), 16),
          g: parseInt(m.slice(3, 5), 16),
          b: parseInt(m.slice(5, 7), 16),
          a: 1
        };
    },
    _hex4ColorToRGBA(m) {
      if (m[0] === "#" && m.length === 5)
        return {
          r: parseInt(m[1] + m[1], 16),
          g: parseInt(m[2] + m[2], 16),
          b: parseInt(m[3] + m[3], 16),
          a: parseInt(m[4] + m[4], 16) / 255
        };
    },
    _hex3ColorToRGBA(m) {
      if (m[0] === "#" && m.length === 4)
        return {
          r: parseInt(m[1] + m[1], 16),
          g: parseInt(m[2] + m[2], 16),
          b: parseInt(m[3] + m[3], 16),
          a: 1
        };
    },
    _hslColorToRGBA(m) {
      if (/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.test(m)) {
        const [C, ...$] = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(m), N = Number($[0]) / 360, G = Number($[1]) / 100, T = Number($[2]) / 100;
        let M, L, U;
        if (G === 0)
          return U = T * 255, {
            r: Math.round(U),
            g: Math.round(U),
            b: Math.round(U),
            a: 1
          };
        T < 0.5 ? M = T * (1 + G) : M = T + G - T * G;
        const B = 2 * T - M, W = [0, 0, 0];
        for (let te = 0; te < 3; te++)
          L = N + 1 / 3 * -(te - 1), L < 0 && L++, L > 1 && L--, 6 * L < 1 ? U = B + (M - B) * 6 * L : 2 * L < 1 ? U = M : 3 * L < 2 ? U = B + (M - B) * (2 / 3 - L) * 6 : U = B, W[te] = U * 255;
        return {
          r: Math.round(W[0]),
          g: Math.round(W[1]),
          b: Math.round(W[2]),
          a: 1
        };
      }
    },
    haveIntersection(m, C) {
      return !(C.x > m.x + m.width || C.x + C.width < m.x || C.y > m.y + m.height || C.y + C.height < m.y);
    },
    cloneObject(m) {
      const C = {};
      for (const $ in m)
        this._isPlainObject(m[$]) ? C[$] = this.cloneObject(m[$]) : this._isArray(m[$]) ? C[$] = this.cloneArray(m[$]) : C[$] = m[$];
      return C;
    },
    cloneArray(m) {
      return m.slice(0);
    },
    degToRad(m) {
      return m * c;
    },
    radToDeg(m) {
      return m * u;
    },
    _degToRad(m) {
      return i.Util.warn("Util._degToRad is removed. Please use public Util.degToRad instead."), i.Util.degToRad(m);
    },
    _radToDeg(m) {
      return i.Util.warn("Util._radToDeg is removed. Please use public Util.radToDeg instead."), i.Util.radToDeg(m);
    },
    _getRotation(m) {
      return t.Konva.angleDeg ? i.Util.radToDeg(m) : m;
    },
    _capitalize(m) {
      return m.charAt(0).toUpperCase() + m.slice(1);
    },
    throw(m) {
      throw new Error(y + m);
    },
    error(m) {
      console.error(y + m);
    },
    warn(m) {
      t.Konva.showWarnings && console.warn(b + m);
    },
    each(m, C) {
      for (const $ in m)
        C($, m[$]);
    },
    _inRange(m, C, $) {
      return C <= m && m < $;
    },
    _getProjectionToSegment(m, C, $, N, G, T) {
      let M, L, U;
      const B = (m - $) * (m - $) + (C - N) * (C - N);
      if (B == 0)
        M = m, L = C, U = (G - $) * (G - $) + (T - N) * (T - N);
      else {
        const W = ((G - m) * ($ - m) + (T - C) * (N - C)) / B;
        W < 0 ? (M = m, L = C, U = (m - G) * (m - G) + (C - T) * (C - T)) : W > 1 ? (M = $, L = N, U = ($ - G) * ($ - G) + (N - T) * (N - T)) : (M = m + W * ($ - m), L = C + W * (N - C), U = (M - G) * (M - G) + (L - T) * (L - T));
      }
      return [M, L, U];
    },
    _getProjectionToLine(m, C, $) {
      const N = i.Util.cloneObject(m);
      let G = Number.MAX_VALUE;
      return C.forEach(function(T, M) {
        if (!$ && M === C.length - 1)
          return;
        const L = C[(M + 1) % C.length], U = i.Util._getProjectionToSegment(T.x, T.y, L.x, L.y, m.x, m.y), B = U[0], W = U[1], te = U[2];
        te < G && (N.x = B, N.y = W, G = te);
      }), N;
    },
    _prepareArrayForTween(m, C, $) {
      const N = [], G = [];
      if (m.length > C.length) {
        const M = C;
        C = m, m = M;
      }
      for (let M = 0; M < m.length; M += 2)
        N.push({
          x: m[M],
          y: m[M + 1]
        });
      for (let M = 0; M < C.length; M += 2)
        G.push({
          x: C[M],
          y: C[M + 1]
        });
      const T = [];
      return G.forEach(function(M) {
        const L = i.Util._getProjectionToLine(M, N, $);
        T.push(L.x), T.push(L.y);
      }), T;
    },
    _prepareToStringify(m) {
      let C;
      m.visitedByCircularReferenceRemoval = !0;
      for (const $ in m)
        if (m.hasOwnProperty($) && m[$] && typeof m[$] == "object") {
          if (C = Object.getOwnPropertyDescriptor(m, $), m[$].visitedByCircularReferenceRemoval || i.Util._isElement(m[$]))
            if (C.configurable)
              delete m[$];
            else
              return null;
          else if (i.Util._prepareToStringify(m[$]) === null)
            if (C.configurable)
              delete m[$];
            else
              return null;
        }
      return delete m.visitedByCircularReferenceRemoval, m;
    },
    _assign(m, C) {
      for (const $ in C)
        m[$] = C[$];
      return m;
    },
    _getFirstPointerId(m) {
      return m.touches ? m.changedTouches[0].identifier : m.pointerId || 999;
    },
    releaseCanvas(...m) {
      t.Konva.releaseCanvasOnDestroy && m.forEach((C) => {
        C.width = 0, C.height = 0;
      });
    },
    drawRoundedRectPath(m, C, $, N) {
      let G = 0, T = 0, M = 0, L = 0;
      typeof N == "number" ? G = T = M = L = Math.min(N, C / 2, $ / 2) : (G = Math.min(N[0] || 0, C / 2, $ / 2), T = Math.min(N[1] || 0, C / 2, $ / 2), L = Math.min(N[2] || 0, C / 2, $ / 2), M = Math.min(N[3] || 0, C / 2, $ / 2)), m.moveTo(G, 0), m.lineTo(C - T, 0), m.arc(C - T, T, T, Math.PI * 3 / 2, 0, !1), m.lineTo(C, $ - L), m.arc(C - L, $ - L, L, 0, Math.PI / 2, !1), m.lineTo(M, $), m.arc(M, $ - M, M, Math.PI / 2, Math.PI, !1), m.lineTo(0, G), m.arc(G, G, G, Math.PI, Math.PI * 3 / 2, !1);
    }
  };
})(Pe);
var ke = {}, nt = {}, _t = {};
Object.defineProperty(_t, "__esModule", { value: !0 });
_t.HitContext = _t.SceneContext = _t.Context = void 0;
const sl = Pe, Jf = le;
function Zf(i) {
  const t = [], e = i.length, n = sl.Util;
  for (let s = 0; s < e; s++) {
    let a = i[s];
    n._isNumber(a) ? a = Math.round(a * 1e3) / 1e3 : n._isString(a) || (a = a + ""), t.push(a);
  }
  return t;
}
const Ha = ",", ed = "(", td = ")", id = "([", rd = "])", nd = ";", sd = "()", ad = "=", Wa = [
  "arc",
  "arcTo",
  "beginPath",
  "bezierCurveTo",
  "clearRect",
  "clip",
  "closePath",
  "createLinearGradient",
  "createPattern",
  "createRadialGradient",
  "drawImage",
  "ellipse",
  "fill",
  "fillText",
  "getImageData",
  "createImageData",
  "lineTo",
  "moveTo",
  "putImageData",
  "quadraticCurveTo",
  "rect",
  "roundRect",
  "restore",
  "rotate",
  "save",
  "scale",
  "setLineDash",
  "setTransform",
  "stroke",
  "strokeText",
  "transform",
  "translate"
], od = [
  "fillStyle",
  "strokeStyle",
  "shadowColor",
  "shadowBlur",
  "shadowOffsetX",
  "shadowOffsetY",
  "letterSpacing",
  "lineCap",
  "lineDashOffset",
  "lineJoin",
  "lineWidth",
  "miterLimit",
  "direction",
  "font",
  "textAlign",
  "textBaseline",
  "globalAlpha",
  "globalCompositeOperation",
  "imageSmoothingEnabled"
], ld = 100;
class xr {
  constructor(t) {
    this.canvas = t, Jf.Konva.enableTrace && (this.traceArr = [], this._enableTrace());
  }
  fillShape(t) {
    t.fillEnabled() && this._fill(t);
  }
  _fill(t) {
  }
  strokeShape(t) {
    t.hasStroke() && this._stroke(t);
  }
  _stroke(t) {
  }
  fillStrokeShape(t) {
    t.attrs.fillAfterStrokeEnabled ? (this.strokeShape(t), this.fillShape(t)) : (this.fillShape(t), this.strokeShape(t));
  }
  getTrace(t, e) {
    let n = this.traceArr, s = n.length, a = "", l, c, u, d;
    for (l = 0; l < s; l++)
      c = n[l], u = c.method, u ? (d = c.args, a += u, t ? a += sd : sl.Util._isArray(d[0]) ? a += id + d.join(Ha) + rd : (e && (d = d.map((p) => typeof p == "number" ? Math.floor(p) : p)), a += ed + d.join(Ha) + td)) : (a += c.property, t || (a += ad + c.val)), a += nd;
    return a;
  }
  clearTrace() {
    this.traceArr = [];
  }
  _trace(t) {
    let e = this.traceArr, n;
    e.push(t), n = e.length, n >= ld && e.shift();
  }
  reset() {
    const t = this.getCanvas().getPixelRatio();
    this.setTransform(1 * t, 0, 0, 1 * t, 0, 0);
  }
  getCanvas() {
    return this.canvas;
  }
  clear(t) {
    const e = this.getCanvas();
    t ? this.clearRect(t.x || 0, t.y || 0, t.width || 0, t.height || 0) : this.clearRect(0, 0, e.getWidth() / e.pixelRatio, e.getHeight() / e.pixelRatio);
  }
  _applyLineCap(t) {
    const e = t.attrs.lineCap;
    e && this.setAttr("lineCap", e);
  }
  _applyOpacity(t) {
    const e = t.getAbsoluteOpacity();
    e !== 1 && this.setAttr("globalAlpha", e);
  }
  _applyLineJoin(t) {
    const e = t.attrs.lineJoin;
    e && this.setAttr("lineJoin", e);
  }
  setAttr(t, e) {
    this._context[t] = e;
  }
  arc(t, e, n, s, a, l) {
    this._context.arc(t, e, n, s, a, l);
  }
  arcTo(t, e, n, s, a) {
    this._context.arcTo(t, e, n, s, a);
  }
  beginPath() {
    this._context.beginPath();
  }
  bezierCurveTo(t, e, n, s, a, l) {
    this._context.bezierCurveTo(t, e, n, s, a, l);
  }
  clearRect(t, e, n, s) {
    this._context.clearRect(t, e, n, s);
  }
  clip(...t) {
    this._context.clip.apply(this._context, t);
  }
  closePath() {
    this._context.closePath();
  }
  createImageData(t, e) {
    const n = arguments;
    if (n.length === 2)
      return this._context.createImageData(t, e);
    if (n.length === 1)
      return this._context.createImageData(t);
  }
  createLinearGradient(t, e, n, s) {
    return this._context.createLinearGradient(t, e, n, s);
  }
  createPattern(t, e) {
    return this._context.createPattern(t, e);
  }
  createRadialGradient(t, e, n, s, a, l) {
    return this._context.createRadialGradient(t, e, n, s, a, l);
  }
  drawImage(t, e, n, s, a, l, c, u, d) {
    const p = arguments, v = this._context;
    p.length === 3 ? v.drawImage(t, e, n) : p.length === 5 ? v.drawImage(t, e, n, s, a) : p.length === 9 && v.drawImage(t, e, n, s, a, l, c, u, d);
  }
  ellipse(t, e, n, s, a, l, c, u) {
    this._context.ellipse(t, e, n, s, a, l, c, u);
  }
  isPointInPath(t, e, n, s) {
    return n ? this._context.isPointInPath(n, t, e, s) : this._context.isPointInPath(t, e, s);
  }
  fill(...t) {
    this._context.fill.apply(this._context, t);
  }
  fillRect(t, e, n, s) {
    this._context.fillRect(t, e, n, s);
  }
  strokeRect(t, e, n, s) {
    this._context.strokeRect(t, e, n, s);
  }
  fillText(t, e, n, s) {
    s ? this._context.fillText(t, e, n, s) : this._context.fillText(t, e, n);
  }
  measureText(t) {
    return this._context.measureText(t);
  }
  getImageData(t, e, n, s) {
    return this._context.getImageData(t, e, n, s);
  }
  lineTo(t, e) {
    this._context.lineTo(t, e);
  }
  moveTo(t, e) {
    this._context.moveTo(t, e);
  }
  rect(t, e, n, s) {
    this._context.rect(t, e, n, s);
  }
  roundRect(t, e, n, s, a) {
    this._context.roundRect(t, e, n, s, a);
  }
  putImageData(t, e, n) {
    this._context.putImageData(t, e, n);
  }
  quadraticCurveTo(t, e, n, s) {
    this._context.quadraticCurveTo(t, e, n, s);
  }
  restore() {
    this._context.restore();
  }
  rotate(t) {
    this._context.rotate(t);
  }
  save() {
    this._context.save();
  }
  scale(t, e) {
    this._context.scale(t, e);
  }
  setLineDash(t) {
    this._context.setLineDash ? this._context.setLineDash(t) : "mozDash" in this._context ? this._context.mozDash = t : "webkitLineDash" in this._context && (this._context.webkitLineDash = t);
  }
  getLineDash() {
    return this._context.getLineDash();
  }
  setTransform(t, e, n, s, a, l) {
    this._context.setTransform(t, e, n, s, a, l);
  }
  stroke(t) {
    t ? this._context.stroke(t) : this._context.stroke();
  }
  strokeText(t, e, n, s) {
    this._context.strokeText(t, e, n, s);
  }
  transform(t, e, n, s, a, l) {
    this._context.transform(t, e, n, s, a, l);
  }
  translate(t, e) {
    this._context.translate(t, e);
  }
  _enableTrace() {
    let t = this, e = Wa.length, n = this.setAttr, s, a;
    const l = function(c) {
      let u = t[c], d;
      t[c] = function() {
        return a = Zf(Array.prototype.slice.call(arguments, 0)), d = u.apply(t, arguments), t._trace({
          method: c,
          args: a
        }), d;
      };
    };
    for (s = 0; s < e; s++)
      l(Wa[s]);
    t.setAttr = function() {
      n.apply(t, arguments);
      const c = arguments[0];
      let u = arguments[1];
      (c === "shadowOffsetX" || c === "shadowOffsetY" || c === "shadowBlur") && (u = u / this.canvas.getPixelRatio()), t._trace({
        property: c,
        val: u
      });
    };
  }
  _applyGlobalCompositeOperation(t) {
    const e = t.attrs.globalCompositeOperation;
    !e || e === "source-over" || this.setAttr("globalCompositeOperation", e);
  }
}
_t.Context = xr;
od.forEach(function(i) {
  Object.defineProperty(xr.prototype, i, {
    get() {
      return this._context[i];
    },
    set(t) {
      this._context[i] = t;
    }
  });
});
class hd extends xr {
  constructor(t, { willReadFrequently: e = !1 } = {}) {
    super(t), this._context = t._canvas.getContext("2d", {
      willReadFrequently: e
    });
  }
  _fillColor(t) {
    const e = t.fill();
    this.setAttr("fillStyle", e), t._fillFunc(this);
  }
  _fillPattern(t) {
    this.setAttr("fillStyle", t._getFillPattern()), t._fillFunc(this);
  }
  _fillLinearGradient(t) {
    const e = t._getLinearGradient();
    e && (this.setAttr("fillStyle", e), t._fillFunc(this));
  }
  _fillRadialGradient(t) {
    const e = t._getRadialGradient();
    e && (this.setAttr("fillStyle", e), t._fillFunc(this));
  }
  _fill(t) {
    const e = t.fill(), n = t.getFillPriority();
    if (e && n === "color") {
      this._fillColor(t);
      return;
    }
    const s = t.getFillPatternImage();
    if (s && n === "pattern") {
      this._fillPattern(t);
      return;
    }
    const a = t.getFillLinearGradientColorStops();
    if (a && n === "linear-gradient") {
      this._fillLinearGradient(t);
      return;
    }
    const l = t.getFillRadialGradientColorStops();
    if (l && n === "radial-gradient") {
      this._fillRadialGradient(t);
      return;
    }
    e ? this._fillColor(t) : s ? this._fillPattern(t) : a ? this._fillLinearGradient(t) : l && this._fillRadialGradient(t);
  }
  _strokeLinearGradient(t) {
    const e = t.getStrokeLinearGradientStartPoint(), n = t.getStrokeLinearGradientEndPoint(), s = t.getStrokeLinearGradientColorStops(), a = this.createLinearGradient(e.x, e.y, n.x, n.y);
    if (s) {
      for (let l = 0; l < s.length; l += 2)
        a.addColorStop(s[l], s[l + 1]);
      this.setAttr("strokeStyle", a);
    }
  }
  _stroke(t) {
    const e = t.dash(), n = t.getStrokeScaleEnabled();
    if (t.hasStroke()) {
      if (!n) {
        this.save();
        const a = this.getCanvas().getPixelRatio();
        this.setTransform(a, 0, 0, a, 0, 0);
      }
      this._applyLineCap(t), e && t.dashEnabled() && (this.setLineDash(e), this.setAttr("lineDashOffset", t.dashOffset())), this.setAttr("lineWidth", t.strokeWidth()), t.getShadowForStrokeEnabled() || this.setAttr("shadowColor", "rgba(0,0,0,0)"), t.getStrokeLinearGradientColorStops() ? this._strokeLinearGradient(t) : this.setAttr("strokeStyle", t.stroke()), t._strokeFunc(this), n || this.restore();
    }
  }
  _applyShadow(t) {
    var e, n, s;
    const a = (e = t.getShadowRGBA()) !== null && e !== void 0 ? e : "black", l = (n = t.getShadowBlur()) !== null && n !== void 0 ? n : 5, c = (s = t.getShadowOffset()) !== null && s !== void 0 ? s : {
      x: 0,
      y: 0
    }, u = t.getAbsoluteScale(), d = this.canvas.getPixelRatio(), p = u.x * d, v = u.y * d;
    this.setAttr("shadowColor", a), this.setAttr("shadowBlur", l * Math.min(Math.abs(p), Math.abs(v))), this.setAttr("shadowOffsetX", c.x * p), this.setAttr("shadowOffsetY", c.y * v);
  }
}
_t.SceneContext = hd;
class cd extends xr {
  constructor(t) {
    super(t), this._context = t._canvas.getContext("2d", {
      willReadFrequently: !0
    });
  }
  _fill(t) {
    this.save(), this.setAttr("fillStyle", t.colorKey), t._fillFuncHit(this), this.restore();
  }
  strokeShape(t) {
    t.hasHitStroke() && this._stroke(t);
  }
  _stroke(t) {
    if (t.hasHitStroke()) {
      const e = t.getStrokeScaleEnabled();
      if (!e) {
        this.save();
        const a = this.getCanvas().getPixelRatio();
        this.setTransform(a, 0, 0, a, 0, 0);
      }
      this._applyLineCap(t);
      const n = t.hitStrokeWidth(), s = n === "auto" ? t.strokeWidth() : n;
      this.setAttr("lineWidth", s), this.setAttr("strokeStyle", t.colorKey), t._strokeFuncHit(this), e || this.restore();
    }
  }
}
_t.HitContext = cd;
Object.defineProperty(nt, "__esModule", { value: !0 });
nt.HitCanvas = nt.SceneCanvas = nt.Canvas = void 0;
const vr = Pe, al = _t, ol = le;
let or;
function ud() {
  if (or)
    return or;
  const i = vr.Util.createCanvasElement(), t = i.getContext("2d");
  return or = function() {
    const e = ol.Konva._global.devicePixelRatio || 1, n = t.webkitBackingStorePixelRatio || t.mozBackingStorePixelRatio || t.msBackingStorePixelRatio || t.oBackingStorePixelRatio || t.backingStorePixelRatio || 1;
    return e / n;
  }(), vr.Util.releaseCanvas(i), or;
}
class ps {
  constructor(t) {
    this.pixelRatio = 1, this.width = 0, this.height = 0, this.isCache = !1;
    const n = (t || {}).pixelRatio || ol.Konva.pixelRatio || ud();
    this.pixelRatio = n, this._canvas = vr.Util.createCanvasElement(), this._canvas.style.padding = "0", this._canvas.style.margin = "0", this._canvas.style.border = "0", this._canvas.style.background = "transparent", this._canvas.style.position = "absolute", this._canvas.style.top = "0", this._canvas.style.left = "0";
  }
  getContext() {
    return this.context;
  }
  getPixelRatio() {
    return this.pixelRatio;
  }
  setPixelRatio(t) {
    const e = this.pixelRatio;
    this.pixelRatio = t, this.setSize(this.getWidth() / e, this.getHeight() / e);
  }
  setWidth(t) {
    this.width = this._canvas.width = t * this.pixelRatio, this._canvas.style.width = t + "px";
    const e = this.pixelRatio;
    this.getContext()._context.scale(e, e);
  }
  setHeight(t) {
    this.height = this._canvas.height = t * this.pixelRatio, this._canvas.style.height = t + "px";
    const e = this.pixelRatio;
    this.getContext()._context.scale(e, e);
  }
  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }
  setSize(t, e) {
    this.setWidth(t || 0), this.setHeight(e || 0);
  }
  toDataURL(t, e) {
    try {
      return this._canvas.toDataURL(t, e);
    } catch {
      try {
        return this._canvas.toDataURL();
      } catch (s) {
        return vr.Util.error("Unable to get data URL. " + s.message + " For more info read https://konvajs.org/docs/posts/Tainted_Canvas.html."), "";
      }
    }
  }
}
nt.Canvas = ps;
class fd extends ps {
  constructor(t = { width: 0, height: 0, willReadFrequently: !1 }) {
    super(t), this.context = new al.SceneContext(this, {
      willReadFrequently: t.willReadFrequently
    }), this.setSize(t.width, t.height);
  }
}
nt.SceneCanvas = fd;
class dd extends ps {
  constructor(t = { width: 0, height: 0 }) {
    super(t), this.hitCanvas = !0, this.context = new al.HitContext(this), this.setSize(t.width, t.height);
  }
}
nt.HitCanvas = dd;
var kr = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.DD = void 0;
  const t = le, e = Pe;
  i.DD = {
    get isDragging() {
      let n = !1;
      return i.DD._dragElements.forEach((s) => {
        s.dragStatus === "dragging" && (n = !0);
      }), n;
    },
    justDragged: !1,
    get node() {
      let n;
      return i.DD._dragElements.forEach((s) => {
        n = s.node;
      }), n;
    },
    _dragElements: /* @__PURE__ */ new Map(),
    _drag(n) {
      const s = [];
      i.DD._dragElements.forEach((a, l) => {
        const { node: c } = a, u = c.getStage();
        u.setPointersPositions(n), a.pointerId === void 0 && (a.pointerId = e.Util._getFirstPointerId(n));
        const d = u._changedPointerPositions.find((p) => p.id === a.pointerId);
        if (d) {
          if (a.dragStatus !== "dragging") {
            const p = c.dragDistance();
            if (Math.max(Math.abs(d.x - a.startPointerPos.x), Math.abs(d.y - a.startPointerPos.y)) < p || (c.startDrag({ evt: n }), !c.isDragging()))
              return;
          }
          c._setDragPosition(n, a), s.push(c);
        }
      }), s.forEach((a) => {
        a.fire("dragmove", {
          type: "dragmove",
          target: a,
          evt: n
        }, !0);
      });
    },
    _endDragBefore(n) {
      const s = [];
      i.DD._dragElements.forEach((a) => {
        const { node: l } = a, c = l.getStage();
        if (n && c.setPointersPositions(n), !c._changedPointerPositions.find((p) => p.id === a.pointerId))
          return;
        (a.dragStatus === "dragging" || a.dragStatus === "stopped") && (i.DD.justDragged = !0, t.Konva._mouseListenClick = !1, t.Konva._touchListenClick = !1, t.Konva._pointerListenClick = !1, a.dragStatus = "stopped");
        const d = a.node.getLayer() || a.node instanceof t.Konva.Stage && a.node;
        d && s.indexOf(d) === -1 && s.push(d);
      }), s.forEach((a) => {
        a.draw();
      });
    },
    _endDragAfter(n) {
      i.DD._dragElements.forEach((s, a) => {
        s.dragStatus === "stopped" && s.node.fire("dragend", {
          type: "dragend",
          target: s.node,
          evt: n
        }, !0), s.dragStatus !== "dragging" && i.DD._dragElements.delete(a);
      });
    }
  }, t.Konva.isBrowser && (window.addEventListener("mouseup", i.DD._endDragBefore, !0), window.addEventListener("touchend", i.DD._endDragBefore, !0), window.addEventListener("touchcancel", i.DD._endDragBefore, !0), window.addEventListener("mousemove", i.DD._drag), window.addEventListener("touchmove", i.DD._drag), window.addEventListener("mouseup", i.DD._endDragAfter, !1), window.addEventListener("touchend", i.DD._endDragAfter, !1), window.addEventListener("touchcancel", i.DD._endDragAfter, !1));
})(kr);
var ce = {}, se = {};
Object.defineProperty(se, "__esModule", { value: !0 });
se.RGBComponent = gd;
se.alphaComponent = pd;
se.getNumberValidator = md;
se.getNumberOrArrayOfNumbersValidator = _d;
se.getNumberOrAutoValidator = vd;
se.getStringValidator = bd;
se.getStringOrGradientValidator = yd;
se.getFunctionValidator = wd;
se.getNumberArrayValidator = Cd;
se.getBooleanValidator = Sd;
se.getComponentValidator = Ed;
const vt = le, Ae = Pe;
function bt(i) {
  return Ae.Util._isString(i) ? '"' + i + '"' : Object.prototype.toString.call(i) === "[object Number]" || Ae.Util._isBoolean(i) ? i : Object.prototype.toString.call(i);
}
function gd(i) {
  return i > 255 ? 255 : i < 0 ? 0 : Math.round(i);
}
function pd(i) {
  return i > 1 ? 1 : i < 1e-4 ? 1e-4 : i;
}
function md() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      return Ae.Util._isNumber(i) || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a number.'), i;
    };
}
function _d(i) {
  if (vt.Konva.isUnminified)
    return function(t, e) {
      let n = Ae.Util._isNumber(t), s = Ae.Util._isArray(t) && t.length == i;
      return !n && !s && Ae.Util.warn(bt(t) + ' is a not valid value for "' + e + '" attribute. The value should be a number or Array<number>(' + i + ")"), t;
    };
}
function vd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      return Ae.Util._isNumber(i) || i === "auto" || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a number or "auto".'), i;
    };
}
function bd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      return Ae.Util._isString(i) || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a string.'), i;
    };
}
function yd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      const e = Ae.Util._isString(i), n = Object.prototype.toString.call(i) === "[object CanvasGradient]" || i && i.addColorStop;
      return e || n || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a string or a native gradient.'), i;
    };
}
function wd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      return Ae.Util._isFunction(i) || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a function.'), i;
    };
}
function Cd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      const e = Int8Array ? Object.getPrototypeOf(Int8Array) : null;
      return e && i instanceof e || (Ae.Util._isArray(i) ? i.forEach(function(n) {
        Ae.Util._isNumber(n) || Ae.Util.warn('"' + t + '" attribute has non numeric element ' + n + ". Make sure that all elements are numbers.");
      }) : Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a array of numbers.')), i;
    };
}
function Sd() {
  if (vt.Konva.isUnminified)
    return function(i, t) {
      return i === !0 || i === !1 || Ae.Util.warn(bt(i) + ' is a not valid value for "' + t + '" attribute. The value should be a boolean.'), i;
    };
}
function Ed(i) {
  if (vt.Konva.isUnminified)
    return function(t, e) {
      return t == null || Ae.Util.isObject(t) || Ae.Util.warn(bt(t) + ' is a not valid value for "' + e + '" attribute. The value should be an object with properties ' + i), t;
    };
}
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Factory = void 0;
  const t = Pe, e = se, n = "get", s = "set";
  i.Factory = {
    addGetterSetter(a, l, c, u, d) {
      i.Factory.addGetter(a, l, c), i.Factory.addSetter(a, l, u, d), i.Factory.addOverloadedGetterSetter(a, l);
    },
    addGetter(a, l, c) {
      const u = n + t.Util._capitalize(l);
      a.prototype[u] = a.prototype[u] || function() {
        const d = this.attrs[l];
        return d === void 0 ? c : d;
      };
    },
    addSetter(a, l, c, u) {
      const d = s + t.Util._capitalize(l);
      a.prototype[d] || i.Factory.overWriteSetter(a, l, c, u);
    },
    overWriteSetter(a, l, c, u) {
      const d = s + t.Util._capitalize(l);
      a.prototype[d] = function(p) {
        return c && p !== void 0 && p !== null && (p = c.call(this, p, l)), this._setAttr(l, p), u && u.call(this), this;
      };
    },
    addComponentsGetterSetter(a, l, c, u, d) {
      const p = c.length, v = t.Util._capitalize, b = n + v(l), y = s + v(l);
      a.prototype[b] = function() {
        const S = {};
        for (let E = 0; E < p; E++) {
          const P = c[E];
          S[P] = this.getAttr(l + v(P));
        }
        return S;
      };
      const _ = (0, e.getComponentValidator)(c);
      a.prototype[y] = function(S) {
        const E = this.attrs[l];
        u && (S = u.call(this, S, l)), _ && _.call(this, S, l);
        for (const P in S)
          S.hasOwnProperty(P) && this._setAttr(l + v(P), S[P]);
        return S || c.forEach((P) => {
          this._setAttr(l + v(P), void 0);
        }), this._fireChangeEvent(l, E, S), d && d.call(this), this;
      }, i.Factory.addOverloadedGetterSetter(a, l);
    },
    addOverloadedGetterSetter(a, l) {
      const c = t.Util._capitalize(l), u = s + c, d = n + c;
      a.prototype[l] = function() {
        return arguments.length ? (this[u](arguments[0]), this) : this[d]();
      };
    },
    addDeprecatedGetterSetter(a, l, c, u) {
      t.Util.error("Adding deprecated " + l);
      const d = n + t.Util._capitalize(l), p = l + " property is deprecated and will be removed soon. Look at Konva change log for more information.";
      a.prototype[d] = function() {
        t.Util.error(p);
        const v = this.attrs[l];
        return v === void 0 ? c : v;
      }, i.Factory.addSetter(a, l, u, function() {
        t.Util.error(p);
      }), i.Factory.addOverloadedGetterSetter(a, l);
    },
    backCompat(a, l) {
      t.Util.each(l, function(c, u) {
        const d = a.prototype[u], p = n + t.Util._capitalize(c), v = s + t.Util._capitalize(c);
        function b() {
          d.apply(this, arguments), t.Util.error('"' + c + '" method is deprecated and will be removed soon. Use ""' + u + '" instead.');
        }
        a.prototype[c] = b, a.prototype[p] = b, a.prototype[v] = b;
      });
    },
    afterSetFilter() {
      this._filterUpToDate = !1;
    }
  };
})(ce);
Object.defineProperty(ke, "__esModule", { value: !0 });
ke.Node = void 0;
const ii = nt, Ze = kr, Ii = ce, Et = le, de = Pe, Le = se, pr = "absoluteOpacity", lr = "allEventListeners", pt = "absoluteTransform", za = "absoluteScale", Mt = "canvas", xd = "Change", kd = "children", $d = "konva", ts = "listening", Pd = "mouseenter", Td = "mouseleave", Ad = "pointerenter", Od = "pointerleave", Nd = "touchenter", Rd = "touchleave", Ya = "set", Ka = "Shape", mr = " ", Xa = "stage", kt = "transform", Ld = "Stage", is = "visible", Fd = [
  "xChange.konva",
  "yChange.konva",
  "scaleXChange.konva",
  "scaleYChange.konva",
  "skewXChange.konva",
  "skewYChange.konva",
  "rotationChange.konva",
  "offsetXChange.konva",
  "offsetYChange.konva",
  "transformsEnabledChange.konva"
].join(mr);
let Md = 1;
class ae {
  constructor(t) {
    this._id = Md++, this.eventListeners = {}, this.attrs = {}, this.index = 0, this._allEventListeners = null, this.parent = null, this._cache = /* @__PURE__ */ new Map(), this._attachedDepsListeners = /* @__PURE__ */ new Map(), this._lastPos = null, this._batchingTransformChange = !1, this._needClearTransformCache = !1, this._filterUpToDate = !1, this._isUnderCache = !1, this._dragEventId = null, this._shouldFireChangeEvents = !1, this.setAttrs(t), this._shouldFireChangeEvents = !0;
  }
  hasChildren() {
    return !1;
  }
  _clearCache(t) {
    (t === kt || t === pt) && this._cache.get(t) ? this._cache.get(t).dirty = !0 : t ? this._cache.delete(t) : this._cache.clear();
  }
  _getCache(t, e) {
    let n = this._cache.get(t);
    return (n === void 0 || (t === kt || t === pt) && n.dirty === !0) && (n = e.call(this), this._cache.set(t, n)), n;
  }
  _calculate(t, e, n) {
    if (!this._attachedDepsListeners.get(t)) {
      const s = e.map((a) => a + "Change.konva").join(mr);
      this.on(s, () => {
        this._clearCache(t);
      }), this._attachedDepsListeners.set(t, !0);
    }
    return this._getCache(t, n);
  }
  _getCanvasCache() {
    return this._cache.get(Mt);
  }
  _clearSelfAndDescendantCache(t) {
    this._clearCache(t), t === pt && this.fire("absoluteTransformChange");
  }
  clearCache() {
    if (this._cache.has(Mt)) {
      const { scene: t, filter: e, hit: n, buffer: s } = this._cache.get(Mt);
      de.Util.releaseCanvas(t, e, n, s), this._cache.delete(Mt);
    }
    return this._clearSelfAndDescendantCache(), this._requestDraw(), this;
  }
  cache(t) {
    const e = t || {};
    let n = {};
    (e.x === void 0 || e.y === void 0 || e.width === void 0 || e.height === void 0) && (n = this.getClientRect({
      skipTransform: !0,
      relativeTo: this.getParent() || void 0
    }));
    let s = Math.ceil(e.width || n.width), a = Math.ceil(e.height || n.height), l = e.pixelRatio, c = e.x === void 0 ? Math.floor(n.x) : e.x, u = e.y === void 0 ? Math.floor(n.y) : e.y, d = e.offset || 0, p = e.drawBorder || !1, v = e.hitCanvasPixelRatio || 1;
    if (!s || !a) {
      de.Util.error("Can not cache the node. Width or height of the node equals 0. Caching is skipped.");
      return;
    }
    const b = Math.abs(Math.round(n.x) - c) > 0.5 ? 1 : 0, y = Math.abs(Math.round(n.y) - u) > 0.5 ? 1 : 0;
    s += d * 2 + b, a += d * 2 + y, c -= d, u -= d;
    const _ = new ii.SceneCanvas({
      pixelRatio: l,
      width: s,
      height: a
    }), S = new ii.SceneCanvas({
      pixelRatio: l,
      width: 0,
      height: 0,
      willReadFrequently: !0
    }), E = new ii.HitCanvas({
      pixelRatio: v,
      width: s,
      height: a
    }), P = _.getContext(), A = E.getContext(), m = new ii.SceneCanvas({
      width: _.width / _.pixelRatio + Math.abs(c),
      height: _.height / _.pixelRatio + Math.abs(u),
      pixelRatio: _.pixelRatio
    }), C = m.getContext();
    return E.isCache = !0, _.isCache = !0, this._cache.delete(Mt), this._filterUpToDate = !1, e.imageSmoothingEnabled === !1 && (_.getContext()._context.imageSmoothingEnabled = !1, S.getContext()._context.imageSmoothingEnabled = !1), P.save(), A.save(), C.save(), P.translate(-c, -u), A.translate(-c, -u), C.translate(-c, -u), m.x = c, m.y = u, this._isUnderCache = !0, this._clearSelfAndDescendantCache(pr), this._clearSelfAndDescendantCache(za), this.drawScene(_, this, m), this.drawHit(E, this), this._isUnderCache = !1, P.restore(), A.restore(), p && (P.save(), P.beginPath(), P.rect(0, 0, s, a), P.closePath(), P.setAttr("strokeStyle", "red"), P.setAttr("lineWidth", 5), P.stroke(), P.restore()), this._cache.set(Mt, {
      scene: _,
      filter: S,
      hit: E,
      buffer: m,
      x: c,
      y: u
    }), this._requestDraw(), this;
  }
  isCached() {
    return this._cache.has(Mt);
  }
  getClientRect(t) {
    throw new Error('abstract "getClientRect" method call');
  }
  _transformedRect(t, e) {
    const n = [
      { x: t.x, y: t.y },
      { x: t.x + t.width, y: t.y },
      { x: t.x + t.width, y: t.y + t.height },
      { x: t.x, y: t.y + t.height }
    ];
    let s = 1 / 0, a = 1 / 0, l = -1 / 0, c = -1 / 0;
    const u = this.getAbsoluteTransform(e);
    return n.forEach(function(d) {
      const p = u.point(d);
      s === void 0 && (s = l = p.x, a = c = p.y), s = Math.min(s, p.x), a = Math.min(a, p.y), l = Math.max(l, p.x), c = Math.max(c, p.y);
    }), {
      x: s,
      y: a,
      width: l - s,
      height: c - a
    };
  }
  _drawCachedSceneCanvas(t) {
    t.save(), t._applyOpacity(this), t._applyGlobalCompositeOperation(this);
    const e = this._getCanvasCache();
    t.translate(e.x, e.y);
    const n = this._getCachedSceneCanvas(), s = n.pixelRatio;
    t.drawImage(n._canvas, 0, 0, n.width / s, n.height / s), t.restore();
  }
  _drawCachedHitCanvas(t) {
    const e = this._getCanvasCache(), n = e.hit;
    t.save(), t.translate(e.x, e.y), t.drawImage(n._canvas, 0, 0, n.width / n.pixelRatio, n.height / n.pixelRatio), t.restore();
  }
  _getCachedSceneCanvas() {
    let t = this.filters(), e = this._getCanvasCache(), n = e.scene, s = e.filter, a = s.getContext(), l, c, u, d;
    if (t) {
      if (!this._filterUpToDate) {
        const p = n.pixelRatio;
        s.setSize(n.width / n.pixelRatio, n.height / n.pixelRatio);
        try {
          for (l = t.length, a.clear(), a.drawImage(n._canvas, 0, 0, n.getWidth() / p, n.getHeight() / p), c = a.getImageData(0, 0, s.getWidth(), s.getHeight()), u = 0; u < l; u++) {
            if (d = t[u], typeof d != "function") {
              de.Util.error("Filter should be type of function, but got " + typeof d + " instead. Please check correct filters");
              continue;
            }
            d.call(this, c), a.putImageData(c, 0, 0);
          }
        } catch (v) {
          de.Util.error("Unable to apply filter. " + v.message + " This post my help you https://konvajs.org/docs/posts/Tainted_Canvas.html.");
        }
        this._filterUpToDate = !0;
      }
      return s;
    }
    return n;
  }
  on(t, e) {
    if (this._cache && this._cache.delete(lr), arguments.length === 3)
      return this._delegate.apply(this, arguments);
    const n = t.split(mr);
    for (let s = 0; s < n.length; s++) {
      const l = n[s].split("."), c = l[0], u = l[1] || "";
      this.eventListeners[c] || (this.eventListeners[c] = []), this.eventListeners[c].push({ name: u, handler: e });
    }
    return this;
  }
  off(t, e) {
    let n = (t || "").split(mr), s = n.length, a, l, c, u, d, p;
    if (this._cache && this._cache.delete(lr), !t)
      for (l in this.eventListeners)
        this._off(l);
    for (a = 0; a < s; a++)
      if (c = n[a], u = c.split("."), d = u[0], p = u[1], d)
        this.eventListeners[d] && this._off(d, p, e);
      else
        for (l in this.eventListeners)
          this._off(l, p, e);
    return this;
  }
  dispatchEvent(t) {
    const e = {
      target: this,
      type: t.type,
      evt: t
    };
    return this.fire(t.type, e), this;
  }
  addEventListener(t, e) {
    return this.on(t, function(n) {
      e.call(this, n.evt);
    }), this;
  }
  removeEventListener(t) {
    return this.off(t), this;
  }
  _delegate(t, e, n) {
    const s = this;
    this.on(t, function(a) {
      const l = a.target.findAncestors(e, !0, s);
      for (let c = 0; c < l.length; c++)
        a = de.Util.cloneObject(a), a.currentTarget = l[c], n.call(l[c], a);
    });
  }
  remove() {
    return this.isDragging() && this.stopDrag(), Ze.DD._dragElements.delete(this._id), this._remove(), this;
  }
  _clearCaches() {
    this._clearSelfAndDescendantCache(pt), this._clearSelfAndDescendantCache(pr), this._clearSelfAndDescendantCache(za), this._clearSelfAndDescendantCache(Xa), this._clearSelfAndDescendantCache(is), this._clearSelfAndDescendantCache(ts);
  }
  _remove() {
    this._clearCaches();
    const t = this.getParent();
    t && t.children && (t.children.splice(this.index, 1), t._setChildrenIndices(), this.parent = null);
  }
  destroy() {
    return this.remove(), this.clearCache(), this;
  }
  getAttr(t) {
    const e = "get" + de.Util._capitalize(t);
    return de.Util._isFunction(this[e]) ? this[e]() : this.attrs[t];
  }
  getAncestors() {
    let t = this.getParent(), e = [];
    for (; t; )
      e.push(t), t = t.getParent();
    return e;
  }
  getAttrs() {
    return this.attrs || {};
  }
  setAttrs(t) {
    return this._batchTransformChanges(() => {
      let e, n;
      if (!t)
        return this;
      for (e in t)
        e !== kd && (n = Ya + de.Util._capitalize(e), de.Util._isFunction(this[n]) ? this[n](t[e]) : this._setAttr(e, t[e]));
    }), this;
  }
  isListening() {
    return this._getCache(ts, this._isListening);
  }
  _isListening(t) {
    if (!this.listening())
      return !1;
    const n = this.getParent();
    return n && n !== t && this !== t ? n._isListening(t) : !0;
  }
  isVisible() {
    return this._getCache(is, this._isVisible);
  }
  _isVisible(t) {
    if (!this.visible())
      return !1;
    const n = this.getParent();
    return n && n !== t && this !== t ? n._isVisible(t) : !0;
  }
  shouldDrawHit(t, e = !1) {
    if (t)
      return this._isVisible(t) && this._isListening(t);
    const n = this.getLayer();
    let s = !1;
    Ze.DD._dragElements.forEach((l) => {
      l.dragStatus === "dragging" && (l.node.nodeType === "Stage" || l.node.getLayer() === n) && (s = !0);
    });
    const a = !e && !Et.Konva.hitOnDragEnabled && (s || Et.Konva.isTransforming());
    return this.isListening() && this.isVisible() && !a;
  }
  show() {
    return this.visible(!0), this;
  }
  hide() {
    return this.visible(!1), this;
  }
  getZIndex() {
    return this.index || 0;
  }
  getAbsoluteZIndex() {
    let t = this.getDepth(), e = this, n = 0, s, a, l, c;
    function u(p) {
      for (s = [], a = p.length, l = 0; l < a; l++)
        c = p[l], n++, c.nodeType !== Ka && (s = s.concat(c.getChildren().slice())), c._id === e._id && (l = a);
      s.length > 0 && s[0].getDepth() <= t && u(s);
    }
    const d = this.getStage();
    return e.nodeType !== Ld && d && u(d.getChildren()), n;
  }
  getDepth() {
    let t = 0, e = this.parent;
    for (; e; )
      t++, e = e.parent;
    return t;
  }
  _batchTransformChanges(t) {
    this._batchingTransformChange = !0, t(), this._batchingTransformChange = !1, this._needClearTransformCache && (this._clearCache(kt), this._clearSelfAndDescendantCache(pt)), this._needClearTransformCache = !1;
  }
  setPosition(t) {
    return this._batchTransformChanges(() => {
      this.x(t.x), this.y(t.y);
    }), this;
  }
  getPosition() {
    return {
      x: this.x(),
      y: this.y()
    };
  }
  getRelativePointerPosition() {
    const t = this.getStage();
    if (!t)
      return null;
    const e = t.getPointerPosition();
    if (!e)
      return null;
    const n = this.getAbsoluteTransform().copy();
    return n.invert(), n.point(e);
  }
  getAbsolutePosition(t) {
    let e = !1, n = this.parent;
    for (; n; ) {
      if (n.isCached()) {
        e = !0;
        break;
      }
      n = n.parent;
    }
    e && !t && (t = !0);
    const s = this.getAbsoluteTransform(t).getMatrix(), a = new de.Transform(), l = this.offset();
    return a.m = s.slice(), a.translate(l.x, l.y), a.getTranslation();
  }
  setAbsolutePosition(t) {
    const { x: e, y: n, ...s } = this._clearTransform();
    this.attrs.x = e, this.attrs.y = n, this._clearCache(kt);
    const a = this._getAbsoluteTransform().copy();
    return a.invert(), a.translate(t.x, t.y), t = {
      x: this.attrs.x + a.getTranslation().x,
      y: this.attrs.y + a.getTranslation().y
    }, this._setTransform(s), this.setPosition({ x: t.x, y: t.y }), this._clearCache(kt), this._clearSelfAndDescendantCache(pt), this;
  }
  _setTransform(t) {
    let e;
    for (e in t)
      this.attrs[e] = t[e];
  }
  _clearTransform() {
    const t = {
      x: this.x(),
      y: this.y(),
      rotation: this.rotation(),
      scaleX: this.scaleX(),
      scaleY: this.scaleY(),
      offsetX: this.offsetX(),
      offsetY: this.offsetY(),
      skewX: this.skewX(),
      skewY: this.skewY()
    };
    return this.attrs.x = 0, this.attrs.y = 0, this.attrs.rotation = 0, this.attrs.scaleX = 1, this.attrs.scaleY = 1, this.attrs.offsetX = 0, this.attrs.offsetY = 0, this.attrs.skewX = 0, this.attrs.skewY = 0, t;
  }
  move(t) {
    let e = t.x, n = t.y, s = this.x(), a = this.y();
    return e !== void 0 && (s += e), n !== void 0 && (a += n), this.setPosition({ x: s, y: a }), this;
  }
  _eachAncestorReverse(t, e) {
    let n = [], s = this.getParent(), a, l;
    if (!(e && e._id === this._id)) {
      for (n.unshift(this); s && (!e || s._id !== e._id); )
        n.unshift(s), s = s.parent;
      for (a = n.length, l = 0; l < a; l++)
        t(n[l]);
    }
  }
  rotate(t) {
    return this.rotation(this.rotation() + t), this;
  }
  moveToTop() {
    if (!this.parent)
      return de.Util.warn("Node has no parent. moveToTop function is ignored."), !1;
    const t = this.index, e = this.parent.getChildren().length;
    return t < e - 1 ? (this.parent.children.splice(t, 1), this.parent.children.push(this), this.parent._setChildrenIndices(), !0) : !1;
  }
  moveUp() {
    if (!this.parent)
      return de.Util.warn("Node has no parent. moveUp function is ignored."), !1;
    const t = this.index, e = this.parent.getChildren().length;
    return t < e - 1 ? (this.parent.children.splice(t, 1), this.parent.children.splice(t + 1, 0, this), this.parent._setChildrenIndices(), !0) : !1;
  }
  moveDown() {
    if (!this.parent)
      return de.Util.warn("Node has no parent. moveDown function is ignored."), !1;
    const t = this.index;
    return t > 0 ? (this.parent.children.splice(t, 1), this.parent.children.splice(t - 1, 0, this), this.parent._setChildrenIndices(), !0) : !1;
  }
  moveToBottom() {
    if (!this.parent)
      return de.Util.warn("Node has no parent. moveToBottom function is ignored."), !1;
    const t = this.index;
    return t > 0 ? (this.parent.children.splice(t, 1), this.parent.children.unshift(this), this.parent._setChildrenIndices(), !0) : !1;
  }
  setZIndex(t) {
    if (!this.parent)
      return de.Util.warn("Node has no parent. zIndex parameter is ignored."), this;
    (t < 0 || t >= this.parent.children.length) && de.Util.warn("Unexpected value " + t + " for zIndex property. zIndex is just index of a node in children of its parent. Expected value is from 0 to " + (this.parent.children.length - 1) + ".");
    const e = this.index;
    return this.parent.children.splice(e, 1), this.parent.children.splice(t, 0, this), this.parent._setChildrenIndices(), this;
  }
  getAbsoluteOpacity() {
    return this._getCache(pr, this._getAbsoluteOpacity);
  }
  _getAbsoluteOpacity() {
    let t = this.opacity();
    const e = this.getParent();
    return e && !e._isUnderCache && (t *= e.getAbsoluteOpacity()), t;
  }
  moveTo(t) {
    return this.getParent() !== t && (this._remove(), t.add(this)), this;
  }
  toObject() {
    let t = this.getAttrs(), e, n, s, a, l;
    const c = {
      attrs: {},
      className: this.getClassName()
    };
    for (e in t)
      n = t[e], l = de.Util.isObject(n) && !de.Util._isPlainObject(n) && !de.Util._isArray(n), !l && (s = typeof this[e] == "function" && this[e], delete t[e], a = s ? s.call(this) : null, t[e] = n, a !== n && (c.attrs[e] = n));
    return de.Util._prepareToStringify(c);
  }
  toJSON() {
    return JSON.stringify(this.toObject());
  }
  getParent() {
    return this.parent;
  }
  findAncestors(t, e, n) {
    const s = [];
    e && this._isMatch(t) && s.push(this);
    let a = this.parent;
    for (; a; ) {
      if (a === n)
        return s;
      a._isMatch(t) && s.push(a), a = a.parent;
    }
    return s;
  }
  isAncestorOf(t) {
    return !1;
  }
  findAncestor(t, e, n) {
    return this.findAncestors(t, e, n)[0];
  }
  _isMatch(t) {
    if (!t)
      return !1;
    if (typeof t == "function")
      return t(this);
    let e = t.replace(/ /g, "").split(","), n = e.length, s, a;
    for (s = 0; s < n; s++)
      if (a = e[s], de.Util.isValidSelector(a) || (de.Util.warn('Selector "' + a + '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".'), de.Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".'), de.Util.warn("Konva is awesome, right?")), a.charAt(0) === "#") {
        if (this.id() === a.slice(1))
          return !0;
      } else if (a.charAt(0) === ".") {
        if (this.hasName(a.slice(1)))
          return !0;
      } else if (this.className === a || this.nodeType === a)
        return !0;
    return !1;
  }
  getLayer() {
    const t = this.getParent();
    return t ? t.getLayer() : null;
  }
  getStage() {
    return this._getCache(Xa, this._getStage);
  }
  _getStage() {
    const t = this.getParent();
    return t ? t.getStage() : null;
  }
  fire(t, e = {}, n) {
    return e.target = e.target || this, n ? this._fireAndBubble(t, e) : this._fire(t, e), this;
  }
  getAbsoluteTransform(t) {
    return t ? this._getAbsoluteTransform(t) : this._getCache(pt, this._getAbsoluteTransform);
  }
  _getAbsoluteTransform(t) {
    let e;
    if (t)
      return e = new de.Transform(), this._eachAncestorReverse(function(n) {
        const s = n.transformsEnabled();
        s === "all" ? e.multiply(n.getTransform()) : s === "position" && e.translate(n.x() - n.offsetX(), n.y() - n.offsetY());
      }, t), e;
    {
      e = this._cache.get(pt) || new de.Transform(), this.parent ? this.parent.getAbsoluteTransform().copyInto(e) : e.reset();
      const n = this.transformsEnabled();
      if (n === "all")
        e.multiply(this.getTransform());
      else if (n === "position") {
        const s = this.attrs.x || 0, a = this.attrs.y || 0, l = this.attrs.offsetX || 0, c = this.attrs.offsetY || 0;
        e.translate(s - l, a - c);
      }
      return e.dirty = !1, e;
    }
  }
  getAbsoluteScale(t) {
    let e = this;
    for (; e; )
      e._isUnderCache && (t = e), e = e.getParent();
    const s = this.getAbsoluteTransform(t).decompose();
    return {
      x: s.scaleX,
      y: s.scaleY
    };
  }
  getAbsoluteRotation() {
    return this.getAbsoluteTransform().decompose().rotation;
  }
  getTransform() {
    return this._getCache(kt, this._getTransform);
  }
  _getTransform() {
    var t, e;
    const n = this._cache.get(kt) || new de.Transform();
    n.reset();
    const s = this.x(), a = this.y(), l = Et.Konva.getAngle(this.rotation()), c = (t = this.attrs.scaleX) !== null && t !== void 0 ? t : 1, u = (e = this.attrs.scaleY) !== null && e !== void 0 ? e : 1, d = this.attrs.skewX || 0, p = this.attrs.skewY || 0, v = this.attrs.offsetX || 0, b = this.attrs.offsetY || 0;
    return (s !== 0 || a !== 0) && n.translate(s, a), l !== 0 && n.rotate(l), (d !== 0 || p !== 0) && n.skew(d, p), (c !== 1 || u !== 1) && n.scale(c, u), (v !== 0 || b !== 0) && n.translate(-1 * v, -1 * b), n.dirty = !1, n;
  }
  clone(t) {
    let e = de.Util.cloneObject(this.attrs), n, s, a, l, c;
    for (n in t)
      e[n] = t[n];
    const u = new this.constructor(e);
    for (n in this.eventListeners)
      for (s = this.eventListeners[n], a = s.length, l = 0; l < a; l++)
        c = s[l], c.name.indexOf($d) < 0 && (u.eventListeners[n] || (u.eventListeners[n] = []), u.eventListeners[n].push(c));
    return u;
  }
  _toKonvaCanvas(t) {
    t = t || {};
    const e = this.getClientRect(), n = this.getStage(), s = t.x !== void 0 ? t.x : Math.floor(e.x), a = t.y !== void 0 ? t.y : Math.floor(e.y), l = t.pixelRatio || 1, c = new ii.SceneCanvas({
      width: t.width || Math.ceil(e.width) || (n ? n.width() : 0),
      height: t.height || Math.ceil(e.height) || (n ? n.height() : 0),
      pixelRatio: l
    }), u = c.getContext(), d = new ii.SceneCanvas({
      width: c.width / c.pixelRatio + Math.abs(s),
      height: c.height / c.pixelRatio + Math.abs(a),
      pixelRatio: c.pixelRatio
    });
    return t.imageSmoothingEnabled === !1 && (u._context.imageSmoothingEnabled = !1), u.save(), (s || a) && u.translate(-1 * s, -1 * a), this.drawScene(c, void 0, d), u.restore(), c;
  }
  toCanvas(t) {
    return this._toKonvaCanvas(t)._canvas;
  }
  toDataURL(t) {
    t = t || {};
    const e = t.mimeType || null, n = t.quality || null, s = this._toKonvaCanvas(t).toDataURL(e, n);
    return t.callback && t.callback(s), s;
  }
  toImage(t) {
    return new Promise((e, n) => {
      try {
        const s = t == null ? void 0 : t.callback;
        s && delete t.callback, de.Util._urlToImage(this.toDataURL(t), function(a) {
          e(a), s == null || s(a);
        });
      } catch (s) {
        n(s);
      }
    });
  }
  toBlob(t) {
    return new Promise((e, n) => {
      try {
        const s = t == null ? void 0 : t.callback;
        s && delete t.callback, this.toCanvas(t).toBlob((a) => {
          e(a), s == null || s(a);
        }, t == null ? void 0 : t.mimeType, t == null ? void 0 : t.quality);
      } catch (s) {
        n(s);
      }
    });
  }
  setSize(t) {
    return this.width(t.width), this.height(t.height), this;
  }
  getSize() {
    return {
      width: this.width(),
      height: this.height()
    };
  }
  getClassName() {
    return this.className || this.nodeType;
  }
  getType() {
    return this.nodeType;
  }
  getDragDistance() {
    return this.attrs.dragDistance !== void 0 ? this.attrs.dragDistance : this.parent ? this.parent.getDragDistance() : Et.Konva.dragDistance;
  }
  _off(t, e, n) {
    let s = this.eventListeners[t], a, l, c;
    for (a = 0; a < s.length; a++)
      if (l = s[a].name, c = s[a].handler, (l !== "konva" || e === "konva") && (!e || l === e) && (!n || n === c)) {
        if (s.splice(a, 1), s.length === 0) {
          delete this.eventListeners[t];
          break;
        }
        a--;
      }
  }
  _fireChangeEvent(t, e, n) {
    this._fire(t + xd, {
      oldVal: e,
      newVal: n
    });
  }
  addName(t) {
    if (!this.hasName(t)) {
      const e = this.name(), n = e ? e + " " + t : t;
      this.name(n);
    }
    return this;
  }
  hasName(t) {
    if (!t)
      return !1;
    const e = this.name();
    return e ? (e || "").split(/\s/g).indexOf(t) !== -1 : !1;
  }
  removeName(t) {
    const e = (this.name() || "").split(/\s/g), n = e.indexOf(t);
    return n !== -1 && (e.splice(n, 1), this.name(e.join(" "))), this;
  }
  setAttr(t, e) {
    const n = this[Ya + de.Util._capitalize(t)];
    return de.Util._isFunction(n) ? n.call(this, e) : this._setAttr(t, e), this;
  }
  _requestDraw() {
    if (Et.Konva.autoDrawEnabled) {
      const t = this.getLayer() || this.getStage();
      t == null || t.batchDraw();
    }
  }
  _setAttr(t, e) {
    const n = this.attrs[t];
    n === e && !de.Util.isObject(e) || (e == null ? delete this.attrs[t] : this.attrs[t] = e, this._shouldFireChangeEvents && this._fireChangeEvent(t, n, e), this._requestDraw());
  }
  _setComponentAttr(t, e, n) {
    let s;
    n !== void 0 && (s = this.attrs[t], s || (this.attrs[t] = this.getAttr(t)), this.attrs[t][e] = n, this._fireChangeEvent(t, s, n));
  }
  _fireAndBubble(t, e, n) {
    e && this.nodeType === Ka && (e.target = this);
    const s = [
      Pd,
      Td,
      Ad,
      Od,
      Nd,
      Rd
    ];
    if (!(s.indexOf(t) !== -1 && (n && (this === n || this.isAncestorOf && this.isAncestorOf(n)) || this.nodeType === "Stage" && !n))) {
      this._fire(t, e);
      const l = s.indexOf(t) !== -1 && n && n.isAncestorOf && n.isAncestorOf(this) && !n.isAncestorOf(this.parent);
      (e && !e.cancelBubble || !e) && this.parent && this.parent.isListening() && !l && (n && n.parent ? this._fireAndBubble.call(this.parent, t, e, n) : this._fireAndBubble.call(this.parent, t, e));
    }
  }
  _getProtoListeners(t) {
    var e, n, s;
    const a = (e = this._cache.get(lr)) !== null && e !== void 0 ? e : {};
    let l = a == null ? void 0 : a[t];
    if (l === void 0) {
      l = [];
      let c = Object.getPrototypeOf(this);
      for (; c; ) {
        const u = (s = (n = c.eventListeners) === null || n === void 0 ? void 0 : n[t]) !== null && s !== void 0 ? s : [];
        l.push(...u), c = Object.getPrototypeOf(c);
      }
      a[t] = l, this._cache.set(lr, a);
    }
    return l;
  }
  _fire(t, e) {
    e = e || {}, e.currentTarget = this, e.type = t;
    const n = this._getProtoListeners(t);
    if (n)
      for (let a = 0; a < n.length; a++)
        n[a].handler.call(this, e);
    const s = this.eventListeners[t];
    if (s)
      for (let a = 0; a < s.length; a++)
        s[a].handler.call(this, e);
  }
  draw() {
    return this.drawScene(), this.drawHit(), this;
  }
  _createDragElement(t) {
    const e = t ? t.pointerId : void 0, n = this.getStage(), s = this.getAbsolutePosition();
    if (!n)
      return;
    const a = n._getPointerById(e) || n._changedPointerPositions[0] || s;
    Ze.DD._dragElements.set(this._id, {
      node: this,
      startPointerPos: a,
      offset: {
        x: a.x - s.x,
        y: a.y - s.y
      },
      dragStatus: "ready",
      pointerId: e
    });
  }
  startDrag(t, e = !0) {
    Ze.DD._dragElements.has(this._id) || this._createDragElement(t);
    const n = Ze.DD._dragElements.get(this._id);
    n.dragStatus = "dragging", this.fire("dragstart", {
      type: "dragstart",
      target: this,
      evt: t && t.evt
    }, e);
  }
  _setDragPosition(t, e) {
    const n = this.getStage()._getPointerById(e.pointerId);
    if (!n)
      return;
    let s = {
      x: n.x - e.offset.x,
      y: n.y - e.offset.y
    };
    const a = this.dragBoundFunc();
    if (a !== void 0) {
      const l = a.call(this, s, t);
      l ? s = l : de.Util.warn("dragBoundFunc did not return any value. That is unexpected behavior. You must return new absolute position from dragBoundFunc.");
    }
    (!this._lastPos || this._lastPos.x !== s.x || this._lastPos.y !== s.y) && (this.setAbsolutePosition(s), this._requestDraw()), this._lastPos = s;
  }
  stopDrag(t) {
    const e = Ze.DD._dragElements.get(this._id);
    e && (e.dragStatus = "stopped"), Ze.DD._endDragBefore(t), Ze.DD._endDragAfter(t);
  }
  setDraggable(t) {
    this._setAttr("draggable", t), this._dragChange();
  }
  isDragging() {
    const t = Ze.DD._dragElements.get(this._id);
    return t ? t.dragStatus === "dragging" : !1;
  }
  _listenDrag() {
    this._dragCleanup(), this.on("mousedown.konva touchstart.konva", function(t) {
      if (!(!(t.evt.button !== void 0) || Et.Konva.dragButtons.indexOf(t.evt.button) >= 0) || this.isDragging())
        return;
      let s = !1;
      Ze.DD._dragElements.forEach((a) => {
        this.isAncestorOf(a.node) && (s = !0);
      }), s || this._createDragElement(t);
    });
  }
  _dragChange() {
    if (this.attrs.draggable)
      this._listenDrag();
    else {
      if (this._dragCleanup(), !this.getStage())
        return;
      const e = Ze.DD._dragElements.get(this._id), n = e && e.dragStatus === "dragging", s = e && e.dragStatus === "ready";
      n ? this.stopDrag() : s && Ze.DD._dragElements.delete(this._id);
    }
  }
  _dragCleanup() {
    this.off("mousedown.konva"), this.off("touchstart.konva");
  }
  isClientRectOnScreen(t = { x: 0, y: 0 }) {
    const e = this.getStage();
    if (!e)
      return !1;
    const n = {
      x: -t.x,
      y: -t.y,
      width: e.width() + 2 * t.x,
      height: e.height() + 2 * t.y
    };
    return de.Util.haveIntersection(n, this.getClientRect());
  }
  static create(t, e) {
    return de.Util._isString(t) && (t = JSON.parse(t)), this._createNode(t, e);
  }
  static _createNode(t, e) {
    let n = ae.prototype.getClassName.call(t), s = t.children, a, l, c;
    e && (t.attrs.container = e), Et.Konva[n] || (de.Util.warn('Can not find a node with class name "' + n + '". Fallback to "Shape".'), n = "Shape");
    const u = Et.Konva[n];
    if (a = new u(t.attrs), s)
      for (l = s.length, c = 0; c < l; c++)
        a.add(ae._createNode(s[c]));
    return a;
  }
}
ke.Node = ae;
ae.prototype.nodeType = "Node";
ae.prototype._attrsAffectingSize = [];
ae.prototype.eventListeners = {};
ae.prototype.on.call(ae.prototype, Fd, function() {
  if (this._batchingTransformChange) {
    this._needClearTransformCache = !0;
    return;
  }
  this._clearCache(kt), this._clearSelfAndDescendantCache(pt);
});
ae.prototype.on.call(ae.prototype, "visibleChange.konva", function() {
  this._clearSelfAndDescendantCache(is);
});
ae.prototype.on.call(ae.prototype, "listeningChange.konva", function() {
  this._clearSelfAndDescendantCache(ts);
});
ae.prototype.on.call(ae.prototype, "opacityChange.konva", function() {
  this._clearSelfAndDescendantCache(pr);
});
const we = Ii.Factory.addGetterSetter;
we(ae, "zIndex");
we(ae, "absolutePosition");
we(ae, "position");
we(ae, "x", 0, (0, Le.getNumberValidator)());
we(ae, "y", 0, (0, Le.getNumberValidator)());
we(ae, "globalCompositeOperation", "source-over", (0, Le.getStringValidator)());
we(ae, "opacity", 1, (0, Le.getNumberValidator)());
we(ae, "name", "", (0, Le.getStringValidator)());
we(ae, "id", "", (0, Le.getStringValidator)());
we(ae, "rotation", 0, (0, Le.getNumberValidator)());
Ii.Factory.addComponentsGetterSetter(ae, "scale", ["x", "y"]);
we(ae, "scaleX", 1, (0, Le.getNumberValidator)());
we(ae, "scaleY", 1, (0, Le.getNumberValidator)());
Ii.Factory.addComponentsGetterSetter(ae, "skew", ["x", "y"]);
we(ae, "skewX", 0, (0, Le.getNumberValidator)());
we(ae, "skewY", 0, (0, Le.getNumberValidator)());
Ii.Factory.addComponentsGetterSetter(ae, "offset", ["x", "y"]);
we(ae, "offsetX", 0, (0, Le.getNumberValidator)());
we(ae, "offsetY", 0, (0, Le.getNumberValidator)());
we(ae, "dragDistance", void 0, (0, Le.getNumberValidator)());
we(ae, "width", 0, (0, Le.getNumberValidator)());
we(ae, "height", 0, (0, Le.getNumberValidator)());
we(ae, "listening", !0, (0, Le.getBooleanValidator)());
we(ae, "preventDefault", !0, (0, Le.getBooleanValidator)());
we(ae, "filters", void 0, function(i) {
  return this._filterUpToDate = !1, i;
});
we(ae, "visible", !0, (0, Le.getBooleanValidator)());
we(ae, "transformsEnabled", "all", (0, Le.getStringValidator)());
we(ae, "size");
we(ae, "dragBoundFunc");
we(ae, "draggable", !1, (0, Le.getBooleanValidator)());
Ii.Factory.backCompat(ae, {
  rotateDeg: "rotate",
  setRotationDeg: "setRotation",
  getRotationDeg: "getRotation"
});
var Dt = {};
Object.defineProperty(Dt, "__esModule", { value: !0 });
Dt.Container = void 0;
const ci = ce, Ln = ke, $r = se;
class Ut extends Ln.Node {
  constructor() {
    super(...arguments), this.children = [];
  }
  getChildren(t) {
    const e = this.children || [];
    return t ? e.filter(t) : e;
  }
  hasChildren() {
    return this.getChildren().length > 0;
  }
  removeChildren() {
    return this.getChildren().forEach((t) => {
      t.parent = null, t.index = 0, t.remove();
    }), this.children = [], this._requestDraw(), this;
  }
  destroyChildren() {
    return this.getChildren().forEach((t) => {
      t.parent = null, t.index = 0, t.destroy();
    }), this.children = [], this._requestDraw(), this;
  }
  add(...t) {
    if (t.length === 0)
      return this;
    if (t.length > 1) {
      for (let n = 0; n < t.length; n++)
        this.add(t[n]);
      return this;
    }
    const e = t[0];
    return e.getParent() ? (e.moveTo(this), this) : (this._validateAdd(e), e.index = this.getChildren().length, e.parent = this, e._clearCaches(), this.getChildren().push(e), this._fire("add", {
      child: e
    }), this._requestDraw(), this);
  }
  destroy() {
    return this.hasChildren() && this.destroyChildren(), super.destroy(), this;
  }
  find(t) {
    return this._generalFind(t, !1);
  }
  findOne(t) {
    const e = this._generalFind(t, !0);
    return e.length > 0 ? e[0] : void 0;
  }
  _generalFind(t, e) {
    const n = [];
    return this._descendants((s) => {
      const a = s._isMatch(t);
      return a && n.push(s), !!(a && e);
    }), n;
  }
  _descendants(t) {
    let e = !1;
    const n = this.getChildren();
    for (const s of n) {
      if (e = t(s), e)
        return !0;
      if (s.hasChildren() && (e = s._descendants(t), e))
        return !0;
    }
    return !1;
  }
  toObject() {
    const t = Ln.Node.prototype.toObject.call(this);
    return t.children = [], this.getChildren().forEach((e) => {
      t.children.push(e.toObject());
    }), t;
  }
  isAncestorOf(t) {
    let e = t.getParent();
    for (; e; ) {
      if (e._id === this._id)
        return !0;
      e = e.getParent();
    }
    return !1;
  }
  clone(t) {
    const e = Ln.Node.prototype.clone.call(this, t);
    return this.getChildren().forEach(function(n) {
      e.add(n.clone());
    }), e;
  }
  getAllIntersections(t) {
    const e = [];
    return this.find("Shape").forEach((n) => {
      n.isVisible() && n.intersects(t) && e.push(n);
    }), e;
  }
  _clearSelfAndDescendantCache(t) {
    var e;
    super._clearSelfAndDescendantCache(t), !this.isCached() && ((e = this.children) === null || e === void 0 || e.forEach(function(n) {
      n._clearSelfAndDescendantCache(t);
    }));
  }
  _setChildrenIndices() {
    var t;
    (t = this.children) === null || t === void 0 || t.forEach(function(e, n) {
      e.index = n;
    }), this._requestDraw();
  }
  drawScene(t, e, n) {
    const s = this.getLayer(), a = t || s && s.getCanvas(), l = a && a.getContext(), c = this._getCanvasCache(), u = c && c.scene, d = a && a.isCache;
    if (!this.isVisible() && !d)
      return this;
    if (u) {
      l.save();
      const p = this.getAbsoluteTransform(e).getMatrix();
      l.transform(p[0], p[1], p[2], p[3], p[4], p[5]), this._drawCachedSceneCanvas(l), l.restore();
    } else
      this._drawChildren("drawScene", a, e, n);
    return this;
  }
  drawHit(t, e) {
    if (!this.shouldDrawHit(e))
      return this;
    const n = this.getLayer(), s = t || n && n.hitCanvas, a = s && s.getContext(), l = this._getCanvasCache();
    if (l && l.hit) {
      a.save();
      const u = this.getAbsoluteTransform(e).getMatrix();
      a.transform(u[0], u[1], u[2], u[3], u[4], u[5]), this._drawCachedHitCanvas(a), a.restore();
    } else
      this._drawChildren("drawHit", s, e);
    return this;
  }
  _drawChildren(t, e, n, s) {
    var a;
    const l = e && e.getContext(), c = this.clipWidth(), u = this.clipHeight(), d = this.clipFunc(), p = typeof c == "number" && typeof u == "number" || d, v = n === this;
    if (p) {
      l.save();
      const y = this.getAbsoluteTransform(n);
      let _ = y.getMatrix();
      l.transform(_[0], _[1], _[2], _[3], _[4], _[5]), l.beginPath();
      let S;
      if (d)
        S = d.call(this, l, this);
      else {
        const E = this.clipX(), P = this.clipY();
        l.rect(E || 0, P || 0, c, u);
      }
      l.clip.apply(l, S), _ = y.copy().invert().getMatrix(), l.transform(_[0], _[1], _[2], _[3], _[4], _[5]);
    }
    const b = !v && this.globalCompositeOperation() !== "source-over" && t === "drawScene";
    b && (l.save(), l._applyGlobalCompositeOperation(this)), (a = this.children) === null || a === void 0 || a.forEach(function(y) {
      y[t](e, n, s);
    }), b && l.restore(), p && l.restore();
  }
  getClientRect(t = {}) {
    var e;
    const n = t.skipTransform, s = t.relativeTo;
    let a, l, c, u, d = {
      x: 1 / 0,
      y: 1 / 0,
      width: 0,
      height: 0
    };
    const p = this;
    (e = this.children) === null || e === void 0 || e.forEach(function(y) {
      if (!y.visible())
        return;
      const _ = y.getClientRect({
        relativeTo: p,
        skipShadow: t.skipShadow,
        skipStroke: t.skipStroke
      });
      _.width === 0 && _.height === 0 || (a === void 0 ? (a = _.x, l = _.y, c = _.x + _.width, u = _.y + _.height) : (a = Math.min(a, _.x), l = Math.min(l, _.y), c = Math.max(c, _.x + _.width), u = Math.max(u, _.y + _.height)));
    });
    const v = this.find("Shape");
    let b = !1;
    for (let y = 0; y < v.length; y++)
      if (v[y]._isVisible(this)) {
        b = !0;
        break;
      }
    return b && a !== void 0 ? d = {
      x: a,
      y: l,
      width: c - a,
      height: u - l
    } : d = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }, n ? d : this._transformedRect(d, s);
  }
}
Dt.Container = Ut;
ci.Factory.addComponentsGetterSetter(Ut, "clip", [
  "x",
  "y",
  "width",
  "height"
]);
ci.Factory.addGetterSetter(Ut, "clipX", void 0, (0, $r.getNumberValidator)());
ci.Factory.addGetterSetter(Ut, "clipY", void 0, (0, $r.getNumberValidator)());
ci.Factory.addGetterSetter(Ut, "clipWidth", void 0, (0, $r.getNumberValidator)());
ci.Factory.addGetterSetter(Ut, "clipHeight", void 0, (0, $r.getNumberValidator)());
ci.Factory.addGetterSetter(Ut, "clipFunc");
var ll = {}, Pt = {};
Object.defineProperty(Pt, "__esModule", { value: !0 });
Pt.getCapturedShape = Id;
Pt.createEvent = ms;
Pt.hasPointerCapture = Dd;
Pt.setPointerCapture = Ud;
Pt.releaseCapture = cl;
const Gd = le, Li = /* @__PURE__ */ new Map(), hl = Gd.Konva._global.PointerEvent !== void 0;
function Id(i) {
  return Li.get(i);
}
function ms(i) {
  return {
    evt: i,
    pointerId: i.pointerId
  };
}
function Dd(i, t) {
  return Li.get(i) === t;
}
function Ud(i, t) {
  cl(i), t.getStage() && (Li.set(i, t), hl && t._fire("gotpointercapture", ms(new PointerEvent("gotpointercapture"))));
}
function cl(i, t) {
  const e = Li.get(i);
  if (!e)
    return;
  const n = e.getStage();
  n && n.content, Li.delete(i), hl && e._fire("lostpointercapture", ms(new PointerEvent("lostpointercapture")));
}
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Stage = i.stages = void 0;
  const t = Pe, e = ce, n = Dt, s = le, a = nt, l = kr, c = le, u = Pt, d = "Stage", p = "string", v = "px", b = "mouseout", y = "mouseleave", _ = "mouseover", S = "mouseenter", E = "mousemove", P = "mousedown", A = "mouseup", m = "pointermove", C = "pointerdown", $ = "pointerup", N = "pointercancel", G = "lostpointercapture", T = "pointerout", M = "pointerleave", L = "pointerover", U = "pointerenter", B = "contextmenu", W = "touchstart", te = "touchend", q = "touchmove", he = "touchcancel", oe = "wheel", I = 5, K = [
    [S, "_pointerenter"],
    [P, "_pointerdown"],
    [E, "_pointermove"],
    [A, "_pointerup"],
    [y, "_pointerleave"],
    [W, "_pointerdown"],
    [q, "_pointermove"],
    [te, "_pointerup"],
    [he, "_pointercancel"],
    [_, "_pointerover"],
    [oe, "_wheel"],
    [B, "_contextmenu"],
    [C, "_pointerdown"],
    [m, "_pointermove"],
    [$, "_pointerup"],
    [N, "_pointercancel"],
    [M, "_pointerleave"],
    [G, "_lostpointercapture"]
  ], Y = {
    mouse: {
      [T]: b,
      [M]: y,
      [L]: _,
      [U]: S,
      [m]: E,
      [C]: P,
      [$]: A,
      [N]: "mousecancel",
      pointerclick: "click",
      pointerdblclick: "dblclick"
    },
    touch: {
      [T]: "touchout",
      [M]: "touchleave",
      [L]: "touchover",
      [U]: "touchenter",
      [m]: q,
      [C]: W,
      [$]: te,
      [N]: he,
      pointerclick: "tap",
      pointerdblclick: "dbltap"
    },
    pointer: {
      [T]: T,
      [M]: M,
      [L]: L,
      [U]: U,
      [m]: m,
      [C]: C,
      [$]: $,
      [N]: N,
      pointerclick: "pointerclick",
      pointerdblclick: "pointerdblclick"
    }
  }, X = (Ce) => Ce.indexOf("pointer") >= 0 ? "pointer" : Ce.indexOf("touch") >= 0 ? "touch" : "mouse", ee = (Ce) => {
    const O = X(Ce);
    if (O === "pointer")
      return s.Konva.pointerEventsEnabled && Y.pointer;
    if (O === "touch")
      return Y.touch;
    if (O === "mouse")
      return Y.mouse;
  };
  function ue(Ce = {}) {
    return (Ce.clipFunc || Ce.clipWidth || Ce.clipHeight) && t.Util.warn("Stage does not support clipping. Please use clip for Layers or Groups."), Ce;
  }
  const Te = "Pointer position is missing and not registered by the stage. Looks like it is outside of the stage container. You can set it manually from event: stage.setPointersPositions(event);";
  i.stages = [];
  class Ne extends n.Container {
    constructor(O) {
      super(ue(O)), this._pointerPositions = [], this._changedPointerPositions = [], this._buildDOM(), this._bindContentEvents(), i.stages.push(this), this.on("widthChange.konva heightChange.konva", this._resizeDOM), this.on("visibleChange.konva", this._checkVisibility), this.on("clipWidthChange.konva clipHeightChange.konva clipFuncChange.konva", () => {
        ue(this.attrs);
      }), this._checkVisibility();
    }
    _validateAdd(O) {
      const H = O.getType() === "Layer", re = O.getType() === "FastLayer";
      H || re || t.Util.throw("You may only add layers to the stage.");
    }
    _checkVisibility() {
      if (!this.content)
        return;
      const O = this.visible() ? "" : "none";
      this.content.style.display = O;
    }
    setContainer(O) {
      if (typeof O === p) {
        let H;
        if (O.charAt(0) === ".") {
          const re = O.slice(1);
          O = document.getElementsByClassName(re)[0];
        } else
          O.charAt(0) !== "#" ? H = O : H = O.slice(1), O = document.getElementById(H);
        if (!O)
          throw "Can not find container in document with id " + H;
      }
      return this._setAttr("container", O), this.content && (this.content.parentElement && this.content.parentElement.removeChild(this.content), O.appendChild(this.content)), this;
    }
    shouldDrawHit() {
      return !0;
    }
    clear() {
      const O = this.children, H = O.length;
      for (let re = 0; re < H; re++)
        O[re].clear();
      return this;
    }
    clone(O) {
      return O || (O = {}), O.container = typeof document < "u" && document.createElement("div"), n.Container.prototype.clone.call(this, O);
    }
    destroy() {
      super.destroy();
      const O = this.content;
      O && t.Util._isInDocument(O) && this.container().removeChild(O);
      const H = i.stages.indexOf(this);
      return H > -1 && i.stages.splice(H, 1), t.Util.releaseCanvas(this.bufferCanvas._canvas, this.bufferHitCanvas._canvas), this;
    }
    getPointerPosition() {
      const O = this._pointerPositions[0] || this._changedPointerPositions[0];
      return O ? {
        x: O.x,
        y: O.y
      } : (t.Util.warn(Te), null);
    }
    _getPointerById(O) {
      return this._pointerPositions.find((H) => H.id === O);
    }
    getPointersPositions() {
      return this._pointerPositions;
    }
    getStage() {
      return this;
    }
    getContent() {
      return this.content;
    }
    _toKonvaCanvas(O) {
      O = O || {}, O.x = O.x || 0, O.y = O.y || 0, O.width = O.width || this.width(), O.height = O.height || this.height();
      const H = new a.SceneCanvas({
        width: O.width,
        height: O.height,
        pixelRatio: O.pixelRatio || 1
      }), re = H.getContext()._context, ve = this.children;
      return (O.x || O.y) && re.translate(-1 * O.x, -1 * O.y), ve.forEach(function(pe) {
        if (!pe.isVisible())
          return;
        const xe = pe._toKonvaCanvas(O);
        re.drawImage(xe._canvas, O.x, O.y, xe.getWidth() / xe.getPixelRatio(), xe.getHeight() / xe.getPixelRatio());
      }), H;
    }
    getIntersection(O) {
      if (!O)
        return null;
      const H = this.children, re = H.length, ve = re - 1;
      for (let pe = ve; pe >= 0; pe--) {
        const xe = H[pe].getIntersection(O);
        if (xe)
          return xe;
      }
      return null;
    }
    _resizeDOM() {
      const O = this.width(), H = this.height();
      this.content && (this.content.style.width = O + v, this.content.style.height = H + v), this.bufferCanvas.setSize(O, H), this.bufferHitCanvas.setSize(O, H), this.children.forEach((re) => {
        re.setSize({ width: O, height: H }), re.draw();
      });
    }
    add(O, ...H) {
      if (arguments.length > 1) {
        for (let ve = 0; ve < arguments.length; ve++)
          this.add(arguments[ve]);
        return this;
      }
      super.add(O);
      const re = this.children.length;
      return re > I && t.Util.warn("The stage has " + re + " layers. Recommended maximum number of layers is 3-5. Adding more layers into the stage may drop the performance. Rethink your tree structure, you can use Konva.Group."), O.setSize({ width: this.width(), height: this.height() }), O.draw(), s.Konva.isBrowser && this.content.appendChild(O.canvas._canvas), this;
    }
    getParent() {
      return null;
    }
    getLayer() {
      return null;
    }
    hasPointerCapture(O) {
      return u.hasPointerCapture(O, this);
    }
    setPointerCapture(O) {
      u.setPointerCapture(O, this);
    }
    releaseCapture(O) {
      u.releaseCapture(O, this);
    }
    getLayers() {
      return this.children;
    }
    _bindContentEvents() {
      s.Konva.isBrowser && K.forEach(([O, H]) => {
        this.content.addEventListener(O, (re) => {
          this[H](re);
        }, { passive: !1 });
      });
    }
    _pointerenter(O) {
      this.setPointersPositions(O);
      const H = ee(O.type);
      H && this._fire(H.pointerenter, {
        evt: O,
        target: this,
        currentTarget: this
      });
    }
    _pointerover(O) {
      this.setPointersPositions(O);
      const H = ee(O.type);
      H && this._fire(H.pointerover, {
        evt: O,
        target: this,
        currentTarget: this
      });
    }
    _getTargetShape(O) {
      let H = this[O + "targetShape"];
      return H && !H.getStage() && (H = null), H;
    }
    _pointerleave(O) {
      const H = ee(O.type), re = X(O.type);
      if (!H)
        return;
      this.setPointersPositions(O);
      const ve = this._getTargetShape(re), pe = !(s.Konva.isDragging() || s.Konva.isTransforming()) || s.Konva.hitOnDragEnabled;
      ve && pe ? (ve._fireAndBubble(H.pointerout, { evt: O }), ve._fireAndBubble(H.pointerleave, { evt: O }), this._fire(H.pointerleave, {
        evt: O,
        target: this,
        currentTarget: this
      }), this[re + "targetShape"] = null) : pe && (this._fire(H.pointerleave, {
        evt: O,
        target: this,
        currentTarget: this
      }), this._fire(H.pointerout, {
        evt: O,
        target: this,
        currentTarget: this
      })), this.pointerPos = null, this._pointerPositions = [];
    }
    _pointerdown(O) {
      const H = ee(O.type), re = X(O.type);
      if (!H)
        return;
      this.setPointersPositions(O);
      let ve = !1;
      this._changedPointerPositions.forEach((pe) => {
        const xe = this.getIntersection(pe);
        if (l.DD.justDragged = !1, s.Konva["_" + re + "ListenClick"] = !0, !xe || !xe.isListening()) {
          this[re + "ClickStartShape"] = void 0;
          return;
        }
        s.Konva.capturePointerEventsEnabled && xe.setPointerCapture(pe.id), this[re + "ClickStartShape"] = xe, xe._fireAndBubble(H.pointerdown, {
          evt: O,
          pointerId: pe.id
        }), ve = !0;
        const Ge = O.type.indexOf("touch") >= 0;
        xe.preventDefault() && O.cancelable && Ge && O.preventDefault();
      }), ve || this._fire(H.pointerdown, {
        evt: O,
        target: this,
        currentTarget: this,
        pointerId: this._pointerPositions[0].id
      });
    }
    _pointermove(O) {
      const H = ee(O.type), re = X(O.type);
      if (!H || (s.Konva.isDragging() && l.DD.node.preventDefault() && O.cancelable && O.preventDefault(), this.setPointersPositions(O), !(!(s.Konva.isDragging() || s.Konva.isTransforming()) || s.Konva.hitOnDragEnabled)))
        return;
      const pe = {};
      let xe = !1;
      const Ge = this._getTargetShape(re);
      this._changedPointerPositions.forEach((He) => {
        const me = u.getCapturedShape(He.id) || this.getIntersection(He), qe = He.id, Ye = { evt: O, pointerId: qe }, it = Ge !== me;
        if (it && Ge && (Ge._fireAndBubble(H.pointerout, { ...Ye }, me), Ge._fireAndBubble(H.pointerleave, { ...Ye }, me)), me) {
          if (pe[me._id])
            return;
          pe[me._id] = !0;
        }
        me && me.isListening() ? (xe = !0, it && (me._fireAndBubble(H.pointerover, { ...Ye }, Ge), me._fireAndBubble(H.pointerenter, { ...Ye }, Ge), this[re + "targetShape"] = me), me._fireAndBubble(H.pointermove, { ...Ye })) : Ge && (this._fire(H.pointerover, {
          evt: O,
          target: this,
          currentTarget: this,
          pointerId: qe
        }), this[re + "targetShape"] = null);
      }), xe || this._fire(H.pointermove, {
        evt: O,
        target: this,
        currentTarget: this,
        pointerId: this._changedPointerPositions[0].id
      });
    }
    _pointerup(O) {
      const H = ee(O.type), re = X(O.type);
      if (!H)
        return;
      this.setPointersPositions(O);
      const ve = this[re + "ClickStartShape"], pe = this[re + "ClickEndShape"], xe = {};
      let Ge = !1;
      this._changedPointerPositions.forEach((He) => {
        const me = u.getCapturedShape(He.id) || this.getIntersection(He);
        if (me) {
          if (me.releaseCapture(He.id), xe[me._id])
            return;
          xe[me._id] = !0;
        }
        const qe = He.id, Ye = { evt: O, pointerId: qe };
        let it = !1;
        s.Konva["_" + re + "InDblClickWindow"] ? (it = !0, clearTimeout(this[re + "DblTimeout"])) : l.DD.justDragged || (s.Konva["_" + re + "InDblClickWindow"] = !0, clearTimeout(this[re + "DblTimeout"])), this[re + "DblTimeout"] = setTimeout(function() {
          s.Konva["_" + re + "InDblClickWindow"] = !1;
        }, s.Konva.dblClickWindow), me && me.isListening() ? (Ge = !0, this[re + "ClickEndShape"] = me, me._fireAndBubble(H.pointerup, { ...Ye }), s.Konva["_" + re + "ListenClick"] && ve && ve === me && (me._fireAndBubble(H.pointerclick, { ...Ye }), it && pe && pe === me && me._fireAndBubble(H.pointerdblclick, { ...Ye }))) : (this[re + "ClickEndShape"] = null, s.Konva["_" + re + "ListenClick"] && this._fire(H.pointerclick, {
          evt: O,
          target: this,
          currentTarget: this,
          pointerId: qe
        }), it && this._fire(H.pointerdblclick, {
          evt: O,
          target: this,
          currentTarget: this,
          pointerId: qe
        }));
      }), Ge || this._fire(H.pointerup, {
        evt: O,
        target: this,
        currentTarget: this,
        pointerId: this._changedPointerPositions[0].id
      }), s.Konva["_" + re + "ListenClick"] = !1, O.cancelable && re !== "touch" && re !== "pointer" && O.preventDefault();
    }
    _contextmenu(O) {
      this.setPointersPositions(O);
      const H = this.getIntersection(this.getPointerPosition());
      H && H.isListening() ? H._fireAndBubble(B, { evt: O }) : this._fire(B, {
        evt: O,
        target: this,
        currentTarget: this
      });
    }
    _wheel(O) {
      this.setPointersPositions(O);
      const H = this.getIntersection(this.getPointerPosition());
      H && H.isListening() ? H._fireAndBubble(oe, { evt: O }) : this._fire(oe, {
        evt: O,
        target: this,
        currentTarget: this
      });
    }
    _pointercancel(O) {
      this.setPointersPositions(O);
      const H = u.getCapturedShape(O.pointerId) || this.getIntersection(this.getPointerPosition());
      H && H._fireAndBubble($, u.createEvent(O)), u.releaseCapture(O.pointerId);
    }
    _lostpointercapture(O) {
      u.releaseCapture(O.pointerId);
    }
    setPointersPositions(O) {
      const H = this._getContentPosition();
      let re = null, ve = null;
      O = O || window.event, O.touches !== void 0 ? (this._pointerPositions = [], this._changedPointerPositions = [], Array.prototype.forEach.call(O.touches, (pe) => {
        this._pointerPositions.push({
          id: pe.identifier,
          x: (pe.clientX - H.left) / H.scaleX,
          y: (pe.clientY - H.top) / H.scaleY
        });
      }), Array.prototype.forEach.call(O.changedTouches || O.touches, (pe) => {
        this._changedPointerPositions.push({
          id: pe.identifier,
          x: (pe.clientX - H.left) / H.scaleX,
          y: (pe.clientY - H.top) / H.scaleY
        });
      })) : (re = (O.clientX - H.left) / H.scaleX, ve = (O.clientY - H.top) / H.scaleY, this.pointerPos = {
        x: re,
        y: ve
      }, this._pointerPositions = [{ x: re, y: ve, id: t.Util._getFirstPointerId(O) }], this._changedPointerPositions = [
        { x: re, y: ve, id: t.Util._getFirstPointerId(O) }
      ]);
    }
    _setPointerPosition(O) {
      t.Util.warn('Method _setPointerPosition is deprecated. Use "stage.setPointersPositions(event)" instead.'), this.setPointersPositions(O);
    }
    _getContentPosition() {
      if (!this.content || !this.content.getBoundingClientRect)
        return {
          top: 0,
          left: 0,
          scaleX: 1,
          scaleY: 1
        };
      const O = this.content.getBoundingClientRect();
      return {
        top: O.top,
        left: O.left,
        scaleX: O.width / this.content.clientWidth || 1,
        scaleY: O.height / this.content.clientHeight || 1
      };
    }
    _buildDOM() {
      if (this.bufferCanvas = new a.SceneCanvas({
        width: this.width(),
        height: this.height()
      }), this.bufferHitCanvas = new a.HitCanvas({
        pixelRatio: 1,
        width: this.width(),
        height: this.height()
      }), !s.Konva.isBrowser)
        return;
      const O = this.container();
      if (!O)
        throw "Stage has no container. A container is required.";
      O.innerHTML = "", this.content = document.createElement("div"), this.content.style.position = "relative", this.content.style.userSelect = "none", this.content.className = "konvajs-content", this.content.setAttribute("role", "presentation"), O.appendChild(this.content), this._resizeDOM();
    }
    cache() {
      return t.Util.warn("Cache function is not allowed for stage. You may use cache only for layers, groups and shapes."), this;
    }
    clearCache() {
      return this;
    }
    batchDraw() {
      return this.getChildren().forEach(function(O) {
        O.batchDraw();
      }), this;
    }
  }
  i.Stage = Ne, Ne.prototype.nodeType = d, (0, c._registerNode)(Ne), e.Factory.addGetterSetter(Ne, "container"), s.Konva.isBrowser && document.addEventListener("visibilitychange", () => {
    i.stages.forEach((Ce) => {
      Ce.batchDraw();
    });
  });
})(ll);
var Di = {}, Ie = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Shape = i.shapes = void 0;
  const t = le, e = Pe, n = ce, s = ke, a = se, l = le, c = Pt, u = "hasShadow", d = "shadowRGBA", p = "patternImage", v = "linearGradient", b = "radialGradient";
  let y;
  function _() {
    return y || (y = e.Util.createCanvasElement().getContext("2d"), y);
  }
  i.shapes = {};
  function S(M) {
    const L = this.attrs.fillRule;
    L ? M.fill(L) : M.fill();
  }
  function E(M) {
    M.stroke();
  }
  function P(M) {
    const L = this.attrs.fillRule;
    L ? M.fill(L) : M.fill();
  }
  function A(M) {
    M.stroke();
  }
  function m() {
    this._clearCache(u);
  }
  function C() {
    this._clearCache(d);
  }
  function $() {
    this._clearCache(p);
  }
  function N() {
    this._clearCache(v);
  }
  function G() {
    this._clearCache(b);
  }
  class T extends s.Node {
    constructor(L) {
      super(L);
      let U;
      for (; U = e.Util.getRandomColor(), !(U && !(U in i.shapes)); )
        ;
      this.colorKey = U, i.shapes[U] = this;
    }
    getContext() {
      return e.Util.warn("shape.getContext() method is deprecated. Please do not use it."), this.getLayer().getContext();
    }
    getCanvas() {
      return e.Util.warn("shape.getCanvas() method is deprecated. Please do not use it."), this.getLayer().getCanvas();
    }
    getSceneFunc() {
      return this.attrs.sceneFunc || this._sceneFunc;
    }
    getHitFunc() {
      return this.attrs.hitFunc || this._hitFunc;
    }
    hasShadow() {
      return this._getCache(u, this._hasShadow);
    }
    _hasShadow() {
      return this.shadowEnabled() && this.shadowOpacity() !== 0 && !!(this.shadowColor() || this.shadowBlur() || this.shadowOffsetX() || this.shadowOffsetY());
    }
    _getFillPattern() {
      return this._getCache(p, this.__getFillPattern);
    }
    __getFillPattern() {
      if (this.fillPatternImage()) {
        const U = _().createPattern(this.fillPatternImage(), this.fillPatternRepeat() || "repeat");
        if (U && U.setTransform) {
          const B = new e.Transform();
          B.translate(this.fillPatternX(), this.fillPatternY()), B.rotate(t.Konva.getAngle(this.fillPatternRotation())), B.scale(this.fillPatternScaleX(), this.fillPatternScaleY()), B.translate(-1 * this.fillPatternOffsetX(), -1 * this.fillPatternOffsetY());
          const W = B.getMatrix(), te = typeof DOMMatrix > "u" ? {
            a: W[0],
            b: W[1],
            c: W[2],
            d: W[3],
            e: W[4],
            f: W[5]
          } : new DOMMatrix(W);
          U.setTransform(te);
        }
        return U;
      }
    }
    _getLinearGradient() {
      return this._getCache(v, this.__getLinearGradient);
    }
    __getLinearGradient() {
      const L = this.fillLinearGradientColorStops();
      if (L) {
        const U = _(), B = this.fillLinearGradientStartPoint(), W = this.fillLinearGradientEndPoint(), te = U.createLinearGradient(B.x, B.y, W.x, W.y);
        for (let q = 0; q < L.length; q += 2)
          te.addColorStop(L[q], L[q + 1]);
        return te;
      }
    }
    _getRadialGradient() {
      return this._getCache(b, this.__getRadialGradient);
    }
    __getRadialGradient() {
      const L = this.fillRadialGradientColorStops();
      if (L) {
        const U = _(), B = this.fillRadialGradientStartPoint(), W = this.fillRadialGradientEndPoint(), te = U.createRadialGradient(B.x, B.y, this.fillRadialGradientStartRadius(), W.x, W.y, this.fillRadialGradientEndRadius());
        for (let q = 0; q < L.length; q += 2)
          te.addColorStop(L[q], L[q + 1]);
        return te;
      }
    }
    getShadowRGBA() {
      return this._getCache(d, this._getShadowRGBA);
    }
    _getShadowRGBA() {
      if (!this.hasShadow())
        return;
      const L = e.Util.colorToRGBA(this.shadowColor());
      if (L)
        return "rgba(" + L.r + "," + L.g + "," + L.b + "," + L.a * (this.shadowOpacity() || 1) + ")";
    }
    hasFill() {
      return this._calculate("hasFill", [
        "fillEnabled",
        "fill",
        "fillPatternImage",
        "fillLinearGradientColorStops",
        "fillRadialGradientColorStops"
      ], () => this.fillEnabled() && !!(this.fill() || this.fillPatternImage() || this.fillLinearGradientColorStops() || this.fillRadialGradientColorStops()));
    }
    hasStroke() {
      return this._calculate("hasStroke", [
        "strokeEnabled",
        "strokeWidth",
        "stroke",
        "strokeLinearGradientColorStops"
      ], () => this.strokeEnabled() && this.strokeWidth() && !!(this.stroke() || this.strokeLinearGradientColorStops()));
    }
    hasHitStroke() {
      const L = this.hitStrokeWidth();
      return L === "auto" ? this.hasStroke() : this.strokeEnabled() && !!L;
    }
    intersects(L) {
      const U = this.getStage();
      if (!U)
        return !1;
      const B = U.bufferHitCanvas;
      return B.getContext().clear(), this.drawHit(B, void 0, !0), B.context.getImageData(Math.round(L.x), Math.round(L.y), 1, 1).data[3] > 0;
    }
    destroy() {
      return s.Node.prototype.destroy.call(this), delete i.shapes[this.colorKey], delete this.colorKey, this;
    }
    _useBufferCanvas(L) {
      var U;
      if (!((U = this.attrs.perfectDrawEnabled) !== null && U !== void 0 ? U : !0))
        return !1;
      const W = L || this.hasFill(), te = this.hasStroke(), q = this.getAbsoluteOpacity() !== 1;
      if (W && te && q)
        return !0;
      const he = this.hasShadow(), oe = this.shadowForStrokeEnabled();
      return !!(W && te && he && oe);
    }
    setStrokeHitEnabled(L) {
      e.Util.warn("strokeHitEnabled property is deprecated. Please use hitStrokeWidth instead."), L ? this.hitStrokeWidth("auto") : this.hitStrokeWidth(0);
    }
    getStrokeHitEnabled() {
      return this.hitStrokeWidth() !== 0;
    }
    getSelfRect() {
      const L = this.size();
      return {
        x: this._centroid ? -L.width / 2 : 0,
        y: this._centroid ? -L.height / 2 : 0,
        width: L.width,
        height: L.height
      };
    }
    getClientRect(L = {}) {
      let U = !1, B = this.getParent();
      for (; B; ) {
        if (B.isCached()) {
          U = !0;
          break;
        }
        B = B.getParent();
      }
      const W = L.skipTransform, te = L.relativeTo || U && this.getStage() || void 0, q = this.getSelfRect(), oe = !L.skipStroke && this.hasStroke() && this.strokeWidth() || 0, I = q.width + oe, K = q.height + oe, Y = !L.skipShadow && this.hasShadow(), X = Y ? this.shadowOffsetX() : 0, ee = Y ? this.shadowOffsetY() : 0, ue = I + Math.abs(X), Te = K + Math.abs(ee), Ne = Y && this.shadowBlur() || 0, Ce = ue + Ne * 2, O = Te + Ne * 2, H = {
        width: Ce,
        height: O,
        x: -(oe / 2 + Ne) + Math.min(X, 0) + q.x,
        y: -(oe / 2 + Ne) + Math.min(ee, 0) + q.y
      };
      return W ? H : this._transformedRect(H, te);
    }
    drawScene(L, U, B) {
      const W = this.getLayer(), te = L || W.getCanvas(), q = te.getContext(), he = this._getCanvasCache(), oe = this.getSceneFunc(), I = this.hasShadow();
      let K;
      const Y = U === this;
      if (!this.isVisible() && !Y)
        return this;
      if (he) {
        q.save();
        const X = this.getAbsoluteTransform(U).getMatrix();
        return q.transform(X[0], X[1], X[2], X[3], X[4], X[5]), this._drawCachedSceneCanvas(q), q.restore(), this;
      }
      if (!oe)
        return this;
      if (q.save(), this._useBufferCanvas()) {
        K = this.getStage();
        const X = B || K.bufferCanvas, ee = X.getContext();
        ee.clear(), ee.save(), ee._applyLineJoin(this);
        const ue = this.getAbsoluteTransform(U).getMatrix();
        ee.transform(ue[0], ue[1], ue[2], ue[3], ue[4], ue[5]), oe.call(this, ee, this), ee.restore();
        const Te = X.pixelRatio;
        I && q._applyShadow(this), q._applyOpacity(this), q._applyGlobalCompositeOperation(this), q.drawImage(X._canvas, X.x || 0, X.y || 0, X.width / Te, X.height / Te);
      } else {
        if (q._applyLineJoin(this), !Y) {
          const X = this.getAbsoluteTransform(U).getMatrix();
          q.transform(X[0], X[1], X[2], X[3], X[4], X[5]), q._applyOpacity(this), q._applyGlobalCompositeOperation(this);
        }
        I && q._applyShadow(this), oe.call(this, q, this);
      }
      return q.restore(), this;
    }
    drawHit(L, U, B = !1) {
      if (!this.shouldDrawHit(U, B))
        return this;
      const W = this.getLayer(), te = L || W.hitCanvas, q = te && te.getContext(), he = this.hitFunc() || this.sceneFunc(), oe = this._getCanvasCache(), I = oe && oe.hit;
      if (this.colorKey || e.Util.warn("Looks like your canvas has a destroyed shape in it. Do not reuse shape after you destroyed it. If you want to reuse shape you should call remove() instead of destroy()"), I) {
        q.save();
        const Y = this.getAbsoluteTransform(U).getMatrix();
        return q.transform(Y[0], Y[1], Y[2], Y[3], Y[4], Y[5]), this._drawCachedHitCanvas(q), q.restore(), this;
      }
      if (!he)
        return this;
      if (q.save(), q._applyLineJoin(this), !(this === U)) {
        const Y = this.getAbsoluteTransform(U).getMatrix();
        q.transform(Y[0], Y[1], Y[2], Y[3], Y[4], Y[5]);
      }
      return he.call(this, q, this), q.restore(), this;
    }
    drawHitFromCache(L = 0) {
      const U = this._getCanvasCache(), B = this._getCachedSceneCanvas(), W = U.hit, te = W.getContext(), q = W.getWidth(), he = W.getHeight();
      te.clear(), te.drawImage(B._canvas, 0, 0, q, he);
      try {
        const oe = te.getImageData(0, 0, q, he), I = oe.data, K = I.length, Y = e.Util._hexToRgb(this.colorKey);
        for (let X = 0; X < K; X += 4)
          I[X + 3] > L ? (I[X] = Y.r, I[X + 1] = Y.g, I[X + 2] = Y.b, I[X + 3] = 255) : I[X + 3] = 0;
        te.putImageData(oe, 0, 0);
      } catch (oe) {
        e.Util.error("Unable to draw hit graph from cached scene canvas. " + oe.message);
      }
      return this;
    }
    hasPointerCapture(L) {
      return c.hasPointerCapture(L, this);
    }
    setPointerCapture(L) {
      c.setPointerCapture(L, this);
    }
    releaseCapture(L) {
      c.releaseCapture(L, this);
    }
  }
  i.Shape = T, T.prototype._fillFunc = S, T.prototype._strokeFunc = E, T.prototype._fillFuncHit = P, T.prototype._strokeFuncHit = A, T.prototype._centroid = !1, T.prototype.nodeType = "Shape", (0, l._registerNode)(T), T.prototype.eventListeners = {}, T.prototype.on.call(T.prototype, "shadowColorChange.konva shadowBlurChange.konva shadowOffsetChange.konva shadowOpacityChange.konva shadowEnabledChange.konva", m), T.prototype.on.call(T.prototype, "shadowColorChange.konva shadowOpacityChange.konva shadowEnabledChange.konva", C), T.prototype.on.call(T.prototype, "fillPriorityChange.konva fillPatternImageChange.konva fillPatternRepeatChange.konva fillPatternScaleXChange.konva fillPatternScaleYChange.konva fillPatternOffsetXChange.konva fillPatternOffsetYChange.konva fillPatternXChange.konva fillPatternYChange.konva fillPatternRotationChange.konva", $), T.prototype.on.call(T.prototype, "fillPriorityChange.konva fillLinearGradientColorStopsChange.konva fillLinearGradientStartPointXChange.konva fillLinearGradientStartPointYChange.konva fillLinearGradientEndPointXChange.konva fillLinearGradientEndPointYChange.konva", N), T.prototype.on.call(T.prototype, "fillPriorityChange.konva fillRadialGradientColorStopsChange.konva fillRadialGradientStartPointXChange.konva fillRadialGradientStartPointYChange.konva fillRadialGradientEndPointXChange.konva fillRadialGradientEndPointYChange.konva fillRadialGradientStartRadiusChange.konva fillRadialGradientEndRadiusChange.konva", G), n.Factory.addGetterSetter(T, "stroke", void 0, (0, a.getStringOrGradientValidator)()), n.Factory.addGetterSetter(T, "strokeWidth", 2, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillAfterStrokeEnabled", !1), n.Factory.addGetterSetter(T, "hitStrokeWidth", "auto", (0, a.getNumberOrAutoValidator)()), n.Factory.addGetterSetter(T, "strokeHitEnabled", !0, (0, a.getBooleanValidator)()), n.Factory.addGetterSetter(T, "perfectDrawEnabled", !0, (0, a.getBooleanValidator)()), n.Factory.addGetterSetter(T, "shadowForStrokeEnabled", !0, (0, a.getBooleanValidator)()), n.Factory.addGetterSetter(T, "lineJoin"), n.Factory.addGetterSetter(T, "lineCap"), n.Factory.addGetterSetter(T, "sceneFunc"), n.Factory.addGetterSetter(T, "hitFunc"), n.Factory.addGetterSetter(T, "dash"), n.Factory.addGetterSetter(T, "dashOffset", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "shadowColor", void 0, (0, a.getStringValidator)()), n.Factory.addGetterSetter(T, "shadowBlur", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "shadowOpacity", 1, (0, a.getNumberValidator)()), n.Factory.addComponentsGetterSetter(T, "shadowOffset", ["x", "y"]), n.Factory.addGetterSetter(T, "shadowOffsetX", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "shadowOffsetY", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillPatternImage"), n.Factory.addGetterSetter(T, "fill", void 0, (0, a.getStringOrGradientValidator)()), n.Factory.addGetterSetter(T, "fillPatternX", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillPatternY", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillLinearGradientColorStops"), n.Factory.addGetterSetter(T, "strokeLinearGradientColorStops"), n.Factory.addGetterSetter(T, "fillRadialGradientStartRadius", 0), n.Factory.addGetterSetter(T, "fillRadialGradientEndRadius", 0), n.Factory.addGetterSetter(T, "fillRadialGradientColorStops"), n.Factory.addGetterSetter(T, "fillPatternRepeat", "repeat"), n.Factory.addGetterSetter(T, "fillEnabled", !0), n.Factory.addGetterSetter(T, "strokeEnabled", !0), n.Factory.addGetterSetter(T, "shadowEnabled", !0), n.Factory.addGetterSetter(T, "dashEnabled", !0), n.Factory.addGetterSetter(T, "strokeScaleEnabled", !0), n.Factory.addGetterSetter(T, "fillPriority", "color"), n.Factory.addComponentsGetterSetter(T, "fillPatternOffset", ["x", "y"]), n.Factory.addGetterSetter(T, "fillPatternOffsetX", 0, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillPatternOffsetY", 0, (0, a.getNumberValidator)()), n.Factory.addComponentsGetterSetter(T, "fillPatternScale", ["x", "y"]), n.Factory.addGetterSetter(T, "fillPatternScaleX", 1, (0, a.getNumberValidator)()), n.Factory.addGetterSetter(T, "fillPatternScaleY", 1, (0, a.getNumberValidator)()), n.Factory.addComponentsGetterSetter(T, "fillLinearGradientStartPoint", [
    "x",
    "y"
  ]), n.Factory.addComponentsGetterSetter(T, "strokeLinearGradientStartPoint", [
    "x",
    "y"
  ]), n.Factory.addGetterSetter(T, "fillLinearGradientStartPointX", 0), n.Factory.addGetterSetter(T, "strokeLinearGradientStartPointX", 0), n.Factory.addGetterSetter(T, "fillLinearGradientStartPointY", 0), n.Factory.addGetterSetter(T, "strokeLinearGradientStartPointY", 0), n.Factory.addComponentsGetterSetter(T, "fillLinearGradientEndPoint", [
    "x",
    "y"
  ]), n.Factory.addComponentsGetterSetter(T, "strokeLinearGradientEndPoint", [
    "x",
    "y"
  ]), n.Factory.addGetterSetter(T, "fillLinearGradientEndPointX", 0), n.Factory.addGetterSetter(T, "strokeLinearGradientEndPointX", 0), n.Factory.addGetterSetter(T, "fillLinearGradientEndPointY", 0), n.Factory.addGetterSetter(T, "strokeLinearGradientEndPointY", 0), n.Factory.addComponentsGetterSetter(T, "fillRadialGradientStartPoint", [
    "x",
    "y"
  ]), n.Factory.addGetterSetter(T, "fillRadialGradientStartPointX", 0), n.Factory.addGetterSetter(T, "fillRadialGradientStartPointY", 0), n.Factory.addComponentsGetterSetter(T, "fillRadialGradientEndPoint", [
    "x",
    "y"
  ]), n.Factory.addGetterSetter(T, "fillRadialGradientEndPointX", 0), n.Factory.addGetterSetter(T, "fillRadialGradientEndPointY", 0), n.Factory.addGetterSetter(T, "fillPatternRotation", 0), n.Factory.addGetterSetter(T, "fillRule", void 0, (0, a.getStringValidator)()), n.Factory.backCompat(T, {
    dashArray: "dash",
    getDashArray: "getDash",
    setDashArray: "getDash",
    drawFunc: "sceneFunc",
    getDrawFunc: "getSceneFunc",
    setDrawFunc: "setSceneFunc",
    drawHitFunc: "hitFunc",
    getDrawHitFunc: "getHitFunc",
    setDrawHitFunc: "setHitFunc"
  });
})(Ie);
Object.defineProperty(Di, "__esModule", { value: !0 });
Di.Layer = void 0;
const gt = Pe, Fn = Dt, ri = ke, _s = ce, qa = nt, Bd = se, jd = Ie, Vd = le, Hd = "#", Wd = "beforeDraw", zd = "draw", ul = [
  { x: 0, y: 0 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 }
], Yd = ul.length;
let ui = class extends Fn.Container {
  constructor(t) {
    super(t), this.canvas = new qa.SceneCanvas(), this.hitCanvas = new qa.HitCanvas({
      pixelRatio: 1
    }), this._waitingForDraw = !1, this.on("visibleChange.konva", this._checkVisibility), this._checkVisibility(), this.on("imageSmoothingEnabledChange.konva", this._setSmoothEnabled), this._setSmoothEnabled();
  }
  createPNGStream() {
    return this.canvas._canvas.createPNGStream();
  }
  getCanvas() {
    return this.canvas;
  }
  getNativeCanvasElement() {
    return this.canvas._canvas;
  }
  getHitCanvas() {
    return this.hitCanvas;
  }
  getContext() {
    return this.getCanvas().getContext();
  }
  clear(t) {
    return this.getContext().clear(t), this.getHitCanvas().getContext().clear(t), this;
  }
  setZIndex(t) {
    super.setZIndex(t);
    const e = this.getStage();
    return e && e.content && (e.content.removeChild(this.getNativeCanvasElement()), t < e.children.length - 1 ? e.content.insertBefore(this.getNativeCanvasElement(), e.children[t + 1].getCanvas()._canvas) : e.content.appendChild(this.getNativeCanvasElement())), this;
  }
  moveToTop() {
    ri.Node.prototype.moveToTop.call(this);
    const t = this.getStage();
    return t && t.content && (t.content.removeChild(this.getNativeCanvasElement()), t.content.appendChild(this.getNativeCanvasElement())), !0;
  }
  moveUp() {
    if (!ri.Node.prototype.moveUp.call(this))
      return !1;
    const e = this.getStage();
    return !e || !e.content ? !1 : (e.content.removeChild(this.getNativeCanvasElement()), this.index < e.children.length - 1 ? e.content.insertBefore(this.getNativeCanvasElement(), e.children[this.index + 1].getCanvas()._canvas) : e.content.appendChild(this.getNativeCanvasElement()), !0);
  }
  moveDown() {
    if (ri.Node.prototype.moveDown.call(this)) {
      const t = this.getStage();
      if (t) {
        const e = t.children;
        t.content && (t.content.removeChild(this.getNativeCanvasElement()), t.content.insertBefore(this.getNativeCanvasElement(), e[this.index + 1].getCanvas()._canvas));
      }
      return !0;
    }
    return !1;
  }
  moveToBottom() {
    if (ri.Node.prototype.moveToBottom.call(this)) {
      const t = this.getStage();
      if (t) {
        const e = t.children;
        t.content && (t.content.removeChild(this.getNativeCanvasElement()), t.content.insertBefore(this.getNativeCanvasElement(), e[1].getCanvas()._canvas));
      }
      return !0;
    }
    return !1;
  }
  getLayer() {
    return this;
  }
  remove() {
    const t = this.getNativeCanvasElement();
    return ri.Node.prototype.remove.call(this), t && t.parentNode && gt.Util._isInDocument(t) && t.parentNode.removeChild(t), this;
  }
  getStage() {
    return this.parent;
  }
  setSize({ width: t, height: e }) {
    return this.canvas.setSize(t, e), this.hitCanvas.setSize(t, e), this._setSmoothEnabled(), this;
  }
  _validateAdd(t) {
    const e = t.getType();
    e !== "Group" && e !== "Shape" && gt.Util.throw("You may only add groups and shapes to a layer.");
  }
  _toKonvaCanvas(t) {
    return t = t || {}, t.width = t.width || this.getWidth(), t.height = t.height || this.getHeight(), t.x = t.x !== void 0 ? t.x : this.x(), t.y = t.y !== void 0 ? t.y : this.y(), ri.Node.prototype._toKonvaCanvas.call(this, t);
  }
  _checkVisibility() {
    this.visible() ? this.canvas._canvas.style.display = "block" : this.canvas._canvas.style.display = "none";
  }
  _setSmoothEnabled() {
    this.getContext()._context.imageSmoothingEnabled = this.imageSmoothingEnabled();
  }
  getWidth() {
    if (this.parent)
      return this.parent.width();
  }
  setWidth() {
    gt.Util.warn('Can not change width of layer. Use "stage.width(value)" function instead.');
  }
  getHeight() {
    if (this.parent)
      return this.parent.height();
  }
  setHeight() {
    gt.Util.warn('Can not change height of layer. Use "stage.height(value)" function instead.');
  }
  batchDraw() {
    return this._waitingForDraw || (this._waitingForDraw = !0, gt.Util.requestAnimFrame(() => {
      this.draw(), this._waitingForDraw = !1;
    })), this;
  }
  getIntersection(t) {
    if (!this.isListening() || !this.isVisible())
      return null;
    let e = 1, n = !1;
    for (; ; ) {
      for (let s = 0; s < Yd; s++) {
        const a = ul[s], l = this._getIntersection({
          x: t.x + a.x * e,
          y: t.y + a.y * e
        }), c = l.shape;
        if (c)
          return c;
        if (n = !!l.antialiased, !l.antialiased)
          break;
      }
      if (n)
        e += 1;
      else
        return null;
    }
  }
  _getIntersection(t) {
    const e = this.hitCanvas.pixelRatio, n = this.hitCanvas.context.getImageData(Math.round(t.x * e), Math.round(t.y * e), 1, 1).data, s = n[3];
    if (s === 255) {
      const a = gt.Util._rgbToHex(n[0], n[1], n[2]), l = jd.shapes[Hd + a];
      return l ? {
        shape: l
      } : {
        antialiased: !0
      };
    } else if (s > 0)
      return {
        antialiased: !0
      };
    return {};
  }
  drawScene(t, e, n) {
    const s = this.getLayer(), a = t || s && s.getCanvas();
    return this._fire(Wd, {
      node: this
    }), this.clearBeforeDraw() && a.getContext().clear(), Fn.Container.prototype.drawScene.call(this, a, e, n), this._fire(zd, {
      node: this
    }), this;
  }
  drawHit(t, e) {
    const n = this.getLayer(), s = t || n && n.hitCanvas;
    return n && n.clearBeforeDraw() && n.getHitCanvas().getContext().clear(), Fn.Container.prototype.drawHit.call(this, s, e), this;
  }
  enableHitGraph() {
    return this.hitGraphEnabled(!0), this;
  }
  disableHitGraph() {
    return this.hitGraphEnabled(!1), this;
  }
  setHitGraphEnabled(t) {
    gt.Util.warn("hitGraphEnabled method is deprecated. Please use layer.listening() instead."), this.listening(t);
  }
  getHitGraphEnabled(t) {
    return gt.Util.warn("hitGraphEnabled method is deprecated. Please use layer.listening() instead."), this.listening();
  }
  toggleHitCanvas() {
    if (!this.parent || !this.parent.content)
      return;
    const t = this.parent;
    !!this.hitCanvas._canvas.parentNode ? t.content.removeChild(this.hitCanvas._canvas) : t.content.appendChild(this.hitCanvas._canvas);
  }
  destroy() {
    return gt.Util.releaseCanvas(this.getNativeCanvasElement(), this.getHitCanvas()._canvas), super.destroy();
  }
};
Di.Layer = ui;
ui.prototype.nodeType = "Layer";
(0, Vd._registerNode)(ui);
_s.Factory.addGetterSetter(ui, "imageSmoothingEnabled", !0);
_s.Factory.addGetterSetter(ui, "clearBeforeDraw", !0);
_s.Factory.addGetterSetter(ui, "hitGraphEnabled", !0, (0, Bd.getBooleanValidator)());
var Pr = {};
Object.defineProperty(Pr, "__esModule", { value: !0 });
Pr.FastLayer = void 0;
const Kd = Pe, Xd = Di, qd = le;
class vs extends Xd.Layer {
  constructor(t) {
    super(t), this.listening(!1), Kd.Util.warn('Konva.Fast layer is deprecated. Please use "new Konva.Layer({ listening: false })" instead.');
  }
}
Pr.FastLayer = vs;
vs.prototype.nodeType = "FastLayer";
(0, qd._registerNode)(vs);
var fi = {};
Object.defineProperty(fi, "__esModule", { value: !0 });
fi.Group = void 0;
const Qd = Pe, Jd = Dt, Zd = le;
let bs = class extends Jd.Container {
  _validateAdd(t) {
    const e = t.getType();
    e !== "Group" && e !== "Shape" && Qd.Util.throw("You may only add groups and shapes to groups.");
  }
};
fi.Group = bs;
bs.prototype.nodeType = "Group";
(0, Zd._registerNode)(bs);
var di = {};
Object.defineProperty(di, "__esModule", { value: !0 });
di.Animation = void 0;
const Mn = le, Qa = Pe, Gn = function() {
  return Mn.glob.performance && Mn.glob.performance.now ? function() {
    return Mn.glob.performance.now();
  } : function() {
    return (/* @__PURE__ */ new Date()).getTime();
  };
}();
class ht {
  constructor(t, e) {
    this.id = ht.animIdCounter++, this.frame = {
      time: 0,
      timeDiff: 0,
      lastTime: Gn(),
      frameRate: 0
    }, this.func = t, this.setLayers(e);
  }
  setLayers(t) {
    let e = [];
    return t && (e = Array.isArray(t) ? t : [t]), this.layers = e, this;
  }
  getLayers() {
    return this.layers;
  }
  addLayer(t) {
    const e = this.layers, n = e.length;
    for (let s = 0; s < n; s++)
      if (e[s]._id === t._id)
        return !1;
    return this.layers.push(t), !0;
  }
  isRunning() {
    const e = ht.animations, n = e.length;
    for (let s = 0; s < n; s++)
      if (e[s].id === this.id)
        return !0;
    return !1;
  }
  start() {
    return this.stop(), this.frame.timeDiff = 0, this.frame.lastTime = Gn(), ht._addAnimation(this), this;
  }
  stop() {
    return ht._removeAnimation(this), this;
  }
  _updateFrameObject(t) {
    this.frame.timeDiff = t - this.frame.lastTime, this.frame.lastTime = t, this.frame.time += this.frame.timeDiff, this.frame.frameRate = 1e3 / this.frame.timeDiff;
  }
  static _addAnimation(t) {
    this.animations.push(t), this._handleAnimation();
  }
  static _removeAnimation(t) {
    const e = t.id, n = this.animations, s = n.length;
    for (let a = 0; a < s; a++)
      if (n[a].id === e) {
        this.animations.splice(a, 1);
        break;
      }
  }
  static _runFrames() {
    const t = {}, e = this.animations;
    for (let n = 0; n < e.length; n++) {
      const s = e[n], a = s.layers, l = s.func;
      s._updateFrameObject(Gn());
      const c = a.length;
      let u;
      if (l ? u = l.call(s, s.frame) !== !1 : u = !0, !!u)
        for (let d = 0; d < c; d++) {
          const p = a[d];
          p._id !== void 0 && (t[p._id] = p);
        }
    }
    for (const n in t)
      t.hasOwnProperty(n) && t[n].batchDraw();
  }
  static _animationLoop() {
    const t = ht;
    t.animations.length ? (t._runFrames(), Qa.Util.requestAnimFrame(t._animationLoop)) : t.animRunning = !1;
  }
  static _handleAnimation() {
    this.animRunning || (this.animRunning = !0, Qa.Util.requestAnimFrame(this._animationLoop));
  }
}
di.Animation = ht;
ht.animations = [];
ht.animIdCounter = 0;
ht.animRunning = !1;
var fl = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Easings = i.Tween = void 0;
  const t = Pe, e = di, n = ke, s = le, a = {
    node: 1,
    duration: 1,
    easing: 1,
    onFinish: 1,
    yoyo: 1
  }, l = 1, c = 2, u = 3, d = ["fill", "stroke", "shadowColor"];
  let p = 0;
  class v {
    constructor(_, S, E, P, A, m, C) {
      this.prop = _, this.propFunc = S, this.begin = P, this._pos = P, this.duration = m, this._change = 0, this.prevPos = 0, this.yoyo = C, this._time = 0, this._position = 0, this._startTime = 0, this._finish = 0, this.func = E, this._change = A - this.begin, this.pause();
    }
    fire(_) {
      const S = this[_];
      S && S();
    }
    setTime(_) {
      _ > this.duration ? this.yoyo ? (this._time = this.duration, this.reverse()) : this.finish() : _ < 0 ? this.yoyo ? (this._time = 0, this.play()) : this.reset() : (this._time = _, this.update());
    }
    getTime() {
      return this._time;
    }
    setPosition(_) {
      this.prevPos = this._pos, this.propFunc(_), this._pos = _;
    }
    getPosition(_) {
      return _ === void 0 && (_ = this._time), this.func(_, this.begin, this._change, this.duration);
    }
    play() {
      this.state = c, this._startTime = this.getTimer() - this._time, this.onEnterFrame(), this.fire("onPlay");
    }
    reverse() {
      this.state = u, this._time = this.duration - this._time, this._startTime = this.getTimer() - this._time, this.onEnterFrame(), this.fire("onReverse");
    }
    seek(_) {
      this.pause(), this._time = _, this.update(), this.fire("onSeek");
    }
    reset() {
      this.pause(), this._time = 0, this.update(), this.fire("onReset");
    }
    finish() {
      this.pause(), this._time = this.duration, this.update(), this.fire("onFinish");
    }
    update() {
      this.setPosition(this.getPosition(this._time)), this.fire("onUpdate");
    }
    onEnterFrame() {
      const _ = this.getTimer() - this._startTime;
      this.state === c ? this.setTime(_) : this.state === u && this.setTime(this.duration - _);
    }
    pause() {
      this.state = l, this.fire("onPause");
    }
    getTimer() {
      return (/* @__PURE__ */ new Date()).getTime();
    }
  }
  class b {
    constructor(_) {
      const S = this, E = _.node, P = E._id, A = _.easing || i.Easings.Linear, m = !!_.yoyo;
      let C, $;
      typeof _.duration > "u" ? C = 0.3 : _.duration === 0 ? C = 1e-3 : C = _.duration, this.node = E, this._id = p++;
      const N = E.getLayer() || (E instanceof s.Konva.Stage ? E.getLayers() : null);
      N || t.Util.error("Tween constructor have `node` that is not in a layer. Please add node into layer first."), this.anim = new e.Animation(function() {
        S.tween.onEnterFrame();
      }, N), this.tween = new v($, function(G) {
        S._tweenFunc(G);
      }, A, 0, 1, C * 1e3, m), this._addListeners(), b.attrs[P] || (b.attrs[P] = {}), b.attrs[P][this._id] || (b.attrs[P][this._id] = {}), b.tweens[P] || (b.tweens[P] = {});
      for ($ in _)
        a[$] === void 0 && this._addAttr($, _[$]);
      this.reset(), this.onFinish = _.onFinish, this.onReset = _.onReset, this.onUpdate = _.onUpdate;
    }
    _addAttr(_, S) {
      const E = this.node, P = E._id;
      let A, m, C, $, N;
      const G = b.tweens[P][_];
      G && delete b.attrs[P][G][_];
      let T = E.getAttr(_);
      if (t.Util._isArray(S))
        if (A = [], m = Math.max(S.length, T.length), _ === "points" && S.length !== T.length && (S.length > T.length ? ($ = T, T = t.Util._prepareArrayForTween(T, S, E.closed())) : (C = S, S = t.Util._prepareArrayForTween(S, T, E.closed()))), _.indexOf("fill") === 0)
          for (let M = 0; M < m; M++)
            if (M % 2 === 0)
              A.push(S[M] - T[M]);
            else {
              const L = t.Util.colorToRGBA(T[M]);
              N = t.Util.colorToRGBA(S[M]), T[M] = L, A.push({
                r: N.r - L.r,
                g: N.g - L.g,
                b: N.b - L.b,
                a: N.a - L.a
              });
            }
        else
          for (let M = 0; M < m; M++)
            A.push(S[M] - T[M]);
      else d.indexOf(_) !== -1 ? (T = t.Util.colorToRGBA(T), N = t.Util.colorToRGBA(S), A = {
        r: N.r - T.r,
        g: N.g - T.g,
        b: N.b - T.b,
        a: N.a - T.a
      }) : A = S - T;
      b.attrs[P][this._id][_] = {
        start: T,
        diff: A,
        end: S,
        trueEnd: C,
        trueStart: $
      }, b.tweens[P][_] = this._id;
    }
    _tweenFunc(_) {
      const S = this.node, E = b.attrs[S._id][this._id];
      let P, A, m, C, $, N, G, T;
      for (P in E) {
        if (A = E[P], m = A.start, C = A.diff, T = A.end, t.Util._isArray(m))
          if ($ = [], G = Math.max(m.length, T.length), P.indexOf("fill") === 0)
            for (N = 0; N < G; N++)
              N % 2 === 0 ? $.push((m[N] || 0) + C[N] * _) : $.push("rgba(" + Math.round(m[N].r + C[N].r * _) + "," + Math.round(m[N].g + C[N].g * _) + "," + Math.round(m[N].b + C[N].b * _) + "," + (m[N].a + C[N].a * _) + ")");
          else
            for (N = 0; N < G; N++)
              $.push((m[N] || 0) + C[N] * _);
        else d.indexOf(P) !== -1 ? $ = "rgba(" + Math.round(m.r + C.r * _) + "," + Math.round(m.g + C.g * _) + "," + Math.round(m.b + C.b * _) + "," + (m.a + C.a * _) + ")" : $ = m + C * _;
        S.setAttr(P, $);
      }
    }
    _addListeners() {
      this.tween.onPlay = () => {
        this.anim.start();
      }, this.tween.onReverse = () => {
        this.anim.start();
      }, this.tween.onPause = () => {
        this.anim.stop();
      }, this.tween.onFinish = () => {
        const _ = this.node, S = b.attrs[_._id][this._id];
        S.points && S.points.trueEnd && _.setAttr("points", S.points.trueEnd), this.onFinish && this.onFinish.call(this);
      }, this.tween.onReset = () => {
        const _ = this.node, S = b.attrs[_._id][this._id];
        S.points && S.points.trueStart && _.points(S.points.trueStart), this.onReset && this.onReset();
      }, this.tween.onUpdate = () => {
        this.onUpdate && this.onUpdate.call(this);
      };
    }
    play() {
      return this.tween.play(), this;
    }
    reverse() {
      return this.tween.reverse(), this;
    }
    reset() {
      return this.tween.reset(), this;
    }
    seek(_) {
      return this.tween.seek(_ * 1e3), this;
    }
    pause() {
      return this.tween.pause(), this;
    }
    finish() {
      return this.tween.finish(), this;
    }
    destroy() {
      const _ = this.node._id, S = this._id, E = b.tweens[_];
      this.pause(), this.anim && this.anim.stop();
      for (const P in E)
        delete b.tweens[_][P];
      delete b.attrs[_][S], b.tweens[_] && (Object.keys(b.tweens[_]).length === 0 && delete b.tweens[_], Object.keys(b.attrs[_]).length === 0 && delete b.attrs[_]);
    }
  }
  i.Tween = b, b.attrs = {}, b.tweens = {}, n.Node.prototype.to = function(y) {
    const _ = y.onFinish;
    y.node = this, y.onFinish = function() {
      this.destroy(), _ && _();
    }, new b(y).play();
  }, i.Easings = {
    BackEaseIn(y, _, S, E) {
      return S * (y /= E) * y * ((1.70158 + 1) * y - 1.70158) + _;
    },
    BackEaseOut(y, _, S, E) {
      return S * ((y = y / E - 1) * y * ((1.70158 + 1) * y + 1.70158) + 1) + _;
    },
    BackEaseInOut(y, _, S, E) {
      let P = 1.70158;
      return (y /= E / 2) < 1 ? S / 2 * (y * y * (((P *= 1.525) + 1) * y - P)) + _ : S / 2 * ((y -= 2) * y * (((P *= 1.525) + 1) * y + P) + 2) + _;
    },
    ElasticEaseIn(y, _, S, E, P, A) {
      let m = 0;
      return y === 0 ? _ : (y /= E) === 1 ? _ + S : (A || (A = E * 0.3), !P || P < Math.abs(S) ? (P = S, m = A / 4) : m = A / (2 * Math.PI) * Math.asin(S / P), -(P * Math.pow(2, 10 * (y -= 1)) * Math.sin((y * E - m) * (2 * Math.PI) / A)) + _);
    },
    ElasticEaseOut(y, _, S, E, P, A) {
      let m = 0;
      return y === 0 ? _ : (y /= E) === 1 ? _ + S : (A || (A = E * 0.3), !P || P < Math.abs(S) ? (P = S, m = A / 4) : m = A / (2 * Math.PI) * Math.asin(S / P), P * Math.pow(2, -10 * y) * Math.sin((y * E - m) * (2 * Math.PI) / A) + S + _);
    },
    ElasticEaseInOut(y, _, S, E, P, A) {
      let m = 0;
      return y === 0 ? _ : (y /= E / 2) === 2 ? _ + S : (A || (A = E * (0.3 * 1.5)), !P || P < Math.abs(S) ? (P = S, m = A / 4) : m = A / (2 * Math.PI) * Math.asin(S / P), y < 1 ? -0.5 * (P * Math.pow(2, 10 * (y -= 1)) * Math.sin((y * E - m) * (2 * Math.PI) / A)) + _ : P * Math.pow(2, -10 * (y -= 1)) * Math.sin((y * E - m) * (2 * Math.PI) / A) * 0.5 + S + _);
    },
    BounceEaseOut(y, _, S, E) {
      return (y /= E) < 1 / 2.75 ? S * (7.5625 * y * y) + _ : y < 2 / 2.75 ? S * (7.5625 * (y -= 1.5 / 2.75) * y + 0.75) + _ : y < 2.5 / 2.75 ? S * (7.5625 * (y -= 2.25 / 2.75) * y + 0.9375) + _ : S * (7.5625 * (y -= 2.625 / 2.75) * y + 0.984375) + _;
    },
    BounceEaseIn(y, _, S, E) {
      return S - i.Easings.BounceEaseOut(E - y, 0, S, E) + _;
    },
    BounceEaseInOut(y, _, S, E) {
      return y < E / 2 ? i.Easings.BounceEaseIn(y * 2, 0, S, E) * 0.5 + _ : i.Easings.BounceEaseOut(y * 2 - E, 0, S, E) * 0.5 + S * 0.5 + _;
    },
    EaseIn(y, _, S, E) {
      return S * (y /= E) * y + _;
    },
    EaseOut(y, _, S, E) {
      return -S * (y /= E) * (y - 2) + _;
    },
    EaseInOut(y, _, S, E) {
      return (y /= E / 2) < 1 ? S / 2 * y * y + _ : -S / 2 * (--y * (y - 2) - 1) + _;
    },
    StrongEaseIn(y, _, S, E) {
      return S * (y /= E) * y * y * y * y + _;
    },
    StrongEaseOut(y, _, S, E) {
      return S * ((y = y / E - 1) * y * y * y * y + 1) + _;
    },
    StrongEaseInOut(y, _, S, E) {
      return (y /= E / 2) < 1 ? S / 2 * y * y * y * y * y + _ : S / 2 * ((y -= 2) * y * y * y * y + 2) + _;
    },
    Linear(y, _, S, E) {
      return S * y / E + _;
    }
  };
})(fl);
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.Konva = void 0;
  const t = le, e = Pe, n = ke, s = Dt, a = ll, l = Di, c = Pr, u = fi, d = kr, p = Ie, v = di, b = fl, y = _t, _ = nt;
  i.Konva = e.Util._assign(t.Konva, {
    Util: e.Util,
    Transform: e.Transform,
    Node: n.Node,
    Container: s.Container,
    Stage: a.Stage,
    stages: a.stages,
    Layer: l.Layer,
    FastLayer: c.FastLayer,
    Group: u.Group,
    DD: d.DD,
    Shape: p.Shape,
    shapes: p.shapes,
    Animation: v.Animation,
    Tween: b.Tween,
    Easings: b.Easings,
    Context: y.Context,
    Canvas: _.Canvas
  }), i.default = i.Konva;
})(_r);
var Tr = {};
Object.defineProperty(Tr, "__esModule", { value: !0 });
Tr.Arc = void 0;
const Ar = ce, e0 = Ie, Ja = le, Or = se, t0 = le;
class yt extends e0.Shape {
  _sceneFunc(t) {
    const e = Ja.Konva.getAngle(this.angle()), n = this.clockwise();
    t.beginPath(), t.arc(0, 0, this.outerRadius(), 0, e, n), t.arc(0, 0, this.innerRadius(), e, 0, !n), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.outerRadius() * 2;
  }
  getHeight() {
    return this.outerRadius() * 2;
  }
  setWidth(t) {
    this.outerRadius(t / 2);
  }
  setHeight(t) {
    this.outerRadius(t / 2);
  }
  getSelfRect() {
    const t = this.innerRadius(), e = this.outerRadius(), n = this.clockwise(), s = Ja.Konva.getAngle(n ? 360 - this.angle() : this.angle()), a = Math.cos(Math.min(s, Math.PI)), l = 1, c = Math.sin(Math.min(Math.max(Math.PI, s), 3 * Math.PI / 2)), u = Math.sin(Math.min(s, Math.PI / 2)), d = a * (a > 0 ? t : e), p = l * e, v = c * (c > 0 ? t : e), b = u * (u > 0 ? e : t);
    return {
      x: d,
      y: n ? -1 * b : v,
      width: p - d,
      height: b - v
    };
  }
}
Tr.Arc = yt;
yt.prototype._centroid = !0;
yt.prototype.className = "Arc";
yt.prototype._attrsAffectingSize = [
  "innerRadius",
  "outerRadius",
  "angle",
  "clockwise"
];
(0, t0._registerNode)(yt);
Ar.Factory.addGetterSetter(yt, "innerRadius", 0, (0, Or.getNumberValidator)());
Ar.Factory.addGetterSetter(yt, "outerRadius", 0, (0, Or.getNumberValidator)());
Ar.Factory.addGetterSetter(yt, "angle", 0, (0, Or.getNumberValidator)());
Ar.Factory.addGetterSetter(yt, "clockwise", !1, (0, Or.getBooleanValidator)());
var Nr = {}, Ui = {};
Object.defineProperty(Ui, "__esModule", { value: !0 });
Ui.Line = void 0;
const Rr = ce, i0 = le, r0 = Ie, dl = se;
function rs(i, t, e, n, s, a, l) {
  const c = Math.sqrt(Math.pow(e - i, 2) + Math.pow(n - t, 2)), u = Math.sqrt(Math.pow(s - e, 2) + Math.pow(a - n, 2)), d = l * c / (c + u), p = l * u / (c + u), v = e - d * (s - i), b = n - d * (a - t), y = e + p * (s - i), _ = n + p * (a - t);
  return [v, b, y, _];
}
function Za(i, t) {
  const e = i.length, n = [];
  for (let s = 2; s < e - 2; s += 2) {
    const a = rs(i[s - 2], i[s - 1], i[s], i[s + 1], i[s + 2], i[s + 3], t);
    isNaN(a[0]) || (n.push(a[0]), n.push(a[1]), n.push(i[s]), n.push(i[s + 1]), n.push(a[2]), n.push(a[3]));
  }
  return n;
}
let Tt = class extends r0.Shape {
  constructor(t) {
    super(t), this.on("pointsChange.konva tensionChange.konva closedChange.konva bezierChange.konva", function() {
      this._clearCache("tensionPoints");
    });
  }
  _sceneFunc(t) {
    const e = this.points(), n = e.length, s = this.tension(), a = this.closed(), l = this.bezier();
    if (!n)
      return;
    let c = 0;
    if (t.beginPath(), t.moveTo(e[0], e[1]), s !== 0 && n > 4) {
      const u = this.getTensionPoints(), d = u.length;
      for (c = a ? 0 : 4, a || t.quadraticCurveTo(u[0], u[1], u[2], u[3]); c < d - 2; )
        t.bezierCurveTo(u[c++], u[c++], u[c++], u[c++], u[c++], u[c++]);
      a || t.quadraticCurveTo(u[d - 2], u[d - 1], e[n - 2], e[n - 1]);
    } else if (l)
      for (c = 2; c < n; )
        t.bezierCurveTo(e[c++], e[c++], e[c++], e[c++], e[c++], e[c++]);
    else
      for (c = 2; c < n; c += 2)
        t.lineTo(e[c], e[c + 1]);
    a ? (t.closePath(), t.fillStrokeShape(this)) : t.strokeShape(this);
  }
  getTensionPoints() {
    return this._getCache("tensionPoints", this._getTensionPoints);
  }
  _getTensionPoints() {
    return this.closed() ? this._getTensionPointsClosed() : Za(this.points(), this.tension());
  }
  _getTensionPointsClosed() {
    const t = this.points(), e = t.length, n = this.tension(), s = rs(t[e - 2], t[e - 1], t[0], t[1], t[2], t[3], n), a = rs(t[e - 4], t[e - 3], t[e - 2], t[e - 1], t[0], t[1], n), l = Za(t, n);
    return [s[2], s[3]].concat(l).concat([
      a[0],
      a[1],
      t[e - 2],
      t[e - 1],
      a[2],
      a[3],
      s[0],
      s[1],
      t[0],
      t[1]
    ]);
  }
  getWidth() {
    return this.getSelfRect().width;
  }
  getHeight() {
    return this.getSelfRect().height;
  }
  getSelfRect() {
    let t = this.points();
    if (t.length < 4)
      return {
        x: t[0] || 0,
        y: t[1] || 0,
        width: 0,
        height: 0
      };
    this.tension() !== 0 ? t = [
      t[0],
      t[1],
      ...this._getTensionPoints(),
      t[t.length - 2],
      t[t.length - 1]
    ] : t = this.points();
    let e = t[0], n = t[0], s = t[1], a = t[1], l, c;
    for (let u = 0; u < t.length / 2; u++)
      l = t[u * 2], c = t[u * 2 + 1], e = Math.min(e, l), n = Math.max(n, l), s = Math.min(s, c), a = Math.max(a, c);
    return {
      x: e,
      y: s,
      width: n - e,
      height: a - s
    };
  }
};
Ui.Line = Tt;
Tt.prototype.className = "Line";
Tt.prototype._attrsAffectingSize = ["points", "bezier", "tension"];
(0, i0._registerNode)(Tt);
Rr.Factory.addGetterSetter(Tt, "closed", !1);
Rr.Factory.addGetterSetter(Tt, "bezier", !1);
Rr.Factory.addGetterSetter(Tt, "tension", 0, (0, dl.getNumberValidator)());
Rr.Factory.addGetterSetter(Tt, "points", [], (0, dl.getNumberArrayValidator)());
var gi = {}, gl = {};
(function(i) {
  Object.defineProperty(i, "__esModule", { value: !0 }), i.t2length = i.getQuadraticArcLength = i.getCubicArcLength = i.binomialCoefficients = i.cValues = i.tValues = void 0, i.tValues = [
    [],
    [],
    [
      -0.5773502691896257,
      0.5773502691896257
    ],
    [
      0,
      -0.7745966692414834,
      0.7745966692414834
    ],
    [
      -0.33998104358485626,
      0.33998104358485626,
      -0.8611363115940526,
      0.8611363115940526
    ],
    [
      0,
      -0.5384693101056831,
      0.5384693101056831,
      -0.906179845938664,
      0.906179845938664
    ],
    [
      0.6612093864662645,
      -0.6612093864662645,
      -0.2386191860831969,
      0.2386191860831969,
      -0.932469514203152,
      0.932469514203152
    ],
    [
      0,
      0.4058451513773972,
      -0.4058451513773972,
      -0.7415311855993945,
      0.7415311855993945,
      -0.9491079123427585,
      0.9491079123427585
    ],
    [
      -0.1834346424956498,
      0.1834346424956498,
      -0.525532409916329,
      0.525532409916329,
      -0.7966664774136267,
      0.7966664774136267,
      -0.9602898564975363,
      0.9602898564975363
    ],
    [
      0,
      -0.8360311073266358,
      0.8360311073266358,
      -0.9681602395076261,
      0.9681602395076261,
      -0.3242534234038089,
      0.3242534234038089,
      -0.6133714327005904,
      0.6133714327005904
    ],
    [
      -0.14887433898163122,
      0.14887433898163122,
      -0.4333953941292472,
      0.4333953941292472,
      -0.6794095682990244,
      0.6794095682990244,
      -0.8650633666889845,
      0.8650633666889845,
      -0.9739065285171717,
      0.9739065285171717
    ],
    [
      0,
      -0.26954315595234496,
      0.26954315595234496,
      -0.5190961292068118,
      0.5190961292068118,
      -0.7301520055740494,
      0.7301520055740494,
      -0.8870625997680953,
      0.8870625997680953,
      -0.978228658146057,
      0.978228658146057
    ],
    [
      -0.1252334085114689,
      0.1252334085114689,
      -0.3678314989981802,
      0.3678314989981802,
      -0.5873179542866175,
      0.5873179542866175,
      -0.7699026741943047,
      0.7699026741943047,
      -0.9041172563704749,
      0.9041172563704749,
      -0.9815606342467192,
      0.9815606342467192
    ],
    [
      0,
      -0.2304583159551348,
      0.2304583159551348,
      -0.44849275103644687,
      0.44849275103644687,
      -0.6423493394403402,
      0.6423493394403402,
      -0.8015780907333099,
      0.8015780907333099,
      -0.9175983992229779,
      0.9175983992229779,
      -0.9841830547185881,
      0.9841830547185881
    ],
    [
      -0.10805494870734367,
      0.10805494870734367,
      -0.31911236892788974,
      0.31911236892788974,
      -0.5152486363581541,
      0.5152486363581541,
      -0.6872929048116855,
      0.6872929048116855,
      -0.827201315069765,
      0.827201315069765,
      -0.9284348836635735,
      0.9284348836635735,
      -0.9862838086968123,
      0.9862838086968123
    ],
    [
      0,
      -0.20119409399743451,
      0.20119409399743451,
      -0.3941513470775634,
      0.3941513470775634,
      -0.5709721726085388,
      0.5709721726085388,
      -0.7244177313601701,
      0.7244177313601701,
      -0.8482065834104272,
      0.8482065834104272,
      -0.937273392400706,
      0.937273392400706,
      -0.9879925180204854,
      0.9879925180204854
    ],
    [
      -0.09501250983763744,
      0.09501250983763744,
      -0.2816035507792589,
      0.2816035507792589,
      -0.45801677765722737,
      0.45801677765722737,
      -0.6178762444026438,
      0.6178762444026438,
      -0.755404408355003,
      0.755404408355003,
      -0.8656312023878318,
      0.8656312023878318,
      -0.9445750230732326,
      0.9445750230732326,
      -0.9894009349916499,
      0.9894009349916499
    ],
    [
      0,
      -0.17848418149584785,
      0.17848418149584785,
      -0.3512317634538763,
      0.3512317634538763,
      -0.5126905370864769,
      0.5126905370864769,
      -0.6576711592166907,
      0.6576711592166907,
      -0.7815140038968014,
      0.7815140038968014,
      -0.8802391537269859,
      0.8802391537269859,
      -0.9506755217687678,
      0.9506755217687678,
      -0.9905754753144174,
      0.9905754753144174
    ],
    [
      -0.0847750130417353,
      0.0847750130417353,
      -0.2518862256915055,
      0.2518862256915055,
      -0.41175116146284263,
      0.41175116146284263,
      -0.5597708310739475,
      0.5597708310739475,
      -0.6916870430603532,
      0.6916870430603532,
      -0.8037049589725231,
      0.8037049589725231,
      -0.8926024664975557,
      0.8926024664975557,
      -0.9558239495713977,
      0.9558239495713977,
      -0.9915651684209309,
      0.9915651684209309
    ],
    [
      0,
      -0.16035864564022537,
      0.16035864564022537,
      -0.31656409996362983,
      0.31656409996362983,
      -0.46457074137596094,
      0.46457074137596094,
      -0.600545304661681,
      0.600545304661681,
      -0.7209661773352294,
      0.7209661773352294,
      -0.8227146565371428,
      0.8227146565371428,
      -0.9031559036148179,
      0.9031559036148179,
      -0.96020815213483,
      0.96020815213483,
      -0.9924068438435844,
      0.9924068438435844
    ],
    [
      -0.07652652113349734,
      0.07652652113349734,
      -0.22778585114164507,
      0.22778585114164507,
      -0.37370608871541955,
      0.37370608871541955,
      -0.5108670019508271,
      0.5108670019508271,
      -0.636053680726515,
      0.636053680726515,
      -0.7463319064601508,
      0.7463319064601508,
      -0.8391169718222188,
      0.8391169718222188,
      -0.912234428251326,
      0.912234428251326,
      -0.9639719272779138,
      0.9639719272779138,
      -0.9931285991850949,
      0.9931285991850949
    ],
    [
      0,
      -0.1455618541608951,
      0.1455618541608951,
      -0.2880213168024011,
      0.2880213168024011,
      -0.4243421202074388,
      0.4243421202074388,
      -0.5516188358872198,
      0.5516188358872198,
      -0.6671388041974123,
      0.6671388041974123,
      -0.7684399634756779,
      0.7684399634756779,
      -0.8533633645833173,
      0.8533633645833173,
      -0.9200993341504008,
      0.9200993341504008,
      -0.9672268385663063,
      0.9672268385663063,
      -0.9937521706203895,
      0.9937521706203895
    ],
    [
      -0.06973927331972223,
      0.06973927331972223,
      -0.20786042668822127,
      0.20786042668822127,
      -0.34193582089208424,
      0.34193582089208424,
      -0.469355837986757,
      0.469355837986757,
      -0.5876404035069116,
      0.5876404035069116,
      -0.6944872631866827,
      0.6944872631866827,
      -0.7878168059792081,
      0.7878168059792081,
      -0.8658125777203002,
      0.8658125777203002,
      -0.926956772187174,
      0.926956772187174,
      -0.9700604978354287,
      0.9700604978354287,
      -0.9942945854823992,
      0.9942945854823992
    ],
    [
      0,
      -0.1332568242984661,
      0.1332568242984661,
      -0.26413568097034495,
      0.26413568097034495,
      -0.3903010380302908,
      0.3903010380302908,
      -0.5095014778460075,
      0.5095014778460075,
      -0.6196098757636461,
      0.6196098757636461,
      -0.7186613631319502,
      0.7186613631319502,
      -0.8048884016188399,
      0.8048884016188399,
      -0.8767523582704416,
      0.8767523582704416,
      -0.9329710868260161,
      0.9329710868260161,
      -0.9725424712181152,
      0.9725424712181152,
      -0.9947693349975522,
      0.9947693349975522
    ],
    [
      -0.06405689286260563,
      0.06405689286260563,
      -0.1911188674736163,
      0.1911188674736163,
      -0.3150426796961634,
      0.3150426796961634,
      -0.4337935076260451,
      0.4337935076260451,
      -0.5454214713888396,
      0.5454214713888396,
      -0.6480936519369755,
      0.6480936519369755,
      -0.7401241915785544,
      0.7401241915785544,
      -0.820001985973903,
      0.820001985973903,
      -0.8864155270044011,
      0.8864155270044011,
      -0.9382745520027328,
      0.9382745520027328,
      -0.9747285559713095,
      0.9747285559713095,
      -0.9951872199970213,
      0.9951872199970213
    ]
  ], i.cValues = [
    [],
    [],
    [1, 1],
    [
      0.8888888888888888,
      0.5555555555555556,
      0.5555555555555556
    ],
    [
      0.6521451548625461,
      0.6521451548625461,
      0.34785484513745385,
      0.34785484513745385
    ],
    [
      0.5688888888888889,
      0.47862867049936647,
      0.47862867049936647,
      0.23692688505618908,
      0.23692688505618908
    ],
    [
      0.3607615730481386,
      0.3607615730481386,
      0.46791393457269104,
      0.46791393457269104,
      0.17132449237917036,
      0.17132449237917036
    ],
    [
      0.4179591836734694,
      0.3818300505051189,
      0.3818300505051189,
      0.27970539148927664,
      0.27970539148927664,
      0.1294849661688697,
      0.1294849661688697
    ],
    [
      0.362683783378362,
      0.362683783378362,
      0.31370664587788727,
      0.31370664587788727,
      0.22238103445337448,
      0.22238103445337448,
      0.10122853629037626,
      0.10122853629037626
    ],
    [
      0.3302393550012598,
      0.1806481606948574,
      0.1806481606948574,
      0.08127438836157441,
      0.08127438836157441,
      0.31234707704000286,
      0.31234707704000286,
      0.26061069640293544,
      0.26061069640293544
    ],
    [
      0.29552422471475287,
      0.29552422471475287,
      0.26926671930999635,
      0.26926671930999635,
      0.21908636251598204,
      0.21908636251598204,
      0.1494513491505806,
      0.1494513491505806,
      0.06667134430868814,
      0.06667134430868814
    ],
    [
      0.2729250867779006,
      0.26280454451024665,
      0.26280454451024665,
      0.23319376459199048,
      0.23319376459199048,
      0.18629021092773426,
      0.18629021092773426,
      0.1255803694649046,
      0.1255803694649046,
      0.05566856711617366,
      0.05566856711617366
    ],
    [
      0.24914704581340277,
      0.24914704581340277,
      0.2334925365383548,
      0.2334925365383548,
      0.20316742672306592,
      0.20316742672306592,
      0.16007832854334622,
      0.16007832854334622,
      0.10693932599531843,
      0.10693932599531843,
      0.04717533638651183,
      0.04717533638651183
    ],
    [
      0.2325515532308739,
      0.22628318026289723,
      0.22628318026289723,
      0.2078160475368885,
      0.2078160475368885,
      0.17814598076194574,
      0.17814598076194574,
      0.13887351021978725,
      0.13887351021978725,
      0.09212149983772845,
      0.09212149983772845,
      0.04048400476531588,
      0.04048400476531588
    ],
    [
      0.2152638534631578,
      0.2152638534631578,
      0.2051984637212956,
      0.2051984637212956,
      0.18553839747793782,
      0.18553839747793782,
      0.15720316715819355,
      0.15720316715819355,
      0.12151857068790319,
      0.12151857068790319,
      0.08015808715976021,
      0.08015808715976021,
      0.03511946033175186,
      0.03511946033175186
    ],
    [
      0.2025782419255613,
      0.19843148532711158,
      0.19843148532711158,
      0.1861610000155622,
      0.1861610000155622,
      0.16626920581699392,
      0.16626920581699392,
      0.13957067792615432,
      0.13957067792615432,
      0.10715922046717194,
      0.10715922046717194,
      0.07036604748810812,
      0.07036604748810812,
      0.03075324199611727,
      0.03075324199611727
    ],
    [
      0.1894506104550685,
      0.1894506104550685,
      0.18260341504492358,
      0.18260341504492358,
      0.16915651939500254,
      0.16915651939500254,
      0.14959598881657674,
      0.14959598881657674,
      0.12462897125553388,
      0.12462897125553388,
      0.09515851168249279,
      0.09515851168249279,
      0.062253523938647894,
      0.062253523938647894,
      0.027152459411754096,
      0.027152459411754096
    ],
    [
      0.17944647035620653,
      0.17656270536699264,
      0.17656270536699264,
      0.16800410215645004,
      0.16800410215645004,
      0.15404576107681028,
      0.15404576107681028,
      0.13513636846852548,
      0.13513636846852548,
      0.11188384719340397,
      0.11188384719340397,
      0.08503614831717918,
      0.08503614831717918,
      0.0554595293739872,
      0.0554595293739872,
      0.02414830286854793,
      0.02414830286854793
    ],
    [
      0.1691423829631436,
      0.1691423829631436,
      0.16427648374583273,
      0.16427648374583273,
      0.15468467512626524,
      0.15468467512626524,
      0.14064291467065065,
      0.14064291467065065,
      0.12255520671147846,
      0.12255520671147846,
      0.10094204410628717,
      0.10094204410628717,
      0.07642573025488905,
      0.07642573025488905,
      0.0497145488949698,
      0.0497145488949698,
      0.02161601352648331,
      0.02161601352648331
    ],
    [
      0.1610544498487837,
      0.15896884339395434,
      0.15896884339395434,
      0.15276604206585967,
      0.15276604206585967,
      0.1426067021736066,
      0.1426067021736066,
      0.12875396253933621,
      0.12875396253933621,
      0.11156664554733399,
      0.11156664554733399,
      0.09149002162245,
      0.09149002162245,
      0.06904454273764123,
      0.06904454273764123,
      0.0448142267656996,
      0.0448142267656996,
      0.019461788229726478,
      0.019461788229726478
    ],
    [
      0.15275338713072584,
      0.15275338713072584,
      0.14917298647260374,
      0.14917298647260374,
      0.14209610931838204,
      0.14209610931838204,
      0.13168863844917664,
      0.13168863844917664,
      0.11819453196151841,
      0.11819453196151841,
      0.10193011981724044,
      0.10193011981724044,
      0.08327674157670475,
      0.08327674157670475,
      0.06267204833410907,
      0.06267204833410907,
      0.04060142980038694,
      0.04060142980038694,
      0.017614007139152118,
      0.017614007139152118
    ],
    [
      0.14608113364969041,
      0.14452440398997005,
      0.14452440398997005,
      0.13988739479107315,
      0.13988739479107315,
      0.13226893863333747,
      0.13226893863333747,
      0.12183141605372853,
      0.12183141605372853,
      0.10879729916714838,
      0.10879729916714838,
      0.09344442345603386,
      0.09344442345603386,
      0.0761001136283793,
      0.0761001136283793,
      0.057134425426857205,
      0.057134425426857205,
      0.036953789770852494,
      0.036953789770852494,
      0.016017228257774335,
      0.016017228257774335
    ],
    [
      0.13925187285563198,
      0.13925187285563198,
      0.13654149834601517,
      0.13654149834601517,
      0.13117350478706238,
      0.13117350478706238,
      0.12325237681051242,
      0.12325237681051242,
      0.11293229608053922,
      0.11293229608053922,
      0.10041414444288096,
      0.10041414444288096,
      0.08594160621706773,
      0.08594160621706773,
      0.06979646842452049,
      0.06979646842452049,
      0.052293335152683286,
      0.052293335152683286,
      0.03377490158481415,
      0.03377490158481415,
      0.0146279952982722,
      0.0146279952982722
    ],
    [
      0.13365457218610619,
      0.1324620394046966,
      0.1324620394046966,
      0.12890572218808216,
      0.12890572218808216,
      0.12304908430672953,
      0.12304908430672953,
      0.11499664022241136,
      0.11499664022241136,
      0.10489209146454141,
      0.10489209146454141,
      0.09291576606003515,
      0.09291576606003515,
      0.07928141177671895,
      0.07928141177671895,
      0.06423242140852585,
      0.06423242140852585,
      0.04803767173108467,
      0.04803767173108467,
      0.030988005856979445,
      0.030988005856979445,
      0.013411859487141771,
      0.013411859487141771
    ],
    [
      0.12793819534675216,
      0.12793819534675216,
      0.1258374563468283,
      0.1258374563468283,
      0.12167047292780339,
      0.12167047292780339,
      0.1155056680537256,
      0.1155056680537256,
      0.10744427011596563,
      0.10744427011596563,
      0.09761865210411388,
      0.09761865210411388,
      0.08619016153195327,
      0.08619016153195327,
      0.0733464814110803,
      0.0733464814110803,
      0.05929858491543678,
      0.05929858491543678,
      0.04427743881741981,
      0.04427743881741981,
      0.028531388628933663,
      0.028531388628933663,
      0.0123412297999872,
      0.0123412297999872
    ]
  ], i.binomialCoefficients = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]];
  const t = (l, c, u) => {
    let d, p;
    const b = u / 2;
    d = 0;
    for (let y = 0; y < 20; y++)
      p = b * i.tValues[20][y] + b, d += i.cValues[20][y] * n(l, c, p);
    return b * d;
  };
  i.getCubicArcLength = t;
  const e = (l, c, u) => {
    u === void 0 && (u = 1);
    const d = l[0] - 2 * l[1] + l[2], p = c[0] - 2 * c[1] + c[2], v = 2 * l[1] - 2 * l[0], b = 2 * c[1] - 2 * c[0], y = 4 * (d * d + p * p), _ = 4 * (d * v + p * b), S = v * v + b * b;
    if (y === 0)
      return u * Math.sqrt(Math.pow(l[2] - l[0], 2) + Math.pow(c[2] - c[0], 2));
    const E = _ / (2 * y), P = S / y, A = u + E, m = P - E * E, C = A * A + m > 0 ? Math.sqrt(A * A + m) : 0, $ = E * E + m > 0 ? Math.sqrt(E * E + m) : 0, N = E + Math.sqrt(E * E + m) !== 0 ? m * Math.log(Math.abs((A + C) / (E + $))) : 0;
    return Math.sqrt(y) / 2 * (A * C - E * $ + N);
  };
  i.getQuadraticArcLength = e;
  function n(l, c, u) {
    const d = s(1, u, l), p = s(1, u, c), v = d * d + p * p;
    return Math.sqrt(v);
  }
  const s = (l, c, u) => {
    const d = u.length - 1;
    let p, v;
    if (d === 0)
      return 0;
    if (l === 0) {
      v = 0;
      for (let b = 0; b <= d; b++)
        v += i.binomialCoefficients[d][b] * Math.pow(1 - c, d - b) * Math.pow(c, b) * u[b];
      return v;
    } else {
      p = new Array(d);
      for (let b = 0; b < d; b++)
        p[b] = d * (u[b + 1] - u[b]);
      return s(l - 1, c, p);
    }
  }, a = (l, c, u) => {
    let d = 1, p = l / c, v = (l - u(p)) / c, b = 0;
    for (; d > 1e-3; ) {
      const y = u(p + v), _ = Math.abs(l - y) / c;
      if (_ < d)
        d = _, p += v;
      else {
        const S = u(p - v), E = Math.abs(l - S) / c;
        E < d ? (d = E, p -= v) : v /= 2;
      }
      if (b++, b > 500)
        break;
    }
    return p;
  };
  i.t2length = a;
})(gl);
Object.defineProperty(gi, "__esModule", { value: !0 });
gi.Path = void 0;
const n0 = ce, s0 = le, a0 = Ie, ni = gl;
let Bi = class Ke extends a0.Shape {
  constructor(t) {
    super(t), this.dataArray = [], this.pathLength = 0, this._readDataAttribute(), this.on("dataChange.konva", function() {
      this._readDataAttribute();
    });
  }
  _readDataAttribute() {
    this.dataArray = Ke.parsePathData(this.data()), this.pathLength = Ke.getPathLength(this.dataArray);
  }
  _sceneFunc(t) {
    const e = this.dataArray;
    t.beginPath();
    let n = !1;
    for (let s = 0; s < e.length; s++) {
      const a = e[s].command, l = e[s].points;
      switch (a) {
        case "L":
          t.lineTo(l[0], l[1]);
          break;
        case "M":
          t.moveTo(l[0], l[1]);
          break;
        case "C":
          t.bezierCurveTo(l[0], l[1], l[2], l[3], l[4], l[5]);
          break;
        case "Q":
          t.quadraticCurveTo(l[0], l[1], l[2], l[3]);
          break;
        case "A":
          const c = l[0], u = l[1], d = l[2], p = l[3], v = l[4], b = l[5], y = l[6], _ = l[7], S = d > p ? d : p, E = d > p ? 1 : d / p, P = d > p ? p / d : 1;
          t.translate(c, u), t.rotate(y), t.scale(E, P), t.arc(0, 0, S, v, v + b, 1 - _), t.scale(1 / E, 1 / P), t.rotate(-y), t.translate(-c, -u);
          break;
        case "z":
          n = !0, t.closePath();
          break;
      }
    }
    !n && !this.hasFill() ? t.strokeShape(this) : t.fillStrokeShape(this);
  }
  getSelfRect() {
    let t = [];
    this.dataArray.forEach(function(u) {
      if (u.command === "A") {
        const d = u.points[4], p = u.points[5], v = u.points[4] + p;
        let b = Math.PI / 180;
        if (Math.abs(d - v) < b && (b = Math.abs(d - v)), p < 0)
          for (let y = d - b; y > v; y -= b) {
            const _ = Ke.getPointOnEllipticalArc(u.points[0], u.points[1], u.points[2], u.points[3], y, 0);
            t.push(_.x, _.y);
          }
        else
          for (let y = d + b; y < v; y += b) {
            const _ = Ke.getPointOnEllipticalArc(u.points[0], u.points[1], u.points[2], u.points[3], y, 0);
            t.push(_.x, _.y);
          }
      } else if (u.command === "C")
        for (let d = 0; d <= 1; d += 0.01) {
          const p = Ke.getPointOnCubicBezier(d, u.start.x, u.start.y, u.points[0], u.points[1], u.points[2], u.points[3], u.points[4], u.points[5]);
          t.push(p.x, p.y);
        }
      else
        t = t.concat(u.points);
    });
    let e = t[0], n = t[0], s = t[1], a = t[1], l, c;
    for (let u = 0; u < t.length / 2; u++)
      l = t[u * 2], c = t[u * 2 + 1], isNaN(l) || (e = Math.min(e, l), n = Math.max(n, l)), isNaN(c) || (s = Math.min(s, c), a = Math.max(a, c));
    return {
      x: e,
      y: s,
      width: n - e,
      height: a - s
    };
  }
  getLength() {
    return this.pathLength;
  }
  getPointAtLength(t) {
    return Ke.getPointAtLengthOfDataArray(t, this.dataArray);
  }
  static getLineLength(t, e, n, s) {
    return Math.sqrt((n - t) * (n - t) + (s - e) * (s - e));
  }
  static getPathLength(t) {
    let e = 0;
    for (let n = 0; n < t.length; ++n)
      e += t[n].pathLength;
    return e;
  }
  static getPointAtLengthOfDataArray(t, e) {
    let n, s = 0, a = e.length;
    if (!a)
      return null;
    for (; s < a && t > e[s].pathLength; )
      t -= e[s].pathLength, ++s;
    if (s === a)
      return n = e[s - 1].points.slice(-2), {
        x: n[0],
        y: n[1]
      };
    if (t < 0.01)
      return e[s].command === "M" ? (n = e[s].points.slice(0, 2), {
        x: n[0],
        y: n[1]
      }) : {
        x: e[s].start.x,
        y: e[s].start.y
      };
    const l = e[s], c = l.points;
    switch (l.command) {
      case "L":
        return Ke.getPointOnLine(t, l.start.x, l.start.y, c[0], c[1]);
      case "C":
        return Ke.getPointOnCubicBezier((0, ni.t2length)(t, Ke.getPathLength(e), (S) => (0, ni.getCubicArcLength)([l.start.x, c[0], c[2], c[4]], [l.start.y, c[1], c[3], c[5]], S)), l.start.x, l.start.y, c[0], c[1], c[2], c[3], c[4], c[5]);
      case "Q":
        return Ke.getPointOnQuadraticBezier((0, ni.t2length)(t, Ke.getPathLength(e), (S) => (0, ni.getQuadraticArcLength)([l.start.x, c[0], c[2]], [l.start.y, c[1], c[3]], S)), l.start.x, l.start.y, c[0], c[1], c[2], c[3]);
      case "A":
        const u = c[0], d = c[1], p = c[2], v = c[3], b = c[5], y = c[6];
        let _ = c[4];
        return _ += b * t / l.pathLength, Ke.getPointOnEllipticalArc(u, d, p, v, _, y);
    }
    return null;
  }
  static getPointOnLine(t, e, n, s, a, l, c) {
    l = l ?? e, c = c ?? n;
    const u = this.getLineLength(e, n, s, a);
    if (u < 1e-10)
      return { x: e, y: n };
    if (s === e)
      return { x: l, y: c + (a > n ? t : -t) };
    const d = (a - n) / (s - e), p = Math.sqrt(t * t / (1 + d * d)) * (s < e ? -1 : 1), v = d * p;
    if (Math.abs(c - n - d * (l - e)) < 1e-10)
      return { x: l + p, y: c + v };
    const b = ((l - e) * (s - e) + (c - n) * (a - n)) / (u * u), y = e + b * (s - e), _ = n + b * (a - n), S = this.getLineLength(l, c, y, _), E = Math.sqrt(t * t - S * S), P = Math.sqrt(E * E / (1 + d * d)) * (s < e ? -1 : 1), A = d * P;
    return { x: y + P, y: _ + A };
  }
  static getPointOnCubicBezier(t, e, n, s, a, l, c, u, d) {
    function p(E) {
      return E * E * E;
    }
    function v(E) {
      return 3 * E * E * (1 - E);
    }
    function b(E) {
      return 3 * E * (1 - E) * (1 - E);
    }
    function y(E) {
      return (1 - E) * (1 - E) * (1 - E);
    }
    const _ = u * p(t) + l * v(t) + s * b(t) + e * y(t), S = d * p(t) + c * v(t) + a * b(t) + n * y(t);
    return { x: _, y: S };
  }
  static getPointOnQuadraticBezier(t, e, n, s, a, l, c) {
    function u(y) {
      return y * y;
    }
    function d(y) {
      return 2 * y * (1 - y);
    }
    function p(y) {
      return (1 - y) * (1 - y);
    }
    const v = l * u(t) + s * d(t) + e * p(t), b = c * u(t) + a * d(t) + n * p(t);
    return { x: v, y: b };
  }
  static getPointOnEllipticalArc(t, e, n, s, a, l) {
    const c = Math.cos(l), u = Math.sin(l), d = {
      x: n * Math.cos(a),
      y: s * Math.sin(a)
    };
    return {
      x: t + (d.x * c - d.y * u),
      y: e + (d.x * u + d.y * c)
    };
  }
  static parsePathData(t) {
    if (!t)
      return [];
    let e = t;
    const n = [
      "m",
      "M",
      "l",
      "L",
      "v",
      "V",
      "h",
      "H",
      "z",
      "Z",
      "c",
      "C",
      "q",
      "Q",
      "t",
      "T",
      "s",
      "S",
      "a",
      "A"
    ];
    e = e.replace(new RegExp(" ", "g"), ",");
    for (let v = 0; v < n.length; v++)
      e = e.replace(new RegExp(n[v], "g"), "|" + n[v]);
    const s = e.split("|"), a = [], l = [];
    let c = 0, u = 0;
    const d = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/gi;
    let p;
    for (let v = 1; v < s.length; v++) {
      let b = s[v], y = b.charAt(0);
      for (b = b.slice(1), l.length = 0; p = d.exec(b); )
        l.push(p[0]);
      const _ = [];
      for (let S = 0, E = l.length; S < E; S++) {
        if (l[S] === "00") {
          _.push(0, 0);
          continue;
        }
        const P = parseFloat(l[S]);
        isNaN(P) ? _.push(0) : _.push(P);
      }
      for (; _.length > 0 && !isNaN(_[0]); ) {
        let S = "", E = [];
        const P = c, A = u;
        let m, C, $, N, G, T, M, L, U, B;
        switch (y) {
          case "l":
            c += _.shift(), u += _.shift(), S = "L", E.push(c, u);
            break;
          case "L":
            c = _.shift(), u = _.shift(), E.push(c, u);
            break;
          case "m":
            const W = _.shift(), te = _.shift();
            if (c += W, u += te, S = "M", a.length > 2 && a[a.length - 1].command === "z") {
              for (let q = a.length - 2; q >= 0; q--)
                if (a[q].command === "M") {
                  c = a[q].points[0] + W, u = a[q].points[1] + te;
                  break;
                }
            }
            E.push(c, u), y = "l";
            break;
          case "M":
            c = _.shift(), u = _.shift(), S = "M", E.push(c, u), y = "L";
            break;
          case "h":
            c += _.shift(), S = "L", E.push(c, u);
            break;
          case "H":
            c = _.shift(), S = "L", E.push(c, u);
            break;
          case "v":
            u += _.shift(), S = "L", E.push(c, u);
            break;
          case "V":
            u = _.shift(), S = "L", E.push(c, u);
            break;
          case "C":
            E.push(_.shift(), _.shift(), _.shift(), _.shift()), c = _.shift(), u = _.shift(), E.push(c, u);
            break;
          case "c":
            E.push(c + _.shift(), u + _.shift(), c + _.shift(), u + _.shift()), c += _.shift(), u += _.shift(), S = "C", E.push(c, u);
            break;
          case "S":
            C = c, $ = u, m = a[a.length - 1], m.command === "C" && (C = c + (c - m.points[2]), $ = u + (u - m.points[3])), E.push(C, $, _.shift(), _.shift()), c = _.shift(), u = _.shift(), S = "C", E.push(c, u);
            break;
          case "s":
            C = c, $ = u, m = a[a.length - 1], m.command === "C" && (C = c + (c - m.points[2]), $ = u + (u - m.points[3])), E.push(C, $, c + _.shift(), u + _.shift()), c += _.shift(), u += _.shift(), S = "C", E.push(c, u);
            break;
          case "Q":
            E.push(_.shift(), _.shift()), c = _.shift(), u = _.shift(), E.push(c, u);
            break;
          case "q":
            E.push(c + _.shift(), u + _.shift()), c += _.shift(), u += _.shift(), S = "Q", E.push(c, u);
            break;
          case "T":
            C = c, $ = u, m = a[a.length - 1], m.command === "Q" && (C = c + (c - m.points[0]), $ = u + (u - m.points[1])), c = _.shift(), u = _.shift(), S = "Q", E.push(C, $, c, u);
            break;
          case "t":
            C = c, $ = u, m = a[a.length - 1], m.command === "Q" && (C = c + (c - m.points[0]), $ = u + (u - m.points[1])), c += _.shift(), u += _.shift(), S = "Q", E.push(C, $, c, u);
            break;
          case "A":
            N = _.shift(), G = _.shift(), T = _.shift(), M = _.shift(), L = _.shift(), U = c, B = u, c = _.shift(), u = _.shift(), S = "A", E = this.convertEndpointToCenterParameterization(U, B, c, u, M, L, N, G, T);
            break;
          case "a":
            N = _.shift(), G = _.shift(), T = _.shift(), M = _.shift(), L = _.shift(), U = c, B = u, c += _.shift(), u += _.shift(), S = "A", E = this.convertEndpointToCenterParameterization(U, B, c, u, M, L, N, G, T);
            break;
        }
        a.push({
          command: S || y,
          points: E,
          start: {
            x: P,
            y: A
          },
          pathLength: this.calcLength(P, A, S || y, E)
        });
      }
      (y === "z" || y === "Z") && a.push({
        command: "z",
        points: [],
        start: void 0,
        pathLength: 0
      });
    }
    return a;
  }
  static calcLength(t, e, n, s) {
    let a, l, c, u;
    const d = Ke;
    switch (n) {
      case "L":
        return d.getLineLength(t, e, s[0], s[1]);
      case "C":
        return (0, ni.getCubicArcLength)([t, s[0], s[2], s[4]], [e, s[1], s[3], s[5]], 1);
      case "Q":
        return (0, ni.getQuadraticArcLength)([t, s[0], s[2]], [e, s[1], s[3]], 1);
      case "A":
        a = 0;
        const p = s[4], v = s[5], b = s[4] + v;
        let y = Math.PI / 180;
        if (Math.abs(p - b) < y && (y = Math.abs(p - b)), l = d.getPointOnEllipticalArc(s[0], s[1], s[2], s[3], p, 0), v < 0)
          for (u = p - y; u > b; u -= y)
            c = d.getPointOnEllipticalArc(s[0], s[1], s[2], s[3], u, 0), a += d.getLineLength(l.x, l.y, c.x, c.y), l = c;
        else
          for (u = p + y; u < b; u += y)
            c = d.getPointOnEllipticalArc(s[0], s[1], s[2], s[3], u, 0), a += d.getLineLength(l.x, l.y, c.x, c.y), l = c;
        return c = d.getPointOnEllipticalArc(s[0], s[1], s[2], s[3], b, 0), a += d.getLineLength(l.x, l.y, c.x, c.y), a;
    }
    return 0;
  }
  static convertEndpointToCenterParameterization(t, e, n, s, a, l, c, u, d) {
    const p = d * (Math.PI / 180), v = Math.cos(p) * (t - n) / 2 + Math.sin(p) * (e - s) / 2, b = -1 * Math.sin(p) * (t - n) / 2 + Math.cos(p) * (e - s) / 2, y = v * v / (c * c) + b * b / (u * u);
    y > 1 && (c *= Math.sqrt(y), u *= Math.sqrt(y));
    let _ = Math.sqrt((c * c * (u * u) - c * c * (b * b) - u * u * (v * v)) / (c * c * (b * b) + u * u * (v * v)));
    a === l && (_ *= -1), isNaN(_) && (_ = 0);
    const S = _ * c * b / u, E = _ * -u * v / c, P = (t + n) / 2 + Math.cos(p) * S - Math.sin(p) * E, A = (e + s) / 2 + Math.sin(p) * S + Math.cos(p) * E, m = function(L) {
      return Math.sqrt(L[0] * L[0] + L[1] * L[1]);
    }, C = function(L, U) {
      return (L[0] * U[0] + L[1] * U[1]) / (m(L) * m(U));
    }, $ = function(L, U) {
      return (L[0] * U[1] < L[1] * U[0] ? -1 : 1) * Math.acos(C(L, U));
    }, N = $([1, 0], [(v - S) / c, (b - E) / u]), G = [(v - S) / c, (b - E) / u], T = [(-1 * v - S) / c, (-1 * b - E) / u];
    let M = $(G, T);
    return C(G, T) <= -1 && (M = Math.PI), C(G, T) >= 1 && (M = 0), l === 0 && M > 0 && (M = M - 2 * Math.PI), l === 1 && M < 0 && (M = M + 2 * Math.PI), [P, A, c, u, N, M, p, l];
  }
};
gi.Path = Bi;
Bi.prototype.className = "Path";
Bi.prototype._attrsAffectingSize = ["data"];
(0, s0._registerNode)(Bi);
n0.Factory.addGetterSetter(Bi, "data");
Object.defineProperty(Nr, "__esModule", { value: !0 });
Nr.Arrow = void 0;
const Lr = ce, o0 = Ui, pl = se, l0 = le, eo = gi;
class Bt extends o0.Line {
  _sceneFunc(t) {
    super._sceneFunc(t);
    const e = Math.PI * 2, n = this.points();
    let s = n;
    const a = this.tension() !== 0 && n.length > 4;
    a && (s = this.getTensionPoints());
    const l = this.pointerLength(), c = n.length;
    let u, d;
    if (a) {
      const b = [
        s[s.length - 4],
        s[s.length - 3],
        s[s.length - 2],
        s[s.length - 1],
        n[c - 2],
        n[c - 1]
      ], y = eo.Path.calcLength(s[s.length - 4], s[s.length - 3], "C", b), _ = eo.Path.getPointOnQuadraticBezier(Math.min(1, 1 - l / y), b[0], b[1], b[2], b[3], b[4], b[5]);
      u = n[c - 2] - _.x, d = n[c - 1] - _.y;
    } else
      u = n[c - 2] - n[c - 4], d = n[c - 1] - n[c - 3];
    const p = (Math.atan2(d, u) + e) % e, v = this.pointerWidth();
    this.pointerAtEnding() && (t.save(), t.beginPath(), t.translate(n[c - 2], n[c - 1]), t.rotate(p), t.moveTo(0, 0), t.lineTo(-l, v / 2), t.lineTo(-l, -v / 2), t.closePath(), t.restore(), this.__fillStroke(t)), this.pointerAtBeginning() && (t.save(), t.beginPath(), t.translate(n[0], n[1]), a ? (u = (s[0] + s[2]) / 2 - n[0], d = (s[1] + s[3]) / 2 - n[1]) : (u = n[2] - n[0], d = n[3] - n[1]), t.rotate((Math.atan2(-d, -u) + e) % e), t.moveTo(0, 0), t.lineTo(-l, v / 2), t.lineTo(-l, -v / 2), t.closePath(), t.restore(), this.__fillStroke(t));
  }
  __fillStroke(t) {
    const e = this.dashEnabled();
    e && (this.attrs.dashEnabled = !1, t.setLineDash([])), t.fillStrokeShape(this), e && (this.attrs.dashEnabled = !0);
  }
  getSelfRect() {
    const t = super.getSelfRect(), e = this.pointerWidth() / 2;
    return {
      x: t.x,
      y: t.y - e,
      width: t.width,
      height: t.height + e * 2
    };
  }
}
Nr.Arrow = Bt;
Bt.prototype.className = "Arrow";
(0, l0._registerNode)(Bt);
Lr.Factory.addGetterSetter(Bt, "pointerLength", 10, (0, pl.getNumberValidator)());
Lr.Factory.addGetterSetter(Bt, "pointerWidth", 10, (0, pl.getNumberValidator)());
Lr.Factory.addGetterSetter(Bt, "pointerAtBeginning", !1);
Lr.Factory.addGetterSetter(Bt, "pointerAtEnding", !0);
var Fr = {};
Object.defineProperty(Fr, "__esModule", { value: !0 });
Fr.Circle = void 0;
const h0 = ce, c0 = Ie, u0 = se, f0 = le;
class pi extends c0.Shape {
  _sceneFunc(t) {
    t.beginPath(), t.arc(0, 0, this.attrs.radius || 0, 0, Math.PI * 2, !1), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.radius() * 2;
  }
  getHeight() {
    return this.radius() * 2;
  }
  setWidth(t) {
    this.radius() !== t / 2 && this.radius(t / 2);
  }
  setHeight(t) {
    this.radius() !== t / 2 && this.radius(t / 2);
  }
}
Fr.Circle = pi;
pi.prototype._centroid = !0;
pi.prototype.className = "Circle";
pi.prototype._attrsAffectingSize = ["radius"];
(0, f0._registerNode)(pi);
h0.Factory.addGetterSetter(pi, "radius", 0, (0, u0.getNumberValidator)());
var Mr = {};
Object.defineProperty(Mr, "__esModule", { value: !0 });
Mr.Ellipse = void 0;
const ys = ce, d0 = Ie, ml = se, g0 = le;
class At extends d0.Shape {
  _sceneFunc(t) {
    const e = this.radiusX(), n = this.radiusY();
    t.beginPath(), t.save(), e !== n && t.scale(1, n / e), t.arc(0, 0, e, 0, Math.PI * 2, !1), t.restore(), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.radiusX() * 2;
  }
  getHeight() {
    return this.radiusY() * 2;
  }
  setWidth(t) {
    this.radiusX(t / 2);
  }
  setHeight(t) {
    this.radiusY(t / 2);
  }
}
Mr.Ellipse = At;
At.prototype.className = "Ellipse";
At.prototype._centroid = !0;
At.prototype._attrsAffectingSize = ["radiusX", "radiusY"];
(0, g0._registerNode)(At);
ys.Factory.addComponentsGetterSetter(At, "radius", ["x", "y"]);
ys.Factory.addGetterSetter(At, "radiusX", 0, (0, ml.getNumberValidator)());
ys.Factory.addGetterSetter(At, "radiusY", 0, (0, ml.getNumberValidator)());
var Gr = {};
Object.defineProperty(Gr, "__esModule", { value: !0 });
Gr.Image = void 0;
const In = Pe, jt = ce, p0 = Ie, m0 = le, ji = se;
class tt extends p0.Shape {
  constructor(t) {
    super(t), this._loadListener = () => {
      this._requestDraw();
    }, this.on("imageChange.konva", (e) => {
      this._removeImageLoad(e.oldVal), this._setImageLoad();
    }), this._setImageLoad();
  }
  _setImageLoad() {
    const t = this.image();
    t && t.complete || t && t.readyState === 4 || t && t.addEventListener && t.addEventListener("load", this._loadListener);
  }
  _removeImageLoad(t) {
    t && t.removeEventListener && t.removeEventListener("load", this._loadListener);
  }
  destroy() {
    return this._removeImageLoad(this.image()), super.destroy(), this;
  }
  _useBufferCanvas() {
    const t = !!this.cornerRadius(), e = this.hasShadow();
    return t && e ? !0 : super._useBufferCanvas(!0);
  }
  _sceneFunc(t) {
    const e = this.getWidth(), n = this.getHeight(), s = this.cornerRadius(), a = this.attrs.image;
    let l;
    if (a) {
      const c = this.attrs.cropWidth, u = this.attrs.cropHeight;
      c && u ? l = [
        a,
        this.cropX(),
        this.cropY(),
        c,
        u,
        0,
        0,
        e,
        n
      ] : l = [a, 0, 0, e, n];
    }
    (this.hasFill() || this.hasStroke() || s) && (t.beginPath(), s ? In.Util.drawRoundedRectPath(t, e, n, s) : t.rect(0, 0, e, n), t.closePath(), t.fillStrokeShape(this)), a && (s && t.clip(), t.drawImage.apply(t, l));
  }
  _hitFunc(t) {
    const e = this.width(), n = this.height(), s = this.cornerRadius();
    t.beginPath(), s ? In.Util.drawRoundedRectPath(t, e, n, s) : t.rect(0, 0, e, n), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    var t, e;
    return (t = this.attrs.width) !== null && t !== void 0 ? t : (e = this.image()) === null || e === void 0 ? void 0 : e.width;
  }
  getHeight() {
    var t, e;
    return (t = this.attrs.height) !== null && t !== void 0 ? t : (e = this.image()) === null || e === void 0 ? void 0 : e.height;
  }
  static fromURL(t, e, n = null) {
    const s = In.Util.createImageElement();
    s.onload = function() {
      const a = new tt({
        image: s
      });
      e(a);
    }, s.onerror = n, s.crossOrigin = "Anonymous", s.src = t;
  }
}
Gr.Image = tt;
tt.prototype.className = "Image";
(0, m0._registerNode)(tt);
jt.Factory.addGetterSetter(tt, "cornerRadius", 0, (0, ji.getNumberOrArrayOfNumbersValidator)(4));
jt.Factory.addGetterSetter(tt, "image");
jt.Factory.addComponentsGetterSetter(tt, "crop", ["x", "y", "width", "height"]);
jt.Factory.addGetterSetter(tt, "cropX", 0, (0, ji.getNumberValidator)());
jt.Factory.addGetterSetter(tt, "cropY", 0, (0, ji.getNumberValidator)());
jt.Factory.addGetterSetter(tt, "cropWidth", 0, (0, ji.getNumberValidator)());
jt.Factory.addGetterSetter(tt, "cropHeight", 0, (0, ji.getNumberValidator)());
var oi = {};
Object.defineProperty(oi, "__esModule", { value: !0 });
oi.Tag = oi.Label = void 0;
const Ir = ce, _0 = Ie, v0 = fi, ws = se, _l = le, vl = [
  "fontFamily",
  "fontSize",
  "fontStyle",
  "padding",
  "lineHeight",
  "text",
  "width",
  "height",
  "pointerDirection",
  "pointerWidth",
  "pointerHeight"
], b0 = "Change.konva", y0 = "none", ns = "up", ss = "right", as = "down", os = "left", w0 = vl.length;
class Cs extends v0.Group {
  constructor(t) {
    super(t), this.on("add.konva", function(e) {
      this._addListeners(e.child), this._sync();
    });
  }
  getText() {
    return this.find("Text")[0];
  }
  getTag() {
    return this.find("Tag")[0];
  }
  _addListeners(t) {
    let e = this, n;
    const s = function() {
      e._sync();
    };
    for (n = 0; n < w0; n++)
      t.on(vl[n] + b0, s);
  }
  getWidth() {
    return this.getText().width();
  }
  getHeight() {
    return this.getText().height();
  }
  _sync() {
    let t = this.getText(), e = this.getTag(), n, s, a, l, c, u, d;
    if (t && e) {
      switch (n = t.width(), s = t.height(), a = e.pointerDirection(), l = e.pointerWidth(), d = e.pointerHeight(), c = 0, u = 0, a) {
        case ns:
          c = n / 2, u = -1 * d;
          break;
        case ss:
          c = n + l, u = s / 2;
          break;
        case as:
          c = n / 2, u = s + d;
          break;
        case os:
          c = -1 * l, u = s / 2;
          break;
      }
      e.setAttrs({
        x: -1 * c,
        y: -1 * u,
        width: n,
        height: s
      }), t.setAttrs({
        x: -1 * c,
        y: -1 * u
      });
    }
  }
}
oi.Label = Cs;
Cs.prototype.className = "Label";
(0, _l._registerNode)(Cs);
class Vt extends _0.Shape {
  _sceneFunc(t) {
    const e = this.width(), n = this.height(), s = this.pointerDirection(), a = this.pointerWidth(), l = this.pointerHeight(), c = this.cornerRadius();
    let u = 0, d = 0, p = 0, v = 0;
    typeof c == "number" ? u = d = p = v = Math.min(c, e / 2, n / 2) : (u = Math.min(c[0] || 0, e / 2, n / 2), d = Math.min(c[1] || 0, e / 2, n / 2), v = Math.min(c[2] || 0, e / 2, n / 2), p = Math.min(c[3] || 0, e / 2, n / 2)), t.beginPath(), t.moveTo(u, 0), s === ns && (t.lineTo((e - a) / 2, 0), t.lineTo(e / 2, -1 * l), t.lineTo((e + a) / 2, 0)), t.lineTo(e - d, 0), t.arc(e - d, d, d, Math.PI * 3 / 2, 0, !1), s === ss && (t.lineTo(e, (n - l) / 2), t.lineTo(e + a, n / 2), t.lineTo(e, (n + l) / 2)), t.lineTo(e, n - v), t.arc(e - v, n - v, v, 0, Math.PI / 2, !1), s === as && (t.lineTo((e + a) / 2, n), t.lineTo(e / 2, n + l), t.lineTo((e - a) / 2, n)), t.lineTo(p, n), t.arc(p, n - p, p, Math.PI / 2, Math.PI, !1), s === os && (t.lineTo(0, (n + l) / 2), t.lineTo(-1 * a, n / 2), t.lineTo(0, (n - l) / 2)), t.lineTo(0, u), t.arc(u, u, u, Math.PI, Math.PI * 3 / 2, !1), t.closePath(), t.fillStrokeShape(this);
  }
  getSelfRect() {
    let t = 0, e = 0, n = this.pointerWidth(), s = this.pointerHeight(), a = this.pointerDirection(), l = this.width(), c = this.height();
    return a === ns ? (e -= s, c += s) : a === as ? c += s : a === os ? (t -= n * 1.5, l += n) : a === ss && (l += n * 1.5), {
      x: t,
      y: e,
      width: l,
      height: c
    };
  }
}
oi.Tag = Vt;
Vt.prototype.className = "Tag";
(0, _l._registerNode)(Vt);
Ir.Factory.addGetterSetter(Vt, "pointerDirection", y0);
Ir.Factory.addGetterSetter(Vt, "pointerWidth", 0, (0, ws.getNumberValidator)());
Ir.Factory.addGetterSetter(Vt, "pointerHeight", 0, (0, ws.getNumberValidator)());
Ir.Factory.addGetterSetter(Vt, "cornerRadius", 0, (0, ws.getNumberOrArrayOfNumbersValidator)(4));
var Vi = {};
Object.defineProperty(Vi, "__esModule", { value: !0 });
Vi.Rect = void 0;
const C0 = ce, S0 = Ie, E0 = le, x0 = Pe, k0 = se;
let Dr = class extends S0.Shape {
  _sceneFunc(t) {
    const e = this.cornerRadius(), n = this.width(), s = this.height();
    t.beginPath(), e ? x0.Util.drawRoundedRectPath(t, n, s, e) : t.rect(0, 0, n, s), t.closePath(), t.fillStrokeShape(this);
  }
};
Vi.Rect = Dr;
Dr.prototype.className = "Rect";
(0, E0._registerNode)(Dr);
C0.Factory.addGetterSetter(Dr, "cornerRadius", 0, (0, k0.getNumberOrArrayOfNumbersValidator)(4));
var Ur = {};
Object.defineProperty(Ur, "__esModule", { value: !0 });
Ur.RegularPolygon = void 0;
const bl = ce, $0 = Ie, yl = se, P0 = le;
class Ht extends $0.Shape {
  _sceneFunc(t) {
    const e = this._getPoints();
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (let n = 1; n < e.length; n++)
      t.lineTo(e[n].x, e[n].y);
    t.closePath(), t.fillStrokeShape(this);
  }
  _getPoints() {
    const t = this.attrs.sides, e = this.attrs.radius || 0, n = [];
    for (let s = 0; s < t; s++)
      n.push({
        x: e * Math.sin(s * 2 * Math.PI / t),
        y: -1 * e * Math.cos(s * 2 * Math.PI / t)
      });
    return n;
  }
  getSelfRect() {
    const t = this._getPoints();
    let e = t[0].x, n = t[0].y, s = t[0].x, a = t[0].y;
    return t.forEach((l) => {
      e = Math.min(e, l.x), n = Math.max(n, l.x), s = Math.min(s, l.y), a = Math.max(a, l.y);
    }), {
      x: e,
      y: s,
      width: n - e,
      height: a - s
    };
  }
  getWidth() {
    return this.radius() * 2;
  }
  getHeight() {
    return this.radius() * 2;
  }
  setWidth(t) {
    this.radius(t / 2);
  }
  setHeight(t) {
    this.radius(t / 2);
  }
}
Ur.RegularPolygon = Ht;
Ht.prototype.className = "RegularPolygon";
Ht.prototype._centroid = !0;
Ht.prototype._attrsAffectingSize = ["radius"];
(0, P0._registerNode)(Ht);
bl.Factory.addGetterSetter(Ht, "radius", 0, (0, yl.getNumberValidator)());
bl.Factory.addGetterSetter(Ht, "sides", 0, (0, yl.getNumberValidator)());
var Br = {};
Object.defineProperty(Br, "__esModule", { value: !0 });
Br.Ring = void 0;
const wl = ce, T0 = Ie, Cl = se, A0 = le, to = Math.PI * 2;
class Wt extends T0.Shape {
  _sceneFunc(t) {
    t.beginPath(), t.arc(0, 0, this.innerRadius(), 0, to, !1), t.moveTo(this.outerRadius(), 0), t.arc(0, 0, this.outerRadius(), to, 0, !0), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.outerRadius() * 2;
  }
  getHeight() {
    return this.outerRadius() * 2;
  }
  setWidth(t) {
    this.outerRadius(t / 2);
  }
  setHeight(t) {
    this.outerRadius(t / 2);
  }
}
Br.Ring = Wt;
Wt.prototype.className = "Ring";
Wt.prototype._centroid = !0;
Wt.prototype._attrsAffectingSize = ["innerRadius", "outerRadius"];
(0, A0._registerNode)(Wt);
wl.Factory.addGetterSetter(Wt, "innerRadius", 0, (0, Cl.getNumberValidator)());
wl.Factory.addGetterSetter(Wt, "outerRadius", 0, (0, Cl.getNumberValidator)());
var jr = {};
Object.defineProperty(jr, "__esModule", { value: !0 });
jr.Sprite = void 0;
const zt = ce, O0 = Ie, N0 = di, Sl = se, R0 = le;
class ct extends O0.Shape {
  constructor(t) {
    super(t), this._updated = !0, this.anim = new N0.Animation(() => {
      const e = this._updated;
      return this._updated = !1, e;
    }), this.on("animationChange.konva", function() {
      this.frameIndex(0);
    }), this.on("frameIndexChange.konva", function() {
      this._updated = !0;
    }), this.on("frameRateChange.konva", function() {
      this.anim.isRunning() && (clearInterval(this.interval), this._setInterval());
    });
  }
  _sceneFunc(t) {
    const e = this.animation(), n = this.frameIndex(), s = n * 4, a = this.animations()[e], l = this.frameOffsets(), c = a[s + 0], u = a[s + 1], d = a[s + 2], p = a[s + 3], v = this.image();
    if ((this.hasFill() || this.hasStroke()) && (t.beginPath(), t.rect(0, 0, d, p), t.closePath(), t.fillStrokeShape(this)), v)
      if (l) {
        const b = l[e], y = n * 2;
        t.drawImage(v, c, u, d, p, b[y + 0], b[y + 1], d, p);
      } else
        t.drawImage(v, c, u, d, p, 0, 0, d, p);
  }
  _hitFunc(t) {
    const e = this.animation(), n = this.frameIndex(), s = n * 4, a = this.animations()[e], l = this.frameOffsets(), c = a[s + 2], u = a[s + 3];
    if (t.beginPath(), l) {
      const d = l[e], p = n * 2;
      t.rect(d[p + 0], d[p + 1], c, u);
    } else
      t.rect(0, 0, c, u);
    t.closePath(), t.fillShape(this);
  }
  _useBufferCanvas() {
    return super._useBufferCanvas(!0);
  }
  _setInterval() {
    const t = this;
    this.interval = setInterval(function() {
      t._updateIndex();
    }, 1e3 / this.frameRate());
  }
  start() {
    if (this.isRunning())
      return;
    const t = this.getLayer();
    this.anim.setLayers(t), this._setInterval(), this.anim.start();
  }
  stop() {
    this.anim.stop(), clearInterval(this.interval);
  }
  isRunning() {
    return this.anim.isRunning();
  }
  _updateIndex() {
    const t = this.frameIndex(), e = this.animation(), n = this.animations(), s = n[e], a = s.length / 4;
    t < a - 1 ? this.frameIndex(t + 1) : this.frameIndex(0);
  }
}
jr.Sprite = ct;
ct.prototype.className = "Sprite";
(0, R0._registerNode)(ct);
zt.Factory.addGetterSetter(ct, "animation");
zt.Factory.addGetterSetter(ct, "animations");
zt.Factory.addGetterSetter(ct, "frameOffsets");
zt.Factory.addGetterSetter(ct, "image");
zt.Factory.addGetterSetter(ct, "frameIndex", 0, (0, Sl.getNumberValidator)());
zt.Factory.addGetterSetter(ct, "frameRate", 17, (0, Sl.getNumberValidator)());
zt.Factory.backCompat(ct, {
  index: "frameIndex",
  getIndex: "getFrameIndex",
  setIndex: "setFrameIndex"
});
var Vr = {};
Object.defineProperty(Vr, "__esModule", { value: !0 });
Vr.Star = void 0;
const Ss = ce, L0 = Ie, Es = se, F0 = le;
class Ot extends L0.Shape {
  _sceneFunc(t) {
    const e = this.innerRadius(), n = this.outerRadius(), s = this.numPoints();
    t.beginPath(), t.moveTo(0, 0 - n);
    for (let a = 1; a < s * 2; a++) {
      const l = a % 2 === 0 ? n : e, c = l * Math.sin(a * Math.PI / s), u = -1 * l * Math.cos(a * Math.PI / s);
      t.lineTo(c, u);
    }
    t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.outerRadius() * 2;
  }
  getHeight() {
    return this.outerRadius() * 2;
  }
  setWidth(t) {
    this.outerRadius(t / 2);
  }
  setHeight(t) {
    this.outerRadius(t / 2);
  }
}
Vr.Star = Ot;
Ot.prototype.className = "Star";
Ot.prototype._centroid = !0;
Ot.prototype._attrsAffectingSize = ["innerRadius", "outerRadius"];
(0, F0._registerNode)(Ot);
Ss.Factory.addGetterSetter(Ot, "numPoints", 5, (0, Es.getNumberValidator)());
Ss.Factory.addGetterSetter(Ot, "innerRadius", 0, (0, Es.getNumberValidator)());
Ss.Factory.addGetterSetter(Ot, "outerRadius", 0, (0, Es.getNumberValidator)());
var mi = {};
Object.defineProperty(mi, "__esModule", { value: !0 });
var M0 = mi.Text = void 0;
mi.stringToArray = It;
const ls = Pe, Ve = ce, G0 = Ie, Dn = le, Nt = se, I0 = le;
function It(i) {
  return [...i].reduce((t, e, n, s) => {
    if (new RegExp("\\p{Emoji}", "u").test(e)) {
      const a = s[n + 1];
      a && new RegExp("\\p{Emoji_Modifier}|\\u200D", "u").test(a) ? (t.push(e + a), s[n + 1] = "") : t.push(e);
    } else new RegExp("\\p{Regional_Indicator}{2}", "u").test(e + (s[n + 1] || "")) ? t.push(e + s[n + 1]) : n > 0 && new RegExp("\\p{Mn}|\\p{Me}|\\p{Mc}", "u").test(e) ? t[t.length - 1] += e : e && t.push(e);
    return t;
  }, []);
}
const si = "auto", D0 = "center", El = "inherit", Ti = "justify", U0 = "Change.konva", B0 = "2d", io = "-", xl = "left", j0 = "text", V0 = "Text", H0 = "top", W0 = "bottom", ro = "middle", kl = "normal", z0 = "px ", hr = " ", Y0 = "right", no = "rtl", K0 = "word", X0 = "char", so = "none", Un = "…", $l = [
  "direction",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontVariant",
  "padding",
  "align",
  "verticalAlign",
  "lineHeight",
  "text",
  "width",
  "height",
  "wrap",
  "ellipsis",
  "letterSpacing"
], q0 = $l.length;
function Q0(i) {
  return i.split(",").map((t) => {
    t = t.trim();
    const e = t.indexOf(" ") >= 0, n = t.indexOf('"') >= 0 || t.indexOf("'") >= 0;
    return e && !n && (t = `"${t}"`), t;
  }).join(", ");
}
let cr;
function Bn() {
  return cr || (cr = ls.Util.createCanvasElement().getContext(B0), cr);
}
function J0(i) {
  i.fillText(this._partialText, this._partialTextX, this._partialTextY);
}
function Z0(i) {
  i.setAttr("miterLimit", 2), i.strokeText(this._partialText, this._partialTextX, this._partialTextY);
}
function e1(i) {
  return i = i || {}, !i.fillLinearGradientColorStops && !i.fillRadialGradientColorStops && !i.fillPatternImage && (i.fill = i.fill || "black"), i;
}
let Oe = class extends G0.Shape {
  constructor(t) {
    super(e1(t)), this._partialTextX = 0, this._partialTextY = 0;
    for (let e = 0; e < q0; e++)
      this.on($l[e] + U0, this._setTextData);
    this._setTextData();
  }
  _sceneFunc(t) {
    const e = this.textArr, n = e.length;
    if (!this.text())
      return;
    let s = this.padding(), a = this.fontSize(), l = this.lineHeight() * a, c = this.verticalAlign(), u = this.direction(), d = 0, p = this.align(), v = this.getWidth(), b = this.letterSpacing(), y = this.fill(), _ = this.textDecoration(), S = _.indexOf("underline") !== -1, E = _.indexOf("line-through") !== -1, P;
    u = u === El ? t.direction : u;
    let A = l / 2, m = ro;
    if (Dn.Konva._fixTextRendering) {
      const C = this.measureSize("M");
      m = "alphabetic", A = (C.fontBoundingBoxAscent - C.fontBoundingBoxDescent) / 2 + l / 2;
    }
    for (u === no && t.setAttr("direction", u), t.setAttr("font", this._getContextFont()), t.setAttr("textBaseline", m), t.setAttr("textAlign", xl), c === ro ? d = (this.getHeight() - n * l - s * 2) / 2 : c === W0 && (d = this.getHeight() - n * l - s * 2), t.translate(s, d + s), P = 0; P < n; P++) {
      let C = 0, $ = 0;
      const N = e[P], G = N.text, T = N.width, M = N.lastInParagraph;
      if (t.save(), p === Y0 ? C += v - T - s * 2 : p === D0 && (C += (v - T - s * 2) / 2), S) {
        t.save(), t.beginPath();
        const L = Dn.Konva._fixTextRendering ? Math.round(a / 4) : Math.round(a / 2), U = C, B = A + $ + L;
        t.moveTo(U, B);
        const W = p === Ti && !M ? v - s * 2 : T;
        t.lineTo(U + Math.round(W), B), t.lineWidth = a / 15;
        const te = this._getLinearGradient();
        t.strokeStyle = te || y, t.stroke(), t.restore();
      }
      if (E) {
        t.save(), t.beginPath();
        const L = Dn.Konva._fixTextRendering ? -Math.round(a / 4) : 0;
        t.moveTo(C, A + $ + L);
        const U = p === Ti && !M ? v - s * 2 : T;
        t.lineTo(C + Math.round(U), A + $ + L), t.lineWidth = a / 15;
        const B = this._getLinearGradient();
        t.strokeStyle = B || y, t.stroke(), t.restore();
      }
      if (u !== no && (b !== 0 || p === Ti)) {
        const L = G.split(" ").length - 1, U = It(G);
        for (let B = 0; B < U.length; B++) {
          const W = U[B];
          W === " " && !M && p === Ti && (C += (v - s * 2 - T) / L), this._partialTextX = C, this._partialTextY = A + $, this._partialText = W, t.fillStrokeShape(this), C += this.measureSize(W).width + b;
        }
      } else
        b !== 0 && t.setAttr("letterSpacing", `${b}px`), this._partialTextX = C, this._partialTextY = A + $, this._partialText = G, t.fillStrokeShape(this);
      t.restore(), n > 1 && (A += l);
    }
  }
  _hitFunc(t) {
    const e = this.getWidth(), n = this.getHeight();
    t.beginPath(), t.rect(0, 0, e, n), t.closePath(), t.fillStrokeShape(this);
  }
  setText(t) {
    const e = ls.Util._isString(t) ? t : t == null ? "" : t + "";
    return this._setAttr(j0, e), this;
  }
  getWidth() {
    return this.attrs.width === si || this.attrs.width === void 0 ? this.getTextWidth() + this.padding() * 2 : this.attrs.width;
  }
  getHeight() {
    return this.attrs.height === si || this.attrs.height === void 0 ? this.fontSize() * this.textArr.length * this.lineHeight() + this.padding() * 2 : this.attrs.height;
  }
  getTextWidth() {
    return this.textWidth;
  }
  getTextHeight() {
    return ls.Util.warn("text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height."), this.textHeight;
  }
  measureSize(t) {
    var e, n, s, a, l, c, u, d, p, v, b;
    let y = Bn(), _ = this.fontSize(), S;
    y.save(), y.font = this._getContextFont(), S = y.measureText(t), y.restore();
    const E = _ / 100;
    return {
      actualBoundingBoxAscent: (e = S.actualBoundingBoxAscent) !== null && e !== void 0 ? e : 71.58203125 * E,
      actualBoundingBoxDescent: (n = S.actualBoundingBoxDescent) !== null && n !== void 0 ? n : 0,
      actualBoundingBoxLeft: (s = S.actualBoundingBoxLeft) !== null && s !== void 0 ? s : -7.421875 * E,
      actualBoundingBoxRight: (a = S.actualBoundingBoxRight) !== null && a !== void 0 ? a : 75.732421875 * E,
      alphabeticBaseline: (l = S.alphabeticBaseline) !== null && l !== void 0 ? l : 0,
      emHeightAscent: (c = S.emHeightAscent) !== null && c !== void 0 ? c : 100 * E,
      emHeightDescent: (u = S.emHeightDescent) !== null && u !== void 0 ? u : -20 * E,
      fontBoundingBoxAscent: (d = S.fontBoundingBoxAscent) !== null && d !== void 0 ? d : 91 * E,
      fontBoundingBoxDescent: (p = S.fontBoundingBoxDescent) !== null && p !== void 0 ? p : 21 * E,
      hangingBaseline: (v = S.hangingBaseline) !== null && v !== void 0 ? v : 72.80000305175781 * E,
      ideographicBaseline: (b = S.ideographicBaseline) !== null && b !== void 0 ? b : -21 * E,
      width: S.width,
      height: _
    };
  }
  _getContextFont() {
    return this.fontStyle() + hr + this.fontVariant() + hr + (this.fontSize() + z0) + Q0(this.fontFamily());
  }
  _addTextLine(t) {
    this.align() === Ti && (t = t.trim());
    const n = this._getTextWidth(t);
    return this.textArr.push({
      text: t,
      width: n,
      lastInParagraph: !1
    });
  }
  _getTextWidth(t) {
    const e = this.letterSpacing(), n = t.length;
    return Bn().measureText(t).width + e * n;
  }
  _setTextData() {
    let t = this.text().split(`
`), e = +this.fontSize(), n = 0, s = this.lineHeight() * e, a = this.attrs.width, l = this.attrs.height, c = a !== si && a !== void 0, u = l !== si && l !== void 0, d = this.padding(), p = a - d * 2, v = l - d * 2, b = 0, y = this.wrap(), _ = y !== so, S = y !== X0 && _, E = this.ellipsis();
    this.textArr = [], Bn().font = this._getContextFont();
    const P = E ? this._getTextWidth(Un) : 0;
    for (let A = 0, m = t.length; A < m; ++A) {
      let C = t[A], $ = this._getTextWidth(C);
      if (c && $ > p)
        for (; C.length > 0; ) {
          let N = 0, G = It(C).length, T = "", M = 0;
          for (; N < G; ) {
            const L = N + G >>> 1, U = It(C), B = U.slice(0, L + 1).join(""), W = this._getTextWidth(B);
            (E && u && b + s > v ? W + P : W) <= p ? (N = L + 1, T = B, M = W) : G = L;
          }
          if (T) {
            if (S) {
              const B = It(C), W = It(T), te = B[W.length], q = te === hr || te === io;
              let he;
              if (q && M <= p)
                he = W.length;
              else {
                const oe = W.lastIndexOf(hr), I = W.lastIndexOf(io);
                he = Math.max(oe, I) + 1;
              }
              he > 0 && (N = he, T = B.slice(0, N).join(""), M = this._getTextWidth(T));
            }
            if (T = T.trimRight(), this._addTextLine(T), n = Math.max(n, M), b += s, this._shouldHandleEllipsis(b)) {
              this._tryToAddEllipsisToLastLine();
              break;
            }
            if (C = It(C).slice(N).join("").trimLeft(), C.length > 0 && ($ = this._getTextWidth(C), $ <= p)) {
              this._addTextLine(C), b += s, n = Math.max(n, $);
              break;
            }
          } else
            break;
        }
      else
        this._addTextLine(C), b += s, n = Math.max(n, $), this._shouldHandleEllipsis(b) && A < m - 1 && this._tryToAddEllipsisToLastLine();
      if (this.textArr[this.textArr.length - 1] && (this.textArr[this.textArr.length - 1].lastInParagraph = !0), u && b + s > v)
        break;
    }
    this.textHeight = e, this.textWidth = n;
  }
  _shouldHandleEllipsis(t) {
    const e = +this.fontSize(), n = this.lineHeight() * e, s = this.attrs.height, a = s !== si && s !== void 0, l = this.padding(), c = s - l * 2;
    return !(this.wrap() !== so) || a && t + n > c;
  }
  _tryToAddEllipsisToLastLine() {
    const t = this.attrs.width, e = t !== si && t !== void 0, n = this.padding(), s = t - n * 2, a = this.ellipsis(), l = this.textArr[this.textArr.length - 1];
    !l || !a || (e && (this._getTextWidth(l.text + Un) < s || (l.text = l.text.slice(0, l.text.length - 3))), this.textArr.splice(this.textArr.length - 1, 1), this._addTextLine(l.text + Un));
  }
  getStrokeScaleEnabled() {
    return !0;
  }
  _useBufferCanvas() {
    const t = this.textDecoration().indexOf("underline") !== -1 || this.textDecoration().indexOf("line-through") !== -1, e = this.hasShadow();
    return t && e ? !0 : super._useBufferCanvas();
  }
};
M0 = mi.Text = Oe;
Oe.prototype._fillFunc = J0;
Oe.prototype._strokeFunc = Z0;
Oe.prototype.className = V0;
Oe.prototype._attrsAffectingSize = [
  "text",
  "fontSize",
  "padding",
  "wrap",
  "lineHeight",
  "letterSpacing"
];
(0, I0._registerNode)(Oe);
Ve.Factory.overWriteSetter(Oe, "width", (0, Nt.getNumberOrAutoValidator)());
Ve.Factory.overWriteSetter(Oe, "height", (0, Nt.getNumberOrAutoValidator)());
Ve.Factory.addGetterSetter(Oe, "direction", El);
Ve.Factory.addGetterSetter(Oe, "fontFamily", "Arial");
Ve.Factory.addGetterSetter(Oe, "fontSize", 12, (0, Nt.getNumberValidator)());
Ve.Factory.addGetterSetter(Oe, "fontStyle", kl);
Ve.Factory.addGetterSetter(Oe, "fontVariant", kl);
Ve.Factory.addGetterSetter(Oe, "padding", 0, (0, Nt.getNumberValidator)());
Ve.Factory.addGetterSetter(Oe, "align", xl);
Ve.Factory.addGetterSetter(Oe, "verticalAlign", H0);
Ve.Factory.addGetterSetter(Oe, "lineHeight", 1, (0, Nt.getNumberValidator)());
Ve.Factory.addGetterSetter(Oe, "wrap", K0);
Ve.Factory.addGetterSetter(Oe, "ellipsis", !1, (0, Nt.getBooleanValidator)());
Ve.Factory.addGetterSetter(Oe, "letterSpacing", 0, (0, Nt.getNumberValidator)());
Ve.Factory.addGetterSetter(Oe, "text", "", (0, Nt.getStringValidator)());
Ve.Factory.addGetterSetter(Oe, "textDecoration", "");
var Hr = {};
Object.defineProperty(Hr, "__esModule", { value: !0 });
Hr.TextPath = void 0;
const jn = Pe, st = ce, t1 = Ie, Ai = gi, Vn = mi, Pl = se, i1 = le, r1 = "", Tl = "normal";
function Al(i) {
  i.fillText(this.partialText, 0, 0);
}
function Ol(i) {
  i.strokeText(this.partialText, 0, 0);
}
class De extends t1.Shape {
  constructor(t) {
    super(t), this.dummyCanvas = jn.Util.createCanvasElement(), this.dataArray = [], this._readDataAttribute(), this.on("dataChange.konva", function() {
      this._readDataAttribute(), this._setTextData();
    }), this.on("textChange.konva alignChange.konva letterSpacingChange.konva kerningFuncChange.konva fontSizeChange.konva fontFamilyChange.konva", this._setTextData), this._setTextData();
  }
  _getTextPathLength() {
    return Ai.Path.getPathLength(this.dataArray);
  }
  _getPointAtLength(t) {
    if (!this.attrs.data)
      return null;
    const e = this.pathLength;
    return t - 1 > e ? null : Ai.Path.getPointAtLengthOfDataArray(t, this.dataArray);
  }
  _readDataAttribute() {
    this.dataArray = Ai.Path.parsePathData(this.attrs.data), this.pathLength = this._getTextPathLength();
  }
  _sceneFunc(t) {
    t.setAttr("font", this._getContextFont()), t.setAttr("textBaseline", this.textBaseline()), t.setAttr("textAlign", "left"), t.save();
    const e = this.textDecoration(), n = this.fill(), s = this.fontSize(), a = this.glyphInfo;
    e === "underline" && t.beginPath();
    for (let l = 0; l < a.length; l++) {
      t.save();
      const c = a[l].p0;
      t.translate(c.x, c.y), t.rotate(a[l].rotation), this.partialText = a[l].text, t.fillStrokeShape(this), e === "underline" && (l === 0 && t.moveTo(0, s / 2 + 1), t.lineTo(s, s / 2 + 1)), t.restore();
    }
    e === "underline" && (t.strokeStyle = n, t.lineWidth = s / 20, t.stroke()), t.restore();
  }
  _hitFunc(t) {
    t.beginPath();
    const e = this.glyphInfo;
    if (e.length >= 1) {
      const n = e[0].p0;
      t.moveTo(n.x, n.y);
    }
    for (let n = 0; n < e.length; n++) {
      const s = e[n].p1;
      t.lineTo(s.x, s.y);
    }
    t.setAttr("lineWidth", this.fontSize()), t.setAttr("strokeStyle", this.colorKey), t.stroke();
  }
  getTextWidth() {
    return this.textWidth;
  }
  getTextHeight() {
    return jn.Util.warn("text.getTextHeight() method is deprecated. Use text.height() - for full height and text.fontSize() - for one line height."), this.textHeight;
  }
  setText(t) {
    return Vn.Text.prototype.setText.call(this, t);
  }
  _getContextFont() {
    return Vn.Text.prototype._getContextFont.call(this);
  }
  _getTextSize(t) {
    const n = this.dummyCanvas.getContext("2d");
    n.save(), n.font = this._getContextFont();
    const s = n.measureText(t);
    return n.restore(), {
      width: s.width,
      height: parseInt(`${this.fontSize()}`, 10)
    };
  }
  _setTextData() {
    const { width: t, height: e } = this._getTextSize(this.attrs.text);
    if (this.textWidth = t, this.textHeight = e, this.glyphInfo = [], !this.attrs.data)
      return null;
    const n = this.letterSpacing(), s = this.align(), a = this.kerningFunc(), l = Math.max(this.textWidth + ((this.attrs.text || "").length - 1) * n, 0);
    let c = 0;
    s === "center" && (c = Math.max(0, this.pathLength / 2 - l / 2)), s === "right" && (c = Math.max(0, this.pathLength - l));
    const u = (0, Vn.stringToArray)(this.text());
    let d = c;
    for (let p = 0; p < u.length; p++) {
      const v = this._getPointAtLength(d);
      if (!v)
        return;
      let b = this._getTextSize(u[p]).width + n;
      if (u[p] === " " && s === "justify") {
        const A = this.text().split(" ").length - 1;
        b += (this.pathLength - l) / A;
      }
      const y = this._getPointAtLength(d + b);
      if (!y)
        return;
      const _ = Ai.Path.getLineLength(v.x, v.y, y.x, y.y);
      let S = 0;
      if (a)
        try {
          S = a(u[p - 1], u[p]) * this.fontSize();
        } catch {
          S = 0;
        }
      v.x += S, y.x += S, this.textWidth += S;
      const E = Ai.Path.getPointOnLine(S + _ / 2, v.x, v.y, y.x, y.y), P = Math.atan2(y.y - v.y, y.x - v.x);
      this.glyphInfo.push({
        transposeX: E.x,
        transposeY: E.y,
        text: u[p],
        rotation: P,
        p0: v,
        p1: y
      }), d += b;
    }
  }
  getSelfRect() {
    if (!this.glyphInfo.length)
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    const t = [];
    this.glyphInfo.forEach(function(d) {
      t.push(d.p0.x), t.push(d.p0.y), t.push(d.p1.x), t.push(d.p1.y);
    });
    let e = t[0] || 0, n = t[0] || 0, s = t[1] || 0, a = t[1] || 0, l, c;
    for (let d = 0; d < t.length / 2; d++)
      l = t[d * 2], c = t[d * 2 + 1], e = Math.min(e, l), n = Math.max(n, l), s = Math.min(s, c), a = Math.max(a, c);
    const u = this.fontSize();
    return {
      x: e - u / 2,
      y: s - u / 2,
      width: n - e + u,
      height: a - s + u
    };
  }
  destroy() {
    return jn.Util.releaseCanvas(this.dummyCanvas), super.destroy();
  }
}
Hr.TextPath = De;
De.prototype._fillFunc = Al;
De.prototype._strokeFunc = Ol;
De.prototype._fillFuncHit = Al;
De.prototype._strokeFuncHit = Ol;
De.prototype.className = "TextPath";
De.prototype._attrsAffectingSize = ["text", "fontSize", "data"];
(0, i1._registerNode)(De);
st.Factory.addGetterSetter(De, "data");
st.Factory.addGetterSetter(De, "fontFamily", "Arial");
st.Factory.addGetterSetter(De, "fontSize", 12, (0, Pl.getNumberValidator)());
st.Factory.addGetterSetter(De, "fontStyle", Tl);
st.Factory.addGetterSetter(De, "align", "left");
st.Factory.addGetterSetter(De, "letterSpacing", 0, (0, Pl.getNumberValidator)());
st.Factory.addGetterSetter(De, "textBaseline", "middle");
st.Factory.addGetterSetter(De, "fontVariant", Tl);
st.Factory.addGetterSetter(De, "text", r1);
st.Factory.addGetterSetter(De, "textDecoration", "");
st.Factory.addGetterSetter(De, "kerningFunc", void 0);
var Wr = {};
Object.defineProperty(Wr, "__esModule", { value: !0 });
Wr.Transformer = void 0;
const ye = Pe, _e = ce, ao = ke, n1 = Ie, s1 = Vi, oo = fi, rt = le, Rt = se, a1 = le, Nl = "tr-konva", o1 = [
  "resizeEnabledChange",
  "rotateAnchorOffsetChange",
  "rotateEnabledChange",
  "enabledAnchorsChange",
  "anchorSizeChange",
  "borderEnabledChange",
  "borderStrokeChange",
  "borderStrokeWidthChange",
  "borderDashChange",
  "anchorStrokeChange",
  "anchorStrokeWidthChange",
  "anchorFillChange",
  "anchorCornerRadiusChange",
  "ignoreStrokeChange",
  "anchorStyleFuncChange"
].map((i) => i + `.${Nl}`).join(" "), lo = "nodesRect", l1 = [
  "widthChange",
  "heightChange",
  "scaleXChange",
  "scaleYChange",
  "skewXChange",
  "skewYChange",
  "rotationChange",
  "offsetXChange",
  "offsetYChange",
  "transformsEnabledChange",
  "strokeWidthChange"
], h1 = {
  "top-left": -45,
  "top-center": 0,
  "top-right": 45,
  "middle-right": -90,
  "middle-left": 90,
  "bottom-left": -135,
  "bottom-center": 180,
  "bottom-right": 135
}, c1 = "ontouchstart" in rt.Konva._global;
function u1(i, t, e) {
  if (i === "rotater")
    return e;
  t += ye.Util.degToRad(h1[i] || 0);
  const n = (ye.Util.radToDeg(t) % 360 + 360) % 360;
  return ye.Util._inRange(n, 315 + 22.5, 360) || ye.Util._inRange(n, 0, 22.5) ? "ns-resize" : ye.Util._inRange(n, 45 - 22.5, 45 + 22.5) ? "nesw-resize" : ye.Util._inRange(n, 90 - 22.5, 90 + 22.5) ? "ew-resize" : ye.Util._inRange(n, 135 - 22.5, 135 + 22.5) ? "nwse-resize" : ye.Util._inRange(n, 180 - 22.5, 180 + 22.5) ? "ns-resize" : ye.Util._inRange(n, 225 - 22.5, 225 + 22.5) ? "nesw-resize" : ye.Util._inRange(n, 270 - 22.5, 270 + 22.5) ? "ew-resize" : ye.Util._inRange(n, 315 - 22.5, 315 + 22.5) ? "nwse-resize" : (ye.Util.error("Transformer has unknown angle for cursor detection: " + n), "pointer");
}
const br = [
  "top-left",
  "top-center",
  "top-right",
  "middle-right",
  "middle-left",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];
function f1(i) {
  return {
    x: i.x + i.width / 2 * Math.cos(i.rotation) + i.height / 2 * Math.sin(-i.rotation),
    y: i.y + i.height / 2 * Math.cos(i.rotation) + i.width / 2 * Math.sin(i.rotation)
  };
}
function Rl(i, t, e) {
  const n = e.x + (i.x - e.x) * Math.cos(t) - (i.y - e.y) * Math.sin(t), s = e.y + (i.x - e.x) * Math.sin(t) + (i.y - e.y) * Math.cos(t);
  return {
    ...i,
    rotation: i.rotation + t,
    x: n,
    y: s
  };
}
function d1(i, t) {
  const e = f1(i);
  return Rl(i, t, e);
}
function g1(i, t, e) {
  let n = t;
  for (let s = 0; s < i.length; s++) {
    const a = rt.Konva.getAngle(i[s]), l = Math.abs(a - t) % (Math.PI * 2);
    Math.min(l, Math.PI * 2 - l) < e && (n = a);
  }
  return n;
}
let hs = 0;
class ge extends oo.Group {
  constructor(t) {
    super(t), this._movingAnchorName = null, this._transforming = !1, this._createElements(), this._handleMouseMove = this._handleMouseMove.bind(this), this._handleMouseUp = this._handleMouseUp.bind(this), this.update = this.update.bind(this), this.on(o1, this.update), this.getNode() && this.update();
  }
  attachTo(t) {
    return this.setNode(t), this;
  }
  setNode(t) {
    return ye.Util.warn("tr.setNode(shape), tr.node(shape) and tr.attachTo(shape) methods are deprecated. Please use tr.nodes(nodesArray) instead."), this.setNodes([t]);
  }
  getNode() {
    return this._nodes && this._nodes[0];
  }
  _getEventNamespace() {
    return Nl + this._id;
  }
  setNodes(t = []) {
    this._nodes && this._nodes.length && this.detach();
    const e = t.filter((s) => s.isAncestorOf(this) ? (ye.Util.error("Konva.Transformer cannot be an a child of the node you are trying to attach"), !1) : !0);
    return this._nodes = t = e, t.length === 1 && this.useSingleNodeRotation() ? this.rotation(t[0].getAbsoluteRotation()) : this.rotation(0), this._nodes.forEach((s) => {
      const a = () => {
        this.nodes().length === 1 && this.useSingleNodeRotation() && this.rotation(this.nodes()[0].getAbsoluteRotation()), this._resetTransformCache(), !this._transforming && !this.isDragging() && this.update();
      };
      if (s._attrsAffectingSize.length) {
        const l = s._attrsAffectingSize.map((c) => c + "Change." + this._getEventNamespace()).join(" ");
        s.on(l, a);
      }
      s.on(l1.map((l) => l + `.${this._getEventNamespace()}`).join(" "), a), s.on(`absoluteTransformChange.${this._getEventNamespace()}`, a), this._proxyDrag(s);
    }), this._resetTransformCache(), !!this.findOne(".top-left") && this.update(), this;
  }
  _proxyDrag(t) {
    let e;
    t.on(`dragstart.${this._getEventNamespace()}`, (n) => {
      e = t.getAbsolutePosition(), !this.isDragging() && t !== this.findOne(".back") && this.startDrag(n, !1);
    }), t.on(`dragmove.${this._getEventNamespace()}`, (n) => {
      if (!e)
        return;
      const s = t.getAbsolutePosition(), a = s.x - e.x, l = s.y - e.y;
      this.nodes().forEach((c) => {
        if (c === t || c.isDragging())
          return;
        const u = c.getAbsolutePosition();
        c.setAbsolutePosition({
          x: u.x + a,
          y: u.y + l
        }), c.startDrag(n);
      }), e = null;
    });
  }
  getNodes() {
    return this._nodes || [];
  }
  getActiveAnchor() {
    return this._movingAnchorName;
  }
  detach() {
    this._nodes && this._nodes.forEach((t) => {
      t.off("." + this._getEventNamespace());
    }), this._nodes = [], this._resetTransformCache();
  }
  _resetTransformCache() {
    this._clearCache(lo), this._clearCache("transform"), this._clearSelfAndDescendantCache("absoluteTransform");
  }
  _getNodeRect() {
    return this._getCache(lo, this.__getNodeRect);
  }
  __getNodeShape(t, e = this.rotation(), n) {
    const s = t.getClientRect({
      skipTransform: !0,
      skipShadow: !0,
      skipStroke: this.ignoreStroke()
    }), a = t.getAbsoluteScale(n), l = t.getAbsolutePosition(n), c = s.x * a.x - t.offsetX() * a.x, u = s.y * a.y - t.offsetY() * a.y, d = (rt.Konva.getAngle(t.getAbsoluteRotation()) + Math.PI * 2) % (Math.PI * 2), p = {
      x: l.x + c * Math.cos(d) + u * Math.sin(-d),
      y: l.y + u * Math.cos(d) + c * Math.sin(d),
      width: s.width * a.x,
      height: s.height * a.y,
      rotation: d
    };
    return Rl(p, -rt.Konva.getAngle(e), {
      x: 0,
      y: 0
    });
  }
  __getNodeRect() {
    if (!this.getNode())
      return {
        x: -1e8,
        y: -1e8,
        width: 0,
        height: 0,
        rotation: 0
      };
    const e = [];
    this.nodes().map((d) => {
      const p = d.getClientRect({
        skipTransform: !0,
        skipShadow: !0,
        skipStroke: this.ignoreStroke()
      }), v = [
        { x: p.x, y: p.y },
        { x: p.x + p.width, y: p.y },
        { x: p.x + p.width, y: p.y + p.height },
        { x: p.x, y: p.y + p.height }
      ], b = d.getAbsoluteTransform();
      v.forEach(function(y) {
        const _ = b.point(y);
        e.push(_);
      });
    });
    const n = new ye.Transform();
    n.rotate(-rt.Konva.getAngle(this.rotation()));
    let s = 1 / 0, a = 1 / 0, l = -1 / 0, c = -1 / 0;
    e.forEach(function(d) {
      const p = n.point(d);
      s === void 0 && (s = l = p.x, a = c = p.y), s = Math.min(s, p.x), a = Math.min(a, p.y), l = Math.max(l, p.x), c = Math.max(c, p.y);
    }), n.invert();
    const u = n.point({ x: s, y: a });
    return {
      x: u.x,
      y: u.y,
      width: l - s,
      height: c - a,
      rotation: rt.Konva.getAngle(this.rotation())
    };
  }
  getX() {
    return this._getNodeRect().x;
  }
  getY() {
    return this._getNodeRect().y;
  }
  getWidth() {
    return this._getNodeRect().width;
  }
  getHeight() {
    return this._getNodeRect().height;
  }
  _createElements() {
    this._createBack(), br.forEach((t) => {
      this._createAnchor(t);
    }), this._createAnchor("rotater");
  }
  _createAnchor(t) {
    const e = new s1.Rect({
      stroke: "rgb(0, 161, 255)",
      fill: "white",
      strokeWidth: 1,
      name: t + " _anchor",
      dragDistance: 0,
      draggable: !0,
      hitStrokeWidth: c1 ? 10 : "auto"
    }), n = this;
    e.on("mousedown touchstart", function(s) {
      n._handleMouseDown(s);
    }), e.on("dragstart", (s) => {
      e.stopDrag(), s.cancelBubble = !0;
    }), e.on("dragend", (s) => {
      s.cancelBubble = !0;
    }), e.on("mouseenter", () => {
      const s = rt.Konva.getAngle(this.rotation()), a = this.rotateAnchorCursor(), l = u1(t, s, a);
      e.getStage().content && (e.getStage().content.style.cursor = l), this._cursorChange = !0;
    }), e.on("mouseout", () => {
      e.getStage().content && (e.getStage().content.style.cursor = ""), this._cursorChange = !1;
    }), this.add(e);
  }
  _createBack() {
    const t = new n1.Shape({
      name: "back",
      width: 0,
      height: 0,
      draggable: !0,
      sceneFunc(e, n) {
        const s = n.getParent(), a = s.padding();
        e.beginPath(), e.rect(-a, -a, n.width() + a * 2, n.height() + a * 2), e.moveTo(n.width() / 2, -a), s.rotateEnabled() && s.rotateLineVisible() && e.lineTo(n.width() / 2, -s.rotateAnchorOffset() * ye.Util._sign(n.height()) - a), e.fillStrokeShape(n);
      },
      hitFunc: (e, n) => {
        if (!this.shouldOverdrawWholeArea())
          return;
        const s = this.padding();
        e.beginPath(), e.rect(-s, -s, n.width() + s * 2, n.height() + s * 2), e.fillStrokeShape(n);
      }
    });
    this.add(t), this._proxyDrag(t), t.on("dragstart", (e) => {
      e.cancelBubble = !0;
    }), t.on("dragmove", (e) => {
      e.cancelBubble = !0;
    }), t.on("dragend", (e) => {
      e.cancelBubble = !0;
    }), this.on("dragmove", (e) => {
      this.update();
    });
  }
  _handleMouseDown(t) {
    if (this._transforming)
      return;
    this._movingAnchorName = t.target.name().split(" ")[0];
    const e = this._getNodeRect(), n = e.width, s = e.height, a = Math.sqrt(Math.pow(n, 2) + Math.pow(s, 2));
    this.sin = Math.abs(s / a), this.cos = Math.abs(n / a), typeof window < "u" && (window.addEventListener("mousemove", this._handleMouseMove), window.addEventListener("touchmove", this._handleMouseMove), window.addEventListener("mouseup", this._handleMouseUp, !0), window.addEventListener("touchend", this._handleMouseUp, !0)), this._transforming = !0;
    const l = t.target.getAbsolutePosition(), c = t.target.getStage().getPointerPosition();
    this._anchorDragOffset = {
      x: c.x - l.x,
      y: c.y - l.y
    }, hs++, this._fire("transformstart", { evt: t.evt, target: this.getNode() }), this._nodes.forEach((u) => {
      u._fire("transformstart", { evt: t.evt, target: u });
    });
  }
  _handleMouseMove(t) {
    let e, n, s;
    const a = this.findOne("." + this._movingAnchorName), l = a.getStage();
    l.setPointersPositions(t);
    const c = l.getPointerPosition();
    let u = {
      x: c.x - this._anchorDragOffset.x,
      y: c.y - this._anchorDragOffset.y
    };
    const d = a.getAbsolutePosition();
    this.anchorDragBoundFunc() && (u = this.anchorDragBoundFunc()(d, u, t)), a.setAbsolutePosition(u);
    const p = a.getAbsolutePosition();
    if (d.x === p.x && d.y === p.y)
      return;
    if (this._movingAnchorName === "rotater") {
      const A = this._getNodeRect();
      e = a.x() - A.width / 2, n = -a.y() + A.height / 2;
      let m = Math.atan2(-n, e) + Math.PI / 2;
      A.height < 0 && (m -= Math.PI);
      const $ = rt.Konva.getAngle(this.rotation()) + m, N = rt.Konva.getAngle(this.rotationSnapTolerance()), T = g1(this.rotationSnaps(), $, N) - A.rotation, M = d1(A, T);
      this._fitNodesInto(M, t);
      return;
    }
    const v = this.shiftBehavior();
    let b;
    v === "inverted" ? b = this.keepRatio() && !t.shiftKey : v === "none" ? b = this.keepRatio() : b = this.keepRatio() || t.shiftKey;
    let y = this.centeredScaling() || t.altKey;
    if (this._movingAnchorName === "top-left") {
      if (b) {
        const A = y ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne(".bottom-right").x(),
          y: this.findOne(".bottom-right").y()
        };
        s = Math.sqrt(Math.pow(A.x - a.x(), 2) + Math.pow(A.y - a.y(), 2));
        const m = this.findOne(".top-left").x() > A.x ? -1 : 1, C = this.findOne(".top-left").y() > A.y ? -1 : 1;
        e = s * this.cos * m, n = s * this.sin * C, this.findOne(".top-left").x(A.x - e), this.findOne(".top-left").y(A.y - n);
      }
    } else if (this._movingAnchorName === "top-center")
      this.findOne(".top-left").y(a.y());
    else if (this._movingAnchorName === "top-right") {
      if (b) {
        const A = y ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne(".bottom-left").x(),
          y: this.findOne(".bottom-left").y()
        };
        s = Math.sqrt(Math.pow(a.x() - A.x, 2) + Math.pow(A.y - a.y(), 2));
        const m = this.findOne(".top-right").x() < A.x ? -1 : 1, C = this.findOne(".top-right").y() > A.y ? -1 : 1;
        e = s * this.cos * m, n = s * this.sin * C, this.findOne(".top-right").x(A.x + e), this.findOne(".top-right").y(A.y - n);
      }
      var _ = a.position();
      this.findOne(".top-left").y(_.y), this.findOne(".bottom-right").x(_.x);
    } else if (this._movingAnchorName === "middle-left")
      this.findOne(".top-left").x(a.x());
    else if (this._movingAnchorName === "middle-right")
      this.findOne(".bottom-right").x(a.x());
    else if (this._movingAnchorName === "bottom-left") {
      if (b) {
        const A = y ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne(".top-right").x(),
          y: this.findOne(".top-right").y()
        };
        s = Math.sqrt(Math.pow(A.x - a.x(), 2) + Math.pow(a.y() - A.y, 2));
        const m = A.x < a.x() ? -1 : 1, C = a.y() < A.y ? -1 : 1;
        e = s * this.cos * m, n = s * this.sin * C, a.x(A.x - e), a.y(A.y + n);
      }
      _ = a.position(), this.findOne(".top-left").x(_.x), this.findOne(".bottom-right").y(_.y);
    } else if (this._movingAnchorName === "bottom-center")
      this.findOne(".bottom-right").y(a.y());
    else if (this._movingAnchorName === "bottom-right") {
      if (b) {
        const A = y ? {
          x: this.width() / 2,
          y: this.height() / 2
        } : {
          x: this.findOne(".top-left").x(),
          y: this.findOne(".top-left").y()
        };
        s = Math.sqrt(Math.pow(a.x() - A.x, 2) + Math.pow(a.y() - A.y, 2));
        const m = this.findOne(".bottom-right").x() < A.x ? -1 : 1, C = this.findOne(".bottom-right").y() < A.y ? -1 : 1;
        e = s * this.cos * m, n = s * this.sin * C, this.findOne(".bottom-right").x(A.x + e), this.findOne(".bottom-right").y(A.y + n);
      }
    } else
      console.error(new Error("Wrong position argument of selection resizer: " + this._movingAnchorName));
    if (y = this.centeredScaling() || t.altKey, y) {
      const A = this.findOne(".top-left"), m = this.findOne(".bottom-right"), C = A.x(), $ = A.y(), N = this.getWidth() - m.x(), G = this.getHeight() - m.y();
      m.move({
        x: -C,
        y: -$
      }), A.move({
        x: N,
        y: G
      });
    }
    const S = this.findOne(".top-left").getAbsolutePosition();
    e = S.x, n = S.y;
    const E = this.findOne(".bottom-right").x() - this.findOne(".top-left").x(), P = this.findOne(".bottom-right").y() - this.findOne(".top-left").y();
    this._fitNodesInto({
      x: e,
      y: n,
      width: E,
      height: P,
      rotation: rt.Konva.getAngle(this.rotation())
    }, t);
  }
  _handleMouseUp(t) {
    this._removeEvents(t);
  }
  getAbsoluteTransform() {
    return this.getTransform();
  }
  _removeEvents(t) {
    var e;
    if (this._transforming) {
      this._transforming = !1, typeof window < "u" && (window.removeEventListener("mousemove", this._handleMouseMove), window.removeEventListener("touchmove", this._handleMouseMove), window.removeEventListener("mouseup", this._handleMouseUp, !0), window.removeEventListener("touchend", this._handleMouseUp, !0));
      const n = this.getNode();
      hs--, this._fire("transformend", { evt: t, target: n }), (e = this.getLayer()) === null || e === void 0 || e.batchDraw(), n && this._nodes.forEach((s) => {
        var a;
        s._fire("transformend", { evt: t, target: s }), (a = s.getLayer()) === null || a === void 0 || a.batchDraw();
      }), this._movingAnchorName = null;
    }
  }
  _fitNodesInto(t, e) {
    const n = this._getNodeRect(), s = 1;
    if (ye.Util._inRange(t.width, -this.padding() * 2 - s, s)) {
      this.update();
      return;
    }
    if (ye.Util._inRange(t.height, -this.padding() * 2 - s, s)) {
      this.update();
      return;
    }
    const a = new ye.Transform();
    if (a.rotate(rt.Konva.getAngle(this.rotation())), this._movingAnchorName && t.width < 0 && this._movingAnchorName.indexOf("left") >= 0) {
      const b = a.point({
        x: -this.padding() * 2,
        y: 0
      });
      t.x += b.x, t.y += b.y, t.width += this.padding() * 2, this._movingAnchorName = this._movingAnchorName.replace("left", "right"), this._anchorDragOffset.x -= b.x, this._anchorDragOffset.y -= b.y;
    } else if (this._movingAnchorName && t.width < 0 && this._movingAnchorName.indexOf("right") >= 0) {
      const b = a.point({
        x: this.padding() * 2,
        y: 0
      });
      this._movingAnchorName = this._movingAnchorName.replace("right", "left"), this._anchorDragOffset.x -= b.x, this._anchorDragOffset.y -= b.y, t.width += this.padding() * 2;
    }
    if (this._movingAnchorName && t.height < 0 && this._movingAnchorName.indexOf("top") >= 0) {
      const b = a.point({
        x: 0,
        y: -this.padding() * 2
      });
      t.x += b.x, t.y += b.y, this._movingAnchorName = this._movingAnchorName.replace("top", "bottom"), this._anchorDragOffset.x -= b.x, this._anchorDragOffset.y -= b.y, t.height += this.padding() * 2;
    } else if (this._movingAnchorName && t.height < 0 && this._movingAnchorName.indexOf("bottom") >= 0) {
      const b = a.point({
        x: 0,
        y: this.padding() * 2
      });
      this._movingAnchorName = this._movingAnchorName.replace("bottom", "top"), this._anchorDragOffset.x -= b.x, this._anchorDragOffset.y -= b.y, t.height += this.padding() * 2;
    }
    if (this.boundBoxFunc()) {
      const b = this.boundBoxFunc()(n, t);
      b ? t = b : ye.Util.warn("boundBoxFunc returned falsy. You should return new bound rect from it!");
    }
    const l = 1e7, c = new ye.Transform();
    c.translate(n.x, n.y), c.rotate(n.rotation), c.scale(n.width / l, n.height / l);
    const u = new ye.Transform(), d = t.width / l, p = t.height / l;
    this.flipEnabled() === !1 ? (u.translate(t.x, t.y), u.rotate(t.rotation), u.translate(t.width < 0 ? t.width : 0, t.height < 0 ? t.height : 0), u.scale(Math.abs(d), Math.abs(p))) : (u.translate(t.x, t.y), u.rotate(t.rotation), u.scale(d, p));
    const v = u.multiply(c.invert());
    this._nodes.forEach((b) => {
      var y;
      const _ = b.getParent().getAbsoluteTransform(), S = b.getTransform().copy();
      S.translate(b.offsetX(), b.offsetY());
      const E = new ye.Transform();
      E.multiply(_.copy().invert()).multiply(v).multiply(_).multiply(S);
      const P = E.decompose();
      b.setAttrs(P), (y = b.getLayer()) === null || y === void 0 || y.batchDraw();
    }), this.rotation(ye.Util._getRotation(t.rotation)), this._nodes.forEach((b) => {
      this._fire("transform", { evt: e, target: b }), b._fire("transform", { evt: e, target: b });
    }), this._resetTransformCache(), this.update(), this.getLayer().batchDraw();
  }
  forceUpdate() {
    this._resetTransformCache(), this.update();
  }
  _batchChangeChild(t, e) {
    this.findOne(t).setAttrs(e);
  }
  update() {
    var t;
    const e = this._getNodeRect();
    this.rotation(ye.Util._getRotation(e.rotation));
    const n = e.width, s = e.height, a = this.enabledAnchors(), l = this.resizeEnabled(), c = this.padding(), u = this.anchorSize(), d = this.find("._anchor");
    d.forEach((v) => {
      v.setAttrs({
        width: u,
        height: u,
        offsetX: u / 2,
        offsetY: u / 2,
        stroke: this.anchorStroke(),
        strokeWidth: this.anchorStrokeWidth(),
        fill: this.anchorFill(),
        cornerRadius: this.anchorCornerRadius()
      });
    }), this._batchChangeChild(".top-left", {
      x: 0,
      y: 0,
      offsetX: u / 2 + c,
      offsetY: u / 2 + c,
      visible: l && a.indexOf("top-left") >= 0
    }), this._batchChangeChild(".top-center", {
      x: n / 2,
      y: 0,
      offsetY: u / 2 + c,
      visible: l && a.indexOf("top-center") >= 0
    }), this._batchChangeChild(".top-right", {
      x: n,
      y: 0,
      offsetX: u / 2 - c,
      offsetY: u / 2 + c,
      visible: l && a.indexOf("top-right") >= 0
    }), this._batchChangeChild(".middle-left", {
      x: 0,
      y: s / 2,
      offsetX: u / 2 + c,
      visible: l && a.indexOf("middle-left") >= 0
    }), this._batchChangeChild(".middle-right", {
      x: n,
      y: s / 2,
      offsetX: u / 2 - c,
      visible: l && a.indexOf("middle-right") >= 0
    }), this._batchChangeChild(".bottom-left", {
      x: 0,
      y: s,
      offsetX: u / 2 + c,
      offsetY: u / 2 - c,
      visible: l && a.indexOf("bottom-left") >= 0
    }), this._batchChangeChild(".bottom-center", {
      x: n / 2,
      y: s,
      offsetY: u / 2 - c,
      visible: l && a.indexOf("bottom-center") >= 0
    }), this._batchChangeChild(".bottom-right", {
      x: n,
      y: s,
      offsetX: u / 2 - c,
      offsetY: u / 2 - c,
      visible: l && a.indexOf("bottom-right") >= 0
    }), this._batchChangeChild(".rotater", {
      x: n / 2,
      y: -this.rotateAnchorOffset() * ye.Util._sign(s) - c,
      visible: this.rotateEnabled()
    }), this._batchChangeChild(".back", {
      width: n,
      height: s,
      visible: this.borderEnabled(),
      stroke: this.borderStroke(),
      strokeWidth: this.borderStrokeWidth(),
      dash: this.borderDash(),
      x: 0,
      y: 0
    });
    const p = this.anchorStyleFunc();
    p && d.forEach((v) => {
      p(v);
    }), (t = this.getLayer()) === null || t === void 0 || t.batchDraw();
  }
  isTransforming() {
    return this._transforming;
  }
  stopTransform() {
    if (this._transforming) {
      this._removeEvents();
      const t = this.findOne("." + this._movingAnchorName);
      t && t.stopDrag();
    }
  }
  destroy() {
    return this.getStage() && this._cursorChange && this.getStage().content && (this.getStage().content.style.cursor = ""), oo.Group.prototype.destroy.call(this), this.detach(), this._removeEvents(), this;
  }
  toObject() {
    return ao.Node.prototype.toObject.call(this);
  }
  clone(t) {
    return ao.Node.prototype.clone.call(this, t);
  }
  getClientRect() {
    return this.nodes().length > 0 ? super.getClientRect() : { x: 0, y: 0, width: 0, height: 0 };
  }
}
Wr.Transformer = ge;
ge.isTransforming = () => hs > 0;
function p1(i) {
  return i instanceof Array || ye.Util.warn("enabledAnchors value should be an array"), i instanceof Array && i.forEach(function(t) {
    br.indexOf(t) === -1 && ye.Util.warn("Unknown anchor name: " + t + ". Available names are: " + br.join(", "));
  }), i || [];
}
ge.prototype.className = "Transformer";
(0, a1._registerNode)(ge);
_e.Factory.addGetterSetter(ge, "enabledAnchors", br, p1);
_e.Factory.addGetterSetter(ge, "flipEnabled", !0, (0, Rt.getBooleanValidator)());
_e.Factory.addGetterSetter(ge, "resizeEnabled", !0);
_e.Factory.addGetterSetter(ge, "anchorSize", 10, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "rotateEnabled", !0);
_e.Factory.addGetterSetter(ge, "rotateLineVisible", !0);
_e.Factory.addGetterSetter(ge, "rotationSnaps", []);
_e.Factory.addGetterSetter(ge, "rotateAnchorOffset", 50, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "rotateAnchorCursor", "crosshair");
_e.Factory.addGetterSetter(ge, "rotationSnapTolerance", 5, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "borderEnabled", !0);
_e.Factory.addGetterSetter(ge, "anchorStroke", "rgb(0, 161, 255)");
_e.Factory.addGetterSetter(ge, "anchorStrokeWidth", 1, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "anchorFill", "white");
_e.Factory.addGetterSetter(ge, "anchorCornerRadius", 0, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "borderStroke", "rgb(0, 161, 255)");
_e.Factory.addGetterSetter(ge, "borderStrokeWidth", 1, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "borderDash");
_e.Factory.addGetterSetter(ge, "keepRatio", !0);
_e.Factory.addGetterSetter(ge, "shiftBehavior", "default");
_e.Factory.addGetterSetter(ge, "centeredScaling", !1);
_e.Factory.addGetterSetter(ge, "ignoreStroke", !1);
_e.Factory.addGetterSetter(ge, "padding", 0, (0, Rt.getNumberValidator)());
_e.Factory.addGetterSetter(ge, "nodes");
_e.Factory.addGetterSetter(ge, "node");
_e.Factory.addGetterSetter(ge, "boundBoxFunc");
_e.Factory.addGetterSetter(ge, "anchorDragBoundFunc");
_e.Factory.addGetterSetter(ge, "anchorStyleFunc");
_e.Factory.addGetterSetter(ge, "shouldOverdrawWholeArea", !1);
_e.Factory.addGetterSetter(ge, "useSingleNodeRotation", !0);
_e.Factory.backCompat(ge, {
  lineEnabled: "borderEnabled",
  rotateHandlerOffset: "rotateAnchorOffset",
  enabledHandlers: "enabledAnchors"
});
var zr = {};
Object.defineProperty(zr, "__esModule", { value: !0 });
zr.Wedge = void 0;
const Yr = ce, m1 = Ie, _1 = le, Ll = se, v1 = le;
class wt extends m1.Shape {
  _sceneFunc(t) {
    t.beginPath(), t.arc(0, 0, this.radius(), 0, _1.Konva.getAngle(this.angle()), this.clockwise()), t.lineTo(0, 0), t.closePath(), t.fillStrokeShape(this);
  }
  getWidth() {
    return this.radius() * 2;
  }
  getHeight() {
    return this.radius() * 2;
  }
  setWidth(t) {
    this.radius(t / 2);
  }
  setHeight(t) {
    this.radius(t / 2);
  }
}
zr.Wedge = wt;
wt.prototype.className = "Wedge";
wt.prototype._centroid = !0;
wt.prototype._attrsAffectingSize = ["radius"];
(0, v1._registerNode)(wt);
Yr.Factory.addGetterSetter(wt, "radius", 0, (0, Ll.getNumberValidator)());
Yr.Factory.addGetterSetter(wt, "angle", 0, (0, Ll.getNumberValidator)());
Yr.Factory.addGetterSetter(wt, "clockwise", !1);
Yr.Factory.backCompat(wt, {
  angleDeg: "angle",
  getAngleDeg: "getAngle",
  setAngleDeg: "setAngle"
});
var Kr = {};
Object.defineProperty(Kr, "__esModule", { value: !0 });
Kr.Blur = void 0;
const ho = ce, b1 = ke, y1 = se;
function co() {
  this.r = 0, this.g = 0, this.b = 0, this.a = 0, this.next = null;
}
const w1 = [
  512,
  512,
  456,
  512,
  328,
  456,
  335,
  512,
  405,
  328,
  271,
  456,
  388,
  335,
  292,
  512,
  454,
  405,
  364,
  328,
  298,
  271,
  496,
  456,
  420,
  388,
  360,
  335,
  312,
  292,
  273,
  512,
  482,
  454,
  428,
  405,
  383,
  364,
  345,
  328,
  312,
  298,
  284,
  271,
  259,
  496,
  475,
  456,
  437,
  420,
  404,
  388,
  374,
  360,
  347,
  335,
  323,
  312,
  302,
  292,
  282,
  273,
  265,
  512,
  497,
  482,
  468,
  454,
  441,
  428,
  417,
  405,
  394,
  383,
  373,
  364,
  354,
  345,
  337,
  328,
  320,
  312,
  305,
  298,
  291,
  284,
  278,
  271,
  265,
  259,
  507,
  496,
  485,
  475,
  465,
  456,
  446,
  437,
  428,
  420,
  412,
  404,
  396,
  388,
  381,
  374,
  367,
  360,
  354,
  347,
  341,
  335,
  329,
  323,
  318,
  312,
  307,
  302,
  297,
  292,
  287,
  282,
  278,
  273,
  269,
  265,
  261,
  512,
  505,
  497,
  489,
  482,
  475,
  468,
  461,
  454,
  447,
  441,
  435,
  428,
  422,
  417,
  411,
  405,
  399,
  394,
  389,
  383,
  378,
  373,
  368,
  364,
  359,
  354,
  350,
  345,
  341,
  337,
  332,
  328,
  324,
  320,
  316,
  312,
  309,
  305,
  301,
  298,
  294,
  291,
  287,
  284,
  281,
  278,
  274,
  271,
  268,
  265,
  262,
  259,
  257,
  507,
  501,
  496,
  491,
  485,
  480,
  475,
  470,
  465,
  460,
  456,
  451,
  446,
  442,
  437,
  433,
  428,
  424,
  420,
  416,
  412,
  408,
  404,
  400,
  396,
  392,
  388,
  385,
  381,
  377,
  374,
  370,
  367,
  363,
  360,
  357,
  354,
  350,
  347,
  344,
  341,
  338,
  335,
  332,
  329,
  326,
  323,
  320,
  318,
  315,
  312,
  310,
  307,
  304,
  302,
  299,
  297,
  294,
  292,
  289,
  287,
  285,
  282,
  280,
  278,
  275,
  273,
  271,
  269,
  267,
  265,
  263,
  261,
  259
], C1 = [
  9,
  11,
  12,
  13,
  13,
  14,
  14,
  15,
  15,
  15,
  15,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  18,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  21,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  22,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  23,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24,
  24
];
function S1(i, t) {
  const e = i.data, n = i.width, s = i.height;
  let a, l, c, u, d, p, v, b, y, _, S, E, P, A, m, C, $, N, G, T;
  const M = t + t + 1, L = n - 1, U = s - 1, B = t + 1, W = B * (B + 1) / 2, te = new co(), q = w1[t], he = C1[t];
  let oe = null, I = te, K = null, Y = null;
  for (let X = 1; X < M; X++)
    I = I.next = new co(), X === B && (oe = I);
  I.next = te, c = l = 0;
  for (let X = 0; X < s; X++) {
    E = P = A = m = u = d = p = v = 0, b = B * (C = e[l]), y = B * ($ = e[l + 1]), _ = B * (N = e[l + 2]), S = B * (G = e[l + 3]), u += W * C, d += W * $, p += W * N, v += W * G, I = te;
    for (let ee = 0; ee < B; ee++)
      I.r = C, I.g = $, I.b = N, I.a = G, I = I.next;
    for (let ee = 1; ee < B; ee++)
      a = l + ((L < ee ? L : ee) << 2), u += (I.r = C = e[a]) * (T = B - ee), d += (I.g = $ = e[a + 1]) * T, p += (I.b = N = e[a + 2]) * T, v += (I.a = G = e[a + 3]) * T, E += C, P += $, A += N, m += G, I = I.next;
    K = te, Y = oe;
    for (let ee = 0; ee < n; ee++)
      e[l + 3] = G = v * q >> he, G !== 0 ? (G = 255 / G, e[l] = (u * q >> he) * G, e[l + 1] = (d * q >> he) * G, e[l + 2] = (p * q >> he) * G) : e[l] = e[l + 1] = e[l + 2] = 0, u -= b, d -= y, p -= _, v -= S, b -= K.r, y -= K.g, _ -= K.b, S -= K.a, a = c + ((a = ee + t + 1) < L ? a : L) << 2, E += K.r = e[a], P += K.g = e[a + 1], A += K.b = e[a + 2], m += K.a = e[a + 3], u += E, d += P, p += A, v += m, K = K.next, b += C = Y.r, y += $ = Y.g, _ += N = Y.b, S += G = Y.a, E -= C, P -= $, A -= N, m -= G, Y = Y.next, l += 4;
    c += n;
  }
  for (let X = 0; X < n; X++) {
    P = A = m = E = d = p = v = u = 0, l = X << 2, b = B * (C = e[l]), y = B * ($ = e[l + 1]), _ = B * (N = e[l + 2]), S = B * (G = e[l + 3]), u += W * C, d += W * $, p += W * N, v += W * G, I = te;
    for (let ue = 0; ue < B; ue++)
      I.r = C, I.g = $, I.b = N, I.a = G, I = I.next;
    let ee = n;
    for (let ue = 1; ue <= t; ue++)
      l = ee + X << 2, u += (I.r = C = e[l]) * (T = B - ue), d += (I.g = $ = e[l + 1]) * T, p += (I.b = N = e[l + 2]) * T, v += (I.a = G = e[l + 3]) * T, E += C, P += $, A += N, m += G, I = I.next, ue < U && (ee += n);
    l = X, K = te, Y = oe;
    for (let ue = 0; ue < s; ue++)
      a = l << 2, e[a + 3] = G = v * q >> he, G > 0 ? (G = 255 / G, e[a] = (u * q >> he) * G, e[a + 1] = (d * q >> he) * G, e[a + 2] = (p * q >> he) * G) : e[a] = e[a + 1] = e[a + 2] = 0, u -= b, d -= y, p -= _, v -= S, b -= K.r, y -= K.g, _ -= K.b, S -= K.a, a = X + ((a = ue + B) < U ? a : U) * n << 2, u += E += K.r = e[a], d += P += K.g = e[a + 1], p += A += K.b = e[a + 2], v += m += K.a = e[a + 3], K = K.next, b += C = Y.r, y += $ = Y.g, _ += N = Y.b, S += G = Y.a, E -= C, P -= $, A -= N, m -= G, Y = Y.next, l += n;
  }
}
const E1 = function(t) {
  const e = Math.round(this.blurRadius());
  e > 0 && S1(t, e);
};
Kr.Blur = E1;
ho.Factory.addGetterSetter(b1.Node, "blurRadius", 0, (0, y1.getNumberValidator)(), ho.Factory.afterSetFilter);
var Xr = {};
Object.defineProperty(Xr, "__esModule", { value: !0 });
Xr.Brighten = void 0;
const uo = ce, x1 = ke, k1 = se, $1 = function(i) {
  const t = this.brightness() * 255, e = i.data, n = e.length;
  for (let s = 0; s < n; s += 4)
    e[s] += t, e[s + 1] += t, e[s + 2] += t;
};
Xr.Brighten = $1;
uo.Factory.addGetterSetter(x1.Node, "brightness", 0, (0, k1.getNumberValidator)(), uo.Factory.afterSetFilter);
var qr = {};
Object.defineProperty(qr, "__esModule", { value: !0 });
qr.Contrast = void 0;
const fo = ce, P1 = ke, T1 = se, A1 = function(i) {
  const t = Math.pow((this.contrast() + 100) / 100, 2), e = i.data, n = e.length;
  let s = 150, a = 150, l = 150;
  for (let c = 0; c < n; c += 4)
    s = e[c], a = e[c + 1], l = e[c + 2], s /= 255, s -= 0.5, s *= t, s += 0.5, s *= 255, a /= 255, a -= 0.5, a *= t, a += 0.5, a *= 255, l /= 255, l -= 0.5, l *= t, l += 0.5, l *= 255, s = s < 0 ? 0 : s > 255 ? 255 : s, a = a < 0 ? 0 : a > 255 ? 255 : a, l = l < 0 ? 0 : l > 255 ? 255 : l, e[c] = s, e[c + 1] = a, e[c + 2] = l;
};
qr.Contrast = A1;
fo.Factory.addGetterSetter(P1.Node, "contrast", 0, (0, T1.getNumberValidator)(), fo.Factory.afterSetFilter);
var Qr = {};
Object.defineProperty(Qr, "__esModule", { value: !0 });
Qr.Emboss = void 0;
const $t = ce, Jr = ke, O1 = Pe, Fl = se, N1 = function(i) {
  const t = this.embossStrength() * 10, e = this.embossWhiteLevel() * 255, n = this.embossDirection(), s = this.embossBlend(), a = i.data, l = i.width, c = i.height, u = l * 4;
  let d = 0, p = 0, v = c;
  switch (n) {
    case "top-left":
      d = -1, p = -1;
      break;
    case "top":
      d = -1, p = 0;
      break;
    case "top-right":
      d = -1, p = 1;
      break;
    case "right":
      d = 0, p = 1;
      break;
    case "bottom-right":
      d = 1, p = 1;
      break;
    case "bottom":
      d = 1, p = 0;
      break;
    case "bottom-left":
      d = 1, p = -1;
      break;
    case "left":
      d = 0, p = -1;
      break;
    default:
      O1.Util.error("Unknown emboss direction: " + n);
  }
  do {
    const b = (v - 1) * u;
    let y = d;
    v + y < 1 && (y = 0), v + y > c && (y = 0);
    const _ = (v - 1 + y) * l * 4;
    let S = l;
    do {
      const E = b + (S - 1) * 4;
      let P = p;
      S + P < 1 && (P = 0), S + P > l && (P = 0);
      const A = _ + (S - 1 + P) * 4, m = a[E] - a[A], C = a[E + 1] - a[A + 1], $ = a[E + 2] - a[A + 2];
      let N = m;
      const G = N > 0 ? N : -N, T = C > 0 ? C : -C, M = $ > 0 ? $ : -$;
      if (T > G && (N = C), M > G && (N = $), N *= t, s) {
        const L = a[E] + N, U = a[E + 1] + N, B = a[E + 2] + N;
        a[E] = L > 255 ? 255 : L < 0 ? 0 : L, a[E + 1] = U > 255 ? 255 : U < 0 ? 0 : U, a[E + 2] = B > 255 ? 255 : B < 0 ? 0 : B;
      } else {
        let L = e - N;
        L < 0 ? L = 0 : L > 255 && (L = 255), a[E] = a[E + 1] = a[E + 2] = L;
      }
    } while (--S);
  } while (--v);
};
Qr.Emboss = N1;
$t.Factory.addGetterSetter(Jr.Node, "embossStrength", 0.5, (0, Fl.getNumberValidator)(), $t.Factory.afterSetFilter);
$t.Factory.addGetterSetter(Jr.Node, "embossWhiteLevel", 0.5, (0, Fl.getNumberValidator)(), $t.Factory.afterSetFilter);
$t.Factory.addGetterSetter(Jr.Node, "embossDirection", "top-left", void 0, $t.Factory.afterSetFilter);
$t.Factory.addGetterSetter(Jr.Node, "embossBlend", !1, void 0, $t.Factory.afterSetFilter);
var Zr = {};
Object.defineProperty(Zr, "__esModule", { value: !0 });
Zr.Enhance = void 0;
const go = ce, R1 = ke, L1 = se;
function Hn(i, t, e, n, s) {
  const a = e - t, l = s - n;
  if (a === 0)
    return n + l / 2;
  if (l === 0)
    return n;
  let c = (i - t) / a;
  return c = l * c + n, c;
}
const F1 = function(i) {
  const t = i.data, e = t.length;
  let n = t[0], s = n, a, l = t[1], c = l, u, d = t[2], p = d, v;
  const b = this.enhance();
  if (b === 0)
    return;
  for (let m = 0; m < e; m += 4)
    a = t[m + 0], a < n ? n = a : a > s && (s = a), u = t[m + 1], u < l ? l = u : u > c && (c = u), v = t[m + 2], v < d ? d = v : v > p && (p = v);
  s === n && (s = 255, n = 0), c === l && (c = 255, l = 0), p === d && (p = 255, d = 0);
  let y, _, S, E, P, A;
  if (b > 0)
    y = s + b * (255 - s), _ = n - b * (n - 0), S = c + b * (255 - c), E = l - b * (l - 0), P = p + b * (255 - p), A = d - b * (d - 0);
  else {
    const m = (s + n) * 0.5;
    y = s + b * (s - m), _ = n + b * (n - m);
    const C = (c + l) * 0.5;
    S = c + b * (c - C), E = l + b * (l - C);
    const $ = (p + d) * 0.5;
    P = p + b * (p - $), A = d + b * (d - $);
  }
  for (let m = 0; m < e; m += 4)
    t[m + 0] = Hn(t[m + 0], n, s, _, y), t[m + 1] = Hn(t[m + 1], l, c, E, S), t[m + 2] = Hn(t[m + 2], d, p, A, P);
};
Zr.Enhance = F1;
go.Factory.addGetterSetter(R1.Node, "enhance", 0, (0, L1.getNumberValidator)(), go.Factory.afterSetFilter);
var en = {};
Object.defineProperty(en, "__esModule", { value: !0 });
en.Grayscale = void 0;
const M1 = function(i) {
  const t = i.data, e = t.length;
  for (let n = 0; n < e; n += 4) {
    const s = 0.34 * t[n] + 0.5 * t[n + 1] + 0.16 * t[n + 2];
    t[n] = s, t[n + 1] = s, t[n + 2] = s;
  }
};
en.Grayscale = M1;
var tn = {};
Object.defineProperty(tn, "__esModule", { value: !0 });
tn.HSL = void 0;
const li = ce, xs = ke, ks = se;
li.Factory.addGetterSetter(xs.Node, "hue", 0, (0, ks.getNumberValidator)(), li.Factory.afterSetFilter);
li.Factory.addGetterSetter(xs.Node, "saturation", 0, (0, ks.getNumberValidator)(), li.Factory.afterSetFilter);
li.Factory.addGetterSetter(xs.Node, "luminance", 0, (0, ks.getNumberValidator)(), li.Factory.afterSetFilter);
const G1 = function(i) {
  const t = i.data, e = t.length, n = 1, s = Math.pow(2, this.saturation()), a = Math.abs(this.hue() + 360) % 360, l = this.luminance() * 127, c = n * s * Math.cos(a * Math.PI / 180), u = n * s * Math.sin(a * Math.PI / 180), d = 0.299 * n + 0.701 * c + 0.167 * u, p = 0.587 * n - 0.587 * c + 0.33 * u, v = 0.114 * n - 0.114 * c - 0.497 * u, b = 0.299 * n - 0.299 * c - 0.328 * u, y = 0.587 * n + 0.413 * c + 0.035 * u, _ = 0.114 * n - 0.114 * c + 0.293 * u, S = 0.299 * n - 0.3 * c + 1.25 * u, E = 0.587 * n - 0.586 * c - 1.05 * u, P = 0.114 * n + 0.886 * c - 0.2 * u;
  let A, m, C, $;
  for (let N = 0; N < e; N += 4)
    A = t[N + 0], m = t[N + 1], C = t[N + 2], $ = t[N + 3], t[N + 0] = d * A + p * m + v * C + l, t[N + 1] = b * A + y * m + _ * C + l, t[N + 2] = S * A + E * m + P * C + l, t[N + 3] = $;
};
tn.HSL = G1;
var rn = {};
Object.defineProperty(rn, "__esModule", { value: !0 });
rn.HSV = void 0;
const hi = ce, $s = ke, Ps = se, I1 = function(i) {
  const t = i.data, e = t.length, n = Math.pow(2, this.value()), s = Math.pow(2, this.saturation()), a = Math.abs(this.hue() + 360) % 360, l = n * s * Math.cos(a * Math.PI / 180), c = n * s * Math.sin(a * Math.PI / 180), u = 0.299 * n + 0.701 * l + 0.167 * c, d = 0.587 * n - 0.587 * l + 0.33 * c, p = 0.114 * n - 0.114 * l - 0.497 * c, v = 0.299 * n - 0.299 * l - 0.328 * c, b = 0.587 * n + 0.413 * l + 0.035 * c, y = 0.114 * n - 0.114 * l + 0.293 * c, _ = 0.299 * n - 0.3 * l + 1.25 * c, S = 0.587 * n - 0.586 * l - 1.05 * c, E = 0.114 * n + 0.886 * l - 0.2 * c;
  for (let P = 0; P < e; P += 4) {
    const A = t[P + 0], m = t[P + 1], C = t[P + 2], $ = t[P + 3];
    t[P + 0] = u * A + d * m + p * C, t[P + 1] = v * A + b * m + y * C, t[P + 2] = _ * A + S * m + E * C, t[P + 3] = $;
  }
};
rn.HSV = I1;
hi.Factory.addGetterSetter($s.Node, "hue", 0, (0, Ps.getNumberValidator)(), hi.Factory.afterSetFilter);
hi.Factory.addGetterSetter($s.Node, "saturation", 0, (0, Ps.getNumberValidator)(), hi.Factory.afterSetFilter);
hi.Factory.addGetterSetter($s.Node, "value", 0, (0, Ps.getNumberValidator)(), hi.Factory.afterSetFilter);
var nn = {};
Object.defineProperty(nn, "__esModule", { value: !0 });
nn.Invert = void 0;
const D1 = function(i) {
  const t = i.data, e = t.length;
  for (let n = 0; n < e; n += 4)
    t[n] = 255 - t[n], t[n + 1] = 255 - t[n + 1], t[n + 2] = 255 - t[n + 2];
};
nn.Invert = D1;
var sn = {};
Object.defineProperty(sn, "__esModule", { value: !0 });
sn.Kaleidoscope = void 0;
const yr = ce, Ml = ke, po = Pe, Gl = se, U1 = function(i, t, e) {
  const n = i.data, s = t.data, a = i.width, l = i.height, c = e.polarCenterX || a / 2, u = e.polarCenterY || l / 2;
  let d = Math.sqrt(c * c + u * u), p = a - c, v = l - u;
  const b = Math.sqrt(p * p + v * v);
  d = b > d ? b : d;
  const y = l, _ = a, S = 360 / _ * Math.PI / 180;
  for (let E = 0; E < _; E += 1) {
    const P = Math.sin(E * S), A = Math.cos(E * S);
    for (let m = 0; m < y; m += 1) {
      p = Math.floor(c + d * m / y * A), v = Math.floor(u + d * m / y * P);
      let C = (v * a + p) * 4;
      const $ = n[C + 0], N = n[C + 1], G = n[C + 2], T = n[C + 3];
      C = (E + m * a) * 4, s[C + 0] = $, s[C + 1] = N, s[C + 2] = G, s[C + 3] = T;
    }
  }
}, B1 = function(i, t, e) {
  const n = i.data, s = t.data, a = i.width, l = i.height, c = e.polarCenterX || a / 2, u = e.polarCenterY || l / 2;
  let d = Math.sqrt(c * c + u * u), p = a - c, v = l - u;
  const b = Math.sqrt(p * p + v * v);
  d = b > d ? b : d;
  const y = l, _ = a, S = 0;
  let E, P;
  for (p = 0; p < a; p += 1)
    for (v = 0; v < l; v += 1) {
      const A = p - c, m = v - u, C = Math.sqrt(A * A + m * m) * y / d;
      let $ = (Math.atan2(m, A) * 180 / Math.PI + 360 + S) % 360;
      $ = $ * _ / 360, E = Math.floor($), P = Math.floor(C);
      let N = (P * a + E) * 4;
      const G = n[N + 0], T = n[N + 1], M = n[N + 2], L = n[N + 3];
      N = (v * a + p) * 4, s[N + 0] = G, s[N + 1] = T, s[N + 2] = M, s[N + 3] = L;
    }
}, j1 = function(i) {
  const t = i.width, e = i.height;
  let n, s, a, l, c, u, d, p, v, b, y = Math.round(this.kaleidoscopePower());
  const _ = Math.round(this.kaleidoscopeAngle()), S = Math.floor(t * (_ % 360) / 360);
  if (y < 1)
    return;
  const E = po.Util.createCanvasElement();
  E.width = t, E.height = e;
  const P = E.getContext("2d").getImageData(0, 0, t, e);
  po.Util.releaseCanvas(E), U1(i, P, {
    polarCenterX: t / 2,
    polarCenterY: e / 2
  });
  let A = t / Math.pow(2, y);
  for (; A <= 8; )
    A = A * 2, y -= 1;
  A = Math.ceil(A);
  let m = A, C = 0, $ = m, N = 1;
  for (S + A > t && (C = m, $ = 0, N = -1), s = 0; s < e; s += 1)
    for (n = C; n !== $; n += N)
      a = Math.round(n + S) % t, v = (t * s + a) * 4, c = P.data[v + 0], u = P.data[v + 1], d = P.data[v + 2], p = P.data[v + 3], b = (t * s + n) * 4, P.data[b + 0] = c, P.data[b + 1] = u, P.data[b + 2] = d, P.data[b + 3] = p;
  for (s = 0; s < e; s += 1)
    for (m = Math.floor(A), l = 0; l < y; l += 1) {
      for (n = 0; n < m + 1; n += 1)
        v = (t * s + n) * 4, c = P.data[v + 0], u = P.data[v + 1], d = P.data[v + 2], p = P.data[v + 3], b = (t * s + m * 2 - n - 1) * 4, P.data[b + 0] = c, P.data[b + 1] = u, P.data[b + 2] = d, P.data[b + 3] = p;
      m *= 2;
    }
  B1(P, i, {});
};
sn.Kaleidoscope = j1;
yr.Factory.addGetterSetter(Ml.Node, "kaleidoscopePower", 2, (0, Gl.getNumberValidator)(), yr.Factory.afterSetFilter);
yr.Factory.addGetterSetter(Ml.Node, "kaleidoscopeAngle", 0, (0, Gl.getNumberValidator)(), yr.Factory.afterSetFilter);
var an = {};
Object.defineProperty(an, "__esModule", { value: !0 });
an.Mask = void 0;
const mo = ce, V1 = ke, H1 = se;
function ur(i, t, e) {
  let n = (e * i.width + t) * 4;
  const s = [];
  return s.push(i.data[n++], i.data[n++], i.data[n++], i.data[n++]), s;
}
function Oi(i, t) {
  return Math.sqrt(Math.pow(i[0] - t[0], 2) + Math.pow(i[1] - t[1], 2) + Math.pow(i[2] - t[2], 2));
}
function W1(i) {
  const t = [0, 0, 0];
  for (let e = 0; e < i.length; e++)
    t[0] += i[e][0], t[1] += i[e][1], t[2] += i[e][2];
  return t[0] /= i.length, t[1] /= i.length, t[2] /= i.length, t;
}
function z1(i, t) {
  const e = ur(i, 0, 0), n = ur(i, i.width - 1, 0), s = ur(i, 0, i.height - 1), a = ur(i, i.width - 1, i.height - 1), l = t || 10;
  if (Oi(e, n) < l && Oi(n, a) < l && Oi(a, s) < l && Oi(s, e) < l) {
    const c = W1([n, e, a, s]), u = [];
    for (let d = 0; d < i.width * i.height; d++) {
      const p = Oi(c, [
        i.data[d * 4],
        i.data[d * 4 + 1],
        i.data[d * 4 + 2]
      ]);
      u[d] = p < l ? 0 : 255;
    }
    return u;
  }
}
function Y1(i, t) {
  for (let e = 0; e < i.width * i.height; e++)
    i.data[4 * e + 3] = t[e];
}
function K1(i, t, e) {
  const n = [1, 1, 1, 1, 0, 1, 1, 1, 1], s = Math.round(Math.sqrt(n.length)), a = Math.floor(s / 2), l = [];
  for (let c = 0; c < e; c++)
    for (let u = 0; u < t; u++) {
      const d = c * t + u;
      let p = 0;
      for (let v = 0; v < s; v++)
        for (let b = 0; b < s; b++) {
          const y = c + v - a, _ = u + b - a;
          if (y >= 0 && y < e && _ >= 0 && _ < t) {
            const S = y * t + _, E = n[v * s + b];
            p += i[S] * E;
          }
        }
      l[d] = p === 255 * 8 ? 255 : 0;
    }
  return l;
}
function X1(i, t, e) {
  const n = [1, 1, 1, 1, 1, 1, 1, 1, 1], s = Math.round(Math.sqrt(n.length)), a = Math.floor(s / 2), l = [];
  for (let c = 0; c < e; c++)
    for (let u = 0; u < t; u++) {
      const d = c * t + u;
      let p = 0;
      for (let v = 0; v < s; v++)
        for (let b = 0; b < s; b++) {
          const y = c + v - a, _ = u + b - a;
          if (y >= 0 && y < e && _ >= 0 && _ < t) {
            const S = y * t + _, E = n[v * s + b];
            p += i[S] * E;
          }
        }
      l[d] = p >= 255 * 4 ? 255 : 0;
    }
  return l;
}
function q1(i, t, e) {
  const n = [0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111, 0.1111111111111111], s = Math.round(Math.sqrt(n.length)), a = Math.floor(s / 2), l = [];
  for (let c = 0; c < e; c++)
    for (let u = 0; u < t; u++) {
      const d = c * t + u;
      let p = 0;
      for (let v = 0; v < s; v++)
        for (let b = 0; b < s; b++) {
          const y = c + v - a, _ = u + b - a;
          if (y >= 0 && y < e && _ >= 0 && _ < t) {
            const S = y * t + _, E = n[v * s + b];
            p += i[S] * E;
          }
        }
      l[d] = p;
    }
  return l;
}
const Q1 = function(i) {
  const t = this.threshold();
  let e = z1(i, t);
  return e && (e = K1(e, i.width, i.height), e = X1(e, i.width, i.height), e = q1(e, i.width, i.height), Y1(i, e)), i;
};
an.Mask = Q1;
mo.Factory.addGetterSetter(V1.Node, "threshold", 0, (0, H1.getNumberValidator)(), mo.Factory.afterSetFilter);
var on = {};
Object.defineProperty(on, "__esModule", { value: !0 });
on.Noise = void 0;
const _o = ce, J1 = ke, Z1 = se, eg = function(i) {
  const t = this.noise() * 255, e = i.data, n = e.length, s = t / 2;
  for (let a = 0; a < n; a += 4)
    e[a + 0] += s - 2 * s * Math.random(), e[a + 1] += s - 2 * s * Math.random(), e[a + 2] += s - 2 * s * Math.random();
};
on.Noise = eg;
_o.Factory.addGetterSetter(J1.Node, "noise", 0.2, (0, Z1.getNumberValidator)(), _o.Factory.afterSetFilter);
var ln = {};
Object.defineProperty(ln, "__esModule", { value: !0 });
ln.Pixelate = void 0;
const vo = ce, tg = Pe, ig = ke, rg = se, ng = function(i) {
  let t = Math.ceil(this.pixelSize()), e = i.width, n = i.height, s = Math.ceil(e / t), a = Math.ceil(n / t), l = i.data;
  if (t <= 0) {
    tg.Util.error("pixelSize value can not be <= 0");
    return;
  }
  for (let c = 0; c < s; c += 1)
    for (let u = 0; u < a; u += 1) {
      let d = 0, p = 0, v = 0, b = 0;
      const y = c * t, _ = y + t, S = u * t, E = S + t;
      let P = 0;
      for (let A = y; A < _; A += 1)
        if (!(A >= e))
          for (let m = S; m < E; m += 1) {
            if (m >= n)
              continue;
            const C = (e * m + A) * 4;
            d += l[C + 0], p += l[C + 1], v += l[C + 2], b += l[C + 3], P += 1;
          }
      d = d / P, p = p / P, v = v / P, b = b / P;
      for (let A = y; A < _; A += 1)
        if (!(A >= e))
          for (let m = S; m < E; m += 1) {
            if (m >= n)
              continue;
            const C = (e * m + A) * 4;
            l[C + 0] = d, l[C + 1] = p, l[C + 2] = v, l[C + 3] = b;
          }
    }
};
ln.Pixelate = ng;
vo.Factory.addGetterSetter(ig.Node, "pixelSize", 8, (0, rg.getNumberValidator)(), vo.Factory.afterSetFilter);
var hn = {};
Object.defineProperty(hn, "__esModule", { value: !0 });
hn.Posterize = void 0;
const bo = ce, sg = ke, ag = se, og = function(i) {
  const t = Math.round(this.levels() * 254) + 1, e = i.data, n = e.length, s = 255 / t;
  for (let a = 0; a < n; a += 1)
    e[a] = Math.floor(e[a] / s) * s;
};
hn.Posterize = og;
bo.Factory.addGetterSetter(sg.Node, "levels", 0.5, (0, ag.getNumberValidator)(), bo.Factory.afterSetFilter);
var cn = {};
Object.defineProperty(cn, "__esModule", { value: !0 });
cn.RGB = void 0;
const wr = ce, Ts = ke, lg = se, hg = function(i) {
  const t = i.data, e = t.length, n = this.red(), s = this.green(), a = this.blue();
  for (let l = 0; l < e; l += 4) {
    const c = (0.34 * t[l] + 0.5 * t[l + 1] + 0.16 * t[l + 2]) / 255;
    t[l] = c * n, t[l + 1] = c * s, t[l + 2] = c * a, t[l + 3] = t[l + 3];
  }
};
cn.RGB = hg;
wr.Factory.addGetterSetter(Ts.Node, "red", 0, function(i) {
  return this._filterUpToDate = !1, i > 255 ? 255 : i < 0 ? 0 : Math.round(i);
});
wr.Factory.addGetterSetter(Ts.Node, "green", 0, function(i) {
  return this._filterUpToDate = !1, i > 255 ? 255 : i < 0 ? 0 : Math.round(i);
});
wr.Factory.addGetterSetter(Ts.Node, "blue", 0, lg.RGBComponent, wr.Factory.afterSetFilter);
var un = {};
Object.defineProperty(un, "__esModule", { value: !0 });
un.RGBA = void 0;
const Fi = ce, fn = ke, cg = se, ug = function(i) {
  const t = i.data, e = t.length, n = this.red(), s = this.green(), a = this.blue(), l = this.alpha();
  for (let c = 0; c < e; c += 4) {
    const u = 1 - l;
    t[c] = n * l + t[c] * u, t[c + 1] = s * l + t[c + 1] * u, t[c + 2] = a * l + t[c + 2] * u;
  }
};
un.RGBA = ug;
Fi.Factory.addGetterSetter(fn.Node, "red", 0, function(i) {
  return this._filterUpToDate = !1, i > 255 ? 255 : i < 0 ? 0 : Math.round(i);
});
Fi.Factory.addGetterSetter(fn.Node, "green", 0, function(i) {
  return this._filterUpToDate = !1, i > 255 ? 255 : i < 0 ? 0 : Math.round(i);
});
Fi.Factory.addGetterSetter(fn.Node, "blue", 0, cg.RGBComponent, Fi.Factory.afterSetFilter);
Fi.Factory.addGetterSetter(fn.Node, "alpha", 1, function(i) {
  return this._filterUpToDate = !1, i > 1 ? 1 : i < 0 ? 0 : i;
});
var dn = {};
Object.defineProperty(dn, "__esModule", { value: !0 });
dn.Sepia = void 0;
const fg = function(i) {
  const t = i.data, e = t.length;
  for (let n = 0; n < e; n += 4) {
    const s = t[n + 0], a = t[n + 1], l = t[n + 2];
    t[n + 0] = Math.min(255, s * 0.393 + a * 0.769 + l * 0.189), t[n + 1] = Math.min(255, s * 0.349 + a * 0.686 + l * 0.168), t[n + 2] = Math.min(255, s * 0.272 + a * 0.534 + l * 0.131);
  }
};
dn.Sepia = fg;
var gn = {};
Object.defineProperty(gn, "__esModule", { value: !0 });
gn.Solarize = void 0;
const dg = function(i) {
  const t = i.data, e = i.width, n = i.height, s = e * 4;
  let a = n;
  do {
    const l = (a - 1) * s;
    let c = e;
    do {
      const u = l + (c - 1) * 4;
      let d = t[u], p = t[u + 1], v = t[u + 2];
      d > 127 && (d = 255 - d), p > 127 && (p = 255 - p), v > 127 && (v = 255 - v), t[u] = d, t[u + 1] = p, t[u + 2] = v;
    } while (--c);
  } while (--a);
};
gn.Solarize = dg;
var pn = {};
Object.defineProperty(pn, "__esModule", { value: !0 });
pn.Threshold = void 0;
const yo = ce, gg = ke, pg = se, mg = function(i) {
  const t = this.threshold() * 255, e = i.data, n = e.length;
  for (let s = 0; s < n; s += 1)
    e[s] = e[s] < t ? 0 : 255;
};
pn.Threshold = mg;
yo.Factory.addGetterSetter(gg.Node, "threshold", 0.5, (0, pg.getNumberValidator)(), yo.Factory.afterSetFilter);
Object.defineProperty(Er, "__esModule", { value: !0 });
Er.Konva = void 0;
const wo = _r, _g = Tr, vg = Nr, bg = Fr, yg = Mr, wg = Gr, Co = oi, Cg = Ui, Sg = gi, Eg = Vi, xg = Ur, kg = Br, $g = jr, Pg = Vr, Tg = mi, Ag = Hr, Og = Wr, Ng = zr, Rg = Kr, Lg = Xr, Fg = qr, Mg = Qr, Gg = Zr, Ig = en, Dg = tn, Ug = rn, Bg = nn, jg = sn, Vg = an, Hg = on, Wg = ln, zg = hn, Yg = cn, Kg = un, Xg = dn, qg = gn, Qg = pn;
Er.Konva = wo.Konva.Util._assign(wo.Konva, {
  Arc: _g.Arc,
  Arrow: vg.Arrow,
  Circle: bg.Circle,
  Ellipse: yg.Ellipse,
  Image: wg.Image,
  Label: Co.Label,
  Tag: Co.Tag,
  Line: Cg.Line,
  Path: Sg.Path,
  Rect: Eg.Rect,
  RegularPolygon: xg.RegularPolygon,
  Ring: kg.Ring,
  Sprite: $g.Sprite,
  Star: Pg.Star,
  Text: Tg.Text,
  TextPath: Ag.TextPath,
  Transformer: Og.Transformer,
  Wedge: Ng.Wedge,
  Filters: {
    Blur: Rg.Blur,
    Brighten: Lg.Brighten,
    Contrast: Fg.Contrast,
    Emboss: Mg.Emboss,
    Enhance: Gg.Enhance,
    Grayscale: Ig.Grayscale,
    HSL: Dg.HSL,
    HSV: Ug.HSV,
    Invert: Bg.Invert,
    Kaleidoscope: jg.Kaleidoscope,
    Mask: Vg.Mask,
    Noise: Hg.Noise,
    Pixelate: Wg.Pixelate,
    Posterize: zg.Posterize,
    RGB: Yg.RGB,
    RGBA: Kg.RGBA,
    Sepia: Xg.Sepia,
    Solarize: qg.Solarize,
    Threshold: Qg.Threshold
  }
});
var Jg = nl.exports;
Object.defineProperty(Jg, "__esModule", { value: !0 });
const Zg = Er;
nl.exports = Zg.Konva;
var cs = { exports: {} };
(function(i, t) {
  Object.defineProperty(t, "__esModule", { value: !0 }), t.Konva = void 0;
  var e = _r;
  Object.defineProperty(t, "Konva", { enumerable: !0, get: function() {
    return e.Konva;
  } });
  const n = _r;
  i.exports = n.Konva;
})(cs, cs.exports);
var e2 = cs.exports;
const Mi = /* @__PURE__ */ gs(e2);
var fr = { exports: {} }, Wn = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var So;
function t2() {
  return So || (So = 1, function(i) {
    function t(I, K) {
      var Y = I.length;
      I.push(K);
      e: for (; 0 < Y; ) {
        var X = Y - 1 >>> 1, ee = I[X];
        if (0 < s(ee, K)) I[X] = K, I[Y] = ee, Y = X;
        else break e;
      }
    }
    function e(I) {
      return I.length === 0 ? null : I[0];
    }
    function n(I) {
      if (I.length === 0) return null;
      var K = I[0], Y = I.pop();
      if (Y !== K) {
        I[0] = Y;
        e: for (var X = 0, ee = I.length, ue = ee >>> 1; X < ue; ) {
          var Te = 2 * (X + 1) - 1, Ne = I[Te], Ce = Te + 1, O = I[Ce];
          if (0 > s(Ne, Y)) Ce < ee && 0 > s(O, Ne) ? (I[X] = O, I[Ce] = Y, X = Ce) : (I[X] = Ne, I[Te] = Y, X = Te);
          else if (Ce < ee && 0 > s(O, Y)) I[X] = O, I[Ce] = Y, X = Ce;
          else break e;
        }
      }
      return K;
    }
    function s(I, K) {
      var Y = I.sortIndex - K.sortIndex;
      return Y !== 0 ? Y : I.id - K.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var a = performance;
      i.unstable_now = function() {
        return a.now();
      };
    } else {
      var l = Date, c = l.now();
      i.unstable_now = function() {
        return l.now() - c;
      };
    }
    var u = [], d = [], p = 1, v = null, b = 3, y = !1, _ = !1, S = !1, E = typeof setTimeout == "function" ? setTimeout : null, P = typeof clearTimeout == "function" ? clearTimeout : null, A = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function m(I) {
      for (var K = e(d); K !== null; ) {
        if (K.callback === null) n(d);
        else if (K.startTime <= I) n(d), K.sortIndex = K.expirationTime, t(u, K);
        else break;
        K = e(d);
      }
    }
    function C(I) {
      if (S = !1, m(I), !_) if (e(u) !== null) _ = !0, he($);
      else {
        var K = e(d);
        K !== null && oe(C, K.startTime - I);
      }
    }
    function $(I, K) {
      _ = !1, S && (S = !1, P(T), T = -1), y = !0;
      var Y = b;
      try {
        for (m(K), v = e(u); v !== null && (!(v.expirationTime > K) || I && !U()); ) {
          var X = v.callback;
          if (typeof X == "function") {
            v.callback = null, b = v.priorityLevel;
            var ee = X(v.expirationTime <= K);
            K = i.unstable_now(), typeof ee == "function" ? v.callback = ee : v === e(u) && n(u), m(K);
          } else n(u);
          v = e(u);
        }
        if (v !== null) var ue = !0;
        else {
          var Te = e(d);
          Te !== null && oe(C, Te.startTime - K), ue = !1;
        }
        return ue;
      } finally {
        v = null, b = Y, y = !1;
      }
    }
    var N = !1, G = null, T = -1, M = 5, L = -1;
    function U() {
      return !(i.unstable_now() - L < M);
    }
    function B() {
      if (G !== null) {
        var I = i.unstable_now();
        L = I;
        var K = !0;
        try {
          K = G(!0, I);
        } finally {
          K ? W() : (N = !1, G = null);
        }
      } else N = !1;
    }
    var W;
    if (typeof A == "function") W = function() {
      A(B);
    };
    else if (typeof MessageChannel < "u") {
      var te = new MessageChannel(), q = te.port2;
      te.port1.onmessage = B, W = function() {
        q.postMessage(null);
      };
    } else W = function() {
      E(B, 0);
    };
    function he(I) {
      G = I, N || (N = !0, W());
    }
    function oe(I, K) {
      T = E(function() {
        I(i.unstable_now());
      }, K);
    }
    i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(I) {
      I.callback = null;
    }, i.unstable_continueExecution = function() {
      _ || y || (_ = !0, he($));
    }, i.unstable_forceFrameRate = function(I) {
      0 > I || 125 < I ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : M = 0 < I ? Math.floor(1e3 / I) : 5;
    }, i.unstable_getCurrentPriorityLevel = function() {
      return b;
    }, i.unstable_getFirstCallbackNode = function() {
      return e(u);
    }, i.unstable_next = function(I) {
      switch (b) {
        case 1:
        case 2:
        case 3:
          var K = 3;
          break;
        default:
          K = b;
      }
      var Y = b;
      b = K;
      try {
        return I();
      } finally {
        b = Y;
      }
    }, i.unstable_pauseExecution = function() {
    }, i.unstable_requestPaint = function() {
    }, i.unstable_runWithPriority = function(I, K) {
      switch (I) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          I = 3;
      }
      var Y = b;
      b = I;
      try {
        return K();
      } finally {
        b = Y;
      }
    }, i.unstable_scheduleCallback = function(I, K, Y) {
      var X = i.unstable_now();
      switch (typeof Y == "object" && Y !== null ? (Y = Y.delay, Y = typeof Y == "number" && 0 < Y ? X + Y : X) : Y = X, I) {
        case 1:
          var ee = -1;
          break;
        case 2:
          ee = 250;
          break;
        case 5:
          ee = 1073741823;
          break;
        case 4:
          ee = 1e4;
          break;
        default:
          ee = 5e3;
      }
      return ee = Y + ee, I = { id: p++, callback: K, priorityLevel: I, startTime: Y, expirationTime: ee, sortIndex: -1 }, Y > X ? (I.sortIndex = Y, t(d, I), e(u) === null && I === e(d) && (S ? (P(T), T = -1) : S = !0, oe(C, Y - X))) : (I.sortIndex = ee, t(u, I), _ || y || (_ = !0, he($))), I;
    }, i.unstable_shouldYield = U, i.unstable_wrapCallback = function(I) {
      var K = b;
      return function() {
        var Y = b;
        b = K;
        try {
          return I.apply(this, arguments);
        } finally {
          b = Y;
        }
      };
    };
  }(Wn)), Wn;
}
var zn = {};
/**
 * @license React
 * scheduler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Eo;
function i2() {
  return Eo || (Eo = 1, function(i) {
    process.env.NODE_ENV !== "production" && function() {
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
      var t = !1, e = 5;
      function n(J, ne) {
        var fe = J.length;
        J.push(ne), l(J, ne, fe);
      }
      function s(J) {
        return J.length === 0 ? null : J[0];
      }
      function a(J) {
        if (J.length === 0)
          return null;
        var ne = J[0], fe = J.pop();
        return fe !== ne && (J[0] = fe, c(J, fe, 0)), ne;
      }
      function l(J, ne, fe) {
        for (var Se = fe; Se > 0; ) {
          var Re = Se - 1 >>> 1, We = J[Re];
          if (u(We, ne) > 0)
            J[Re] = ne, J[Se] = We, Se = Re;
          else
            return;
        }
      }
      function c(J, ne, fe) {
        for (var Se = fe, Re = J.length, We = Re >>> 1; Se < We; ) {
          var Ue = (Se + 1) * 2 - 1, ft = J[Ue], je = Ue + 1, Kt = J[je];
          if (u(ft, ne) < 0)
            je < Re && u(Kt, ft) < 0 ? (J[Se] = Kt, J[je] = ne, Se = je) : (J[Se] = ft, J[Ue] = ne, Se = Ue);
          else if (je < Re && u(Kt, ne) < 0)
            J[Se] = Kt, J[je] = ne, Se = je;
          else
            return;
        }
      }
      function u(J, ne) {
        var fe = J.sortIndex - ne.sortIndex;
        return fe !== 0 ? fe : J.id - ne.id;
      }
      var d = 1, p = 2, v = 3, b = 4, y = 5;
      function _(J, ne) {
      }
      var S = typeof performance == "object" && typeof performance.now == "function";
      if (S) {
        var E = performance;
        i.unstable_now = function() {
          return E.now();
        };
      } else {
        var P = Date, A = P.now();
        i.unstable_now = function() {
          return P.now() - A;
        };
      }
      var m = 1073741823, C = -1, $ = 250, N = 5e3, G = 1e4, T = m, M = [], L = [], U = 1, B = null, W = v, te = !1, q = !1, he = !1, oe = typeof setTimeout == "function" ? setTimeout : null, I = typeof clearTimeout == "function" ? clearTimeout : null, K = typeof setImmediate < "u" ? setImmediate : null;
      typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function Y(J) {
        for (var ne = s(L); ne !== null; ) {
          if (ne.callback === null)
            a(L);
          else if (ne.startTime <= J)
            a(L), ne.sortIndex = ne.expirationTime, n(M, ne);
          else
            return;
          ne = s(L);
        }
      }
      function X(J) {
        if (he = !1, Y(J), !q)
          if (s(M) !== null)
            q = !0, bi(ee);
          else {
            var ne = s(L);
            ne !== null && yi(X, ne.startTime - J);
          }
      }
      function ee(J, ne) {
        q = !1, he && (he = !1, Wi()), te = !0;
        var fe = W;
        try {
          var Se;
          if (!t) return ue(J, ne);
        } finally {
          B = null, W = fe, te = !1;
        }
      }
      function ue(J, ne) {
        var fe = ne;
        for (Y(fe), B = s(M); B !== null && !(B.expirationTime > fe && (!J || it())); ) {
          var Se = B.callback;
          if (typeof Se == "function") {
            B.callback = null, W = B.priorityLevel;
            var Re = B.expirationTime <= fe, We = Se(Re);
            fe = i.unstable_now(), typeof We == "function" ? B.callback = We : B === s(M) && a(M), Y(fe);
          } else
            a(M);
          B = s(M);
        }
        if (B !== null)
          return !0;
        var Ue = s(L);
        return Ue !== null && yi(X, Ue.startTime - fe), !1;
      }
      function Te(J, ne) {
        switch (J) {
          case d:
          case p:
          case v:
          case b:
          case y:
            break;
          default:
            J = v;
        }
        var fe = W;
        W = J;
        try {
          return ne();
        } finally {
          W = fe;
        }
      }
      function Ne(J) {
        var ne;
        switch (W) {
          case d:
          case p:
          case v:
            ne = v;
            break;
          default:
            ne = W;
            break;
        }
        var fe = W;
        W = ne;
        try {
          return J();
        } finally {
          W = fe;
        }
      }
      function Ce(J) {
        var ne = W;
        return function() {
          var fe = W;
          W = ne;
          try {
            return J.apply(this, arguments);
          } finally {
            W = fe;
          }
        };
      }
      function O(J, ne, fe) {
        var Se = i.unstable_now(), Re;
        if (typeof fe == "object" && fe !== null) {
          var We = fe.delay;
          typeof We == "number" && We > 0 ? Re = Se + We : Re = Se;
        } else
          Re = Se;
        var Ue;
        switch (J) {
          case d:
            Ue = C;
            break;
          case p:
            Ue = $;
            break;
          case y:
            Ue = T;
            break;
          case b:
            Ue = G;
            break;
          case v:
          default:
            Ue = N;
            break;
        }
        var ft = Re + Ue, je = {
          id: U++,
          callback: ne,
          priorityLevel: J,
          startTime: Re,
          expirationTime: ft,
          sortIndex: -1
        };
        return Re > Se ? (je.sortIndex = Re, n(L, je), s(M) === null && je === s(L) && (he ? Wi() : he = !0, yi(X, Re - Se))) : (je.sortIndex = ft, n(M, je), !q && !te && (q = !0, bi(ee))), je;
      }
      function H() {
      }
      function re() {
        !q && !te && (q = !0, bi(ee));
      }
      function ve() {
        return s(M);
      }
      function pe(J) {
        J.callback = null;
      }
      function xe() {
        return W;
      }
      var Ge = !1, He = null, me = -1, qe = e, Ye = -1;
      function it() {
        var J = i.unstable_now() - Ye;
        return !(J < qe);
      }
      function yn() {
      }
      function wn(J) {
        if (J < 0 || J > 125) {
          console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported");
          return;
        }
        J > 0 ? qe = Math.floor(1e3 / J) : qe = e;
      }
      var _i = function() {
        if (He !== null) {
          var J = i.unstable_now();
          Ye = J;
          var ne = !0, fe = !0;
          try {
            fe = He(ne, J);
          } finally {
            fe ? Ft() : (Ge = !1, He = null);
          }
        } else
          Ge = !1;
      }, Ft;
      if (typeof K == "function")
        Ft = function() {
          K(_i);
        };
      else if (typeof MessageChannel < "u") {
        var Hi = new MessageChannel(), vi = Hi.port2;
        Hi.port1.onmessage = _i, Ft = function() {
          vi.postMessage(null);
        };
      } else
        Ft = function() {
          oe(_i, 0);
        };
      function bi(J) {
        He = J, Ge || (Ge = !0, Ft());
      }
      function yi(J, ne) {
        me = oe(function() {
          J(i.unstable_now());
        }, ne);
      }
      function Wi() {
        I(me), me = -1;
      }
      var ut = yn, zi = null;
      i.unstable_IdlePriority = y, i.unstable_ImmediatePriority = d, i.unstable_LowPriority = b, i.unstable_NormalPriority = v, i.unstable_Profiling = zi, i.unstable_UserBlockingPriority = p, i.unstable_cancelCallback = pe, i.unstable_continueExecution = re, i.unstable_forceFrameRate = wn, i.unstable_getCurrentPriorityLevel = xe, i.unstable_getFirstCallbackNode = ve, i.unstable_next = Ne, i.unstable_pauseExecution = H, i.unstable_requestPaint = ut, i.unstable_runWithPriority = Te, i.unstable_scheduleCallback = O, i.unstable_shouldYield = it, i.unstable_wrapCallback = Ce, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
    }();
  }(zn)), zn;
}
var xo;
function r2() {
  return xo || (xo = 1, process.env.NODE_ENV === "production" ? fr.exports = t2() : fr.exports = i2()), fr.exports;
}
const ko = {
  children: !0,
  ref: !0,
  key: !0,
  style: !0,
  forwardedRef: !0,
  unstable_applyCache: !0,
  unstable_applyDrawHitFromCache: !0
};
let $o = !1, Po = !1;
const As = ".react-konva-event", n2 = `ReactKonva: You have a Konva node with draggable = true and position defined but no onDragMove or onDragEnd events are handled.
Position of a node will be changed during drag&drop, so you should update state of the react app as well.
Consider to add onDragMove or onDragEnd events.
For more info see: https://github.com/konvajs/react-konva/issues/256
`, s2 = `ReactKonva: You are using "zIndex" attribute for a Konva node.
react-konva may get confused with ordering. Just define correct order of elements in your render function of a component.
For more info see: https://github.com/konvajs/react-konva/issues/194
`, a2 = {};
function mn(i, t, e = a2) {
  if (!$o && "zIndex" in t && (console.warn(s2), $o = !0), !Po && t.draggable) {
    var n = t.x !== void 0 || t.y !== void 0, s = t.onDragEnd || t.onDragMove;
    n && !s && (console.warn(n2), Po = !0);
  }
  for (var a in e)
    if (!ko[a]) {
      var l = a.slice(0, 2) === "on", c = e[a] !== t[a];
      if (l && c) {
        var u = a.substr(2).toLowerCase();
        u.substr(0, 7) === "content" && (u = "content" + u.substr(7, 1).toUpperCase() + u.substr(8)), i.off(u, e[a]);
      }
      var d = !t.hasOwnProperty(a);
      d && i.setAttr(a, void 0);
    }
  var p = t._useStrictMode, v = {}, b = !1;
  const y = {};
  for (var a in t)
    if (!ko[a]) {
      var l = a.slice(0, 2) === "on", _ = e[a] !== t[a];
      if (l && _) {
        var u = a.substr(2).toLowerCase();
        u.substr(0, 7) === "content" && (u = "content" + u.substr(7, 1).toUpperCase() + u.substr(8)), t[a] && (y[u] = t[a]);
      }
      !l && (t[a] !== e[a] || p && t[a] !== i.getAttr(a)) && (b = !0, v[a] = t[a]);
    }
  b && (i.setAttrs(v), Lt(i));
  for (var u in y)
    i.on(u + As, y[u]);
}
function Lt(i) {
  if (!le.Konva.autoDrawEnabled) {
    var t = i.getLayer() || i.getStage();
    t && t.batchDraw();
  }
}
var Yn = r2();
const Il = {}, o2 = {};
Mi.Node.prototype._applyProps = mn;
function l2(i, t) {
  if (typeof t == "string") {
    console.error(`Do not use plain text as child of Konva.Node. You are using text: ${t}`);
    return;
  }
  i.add(t), Lt(i);
}
function h2(i, t, e) {
  let n = Mi[i];
  n || (console.error(`Konva has no node with the type ${i}. Group will be used instead. If you use minimal version of react-konva, just import required nodes into Konva: "import "konva/lib/shapes/${i}"  If you want to render DOM elements as part of canvas tree take a look into this demo: https://konvajs.github.io/docs/react/DOM_Portal.html`), n = Mi.Group);
  const s = {}, a = {};
  for (var l in t) {
    var c = l.slice(0, 2) === "on";
    c ? a[l] = t[l] : s[l] = t[l];
  }
  const u = new n(s);
  return mn(u, a), u;
}
function c2(i, t, e) {
  console.error(`Text components are not supported for now in ReactKonva. Your text is: "${i}"`);
}
function u2(i, t, e) {
  return !1;
}
function f2(i) {
  return i;
}
function d2() {
  return null;
}
function g2() {
  return null;
}
function p2(i, t, e, n) {
  return o2;
}
function m2() {
}
function _2(i) {
}
function v2(i, t) {
  return !1;
}
function b2() {
  return Il;
}
function y2() {
  return Il;
}
const w2 = setTimeout, C2 = clearTimeout, S2 = -1;
function E2(i, t) {
  return !1;
}
const x2 = !1, k2 = !0, $2 = !0;
function P2(i, t) {
  t.parent === i ? t.moveToTop() : i.add(t), Lt(i);
}
function T2(i, t) {
  t.parent === i ? t.moveToTop() : i.add(t), Lt(i);
}
function Dl(i, t, e) {
  t._remove(), i.add(t), t.setZIndex(e.getZIndex()), Lt(i);
}
function A2(i, t, e) {
  Dl(i, t, e);
}
function O2(i, t) {
  t.destroy(), t.off(As), Lt(i);
}
function N2(i, t) {
  t.destroy(), t.off(As), Lt(i);
}
function R2(i, t, e) {
  console.error(`Text components are not yet supported in ReactKonva. You text is: "${e}"`);
}
function L2(i, t, e) {
}
function F2(i, t, e, n, s) {
  mn(i, s, n);
}
function M2(i) {
  i.hide(), Lt(i);
}
function G2(i) {
}
function I2(i, t) {
  (t.visible == null || t.visible) && i.show();
}
function D2(i, t) {
}
function U2(i) {
}
function B2() {
}
const j2 = () => rl.DefaultEventPriority, V2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  appendChild: P2,
  appendChildToContainer: T2,
  appendInitialChild: l2,
  cancelTimeout: C2,
  clearContainer: U2,
  commitMount: L2,
  commitTextUpdate: R2,
  commitUpdate: F2,
  createInstance: h2,
  createTextInstance: c2,
  detachDeletedInstance: B2,
  finalizeInitialChildren: u2,
  getChildHostContext: y2,
  getCurrentEventPriority: j2,
  getPublicInstance: f2,
  getRootHostContext: b2,
  hideInstance: M2,
  hideTextInstance: G2,
  idlePriority: Yn.unstable_IdlePriority,
  insertBefore: Dl,
  insertInContainerBefore: A2,
  isPrimaryRenderer: x2,
  noTimeout: S2,
  now: Yn.unstable_now,
  prepareForCommit: d2,
  preparePortalMount: g2,
  prepareUpdate: p2,
  removeChild: O2,
  removeChildFromContainer: N2,
  resetAfterCommit: m2,
  resetTextContent: _2,
  run: Yn.unstable_runWithPriority,
  scheduleTimeout: w2,
  shouldDeprioritizeSubtree: v2,
  shouldSetTextContent: E2,
  supportsMutation: $2,
  unhideInstance: I2,
  unhideTextInstance: D2,
  warnsIfNotActing: k2
}, Symbol.toStringTag, { value: "Module" }));
var H2 = Object.defineProperty, W2 = Object.defineProperties, z2 = Object.getOwnPropertyDescriptors, To = Object.getOwnPropertySymbols, Y2 = Object.prototype.hasOwnProperty, K2 = Object.prototype.propertyIsEnumerable, Ao = (i, t, e) => t in i ? H2(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e, Oo = (i, t) => {
  for (var e in t || (t = {}))
    Y2.call(t, e) && Ao(i, e, t[e]);
  if (To)
    for (var e of To(t))
      K2.call(t, e) && Ao(i, e, t[e]);
  return i;
}, X2 = (i, t) => W2(i, z2(t)), No, Ro;
typeof window < "u" && ((No = window.document) != null && No.createElement || ((Ro = window.navigator) == null ? void 0 : Ro.product) === "ReactNative") ? Xe.useLayoutEffect : Xe.useEffect;
function Ul(i, t, e) {
  if (!i)
    return;
  if (e(i) === !0)
    return i;
  let n = i.child;
  for (; n; ) {
    const s = Ul(n, t, e);
    if (s)
      return s;
    n = n.sibling;
  }
}
function Bl(i) {
  try {
    return Object.defineProperties(i, {
      _currentRenderer: {
        get() {
          return null;
        },
        set() {
        }
      },
      _currentRenderer2: {
        get() {
          return null;
        },
        set() {
        }
      }
    });
  } catch {
    return i;
  }
}
const Lo = console.error;
console.error = function() {
  const i = [...arguments].join("");
  if (i != null && i.startsWith("Warning:") && i.includes("useContext")) {
    console.error = Lo;
    return;
  }
  return Lo.apply(this, arguments);
};
const Os = Bl(Xe.createContext(null));
class jl extends Xe.Component {
  render() {
    return /* @__PURE__ */ Xe.createElement(Os.Provider, {
      value: this._reactInternals
    }, this.props.children);
  }
}
function q2() {
  const i = Xe.useContext(Os);
  if (i === null)
    throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = Xe.useId();
  return Xe.useMemo(() => {
    for (const n of [i, i == null ? void 0 : i.alternate]) {
      if (!n)
        continue;
      const s = Ul(n, !1, (a) => {
        let l = a.memoizedState;
        for (; l; ) {
          if (l.memoizedState === t)
            return !0;
          l = l.next;
        }
      });
      if (s)
        return s;
    }
  }, [i, t]);
}
function Q2() {
  const i = q2(), [t] = Xe.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let e = i;
  for (; e; ) {
    if (e.type && typeof e.type == "object") {
      const s = e.type._context === void 0 && e.type.Provider === e.type ? e.type : e.type._context;
      s && s !== Os && !t.has(s) && t.set(s, Xe.useContext(Bl(s)));
    }
    e = e.return;
  }
  return t;
}
function J2() {
  const i = Q2();
  return Xe.useMemo(
    () => Array.from(i.keys()).reduce(
      (t, e) => (n) => /* @__PURE__ */ Xe.createElement(t, null, /* @__PURE__ */ Xe.createElement(e.Provider, X2(Oo({}, n), {
        value: i.get(e)
      }))),
      (t) => /* @__PURE__ */ Xe.createElement(jl, Oo({}, t))
    ),
    [i]
  );
}
function Z2(i) {
  const t = ze.useRef({});
  return ze.useLayoutEffect(() => {
    t.current = i;
  }), ze.useLayoutEffect(() => () => {
    t.current = {};
  }, []), t.current;
}
const ep = (i) => {
  const t = ze.useRef(null), e = ze.useRef(null), n = ze.useRef(null), s = Z2(i), a = J2(), l = (c) => {
    const { forwardedRef: u } = i;
    u && (typeof u == "function" ? u(c) : u.current = c);
  };
  return ze.useLayoutEffect(() => (e.current = new Mi.Stage({
    width: i.width,
    height: i.height,
    container: t.current
  }), l(e.current), n.current = Ni.createContainer(e.current, rl.LegacyRoot, !1, null), Ni.updateContainer(ze.createElement(a, {}, i.children), n.current), () => {
    Mi.isBrowser && (l(null), Ni.updateContainer(null, n.current, null), e.current.destroy());
  }), []), ze.useLayoutEffect(() => {
    l(e.current), mn(e.current, i, s), Ni.updateContainer(ze.createElement(a, {}, i.children), n.current, null);
  }), ze.createElement("div", {
    ref: t,
    id: i.id,
    accessKey: i.accessKey,
    className: i.className,
    role: i.role,
    style: i.style,
    tabIndex: i.tabIndex,
    title: i.title
  });
}, $6 = "Layer", P6 = "Group", T6 = "Rect", A6 = "Line", O6 = "Text", N6 = "Path", Ni = qf(V2);
Ni.injectIntoDevTools({
  // @ts-ignore
  findHostInstanceByFiber: () => null,
  bundleType: process.env.NODE_ENV !== "production" ? 1 : 0,
  version: ze.version,
  rendererPackageName: "react-konva"
});
const R6 = ze.forwardRef((i, t) => ze.createElement(jl, {}, ze.createElement(ep, { ...i, forwardedRef: t })));
var tp = "\0", Gt = "\0", Fo = "";
let ip = class {
  constructor(t) {
    Fe(this, "_isDirected", !0);
    Fe(this, "_isMultigraph", !1);
    Fe(this, "_isCompound", !1);
    // Label for the graph itself
    Fe(this, "_label");
    // Defaults to be set when creating a new node
    Fe(this, "_defaultNodeLabelFn", () => {
    });
    // Defaults to be set when creating a new edge
    Fe(this, "_defaultEdgeLabelFn", () => {
    });
    // v -> label
    Fe(this, "_nodes", {});
    // v -> edgeObj
    Fe(this, "_in", {});
    // u -> v -> Number
    Fe(this, "_preds", {});
    // v -> edgeObj
    Fe(this, "_out", {});
    // v -> w -> Number
    Fe(this, "_sucs", {});
    // e -> edgeObj
    Fe(this, "_edgeObjs", {});
    // e -> label
    Fe(this, "_edgeLabels", {});
    /* Number of nodes in the graph. Should only be changed by the implementation. */
    Fe(this, "_nodeCount", 0);
    /* Number of edges in the graph. Should only be changed by the implementation. */
    Fe(this, "_edgeCount", 0);
    Fe(this, "_parent");
    Fe(this, "_children");
    t && (this._isDirected = Object.hasOwn(t, "directed") ? t.directed : !0, this._isMultigraph = Object.hasOwn(t, "multigraph") ? t.multigraph : !1, this._isCompound = Object.hasOwn(t, "compound") ? t.compound : !1), this._isCompound && (this._parent = {}, this._children = {}, this._children[Gt] = {});
  }
  /* === Graph functions ========= */
  /**
   * Whether graph was created with 'directed' flag set to true or not.
   */
  isDirected() {
    return this._isDirected;
  }
  /**
   * Whether graph was created with 'multigraph' flag set to true or not.
   */
  isMultigraph() {
    return this._isMultigraph;
  }
  /**
   * Whether graph was created with 'compound' flag set to true or not.
   */
  isCompound() {
    return this._isCompound;
  }
  /**
   * Sets the label of the graph.
   */
  setGraph(t) {
    return this._label = t, this;
  }
  /**
   * Gets the graph label.
   */
  graph() {
    return this._label;
  }
  /* === Node functions ========== */
  /**
   * Sets the default node label. If newDefault is a function, it will be
   * invoked ach time when setting a label for a node. Otherwise, this label
   * will be assigned as default label in case if no label was specified while
   * setting a node.
   * Complexity: O(1).
   */
  setDefaultNodeLabel(t) {
    return this._defaultNodeLabelFn = t, typeof t != "function" && (this._defaultNodeLabelFn = () => t), this;
  }
  /**
   * Gets the number of nodes in the graph.
   * Complexity: O(1).
   */
  nodeCount() {
    return this._nodeCount;
  }
  /**
   * Gets all nodes of the graph. Note, the in case of compound graph subnodes are
   * not included in list.
   * Complexity: O(1).
   */
  nodes() {
    return Object.keys(this._nodes);
  }
  /**
   * Gets list of nodes without in-edges.
   * Complexity: O(|V|).
   */
  sources() {
    var t = this;
    return this.nodes().filter((e) => Object.keys(t._in[e]).length === 0);
  }
  /**
   * Gets list of nodes without out-edges.
   * Complexity: O(|V|).
   */
  sinks() {
    var t = this;
    return this.nodes().filter((e) => Object.keys(t._out[e]).length === 0);
  }
  /**
   * Invokes setNode method for each node in names list.
   * Complexity: O(|names|).
   */
  setNodes(t, e) {
    var n = arguments, s = this;
    return t.forEach(function(a) {
      n.length > 1 ? s.setNode(a, e) : s.setNode(a);
    }), this;
  }
  /**
   * Creates or updates the value for the node v in the graph. If label is supplied
   * it is set as the value for the node. If label is not supplied and the node was
   * created by this call then the default node label will be assigned.
   * Complexity: O(1).
   */
  setNode(t, e) {
    return Object.hasOwn(this._nodes, t) ? (arguments.length > 1 && (this._nodes[t] = e), this) : (this._nodes[t] = arguments.length > 1 ? e : this._defaultNodeLabelFn(t), this._isCompound && (this._parent[t] = Gt, this._children[t] = {}, this._children[Gt][t] = !0), this._in[t] = {}, this._preds[t] = {}, this._out[t] = {}, this._sucs[t] = {}, ++this._nodeCount, this);
  }
  /**
   * Gets the label of node with specified name.
   * Complexity: O(|V|).
   */
  node(t) {
    return this._nodes[t];
  }
  /**
   * Detects whether graph has a node with specified name or not.
   */
  hasNode(t) {
    return Object.hasOwn(this._nodes, t);
  }
  /**
   * Remove the node with the name from the graph or do nothing if the node is not in
   * the graph. If the node was removed this function also removes any incident
   * edges.
   * Complexity: O(1).
   */
  removeNode(t) {
    var e = this;
    if (Object.hasOwn(this._nodes, t)) {
      var n = (s) => e.removeEdge(e._edgeObjs[s]);
      delete this._nodes[t], this._isCompound && (this._removeFromParentsChildList(t), delete this._parent[t], this.children(t).forEach(function(s) {
        e.setParent(s);
      }), delete this._children[t]), Object.keys(this._in[t]).forEach(n), delete this._in[t], delete this._preds[t], Object.keys(this._out[t]).forEach(n), delete this._out[t], delete this._sucs[t], --this._nodeCount;
    }
    return this;
  }
  /**
   * Sets node p as a parent for node v if it is defined, or removes the
   * parent for v if p is undefined. Method throws an exception in case of
   * invoking it in context of noncompound graph.
   * Average-case complexity: O(1).
   */
  setParent(t, e) {
    if (!this._isCompound)
      throw new Error("Cannot set parent in a non-compound graph");
    if (e === void 0)
      e = Gt;
    else {
      e += "";
      for (var n = e; n !== void 0; n = this.parent(n))
        if (n === t)
          throw new Error("Setting " + e + " as parent of " + t + " would create a cycle");
      this.setNode(e);
    }
    return this.setNode(t), this._removeFromParentsChildList(t), this._parent[t] = e, this._children[e][t] = !0, this;
  }
  _removeFromParentsChildList(t) {
    delete this._children[this._parent[t]][t];
  }
  /**
   * Gets parent node for node v.
   * Complexity: O(1).
   */
  parent(t) {
    if (this._isCompound) {
      var e = this._parent[t];
      if (e !== Gt)
        return e;
    }
  }
  /**
   * Gets list of direct children of node v.
   * Complexity: O(1).
   */
  children(t = Gt) {
    if (this._isCompound) {
      var e = this._children[t];
      if (e)
        return Object.keys(e);
    } else {
      if (t === Gt)
        return this.nodes();
      if (this.hasNode(t))
        return [];
    }
  }
  /**
   * Return all nodes that are predecessors of the specified node or undefined if node v is not in
   * the graph. Behavior is undefined for undirected graphs - use neighbors instead.
   * Complexity: O(|V|).
   */
  predecessors(t) {
    var e = this._preds[t];
    if (e)
      return Object.keys(e);
  }
  /**
   * Return all nodes that are successors of the specified node or undefined if node v is not in
   * the graph. Behavior is undefined for undirected graphs - use neighbors instead.
   * Complexity: O(|V|).
   */
  successors(t) {
    var e = this._sucs[t];
    if (e)
      return Object.keys(e);
  }
  /**
   * Return all nodes that are predecessors or successors of the specified node or undefined if
   * node v is not in the graph.
   * Complexity: O(|V|).
   */
  neighbors(t) {
    var e = this.predecessors(t);
    if (e) {
      const s = new Set(e);
      for (var n of this.successors(t))
        s.add(n);
      return Array.from(s.values());
    }
  }
  isLeaf(t) {
    var e;
    return this.isDirected() ? e = this.successors(t) : e = this.neighbors(t), e.length === 0;
  }
  /**
   * Creates new graph with nodes filtered via filter. Edges incident to rejected node
   * are also removed. In case of compound graph, if parent is rejected by filter,
   * than all its children are rejected too.
   * Average-case complexity: O(|E|+|V|).
   */
  filterNodes(t) {
    var e = new this.constructor({
      directed: this._isDirected,
      multigraph: this._isMultigraph,
      compound: this._isCompound
    });
    e.setGraph(this.graph());
    var n = this;
    Object.entries(this._nodes).forEach(function([l, c]) {
      t(l) && e.setNode(l, c);
    }), Object.values(this._edgeObjs).forEach(function(l) {
      e.hasNode(l.v) && e.hasNode(l.w) && e.setEdge(l, n.edge(l));
    });
    var s = {};
    function a(l) {
      var c = n.parent(l);
      return c === void 0 || e.hasNode(c) ? (s[l] = c, c) : c in s ? s[c] : a(c);
    }
    return this._isCompound && e.nodes().forEach((l) => e.setParent(l, a(l))), e;
  }
  /* === Edge functions ========== */
  /**
   * Sets the default edge label or factory function. This label will be
   * assigned as default label in case if no label was specified while setting
   * an edge or this function will be invoked each time when setting an edge
   * with no label specified and returned value * will be used as a label for edge.
   * Complexity: O(1).
   */
  setDefaultEdgeLabel(t) {
    return this._defaultEdgeLabelFn = t, typeof t != "function" && (this._defaultEdgeLabelFn = () => t), this;
  }
  /**
   * Gets the number of edges in the graph.
   * Complexity: O(1).
   */
  edgeCount() {
    return this._edgeCount;
  }
  /**
   * Gets edges of the graph. In case of compound graph subgraphs are not considered.
   * Complexity: O(|E|).
   */
  edges() {
    return Object.values(this._edgeObjs);
  }
  /**
   * Establish an edges path over the nodes in nodes list. If some edge is already
   * exists, it will update its label, otherwise it will create an edge between pair
   * of nodes with label provided or default label if no label provided.
   * Complexity: O(|nodes|).
   */
  setPath(t, e) {
    var n = this, s = arguments;
    return t.reduce(function(a, l) {
      return s.length > 1 ? n.setEdge(a, l, e) : n.setEdge(a, l), l;
    }), this;
  }
  /**
   * Creates or updates the label for the edge (v, w) with the optionally supplied
   * name. If label is supplied it is set as the value for the edge. If label is not
   * supplied and the edge was created by this call then the default edge label will
   * be assigned. The name parameter is only useful with multigraphs.
   */
  setEdge() {
    var t, e, n, s, a = !1, l = arguments[0];
    typeof l == "object" && l !== null && "v" in l ? (t = l.v, e = l.w, n = l.name, arguments.length === 2 && (s = arguments[1], a = !0)) : (t = l, e = arguments[1], n = arguments[3], arguments.length > 2 && (s = arguments[2], a = !0)), t = "" + t, e = "" + e, n !== void 0 && (n = "" + n);
    var c = Ri(this._isDirected, t, e, n);
    if (Object.hasOwn(this._edgeLabels, c))
      return a && (this._edgeLabels[c] = s), this;
    if (n !== void 0 && !this._isMultigraph)
      throw new Error("Cannot set a named edge when isMultigraph = false");
    this.setNode(t), this.setNode(e), this._edgeLabels[c] = a ? s : this._defaultEdgeLabelFn(t, e, n);
    var u = rp(this._isDirected, t, e, n);
    return t = u.v, e = u.w, Object.freeze(u), this._edgeObjs[c] = u, Mo(this._preds[e], t), Mo(this._sucs[t], e), this._in[e][c] = u, this._out[t][c] = u, this._edgeCount++, this;
  }
  /**
   * Gets the label for the specified edge.
   * Complexity: O(1).
   */
  edge(t, e, n) {
    var s = arguments.length === 1 ? Kn(this._isDirected, arguments[0]) : Ri(this._isDirected, t, e, n);
    return this._edgeLabels[s];
  }
  /**
   * Gets the label for the specified edge and converts it to an object.
   * Complexity: O(1)
   */
  edgeAsObj() {
    const t = this.edge(...arguments);
    return typeof t != "object" ? { label: t } : t;
  }
  /**
   * Detects whether the graph contains specified edge or not. No subgraphs are considered.
   * Complexity: O(1).
   */
  hasEdge(t, e, n) {
    var s = arguments.length === 1 ? Kn(this._isDirected, arguments[0]) : Ri(this._isDirected, t, e, n);
    return Object.hasOwn(this._edgeLabels, s);
  }
  /**
   * Removes the specified edge from the graph. No subgraphs are considered.
   * Complexity: O(1).
   */
  removeEdge(t, e, n) {
    var s = arguments.length === 1 ? Kn(this._isDirected, arguments[0]) : Ri(this._isDirected, t, e, n), a = this._edgeObjs[s];
    return a && (t = a.v, e = a.w, delete this._edgeLabels[s], delete this._edgeObjs[s], Go(this._preds[e], t), Go(this._sucs[t], e), delete this._in[e][s], delete this._out[t][s], this._edgeCount--), this;
  }
  /**
   * Return all edges that point to the node v. Optionally filters those edges down to just those
   * coming from node u. Behavior is undefined for undirected graphs - use nodeEdges instead.
   * Complexity: O(|E|).
   */
  inEdges(t, e) {
    var n = this._in[t];
    if (n) {
      var s = Object.values(n);
      return e ? s.filter((a) => a.v === e) : s;
    }
  }
  /**
   * Return all edges that are pointed at by node v. Optionally filters those edges down to just
   * those point to w. Behavior is undefined for undirected graphs - use nodeEdges instead.
   * Complexity: O(|E|).
   */
  outEdges(t, e) {
    var n = this._out[t];
    if (n) {
      var s = Object.values(n);
      return e ? s.filter((a) => a.w === e) : s;
    }
  }
  /**
   * Returns all edges to or from node v regardless of direction. Optionally filters those edges
   * down to just those between nodes v and w regardless of direction.
   * Complexity: O(|E|).
   */
  nodeEdges(t, e) {
    var n = this.inEdges(t, e);
    if (n)
      return n.concat(this.outEdges(t, e));
  }
};
function Mo(i, t) {
  i[t] ? i[t]++ : i[t] = 1;
}
function Go(i, t) {
  --i[t] || delete i[t];
}
function Ri(i, t, e, n) {
  var s = "" + t, a = "" + e;
  if (!i && s > a) {
    var l = s;
    s = a, a = l;
  }
  return s + Fo + a + Fo + (n === void 0 ? tp : n);
}
function rp(i, t, e, n) {
  var s = "" + t, a = "" + e;
  if (!i && s > a) {
    var l = s;
    s = a, a = l;
  }
  var c = { v: s, w: a };
  return n && (c.name = n), c;
}
function Kn(i, t) {
  return Ri(i, t.v, t.w, t.name);
}
var Ns = ip, np = "2.2.4", sp = {
  Graph: Ns,
  version: np
}, ap = Ns, op = {
  write: lp,
  read: up
};
function lp(i) {
  var t = {
    options: {
      directed: i.isDirected(),
      multigraph: i.isMultigraph(),
      compound: i.isCompound()
    },
    nodes: hp(i),
    edges: cp(i)
  };
  return i.graph() !== void 0 && (t.value = structuredClone(i.graph())), t;
}
function hp(i) {
  return i.nodes().map(function(t) {
    var e = i.node(t), n = i.parent(t), s = { v: t };
    return e !== void 0 && (s.value = e), n !== void 0 && (s.parent = n), s;
  });
}
function cp(i) {
  return i.edges().map(function(t) {
    var e = i.edge(t), n = { v: t.v, w: t.w };
    return t.name !== void 0 && (n.name = t.name), e !== void 0 && (n.value = e), n;
  });
}
function up(i) {
  var t = new ap(i.options).setGraph(i.value);
  return i.nodes.forEach(function(e) {
    t.setNode(e.v, e.value), e.parent && t.setParent(e.v, e.parent);
  }), i.edges.forEach(function(e) {
    t.setEdge({ v: e.v, w: e.w, name: e.name }, e.value);
  }), t;
}
var fp = dp;
function dp(i) {
  var t = {}, e = [], n;
  function s(a) {
    Object.hasOwn(t, a) || (t[a] = !0, n.push(a), i.successors(a).forEach(s), i.predecessors(a).forEach(s));
  }
  return i.nodes().forEach(function(a) {
    n = [], s(a), n.length && e.push(n);
  }), e;
}
let gp = class {
  constructor() {
    Fe(this, "_arr", []);
    Fe(this, "_keyIndices", {});
  }
  /**
   * Returns the number of elements in the queue. Takes `O(1)` time.
   */
  size() {
    return this._arr.length;
  }
  /**
   * Returns the keys that are in the queue. Takes `O(n)` time.
   */
  keys() {
    return this._arr.map(function(t) {
      return t.key;
    });
  }
  /**
   * Returns `true` if **key** is in the queue and `false` if not.
   */
  has(t) {
    return Object.hasOwn(this._keyIndices, t);
  }
  /**
   * Returns the priority for **key**. If **key** is not present in the queue
   * then this function returns `undefined`. Takes `O(1)` time.
   *
   * @param {Object} key
   */
  priority(t) {
    var e = this._keyIndices[t];
    if (e !== void 0)
      return this._arr[e].priority;
  }
  /**
   * Returns the key for the minimum element in this queue. If the queue is
   * empty this function throws an Error. Takes `O(1)` time.
   */
  min() {
    if (this.size() === 0)
      throw new Error("Queue underflow");
    return this._arr[0].key;
  }
  /**
   * Inserts a new key into the priority queue. If the key already exists in
   * the queue this function returns `false`; otherwise it will return `true`.
   * Takes `O(n)` time.
   *
   * @param {Object} key the key to add
   * @param {Number} priority the initial priority for the key
   */
  add(t, e) {
    var n = this._keyIndices;
    if (t = String(t), !Object.hasOwn(n, t)) {
      var s = this._arr, a = s.length;
      return n[t] = a, s.push({ key: t, priority: e }), this._decrease(a), !0;
    }
    return !1;
  }
  /**
   * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
   */
  removeMin() {
    this._swap(0, this._arr.length - 1);
    var t = this._arr.pop();
    return delete this._keyIndices[t.key], this._heapify(0), t.key;
  }
  /**
   * Decreases the priority for **key** to **priority**. If the new priority is
   * greater than the previous priority, this function will throw an Error.
   *
   * @param {Object} key the key for which to raise priority
   * @param {Number} priority the new priority for the key
   */
  decrease(t, e) {
    var n = this._keyIndices[t];
    if (e > this._arr[n].priority)
      throw new Error("New priority is greater than current priority. Key: " + t + " Old: " + this._arr[n].priority + " New: " + e);
    this._arr[n].priority = e, this._decrease(n);
  }
  _heapify(t) {
    var e = this._arr, n = 2 * t, s = n + 1, a = t;
    n < e.length && (a = e[n].priority < e[a].priority ? n : a, s < e.length && (a = e[s].priority < e[a].priority ? s : a), a !== t && (this._swap(t, a), this._heapify(a)));
  }
  _decrease(t) {
    for (var e = this._arr, n = e[t].priority, s; t !== 0 && (s = t >> 1, !(e[s].priority < n)); )
      this._swap(t, s), t = s;
  }
  _swap(t, e) {
    var n = this._arr, s = this._keyIndices, a = n[t], l = n[e];
    n[t] = l, n[e] = a, s[l.key] = t, s[a.key] = e;
  }
};
var Vl = gp, pp = Vl, Hl = _p, mp = () => 1;
function _p(i, t, e, n) {
  return vp(
    i,
    String(t),
    e || mp,
    n || function(s) {
      return i.outEdges(s);
    }
  );
}
function vp(i, t, e, n) {
  var s = {}, a = new pp(), l, c, u = function(d) {
    var p = d.v !== l ? d.v : d.w, v = s[p], b = e(d), y = c.distance + b;
    if (b < 0)
      throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + d + " Weight: " + b);
    y < v.distance && (v.distance = y, v.predecessor = l, a.decrease(p, y));
  };
  for (i.nodes().forEach(function(d) {
    var p = d === t ? 0 : Number.POSITIVE_INFINITY;
    s[d] = { distance: p }, a.add(d, p);
  }); a.size() > 0 && (l = a.removeMin(), c = s[l], c.distance !== Number.POSITIVE_INFINITY); )
    n(l).forEach(u);
  return s;
}
var bp = Hl, yp = wp;
function wp(i, t, e) {
  return i.nodes().reduce(function(n, s) {
    return n[s] = bp(i, s, t, e), n;
  }, {});
}
var Wl = Cp;
function Cp(i) {
  var t = 0, e = [], n = {}, s = [];
  function a(l) {
    var c = n[l] = {
      onStack: !0,
      lowlink: t,
      index: t++
    };
    if (e.push(l), i.successors(l).forEach(function(p) {
      Object.hasOwn(n, p) ? n[p].onStack && (c.lowlink = Math.min(c.lowlink, n[p].index)) : (a(p), c.lowlink = Math.min(c.lowlink, n[p].lowlink));
    }), c.lowlink === c.index) {
      var u = [], d;
      do
        d = e.pop(), n[d].onStack = !1, u.push(d);
      while (l !== d);
      s.push(u);
    }
  }
  return i.nodes().forEach(function(l) {
    Object.hasOwn(n, l) || a(l);
  }), s;
}
var Sp = Wl, Ep = xp;
function xp(i) {
  return Sp(i).filter(function(t) {
    return t.length > 1 || t.length === 1 && i.hasEdge(t[0], t[0]);
  });
}
var kp = Pp, $p = () => 1;
function Pp(i, t, e) {
  return Tp(
    i,
    t || $p,
    e || function(n) {
      return i.outEdges(n);
    }
  );
}
function Tp(i, t, e) {
  var n = {}, s = i.nodes();
  return s.forEach(function(a) {
    n[a] = {}, n[a][a] = { distance: 0 }, s.forEach(function(l) {
      a !== l && (n[a][l] = { distance: Number.POSITIVE_INFINITY });
    }), e(a).forEach(function(l) {
      var c = l.v === a ? l.w : l.v, u = t(l);
      n[a][c] = { distance: u, predecessor: a };
    });
  }), s.forEach(function(a) {
    var l = n[a];
    s.forEach(function(c) {
      var u = n[c];
      s.forEach(function(d) {
        var p = u[a], v = l[d], b = u[d], y = p.distance + v.distance;
        y < b.distance && (b.distance = y, b.predecessor = v.predecessor);
      });
    });
  }), n;
}
function zl(i) {
  var t = {}, e = {}, n = [];
  function s(a) {
    if (Object.hasOwn(e, a))
      throw new us();
    Object.hasOwn(t, a) || (e[a] = !0, t[a] = !0, i.predecessors(a).forEach(s), delete e[a], n.push(a));
  }
  if (i.sinks().forEach(s), Object.keys(t).length !== i.nodeCount())
    throw new us();
  return n;
}
class us extends Error {
  constructor() {
    super(...arguments);
  }
}
var Yl = zl;
zl.CycleException = us;
var Io = Yl, Ap = Op;
function Op(i) {
  try {
    Io(i);
  } catch (t) {
    if (t instanceof Io.CycleException)
      return !1;
    throw t;
  }
  return !0;
}
var Kl = Np;
function Np(i, t, e) {
  Array.isArray(t) || (t = [t]);
  var n = i.isDirected() ? (c) => i.successors(c) : (c) => i.neighbors(c), s = e === "post" ? Rp : Lp, a = [], l = {};
  return t.forEach((c) => {
    if (!i.hasNode(c))
      throw new Error("Graph does not have node: " + c);
    s(c, n, l, a);
  }), a;
}
function Rp(i, t, e, n) {
  for (var s = [[i, !1]]; s.length > 0; ) {
    var a = s.pop();
    a[1] ? n.push(a[0]) : Object.hasOwn(e, a[0]) || (e[a[0]] = !0, s.push([a[0], !0]), Xl(t(a[0]), (l) => s.push([l, !1])));
  }
}
function Lp(i, t, e, n) {
  for (var s = [i]; s.length > 0; ) {
    var a = s.pop();
    Object.hasOwn(e, a) || (e[a] = !0, n.push(a), Xl(t(a), (l) => s.push(l)));
  }
}
function Xl(i, t) {
  for (var e = i.length; e--; )
    t(i[e], e, i);
  return i;
}
var Fp = Kl, Mp = Gp;
function Gp(i, t) {
  return Fp(i, t, "post");
}
var Ip = Kl, Dp = Up;
function Up(i, t) {
  return Ip(i, t, "pre");
}
var Bp = Ns, jp = Vl, Vp = Hp;
function Hp(i, t) {
  var e = new Bp(), n = {}, s = new jp(), a;
  function l(u) {
    var d = u.v === a ? u.w : u.v, p = s.priority(d);
    if (p !== void 0) {
      var v = t(u);
      v < p && (n[d] = a, s.decrease(d, v));
    }
  }
  if (i.nodeCount() === 0)
    return e;
  i.nodes().forEach(function(u) {
    s.add(u, Number.POSITIVE_INFINITY), e.setNode(u);
  }), s.decrease(i.nodes()[0], 0);
  for (var c = !1; s.size() > 0; ) {
    if (a = s.removeMin(), Object.hasOwn(n, a))
      e.setEdge(a, n[a]);
    else {
      if (c)
        throw new Error("Input graph is not connected: " + i);
      c = !0;
    }
    i.nodeEdges(a).forEach(l);
  }
  return e;
}
var Wp = {
  components: fp,
  dijkstra: Hl,
  dijkstraAll: yp,
  findCycles: Ep,
  floydWarshall: kp,
  isAcyclic: Ap,
  postorder: Mp,
  preorder: Dp,
  prim: Vp,
  tarjan: Wl,
  topsort: Yl
}, Do = sp, at = {
  Graph: Do.Graph,
  json: op,
  alg: Wp,
  version: Do.version
};
let zp = class {
  constructor() {
    let t = {};
    t._next = t._prev = t, this._sentinel = t;
  }
  dequeue() {
    let t = this._sentinel, e = t._prev;
    if (e !== t)
      return Uo(e), e;
  }
  enqueue(t) {
    let e = this._sentinel;
    t._prev && t._next && Uo(t), t._next = e._next, e._next._prev = t, e._next = t, t._prev = e;
  }
  toString() {
    let t = [], e = this._sentinel, n = e._prev;
    for (; n !== e; )
      t.push(JSON.stringify(n, Yp)), n = n._prev;
    return "[" + t.join(", ") + "]";
  }
};
function Uo(i) {
  i._prev._next = i._next, i._next._prev = i._prev, delete i._next, delete i._prev;
}
function Yp(i, t) {
  if (i !== "_next" && i !== "_prev")
    return t;
}
var Kp = zp;
let Xp = at.Graph, qp = Kp;
var Qp = Zp;
let Jp = () => 1;
function Zp(i, t) {
  if (i.nodeCount() <= 1)
    return [];
  let e = t5(i, t || Jp);
  return e5(e.graph, e.buckets, e.zeroIdx).flatMap((s) => i.outEdges(s.v, s.w));
}
function e5(i, t, e) {
  let n = [], s = t[t.length - 1], a = t[0], l;
  for (; i.nodeCount(); ) {
    for (; l = a.dequeue(); )
      Xn(i, t, e, l);
    for (; l = s.dequeue(); )
      Xn(i, t, e, l);
    if (i.nodeCount()) {
      for (let c = t.length - 2; c > 0; --c)
        if (l = t[c].dequeue(), l) {
          n = n.concat(Xn(i, t, e, l, !0));
          break;
        }
    }
  }
  return n;
}
function Xn(i, t, e, n, s) {
  let a = s ? [] : void 0;
  return i.inEdges(n.v).forEach((l) => {
    let c = i.edge(l), u = i.node(l.v);
    s && a.push({ v: l.v, w: l.w }), u.out -= c, fs(t, e, u);
  }), i.outEdges(n.v).forEach((l) => {
    let c = i.edge(l), u = l.w, d = i.node(u);
    d.in -= c, fs(t, e, d);
  }), i.removeNode(n.v), a;
}
function t5(i, t) {
  let e = new Xp(), n = 0, s = 0;
  i.nodes().forEach((c) => {
    e.setNode(c, { v: c, in: 0, out: 0 });
  }), i.edges().forEach((c) => {
    let u = e.edge(c.v, c.w) || 0, d = t(c), p = u + d;
    e.setEdge(c.v, c.w, p), s = Math.max(s, e.node(c.v).out += d), n = Math.max(n, e.node(c.w).in += d);
  });
  let a = i5(s + n + 3).map(() => new qp()), l = n + 1;
  return e.nodes().forEach((c) => {
    fs(a, l, e.node(c));
  }), { graph: e, buckets: a, zeroIdx: l };
}
function fs(i, t, e) {
  e.out ? e.in ? i[e.out - e.in + t].enqueue(e) : i[i.length - 1].enqueue(e) : i[0].enqueue(e);
}
function i5(i) {
  const t = [];
  for (let e = 0; e < i; e++)
    t.push(e);
  return t;
}
let ql = at.Graph;
var Me = {
  addBorderNode: u5,
  addDummyNode: Ql,
  applyWithChunking: _n,
  asNonCompoundGraph: n5,
  buildLayerMatrix: l5,
  intersectRect: o5,
  mapValues: v5,
  maxRank: Zl,
  normalizeRanks: h5,
  notime: p5,
  partition: d5,
  pick: _5,
  predecessorWeights: a5,
  range: th,
  removeEmptyRanks: c5,
  simplify: r5,
  successorWeights: s5,
  time: g5,
  uniqueId: eh,
  zipObject: Rs
};
function Ql(i, t, e, n) {
  for (var s = n; i.hasNode(s); )
    s = eh(n);
  return e.dummy = t, i.setNode(s, e), s;
}
function r5(i) {
  let t = new ql().setGraph(i.graph());
  return i.nodes().forEach((e) => t.setNode(e, i.node(e))), i.edges().forEach((e) => {
    let n = t.edge(e.v, e.w) || { weight: 0, minlen: 1 }, s = i.edge(e);
    t.setEdge(e.v, e.w, {
      weight: n.weight + s.weight,
      minlen: Math.max(n.minlen, s.minlen)
    });
  }), t;
}
function n5(i) {
  let t = new ql({ multigraph: i.isMultigraph() }).setGraph(i.graph());
  return i.nodes().forEach((e) => {
    i.children(e).length || t.setNode(e, i.node(e));
  }), i.edges().forEach((e) => {
    t.setEdge(e, i.edge(e));
  }), t;
}
function s5(i) {
  let t = i.nodes().map((e) => {
    let n = {};
    return i.outEdges(e).forEach((s) => {
      n[s.w] = (n[s.w] || 0) + i.edge(s).weight;
    }), n;
  });
  return Rs(i.nodes(), t);
}
function a5(i) {
  let t = i.nodes().map((e) => {
    let n = {};
    return i.inEdges(e).forEach((s) => {
      n[s.v] = (n[s.v] || 0) + i.edge(s).weight;
    }), n;
  });
  return Rs(i.nodes(), t);
}
function o5(i, t) {
  let e = i.x, n = i.y, s = t.x - e, a = t.y - n, l = i.width / 2, c = i.height / 2;
  if (!s && !a)
    throw new Error("Not possible to find intersection inside of the rectangle");
  let u, d;
  return Math.abs(a) * l > Math.abs(s) * c ? (a < 0 && (c = -c), u = c * s / a, d = c) : (s < 0 && (l = -l), u = l, d = l * a / s), { x: e + u, y: n + d };
}
function l5(i) {
  let t = th(Zl(i) + 1).map(() => []);
  return i.nodes().forEach((e) => {
    let n = i.node(e), s = n.rank;
    s !== void 0 && (t[s][n.order] = e);
  }), t;
}
function h5(i) {
  let t = i.nodes().map((n) => {
    let s = i.node(n).rank;
    return s === void 0 ? Number.MAX_VALUE : s;
  }), e = _n(Math.min, t);
  i.nodes().forEach((n) => {
    let s = i.node(n);
    Object.hasOwn(s, "rank") && (s.rank -= e);
  });
}
function c5(i) {
  let t = i.nodes().map((l) => i.node(l).rank), e = _n(Math.min, t), n = [];
  i.nodes().forEach((l) => {
    let c = i.node(l).rank - e;
    n[c] || (n[c] = []), n[c].push(l);
  });
  let s = 0, a = i.graph().nodeRankFactor;
  Array.from(n).forEach((l, c) => {
    l === void 0 && c % a !== 0 ? --s : l !== void 0 && s && l.forEach((u) => i.node(u).rank += s);
  });
}
function u5(i, t, e, n) {
  let s = {
    width: 0,
    height: 0
  };
  return arguments.length >= 4 && (s.rank = e, s.order = n), Ql(i, "border", s, t);
}
function f5(i, t = Jl) {
  const e = [];
  for (let n = 0; n < i.length; n += t) {
    const s = i.slice(n, n + t);
    e.push(s);
  }
  return e;
}
const Jl = 65535;
function _n(i, t) {
  if (t.length > Jl) {
    const e = f5(t);
    return i.apply(null, e.map((n) => i.apply(null, n)));
  } else
    return i.apply(null, t);
}
function Zl(i) {
  const e = i.nodes().map((n) => {
    let s = i.node(n).rank;
    return s === void 0 ? Number.MIN_VALUE : s;
  });
  return _n(Math.max, e);
}
function d5(i, t) {
  let e = { lhs: [], rhs: [] };
  return i.forEach((n) => {
    t(n) ? e.lhs.push(n) : e.rhs.push(n);
  }), e;
}
function g5(i, t) {
  let e = Date.now();
  try {
    return t();
  } finally {
    console.log(i + " time: " + (Date.now() - e) + "ms");
  }
}
function p5(i, t) {
  return t();
}
let m5 = 0;
function eh(i) {
  var t = ++m5;
  return i + ("" + t);
}
function th(i, t, e = 1) {
  t == null && (t = i, i = 0);
  let n = (a) => a < t;
  e < 0 && (n = (a) => t < a);
  const s = [];
  for (let a = i; n(a); a += e)
    s.push(a);
  return s;
}
function _5(i, t) {
  const e = {};
  for (const n of t)
    i[n] !== void 0 && (e[n] = i[n]);
  return e;
}
function v5(i, t) {
  let e = t;
  return typeof t == "string" && (e = (n) => n[t]), Object.entries(i).reduce((n, [s, a]) => (n[s] = e(a, s), n), {});
}
function Rs(i, t) {
  return i.reduce((e, n, s) => (e[n] = t[s], e), {});
}
let b5 = Qp, y5 = Me.uniqueId;
var w5 = {
  run: C5,
  undo: E5
};
function C5(i) {
  (i.graph().acyclicer === "greedy" ? b5(i, e(i)) : S5(i)).forEach((n) => {
    let s = i.edge(n);
    i.removeEdge(n), s.forwardName = n.name, s.reversed = !0, i.setEdge(n.w, n.v, s, y5("rev"));
  });
  function e(n) {
    return (s) => n.edge(s).weight;
  }
}
function S5(i) {
  let t = [], e = {}, n = {};
  function s(a) {
    Object.hasOwn(n, a) || (n[a] = !0, e[a] = !0, i.outEdges(a).forEach((l) => {
      Object.hasOwn(e, l.w) ? t.push(l) : s(l.w);
    }), delete e[a]);
  }
  return i.nodes().forEach(s), t;
}
function E5(i) {
  i.edges().forEach((t) => {
    let e = i.edge(t);
    if (e.reversed) {
      i.removeEdge(t);
      let n = e.forwardName;
      delete e.reversed, delete e.forwardName, i.setEdge(t.w, t.v, e, n);
    }
  });
}
let x5 = Me;
var k5 = {
  run: $5,
  undo: T5
};
function $5(i) {
  i.graph().dummyChains = [], i.edges().forEach((t) => P5(i, t));
}
function P5(i, t) {
  let e = t.v, n = i.node(e).rank, s = t.w, a = i.node(s).rank, l = t.name, c = i.edge(t), u = c.labelRank;
  if (a === n + 1) return;
  i.removeEdge(t);
  let d, p, v;
  for (v = 0, ++n; n < a; ++v, ++n)
    c.points = [], p = {
      width: 0,
      height: 0,
      edgeLabel: c,
      edgeObj: t,
      rank: n
    }, d = x5.addDummyNode(i, "edge", p, "_d"), n === u && (p.width = c.width, p.height = c.height, p.dummy = "edge-label", p.labelpos = c.labelpos), i.setEdge(e, d, { weight: c.weight }, l), v === 0 && i.graph().dummyChains.push(d), e = d;
  i.setEdge(e, s, { weight: c.weight }, l);
}
function T5(i) {
  i.graph().dummyChains.forEach((t) => {
    let e = i.node(t), n = e.edgeLabel, s;
    for (i.setEdge(e.edgeObj, n); e.dummy; )
      s = i.successors(t)[0], i.removeNode(t), n.points.push({ x: e.x, y: e.y }), e.dummy === "edge-label" && (n.x = e.x, n.y = e.y, n.width = e.width, n.height = e.height), t = s, e = i.node(t);
  });
}
const { applyWithChunking: A5 } = Me;
var vn = {
  longestPath: O5,
  slack: N5
};
function O5(i) {
  var t = {};
  function e(n) {
    var s = i.node(n);
    if (Object.hasOwn(t, n))
      return s.rank;
    t[n] = !0;
    let a = i.outEdges(n).map((c) => c == null ? Number.POSITIVE_INFINITY : e(c.w) - i.edge(c).minlen);
    var l = A5(Math.min, a);
    return l === Number.POSITIVE_INFINITY && (l = 0), s.rank = l;
  }
  i.sources().forEach(e);
}
function N5(i, t) {
  return i.node(t.w).rank - i.node(t.v).rank - i.edge(t).minlen;
}
var R5 = at.Graph, Cr = vn.slack, ih = L5;
function L5(i) {
  var t = new R5({ directed: !1 }), e = i.nodes()[0], n = i.nodeCount();
  t.setNode(e, {});
  for (var s, a; F5(t, i) < n; )
    s = M5(t, i), a = t.hasNode(s.v) ? Cr(i, s) : -Cr(i, s), G5(t, i, a);
  return t;
}
function F5(i, t) {
  function e(n) {
    t.nodeEdges(n).forEach((s) => {
      var a = s.v, l = n === a ? s.w : a;
      !i.hasNode(l) && !Cr(t, s) && (i.setNode(l, {}), i.setEdge(n, l, {}), e(l));
    });
  }
  return i.nodes().forEach(e), i.nodeCount();
}
function M5(i, t) {
  return t.edges().reduce((n, s) => {
    let a = Number.POSITIVE_INFINITY;
    return i.hasNode(s.v) !== i.hasNode(s.w) && (a = Cr(t, s)), a < n[0] ? [a, s] : n;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function G5(i, t, e) {
  i.nodes().forEach((n) => t.node(n).rank += e);
}
var I5 = ih, Bo = vn.slack, D5 = vn.longestPath, U5 = at.alg.preorder, B5 = at.alg.postorder, j5 = Me.simplify, V5 = Yt;
Yt.initLowLimValues = Fs;
Yt.initCutValues = Ls;
Yt.calcCutValue = rh;
Yt.leaveEdge = sh;
Yt.enterEdge = ah;
Yt.exchangeEdges = oh;
function Yt(i) {
  i = j5(i), D5(i);
  var t = I5(i);
  Fs(t), Ls(t, i);
  for (var e, n; e = sh(t); )
    n = ah(t, i, e), oh(t, i, e, n);
}
function Ls(i, t) {
  var e = B5(i, i.nodes());
  e = e.slice(0, e.length - 1), e.forEach((n) => H5(i, t, n));
}
function H5(i, t, e) {
  var n = i.node(e), s = n.parent;
  i.edge(e, s).cutvalue = rh(i, t, e);
}
function rh(i, t, e) {
  var n = i.node(e), s = n.parent, a = !0, l = t.edge(e, s), c = 0;
  return l || (a = !1, l = t.edge(s, e)), c = l.weight, t.nodeEdges(e).forEach((u) => {
    var d = u.v === e, p = d ? u.w : u.v;
    if (p !== s) {
      var v = d === a, b = t.edge(u).weight;
      if (c += v ? b : -b, z5(i, e, p)) {
        var y = i.edge(e, p).cutvalue;
        c += v ? -y : y;
      }
    }
  }), c;
}
function Fs(i, t) {
  arguments.length < 2 && (t = i.nodes()[0]), nh(i, {}, 1, t);
}
function nh(i, t, e, n, s) {
  var a = e, l = i.node(n);
  return t[n] = !0, i.neighbors(n).forEach((c) => {
    Object.hasOwn(t, c) || (e = nh(i, t, e, c, n));
  }), l.low = a, l.lim = e++, s ? l.parent = s : delete l.parent, e;
}
function sh(i) {
  return i.edges().find((t) => i.edge(t).cutvalue < 0);
}
function ah(i, t, e) {
  var n = e.v, s = e.w;
  t.hasEdge(n, s) || (n = e.w, s = e.v);
  var a = i.node(n), l = i.node(s), c = a, u = !1;
  a.lim > l.lim && (c = l, u = !0);
  var d = t.edges().filter((p) => u === jo(i, i.node(p.v), c) && u !== jo(i, i.node(p.w), c));
  return d.reduce((p, v) => Bo(t, v) < Bo(t, p) ? v : p);
}
function oh(i, t, e, n) {
  var s = e.v, a = e.w;
  i.removeEdge(s, a), i.setEdge(n.v, n.w, {}), Fs(i), Ls(i, t), W5(i, t);
}
function W5(i, t) {
  var e = i.nodes().find((s) => !t.node(s).parent), n = U5(i, e);
  n = n.slice(1), n.forEach((s) => {
    var a = i.node(s).parent, l = t.edge(s, a), c = !1;
    l || (l = t.edge(a, s), c = !0), t.node(s).rank = t.node(a).rank + (c ? l.minlen : -l.minlen);
  });
}
function z5(i, t, e) {
  return i.hasEdge(t, e);
}
function jo(i, t, e) {
  return e.low <= t.lim && t.lim <= e.lim;
}
var Y5 = vn, lh = Y5.longestPath, K5 = ih, X5 = V5, q5 = Q5;
function Q5(i) {
  var t = i.graph().ranker;
  if (t instanceof Function)
    return t(i);
  switch (i.graph().ranker) {
    case "network-simplex":
      Vo(i);
      break;
    case "tight-tree":
      Z5(i);
      break;
    case "longest-path":
      J5(i);
      break;
    case "none":
      break;
    default:
      Vo(i);
  }
}
var J5 = lh;
function Z5(i) {
  lh(i), K5(i);
}
function Vo(i) {
  X5(i);
}
var e3 = t3;
function t3(i) {
  let t = r3(i);
  i.graph().dummyChains.forEach((e) => {
    let n = i.node(e), s = n.edgeObj, a = i3(i, t, s.v, s.w), l = a.path, c = a.lca, u = 0, d = l[u], p = !0;
    for (; e !== s.w; ) {
      if (n = i.node(e), p) {
        for (; (d = l[u]) !== c && i.node(d).maxRank < n.rank; )
          u++;
        d === c && (p = !1);
      }
      if (!p) {
        for (; u < l.length - 1 && i.node(d = l[u + 1]).minRank <= n.rank; )
          u++;
        d = l[u];
      }
      i.setParent(e, d), e = i.successors(e)[0];
    }
  });
}
function i3(i, t, e, n) {
  let s = [], a = [], l = Math.min(t[e].low, t[n].low), c = Math.max(t[e].lim, t[n].lim), u, d;
  u = e;
  do
    u = i.parent(u), s.push(u);
  while (u && (t[u].low > l || c > t[u].lim));
  for (d = u, u = n; (u = i.parent(u)) !== d; )
    a.push(u);
  return { path: s.concat(a.reverse()), lca: d };
}
function r3(i) {
  let t = {}, e = 0;
  function n(s) {
    let a = e;
    i.children(s).forEach(n), t[s] = { low: a, lim: e++ };
  }
  return i.children().forEach(n), t;
}
let Sr = Me;
var n3 = {
  run: s3,
  cleanup: l3
};
function s3(i) {
  let t = Sr.addDummyNode(i, "root", {}, "_root"), e = a3(i), n = Object.values(e), s = Sr.applyWithChunking(Math.max, n) - 1, a = 2 * s + 1;
  i.graph().nestingRoot = t, i.edges().forEach((c) => i.edge(c).minlen *= a);
  let l = o3(i) + 1;
  i.children().forEach((c) => hh(i, t, a, l, s, e, c)), i.graph().nodeRankFactor = a;
}
function hh(i, t, e, n, s, a, l) {
  let c = i.children(l);
  if (!c.length) {
    l !== t && i.setEdge(t, l, { weight: 0, minlen: e });
    return;
  }
  let u = Sr.addBorderNode(i, "_bt"), d = Sr.addBorderNode(i, "_bb"), p = i.node(l);
  i.setParent(u, l), p.borderTop = u, i.setParent(d, l), p.borderBottom = d, c.forEach((v) => {
    hh(i, t, e, n, s, a, v);
    let b = i.node(v), y = b.borderTop ? b.borderTop : v, _ = b.borderBottom ? b.borderBottom : v, S = b.borderTop ? n : 2 * n, E = y !== _ ? 1 : s - a[l] + 1;
    i.setEdge(u, y, {
      weight: S,
      minlen: E,
      nestingEdge: !0
    }), i.setEdge(_, d, {
      weight: S,
      minlen: E,
      nestingEdge: !0
    });
  }), i.parent(l) || i.setEdge(t, u, { weight: 0, minlen: s + a[l] });
}
function a3(i) {
  var t = {};
  function e(n, s) {
    var a = i.children(n);
    a && a.length && a.forEach((l) => e(l, s + 1)), t[n] = s;
  }
  return i.children().forEach((n) => e(n, 1)), t;
}
function o3(i) {
  return i.edges().reduce((t, e) => t + i.edge(e).weight, 0);
}
function l3(i) {
  var t = i.graph();
  i.removeNode(t.nestingRoot), delete t.nestingRoot, i.edges().forEach((e) => {
    var n = i.edge(e);
    n.nestingEdge && i.removeEdge(e);
  });
}
let h3 = Me;
var c3 = u3;
function u3(i) {
  function t(e) {
    let n = i.children(e), s = i.node(e);
    if (n.length && n.forEach(t), Object.hasOwn(s, "minRank")) {
      s.borderLeft = [], s.borderRight = [];
      for (let a = s.minRank, l = s.maxRank + 1; a < l; ++a)
        Ho(i, "borderLeft", "_bl", e, s, a), Ho(i, "borderRight", "_br", e, s, a);
    }
  }
  i.children().forEach(t);
}
function Ho(i, t, e, n, s, a) {
  let l = { width: 0, height: 0, rank: a, borderType: t }, c = s[t][a - 1], u = h3.addDummyNode(i, "border", l, e);
  s[t][a] = u, i.setParent(u, n), c && i.setEdge(c, u, { weight: 1 });
}
var f3 = {
  adjust: d3,
  undo: g3
};
function d3(i) {
  let t = i.graph().rankdir.toLowerCase();
  (t === "lr" || t === "rl") && ch(i);
}
function g3(i) {
  let t = i.graph().rankdir.toLowerCase();
  (t === "bt" || t === "rl") && p3(i), (t === "lr" || t === "rl") && (m3(i), ch(i));
}
function ch(i) {
  i.nodes().forEach((t) => Wo(i.node(t))), i.edges().forEach((t) => Wo(i.edge(t)));
}
function Wo(i) {
  let t = i.width;
  i.width = i.height, i.height = t;
}
function p3(i) {
  i.nodes().forEach((t) => qn(i.node(t))), i.edges().forEach((t) => {
    let e = i.edge(t);
    e.points.forEach(qn), Object.hasOwn(e, "y") && qn(e);
  });
}
function qn(i) {
  i.y = -i.y;
}
function m3(i) {
  i.nodes().forEach((t) => Qn(i.node(t))), i.edges().forEach((t) => {
    let e = i.edge(t);
    e.points.forEach(Qn), Object.hasOwn(e, "x") && Qn(e);
  });
}
function Qn(i) {
  let t = i.x;
  i.x = i.y, i.y = t;
}
let zo = Me;
var _3 = v3;
function v3(i) {
  let t = {}, e = i.nodes().filter((u) => !i.children(u).length), n = e.map((u) => i.node(u).rank), s = zo.applyWithChunking(Math.max, n), a = zo.range(s + 1).map(() => []);
  function l(u) {
    if (t[u]) return;
    t[u] = !0;
    let d = i.node(u);
    a[d.rank].push(u), i.successors(u).forEach(l);
  }
  return e.sort((u, d) => i.node(u).rank - i.node(d).rank).forEach(l), a;
}
let b3 = Me.zipObject;
var y3 = w3;
function w3(i, t) {
  let e = 0;
  for (let n = 1; n < t.length; ++n)
    e += C3(i, t[n - 1], t[n]);
  return e;
}
function C3(i, t, e) {
  let n = b3(e, e.map((d, p) => p)), s = t.flatMap((d) => i.outEdges(d).map((p) => ({ pos: n[p.w], weight: i.edge(p).weight })).sort((p, v) => p.pos - v.pos)), a = 1;
  for (; a < e.length; ) a <<= 1;
  let l = 2 * a - 1;
  a -= 1;
  let c = new Array(l).fill(0), u = 0;
  return s.forEach((d) => {
    let p = d.pos + a;
    c[p] += d.weight;
    let v = 0;
    for (; p > 0; )
      p % 2 && (v += c[p + 1]), p = p - 1 >> 1, c[p] += d.weight;
    u += d.weight * v;
  }), u;
}
var S3 = E3;
function E3(i, t = []) {
  return t.map((e) => {
    let n = i.inEdges(e);
    if (n.length) {
      let s = n.reduce((a, l) => {
        let c = i.edge(l), u = i.node(l.v);
        return {
          sum: a.sum + c.weight * u.order,
          weight: a.weight + c.weight
        };
      }, { sum: 0, weight: 0 });
      return {
        v: e,
        barycenter: s.sum / s.weight,
        weight: s.weight
      };
    } else
      return { v: e };
  });
}
let x3 = Me;
var k3 = $3;
function $3(i, t) {
  let e = {};
  i.forEach((s, a) => {
    let l = e[s.v] = {
      indegree: 0,
      in: [],
      out: [],
      vs: [s.v],
      i: a
    };
    s.barycenter !== void 0 && (l.barycenter = s.barycenter, l.weight = s.weight);
  }), t.edges().forEach((s) => {
    let a = e[s.v], l = e[s.w];
    a !== void 0 && l !== void 0 && (l.indegree++, a.out.push(e[s.w]));
  });
  let n = Object.values(e).filter((s) => !s.indegree);
  return P3(n);
}
function P3(i) {
  let t = [];
  function e(s) {
    return (a) => {
      a.merged || (a.barycenter === void 0 || s.barycenter === void 0 || a.barycenter >= s.barycenter) && T3(s, a);
    };
  }
  function n(s) {
    return (a) => {
      a.in.push(s), --a.indegree === 0 && i.push(a);
    };
  }
  for (; i.length; ) {
    let s = i.pop();
    t.push(s), s.in.reverse().forEach(e(s)), s.out.forEach(n(s));
  }
  return t.filter((s) => !s.merged).map((s) => x3.pick(s, ["vs", "i", "barycenter", "weight"]));
}
function T3(i, t) {
  let e = 0, n = 0;
  i.weight && (e += i.barycenter * i.weight, n += i.weight), t.weight && (e += t.barycenter * t.weight, n += t.weight), i.vs = t.vs.concat(i.vs), i.barycenter = e / n, i.weight = n, i.i = Math.min(t.i, i.i), t.merged = !0;
}
let A3 = Me;
var O3 = N3;
function N3(i, t) {
  let e = A3.partition(i, (p) => Object.hasOwn(p, "barycenter")), n = e.lhs, s = e.rhs.sort((p, v) => v.i - p.i), a = [], l = 0, c = 0, u = 0;
  n.sort(R3(!!t)), u = Yo(a, s, u), n.forEach((p) => {
    u += p.vs.length, a.push(p.vs), l += p.barycenter * p.weight, c += p.weight, u = Yo(a, s, u);
  });
  let d = { vs: a.flat(!0) };
  return c && (d.barycenter = l / c, d.weight = c), d;
}
function Yo(i, t, e) {
  let n;
  for (; t.length && (n = t[t.length - 1]).i <= e; )
    t.pop(), i.push(n.vs), e++;
  return e;
}
function R3(i) {
  return (t, e) => t.barycenter < e.barycenter ? -1 : t.barycenter > e.barycenter ? 1 : i ? e.i - t.i : t.i - e.i;
}
let L3 = S3, F3 = k3, M3 = O3;
var G3 = uh;
function uh(i, t, e, n) {
  let s = i.children(t), a = i.node(t), l = a ? a.borderLeft : void 0, c = a ? a.borderRight : void 0, u = {};
  l && (s = s.filter((b) => b !== l && b !== c));
  let d = L3(i, s);
  d.forEach((b) => {
    if (i.children(b.v).length) {
      let y = uh(i, b.v, e, n);
      u[b.v] = y, Object.hasOwn(y, "barycenter") && D3(b, y);
    }
  });
  let p = F3(d, e);
  I3(p, u);
  let v = M3(p, n);
  if (l && (v.vs = [l, v.vs, c].flat(!0), i.predecessors(l).length)) {
    let b = i.node(i.predecessors(l)[0]), y = i.node(i.predecessors(c)[0]);
    Object.hasOwn(v, "barycenter") || (v.barycenter = 0, v.weight = 0), v.barycenter = (v.barycenter * v.weight + b.order + y.order) / (v.weight + 2), v.weight += 2;
  }
  return v;
}
function I3(i, t) {
  i.forEach((e) => {
    e.vs = e.vs.flatMap((n) => t[n] ? t[n].vs : n);
  });
}
function D3(i, t) {
  i.barycenter !== void 0 ? (i.barycenter = (i.barycenter * i.weight + t.barycenter * t.weight) / (i.weight + t.weight), i.weight += t.weight) : (i.barycenter = t.barycenter, i.weight = t.weight);
}
let U3 = at.Graph, B3 = Me;
var j3 = V3;
function V3(i, t, e, n) {
  n || (n = i.nodes());
  let s = H3(i), a = new U3({ compound: !0 }).setGraph({ root: s }).setDefaultNodeLabel((l) => i.node(l));
  return n.forEach((l) => {
    let c = i.node(l), u = i.parent(l);
    (c.rank === t || c.minRank <= t && t <= c.maxRank) && (a.setNode(l), a.setParent(l, u || s), i[e](l).forEach((d) => {
      let p = d.v === l ? d.w : d.v, v = a.edge(p, l), b = v !== void 0 ? v.weight : 0;
      a.setEdge(p, l, { weight: i.edge(d).weight + b });
    }), Object.hasOwn(c, "minRank") && a.setNode(l, {
      borderLeft: c.borderLeft[t],
      borderRight: c.borderRight[t]
    }));
  }), a;
}
function H3(i) {
  for (var t; i.hasNode(t = B3.uniqueId("_root")); ) ;
  return t;
}
var W3 = z3;
function z3(i, t, e) {
  let n = {}, s;
  e.forEach((a) => {
    let l = i.parent(a), c, u;
    for (; l; ) {
      if (c = i.parent(l), c ? (u = n[c], n[c] = l) : (u = s, s = l), u && u !== l) {
        t.setEdge(u, l);
        return;
      }
      l = c;
    }
  });
}
let Y3 = _3, K3 = y3, X3 = G3, q3 = j3, Q3 = W3, J3 = at.Graph, dr = Me;
var Z3 = fh;
function fh(i, t) {
  if (t && typeof t.customOrder == "function") {
    t.customOrder(i, fh);
    return;
  }
  let e = dr.maxRank(i), n = Ko(i, dr.range(1, e + 1), "inEdges"), s = Ko(i, dr.range(e - 1, -1, -1), "outEdges"), a = Y3(i);
  if (Xo(i, a), t && t.disableOptimalOrderHeuristic)
    return;
  let l = Number.POSITIVE_INFINITY, c;
  for (let u = 0, d = 0; d < 4; ++u, ++d) {
    e4(u % 2 ? n : s, u % 4 >= 2), a = dr.buildLayerMatrix(i);
    let p = K3(i, a);
    p < l && (d = 0, c = Object.assign({}, a), l = p);
  }
  Xo(i, c);
}
function Ko(i, t, e) {
  const n = /* @__PURE__ */ new Map(), s = (a, l) => {
    n.has(a) || n.set(a, []), n.get(a).push(l);
  };
  for (const a of i.nodes()) {
    const l = i.node(a);
    if (typeof l.rank == "number" && s(l.rank, a), typeof l.minRank == "number" && typeof l.maxRank == "number")
      for (let c = l.minRank; c <= l.maxRank; c++)
        c !== l.rank && s(c, a);
  }
  return t.map(function(a) {
    return q3(i, a, e, n.get(a) || []);
  });
}
function e4(i, t) {
  let e = new J3();
  i.forEach(function(n) {
    let s = n.graph().root, a = X3(n, s, e, t);
    a.vs.forEach((l, c) => n.node(l).order = c), Q3(n, e, a.vs);
  });
}
function Xo(i, t) {
  Object.values(t).forEach((e) => e.forEach((n, s) => i.node(n).order = s));
}
let t4 = at.Graph, mt = Me;
var i4 = {
  positionX: d4
};
function r4(i, t) {
  let e = {};
  function n(s, a) {
    let l = 0, c = 0, u = s.length, d = a[a.length - 1];
    return a.forEach((p, v) => {
      let b = s4(i, p), y = b ? i.node(b).order : u;
      (b || p === d) && (a.slice(c, v + 1).forEach((_) => {
        i.predecessors(_).forEach((S) => {
          let E = i.node(S), P = E.order;
          (P < l || y < P) && !(E.dummy && i.node(_).dummy) && dh(e, S, _);
        });
      }), c = v + 1, l = y);
    }), a;
  }
  return t.length && t.reduce(n), e;
}
function n4(i, t) {
  let e = {};
  function n(a, l, c, u, d) {
    let p;
    mt.range(l, c).forEach((v) => {
      p = a[v], i.node(p).dummy && i.predecessors(p).forEach((b) => {
        let y = i.node(b);
        y.dummy && (y.order < u || y.order > d) && dh(e, b, p);
      });
    });
  }
  function s(a, l) {
    let c = -1, u, d = 0;
    return l.forEach((p, v) => {
      if (i.node(p).dummy === "border") {
        let b = i.predecessors(p);
        b.length && (u = i.node(b[0]).order, n(l, d, v, c, u), d = v, c = u);
      }
      n(l, d, l.length, u, a.length);
    }), l;
  }
  return t.length && t.reduce(s), e;
}
function s4(i, t) {
  if (i.node(t).dummy)
    return i.predecessors(t).find((e) => i.node(e).dummy);
}
function dh(i, t, e) {
  if (t > e) {
    let s = t;
    t = e, e = s;
  }
  let n = i[t];
  n || (i[t] = n = {}), n[e] = !0;
}
function a4(i, t, e) {
  if (t > e) {
    let n = t;
    t = e, e = n;
  }
  return !!i[t] && Object.hasOwn(i[t], e);
}
function o4(i, t, e, n) {
  let s = {}, a = {}, l = {};
  return t.forEach((c) => {
    c.forEach((u, d) => {
      s[u] = u, a[u] = u, l[u] = d;
    });
  }), t.forEach((c) => {
    let u = -1;
    c.forEach((d) => {
      let p = n(d);
      if (p.length) {
        p = p.sort((b, y) => l[b] - l[y]);
        let v = (p.length - 1) / 2;
        for (let b = Math.floor(v), y = Math.ceil(v); b <= y; ++b) {
          let _ = p[b];
          a[d] === d && u < l[_] && !a4(e, d, _) && (a[_] = d, a[d] = s[d] = s[_], u = l[_]);
        }
      }
    });
  }), { root: s, align: a };
}
function l4(i, t, e, n, s) {
  let a = {}, l = h4(i, t, e, s), c = s ? "borderLeft" : "borderRight";
  function u(v, b) {
    let y = l.nodes(), _ = y.pop(), S = {};
    for (; _; )
      S[_] ? v(_) : (S[_] = !0, y.push(_), y = y.concat(b(_))), _ = y.pop();
  }
  function d(v) {
    a[v] = l.inEdges(v).reduce((b, y) => Math.max(b, a[y.v] + l.edge(y)), 0);
  }
  function p(v) {
    let b = l.outEdges(v).reduce((_, S) => Math.min(_, a[S.w] - l.edge(S)), Number.POSITIVE_INFINITY), y = i.node(v);
    b !== Number.POSITIVE_INFINITY && y.borderType !== c && (a[v] = Math.max(a[v], b));
  }
  return u(d, l.predecessors.bind(l)), u(p, l.successors.bind(l)), Object.keys(n).forEach((v) => a[v] = a[e[v]]), a;
}
function h4(i, t, e, n) {
  let s = new t4(), a = i.graph(), l = g4(a.nodesep, a.edgesep, n);
  return t.forEach((c) => {
    let u;
    c.forEach((d) => {
      let p = e[d];
      if (s.setNode(p), u) {
        var v = e[u], b = s.edge(v, p);
        s.setEdge(v, p, Math.max(l(i, d, u), b || 0));
      }
      u = d;
    });
  }), s;
}
function c4(i, t) {
  return Object.values(t).reduce((e, n) => {
    let s = Number.NEGATIVE_INFINITY, a = Number.POSITIVE_INFINITY;
    Object.entries(n).forEach(([c, u]) => {
      let d = p4(i, c) / 2;
      s = Math.max(u + d, s), a = Math.min(u - d, a);
    });
    const l = s - a;
    return l < e[0] && (e = [l, n]), e;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function u4(i, t) {
  let e = Object.values(t), n = mt.applyWithChunking(Math.min, e), s = mt.applyWithChunking(Math.max, e);
  ["u", "d"].forEach((a) => {
    ["l", "r"].forEach((l) => {
      let c = a + l, u = i[c];
      if (u === t) return;
      let d = Object.values(u), p = n - mt.applyWithChunking(Math.min, d);
      l !== "l" && (p = s - mt.applyWithChunking(Math.max, d)), p && (i[c] = mt.mapValues(u, (v) => v + p));
    });
  });
}
function f4(i, t) {
  return mt.mapValues(i.ul, (e, n) => {
    if (t)
      return i[t.toLowerCase()][n];
    {
      let s = Object.values(i).map((a) => a[n]).sort((a, l) => a - l);
      return (s[1] + s[2]) / 2;
    }
  });
}
function d4(i) {
  let t = mt.buildLayerMatrix(i), e = Object.assign(
    r4(i, t),
    n4(i, t)
  ), n = {}, s;
  ["u", "d"].forEach((l) => {
    s = l === "u" ? t : Object.values(t).reverse(), ["l", "r"].forEach((c) => {
      c === "r" && (s = s.map((v) => Object.values(v).reverse()));
      let u = (l === "u" ? i.predecessors : i.successors).bind(i), d = o4(i, s, e, u), p = l4(
        i,
        s,
        d.root,
        d.align,
        c === "r"
      );
      c === "r" && (p = mt.mapValues(p, (v) => -v)), n[l + c] = p;
    });
  });
  let a = c4(i, n);
  return u4(n, a), f4(n, i.graph().align);
}
function g4(i, t, e) {
  return (n, s, a) => {
    let l = n.node(s), c = n.node(a), u = 0, d;
    if (u += l.width / 2, Object.hasOwn(l, "labelpos"))
      switch (l.labelpos.toLowerCase()) {
        case "l":
          d = -l.width / 2;
          break;
        case "r":
          d = l.width / 2;
          break;
      }
    if (d && (u += e ? d : -d), d = 0, u += (l.dummy ? t : i) / 2, u += (c.dummy ? t : i) / 2, u += c.width / 2, Object.hasOwn(c, "labelpos"))
      switch (c.labelpos.toLowerCase()) {
        case "l":
          d = c.width / 2;
          break;
        case "r":
          d = -c.width / 2;
          break;
      }
    return d && (u += e ? d : -d), d = 0, u;
  };
}
function p4(i, t) {
  return i.node(t).width;
}
let gh = Me, m4 = i4.positionX;
var _4 = v4;
function v4(i) {
  i = gh.asNonCompoundGraph(i), b4(i), Object.entries(m4(i)).forEach(([t, e]) => i.node(t).x = e);
}
function b4(i) {
  let t = gh.buildLayerMatrix(i), e = i.graph().ranksep, n = 0;
  t.forEach((s) => {
    const a = s.reduce((l, c) => {
      const u = i.node(c).height;
      return l > u ? l : u;
    }, 0);
    s.forEach((l) => i.node(l).y = n + a / 2), n += a + e;
  });
}
let qo = w5, Qo = k5, y4 = q5, w4 = Me.normalizeRanks, C4 = e3, S4 = Me.removeEmptyRanks, Jo = n3, E4 = c3, Zo = f3, x4 = Z3, k4 = _4, et = Me, $4 = at.Graph;
var P4 = T4;
function T4(i, t) {
  let e = t && t.debugTiming ? et.time : et.notime;
  e("layout", () => {
    let n = e("  buildLayoutGraph", () => D4(i));
    e("  runLayout", () => A4(n, e, t)), e("  updateInputGraph", () => O4(i, n));
  });
}
function A4(i, t, e) {
  t("    makeSpaceForEdgeLabels", () => U4(i)), t("    removeSelfEdges", () => X4(i)), t("    acyclic", () => qo.run(i)), t("    nestingGraph.run", () => Jo.run(i)), t("    rank", () => y4(et.asNonCompoundGraph(i))), t("    injectEdgeLabelProxies", () => B4(i)), t("    removeEmptyRanks", () => S4(i)), t("    nestingGraph.cleanup", () => Jo.cleanup(i)), t("    normalizeRanks", () => w4(i)), t("    assignRankMinMax", () => j4(i)), t("    removeEdgeLabelProxies", () => V4(i)), t("    normalize.run", () => Qo.run(i)), t("    parentDummyChains", () => C4(i)), t("    addBorderSegments", () => E4(i)), t("    order", () => x4(i, e)), t("    insertSelfEdges", () => q4(i)), t("    adjustCoordinateSystem", () => Zo.adjust(i)), t("    position", () => k4(i)), t("    positionSelfEdges", () => Q4(i)), t("    removeBorderNodes", () => K4(i)), t("    normalize.undo", () => Qo.undo(i)), t("    fixupEdgeLabelCoords", () => z4(i)), t("    undoCoordinateSystem", () => Zo.undo(i)), t("    translateGraph", () => H4(i)), t("    assignNodeIntersects", () => W4(i)), t("    reversePoints", () => Y4(i)), t("    acyclic.undo", () => qo.undo(i));
}
function O4(i, t) {
  i.nodes().forEach((e) => {
    let n = i.node(e), s = t.node(e);
    n && (n.x = s.x, n.y = s.y, n.rank = s.rank, t.children(e).length && (n.width = s.width, n.height = s.height));
  }), i.edges().forEach((e) => {
    let n = i.edge(e), s = t.edge(e);
    n.points = s.points, Object.hasOwn(s, "x") && (n.x = s.x, n.y = s.y);
  }), i.graph().width = t.graph().width, i.graph().height = t.graph().height;
}
let N4 = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"], R4 = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "tb" }, L4 = ["acyclicer", "ranker", "rankdir", "align"], F4 = ["width", "height", "rank"], el = { width: 0, height: 0 }, M4 = ["minlen", "weight", "width", "height", "labeloffset"], G4 = {
  minlen: 1,
  weight: 1,
  width: 0,
  height: 0,
  labeloffset: 10,
  labelpos: "r"
}, I4 = ["labelpos"];
function D4(i) {
  let t = new $4({ multigraph: !0, compound: !0 }), e = Zn(i.graph());
  return t.setGraph(Object.assign(
    {},
    R4,
    Jn(e, N4),
    et.pick(e, L4)
  )), i.nodes().forEach((n) => {
    let s = Zn(i.node(n));
    const a = Jn(s, F4);
    Object.keys(el).forEach((l) => {
      a[l] === void 0 && (a[l] = el[l]);
    }), t.setNode(n, a), t.setParent(n, i.parent(n));
  }), i.edges().forEach((n) => {
    let s = Zn(i.edge(n));
    t.setEdge(n, Object.assign(
      {},
      G4,
      Jn(s, M4),
      et.pick(s, I4)
    ));
  }), t;
}
function U4(i) {
  let t = i.graph();
  t.ranksep /= 2, i.edges().forEach((e) => {
    let n = i.edge(e);
    n.minlen *= 2, n.labelpos.toLowerCase() !== "c" && (t.rankdir === "TB" || t.rankdir === "BT" ? n.width += n.labeloffset : n.height += n.labeloffset);
  });
}
function B4(i) {
  i.edges().forEach((t) => {
    let e = i.edge(t);
    if (e.width && e.height) {
      let n = i.node(t.v), a = { rank: (i.node(t.w).rank - n.rank) / 2 + n.rank, e: t };
      et.addDummyNode(i, "edge-proxy", a, "_ep");
    }
  });
}
function j4(i) {
  let t = 0;
  i.nodes().forEach((e) => {
    let n = i.node(e);
    n.borderTop && (n.minRank = i.node(n.borderTop).rank, n.maxRank = i.node(n.borderBottom).rank, t = Math.max(t, n.maxRank));
  }), i.graph().maxRank = t;
}
function V4(i) {
  i.nodes().forEach((t) => {
    let e = i.node(t);
    e.dummy === "edge-proxy" && (i.edge(e.e).labelRank = e.rank, i.removeNode(t));
  });
}
function H4(i) {
  let t = Number.POSITIVE_INFINITY, e = 0, n = Number.POSITIVE_INFINITY, s = 0, a = i.graph(), l = a.marginx || 0, c = a.marginy || 0;
  function u(d) {
    let p = d.x, v = d.y, b = d.width, y = d.height;
    t = Math.min(t, p - b / 2), e = Math.max(e, p + b / 2), n = Math.min(n, v - y / 2), s = Math.max(s, v + y / 2);
  }
  i.nodes().forEach((d) => u(i.node(d))), i.edges().forEach((d) => {
    let p = i.edge(d);
    Object.hasOwn(p, "x") && u(p);
  }), t -= l, n -= c, i.nodes().forEach((d) => {
    let p = i.node(d);
    p.x -= t, p.y -= n;
  }), i.edges().forEach((d) => {
    let p = i.edge(d);
    p.points.forEach((v) => {
      v.x -= t, v.y -= n;
    }), Object.hasOwn(p, "x") && (p.x -= t), Object.hasOwn(p, "y") && (p.y -= n);
  }), a.width = e - t + l, a.height = s - n + c;
}
function W4(i) {
  i.edges().forEach((t) => {
    let e = i.edge(t), n = i.node(t.v), s = i.node(t.w), a, l;
    e.points ? (a = e.points[0], l = e.points[e.points.length - 1]) : (e.points = [], a = s, l = n), e.points.unshift(et.intersectRect(n, a)), e.points.push(et.intersectRect(s, l));
  });
}
function z4(i) {
  i.edges().forEach((t) => {
    let e = i.edge(t);
    if (Object.hasOwn(e, "x"))
      switch ((e.labelpos === "l" || e.labelpos === "r") && (e.width -= e.labeloffset), e.labelpos) {
        case "l":
          e.x -= e.width / 2 + e.labeloffset;
          break;
        case "r":
          e.x += e.width / 2 + e.labeloffset;
          break;
      }
  });
}
function Y4(i) {
  i.edges().forEach((t) => {
    let e = i.edge(t);
    e.reversed && e.points.reverse();
  });
}
function K4(i) {
  i.nodes().forEach((t) => {
    if (i.children(t).length) {
      let e = i.node(t), n = i.node(e.borderTop), s = i.node(e.borderBottom), a = i.node(e.borderLeft[e.borderLeft.length - 1]), l = i.node(e.borderRight[e.borderRight.length - 1]);
      e.width = Math.abs(l.x - a.x), e.height = Math.abs(s.y - n.y), e.x = a.x + e.width / 2, e.y = n.y + e.height / 2;
    }
  }), i.nodes().forEach((t) => {
    i.node(t).dummy === "border" && i.removeNode(t);
  });
}
function X4(i) {
  i.edges().forEach((t) => {
    if (t.v === t.w) {
      var e = i.node(t.v);
      e.selfEdges || (e.selfEdges = []), e.selfEdges.push({ e: t, label: i.edge(t) }), i.removeEdge(t);
    }
  });
}
function q4(i) {
  var t = et.buildLayerMatrix(i);
  t.forEach((e) => {
    var n = 0;
    e.forEach((s, a) => {
      var l = i.node(s);
      l.order = a + n, (l.selfEdges || []).forEach((c) => {
        et.addDummyNode(i, "selfedge", {
          width: c.label.width,
          height: c.label.height,
          rank: l.rank,
          order: a + ++n,
          e: c.e,
          label: c.label
        }, "_se");
      }), delete l.selfEdges;
    });
  });
}
function Q4(i) {
  i.nodes().forEach((t) => {
    var e = i.node(t);
    if (e.dummy === "selfedge") {
      var n = i.node(e.e.v), s = n.x + n.width / 2, a = n.y, l = e.x - s, c = n.height / 2;
      i.setEdge(e.e, e.label), i.removeNode(t), e.label.points = [
        { x: s + 2 * l / 3, y: a - c },
        { x: s + 5 * l / 6, y: a - c },
        { x: s + l, y: a },
        { x: s + 5 * l / 6, y: a + c },
        { x: s + 2 * l / 3, y: a + c }
      ], e.label.x = e.x, e.label.y = e.y;
    }
  });
}
function Jn(i, t) {
  return et.mapValues(et.pick(i, t), Number);
}
function Zn(i) {
  var t = {};
  return i && Object.entries(i).forEach(([e, n]) => {
    typeof e == "string" && (e = e.toLowerCase()), t[e] = n;
  }), t;
}
let J4 = Me, Z4 = at.Graph;
var e6 = {
  debugOrdering: t6
};
function t6(i) {
  let t = J4.buildLayerMatrix(i), e = new Z4({ compound: !0, multigraph: !0 }).setGraph({});
  return i.nodes().forEach((n) => {
    e.setNode(n, { label: n }), e.setParent(n, "layer" + i.node(n).rank);
  }), i.edges().forEach((n) => e.setEdge(n.v, n.w, {}, n.name)), t.forEach((n, s) => {
    let a = "layer" + s;
    e.setNode(a, { rank: "same" }), n.reduce((l, c) => (e.setEdge(l, c, { style: "invis" }), c));
  }), e;
}
var i6 = "1.1.8", r6 = {
  graphlib: at,
  layout: P4,
  debug: e6,
  util: {
    time: Me.time,
    notime: Me.notime
  },
  version: i6
};
const G6 = /* @__PURE__ */ gs(r6);
var ph = { exports: {} };
(function(i) {
  var t = Object.prototype.hasOwnProperty, e = "~";
  function n() {
  }
  Object.create && (n.prototype = /* @__PURE__ */ Object.create(null), new n().__proto__ || (e = !1));
  function s(u, d, p) {
    this.fn = u, this.context = d, this.once = p || !1;
  }
  function a(u, d, p, v, b) {
    if (typeof p != "function")
      throw new TypeError("The listener must be a function");
    var y = new s(p, v || u, b), _ = e ? e + d : d;
    return u._events[_] ? u._events[_].fn ? u._events[_] = [u._events[_], y] : u._events[_].push(y) : (u._events[_] = y, u._eventsCount++), u;
  }
  function l(u, d) {
    --u._eventsCount === 0 ? u._events = new n() : delete u._events[d];
  }
  function c() {
    this._events = new n(), this._eventsCount = 0;
  }
  c.prototype.eventNames = function() {
    var d = [], p, v;
    if (this._eventsCount === 0) return d;
    for (v in p = this._events)
      t.call(p, v) && d.push(e ? v.slice(1) : v);
    return Object.getOwnPropertySymbols ? d.concat(Object.getOwnPropertySymbols(p)) : d;
  }, c.prototype.listeners = function(d) {
    var p = e ? e + d : d, v = this._events[p];
    if (!v) return [];
    if (v.fn) return [v.fn];
    for (var b = 0, y = v.length, _ = new Array(y); b < y; b++)
      _[b] = v[b].fn;
    return _;
  }, c.prototype.listenerCount = function(d) {
    var p = e ? e + d : d, v = this._events[p];
    return v ? v.fn ? 1 : v.length : 0;
  }, c.prototype.emit = function(d, p, v, b, y, _) {
    var S = e ? e + d : d;
    if (!this._events[S]) return !1;
    var E = this._events[S], P = arguments.length, A, m;
    if (E.fn) {
      switch (E.once && this.removeListener(d, E.fn, void 0, !0), P) {
        case 1:
          return E.fn.call(E.context), !0;
        case 2:
          return E.fn.call(E.context, p), !0;
        case 3:
          return E.fn.call(E.context, p, v), !0;
        case 4:
          return E.fn.call(E.context, p, v, b), !0;
        case 5:
          return E.fn.call(E.context, p, v, b, y), !0;
        case 6:
          return E.fn.call(E.context, p, v, b, y, _), !0;
      }
      for (m = 1, A = new Array(P - 1); m < P; m++)
        A[m - 1] = arguments[m];
      E.fn.apply(E.context, A);
    } else {
      var C = E.length, $;
      for (m = 0; m < C; m++)
        switch (E[m].once && this.removeListener(d, E[m].fn, void 0, !0), P) {
          case 1:
            E[m].fn.call(E[m].context);
            break;
          case 2:
            E[m].fn.call(E[m].context, p);
            break;
          case 3:
            E[m].fn.call(E[m].context, p, v);
            break;
          case 4:
            E[m].fn.call(E[m].context, p, v, b);
            break;
          default:
            if (!A) for ($ = 1, A = new Array(P - 1); $ < P; $++)
              A[$ - 1] = arguments[$];
            E[m].fn.apply(E[m].context, A);
        }
    }
    return !0;
  }, c.prototype.on = function(d, p, v) {
    return a(this, d, p, v, !1);
  }, c.prototype.once = function(d, p, v) {
    return a(this, d, p, v, !0);
  }, c.prototype.removeListener = function(d, p, v, b) {
    var y = e ? e + d : d;
    if (!this._events[y]) return this;
    if (!p)
      return l(this, y), this;
    var _ = this._events[y];
    if (_.fn)
      _.fn === p && (!b || _.once) && (!v || _.context === v) && l(this, y);
    else {
      for (var S = 0, E = [], P = _.length; S < P; S++)
        (_[S].fn !== p || b && !_[S].once || v && _[S].context !== v) && E.push(_[S]);
      E.length ? this._events[y] = E.length === 1 ? E[0] : E : l(this, y);
    }
    return this;
  }, c.prototype.removeAllListeners = function(d) {
    var p;
    return d ? (p = e ? e + d : d, this._events[p] && l(this, p)) : (this._events = new n(), this._eventsCount = 0), this;
  }, c.prototype.off = c.prototype.removeListener, c.prototype.addListener = c.prototype.on, c.prefixed = e, c.EventEmitter = c, i.exports = c;
})(ph);
var n6 = ph.exports;
const I6 = /* @__PURE__ */ gs(n6);
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var s6 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const a6 = (i) => i.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const bn = (i, t) => {
  const e = Xf(
    ({
      color: n = "currentColor",
      size: s = 24,
      strokeWidth: a = 2,
      absoluteStrokeWidth: l,
      className: c = "",
      children: u,
      ...d
    }, p) => Va(
      "svg",
      {
        ref: p,
        ...s6,
        width: s,
        height: s,
        stroke: n,
        strokeWidth: l ? Number(a) * 24 / Number(s) : a,
        className: ["lucide", `lucide-${a6(i)}`, c].join(" "),
        ...d
      },
      [
        ...t.map(([v, b]) => Va(v, b)),
        ...Array.isArray(u) ? u : [u]
      ]
    )
  );
  return e.displayName = `${i}`, e;
};
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const D6 = bn("KeyRound", [
  ["path", { d: "M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z", key: "167ctg" }],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
]);
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const U6 = bn("LayoutPanelLeft", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "2obqm" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }]
]);
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const B6 = bn("PanelTop", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }]
]);
/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const j6 = bn("PanelsTopLeft", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M9 21V9", key: "1oto5p" }]
]);
function o6(i) {
  throw new Error('Could not dynamically require "' + i + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var l6 = { exports: {} };
(function(i, t) {
  (function(e, n) {
    typeof o6 == "function" ? i.exports = n() : e.pluralize = n();
  })(es, function() {
    var e = [], n = [], s = {}, a = {}, l = {};
    function c(S) {
      return typeof S == "string" ? new RegExp("^" + S + "$", "i") : S;
    }
    function u(S, E) {
      return S === E ? E : S === S.toLowerCase() ? E.toLowerCase() : S === S.toUpperCase() ? E.toUpperCase() : S[0] === S[0].toUpperCase() ? E.charAt(0).toUpperCase() + E.substr(1).toLowerCase() : E.toLowerCase();
    }
    function d(S, E) {
      return S.replace(/\$(\d{1,2})/g, function(P, A) {
        return E[A] || "";
      });
    }
    function p(S, E) {
      return S.replace(E[0], function(P, A) {
        var m = d(E[1], arguments);
        return u(P === "" ? S[A - 1] : P, m);
      });
    }
    function v(S, E, P) {
      if (!S.length || s.hasOwnProperty(S))
        return E;
      for (var A = P.length; A--; ) {
        var m = P[A];
        if (m[0].test(E)) return p(E, m);
      }
      return E;
    }
    function b(S, E, P) {
      return function(A) {
        var m = A.toLowerCase();
        return E.hasOwnProperty(m) ? u(A, m) : S.hasOwnProperty(m) ? u(A, S[m]) : v(m, A, P);
      };
    }
    function y(S, E, P, A) {
      return function(m) {
        var C = m.toLowerCase();
        return E.hasOwnProperty(C) ? !0 : S.hasOwnProperty(C) ? !1 : v(C, C, P) === C;
      };
    }
    function _(S, E, P) {
      var A = E === 1 ? _.singular(S) : _.plural(S);
      return (P ? E + " " : "") + A;
    }
    return _.plural = b(
      l,
      a,
      e
    ), _.isPlural = y(
      l,
      a,
      e
    ), _.singular = b(
      a,
      l,
      n
    ), _.isSingular = y(
      a,
      l,
      n
    ), _.addPluralRule = function(S, E) {
      e.push([c(S), E]);
    }, _.addSingularRule = function(S, E) {
      n.push([c(S), E]);
    }, _.addUncountableRule = function(S) {
      if (typeof S == "string") {
        s[S.toLowerCase()] = !0;
        return;
      }
      _.addPluralRule(S, "$0"), _.addSingularRule(S, "$0");
    }, _.addIrregularRule = function(S, E) {
      E = E.toLowerCase(), S = S.toLowerCase(), l[S] = E, a[E] = S;
    }, [
      // Pronouns.
      ["I", "we"],
      ["me", "us"],
      ["he", "they"],
      ["she", "they"],
      ["them", "them"],
      ["myself", "ourselves"],
      ["yourself", "yourselves"],
      ["itself", "themselves"],
      ["herself", "themselves"],
      ["himself", "themselves"],
      ["themself", "themselves"],
      ["is", "are"],
      ["was", "were"],
      ["has", "have"],
      ["this", "these"],
      ["that", "those"],
      // Words ending in with a consonant and `o`.
      ["echo", "echoes"],
      ["dingo", "dingoes"],
      ["volcano", "volcanoes"],
      ["tornado", "tornadoes"],
      ["torpedo", "torpedoes"],
      // Ends with `us`.
      ["genus", "genera"],
      ["viscus", "viscera"],
      // Ends with `ma`.
      ["stigma", "stigmata"],
      ["stoma", "stomata"],
      ["dogma", "dogmata"],
      ["lemma", "lemmata"],
      ["schema", "schemata"],
      ["anathema", "anathemata"],
      // Other irregular rules.
      ["ox", "oxen"],
      ["axe", "axes"],
      ["die", "dice"],
      ["yes", "yeses"],
      ["foot", "feet"],
      ["eave", "eaves"],
      ["goose", "geese"],
      ["tooth", "teeth"],
      ["quiz", "quizzes"],
      ["human", "humans"],
      ["proof", "proofs"],
      ["carve", "carves"],
      ["valve", "valves"],
      ["looey", "looies"],
      ["thief", "thieves"],
      ["groove", "grooves"],
      ["pickaxe", "pickaxes"],
      ["passerby", "passersby"]
    ].forEach(function(S) {
      return _.addIrregularRule(S[0], S[1]);
    }), [
      [/s?$/i, "s"],
      [/[^\u0000-\u007F]$/i, "$0"],
      [/([^aeiou]ese)$/i, "$1"],
      [/(ax|test)is$/i, "$1es"],
      [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, "$1es"],
      [/(e[mn]u)s?$/i, "$1s"],
      [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, "$1"],
      [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, "$1i"],
      [/(alumn|alg|vertebr)(?:a|ae)$/i, "$1ae"],
      [/(seraph|cherub)(?:im)?$/i, "$1im"],
      [/(her|at|gr)o$/i, "$1oes"],
      [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i, "$1a"],
      [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, "$1a"],
      [/sis$/i, "ses"],
      [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, "$1$2ves"],
      [/([^aeiouy]|qu)y$/i, "$1ies"],
      [/([^ch][ieo][ln])ey$/i, "$1ies"],
      [/(x|ch|ss|sh|zz)$/i, "$1es"],
      [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, "$1ices"],
      [/\b((?:tit)?m|l)(?:ice|ouse)$/i, "$1ice"],
      [/(pe)(?:rson|ople)$/i, "$1ople"],
      [/(child)(?:ren)?$/i, "$1ren"],
      [/eaux$/i, "$0"],
      [/m[ae]n$/i, "men"],
      ["thou", "you"]
    ].forEach(function(S) {
      return _.addPluralRule(S[0], S[1]);
    }), [
      [/s$/i, ""],
      [/(ss)$/i, "$1"],
      [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, "$1fe"],
      [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, "$1f"],
      [/ies$/i, "y"],
      [/\b([pl]|zomb|(?:neck|cross)?t|coll|faer|food|gen|goon|group|lass|talk|goal|cut)ies$/i, "$1ie"],
      [/\b(mon|smil)ies$/i, "$1ey"],
      [/\b((?:tit)?m|l)ice$/i, "$1ouse"],
      [/(seraph|cherub)im$/i, "$1"],
      [/(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$/i, "$1"],
      [/(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$/i, "$1sis"],
      [/(movie|twelve|abuse|e[mn]u)s$/i, "$1"],
      [/(test)(?:is|es)$/i, "$1is"],
      [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, "$1us"],
      [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i, "$1um"],
      [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i, "$1on"],
      [/(alumn|alg|vertebr)ae$/i, "$1a"],
      [/(cod|mur|sil|vert|ind)ices$/i, "$1ex"],
      [/(matr|append)ices$/i, "$1ix"],
      [/(pe)(rson|ople)$/i, "$1rson"],
      [/(child)ren$/i, "$1"],
      [/(eau)x?$/i, "$1"],
      [/men$/i, "man"]
    ].forEach(function(S) {
      return _.addSingularRule(S[0], S[1]);
    }), [
      // Singular words with no plurals.
      "adulthood",
      "advice",
      "agenda",
      "aid",
      "aircraft",
      "alcohol",
      "ammo",
      "analytics",
      "anime",
      "athletics",
      "audio",
      "bison",
      "blood",
      "bream",
      "buffalo",
      "butter",
      "carp",
      "cash",
      "chassis",
      "chess",
      "clothing",
      "cod",
      "commerce",
      "cooperation",
      "corps",
      "debris",
      "diabetes",
      "digestion",
      "elk",
      "energy",
      "equipment",
      "excretion",
      "expertise",
      "firmware",
      "flounder",
      "fun",
      "gallows",
      "garbage",
      "graffiti",
      "hardware",
      "headquarters",
      "health",
      "herpes",
      "highjinks",
      "homework",
      "housework",
      "information",
      "jeans",
      "justice",
      "kudos",
      "labour",
      "literature",
      "machinery",
      "mackerel",
      "mail",
      "media",
      "mews",
      "moose",
      "music",
      "mud",
      "manga",
      "news",
      "only",
      "personnel",
      "pike",
      "plankton",
      "pliers",
      "police",
      "pollution",
      "premises",
      "rain",
      "research",
      "rice",
      "salmon",
      "scissors",
      "series",
      "sewage",
      "shambles",
      "shrimp",
      "software",
      "species",
      "staff",
      "swine",
      "tennis",
      "traffic",
      "transportation",
      "trout",
      "tuna",
      "wealth",
      "welfare",
      "whiting",
      "wildebeest",
      "wildlife",
      "you",
      /pok[eé]mon$/i,
      // Regexes.
      /[^aeiou]ese$/i,
      // "chinese", "japanese"
      /deer$/i,
      // "deer", "reindeer"
      /fish$/i,
      // "fish", "blowfish", "angelfish"
      /measles$/i,
      /o[iu]s$/i,
      // "carnivorous"
      /pox$/i,
      // "chickpox", "smallpox"
      /sheep$/i
    ].forEach(_.addUncountableRule), _;
  });
})(l6);
function Gi(i) {
  "@babel/helpers - typeof";
  return Gi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Gi(i);
}
function tl(i) {
  return f6(i) || u6(i) || c6(i) || h6();
}
function h6() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function c6(i, t) {
  if (i) {
    if (typeof i == "string") return ds(i, t);
    var e = {}.toString.call(i).slice(8, -1);
    return e === "Object" && i.constructor && (e = i.constructor.name), e === "Map" || e === "Set" ? Array.from(i) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? ds(i, t) : void 0;
  }
}
function u6(i) {
  if (typeof Symbol < "u" && i[Symbol.iterator] != null || i["@@iterator"] != null) return Array.from(i);
}
function f6(i) {
  if (Array.isArray(i)) return ds(i);
}
function ds(i, t) {
  (t == null || t > i.length) && (t = i.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = i[e];
  return n;
}
function il(i, t) {
  var e = Object.keys(i);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(i);
    t && (n = n.filter(function(s) {
      return Object.getOwnPropertyDescriptor(i, s).enumerable;
    })), e.push.apply(e, n);
  }
  return e;
}
function xt(i) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? il(Object(e), !0).forEach(function(n) {
      d6(i, n, e[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(i, Object.getOwnPropertyDescriptors(e)) : il(Object(e)).forEach(function(n) {
      Object.defineProperty(i, n, Object.getOwnPropertyDescriptor(e, n));
    });
  }
  return i;
}
function d6(i, t, e) {
  return (t = g6(t)) in i ? Object.defineProperty(i, t, { value: e, enumerable: !0, configurable: !0, writable: !0 }) : i[t] = e, i;
}
function g6(i) {
  var t = p6(i, "string");
  return Gi(t) == "symbol" ? t : t + "";
}
function p6(i, t) {
  if (Gi(i) != "object" || !i) return i;
  var e = i[Symbol.toPrimitive];
  if (e !== void 0) {
    var n = e.call(i, t);
    if (Gi(n) != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(i);
}
var gr = Qf;
function m6(i, t) {
  function e() {
    this.constructor = i;
  }
  e.prototype = t.prototype, i.prototype = new e();
}
function ai(i, t, e, n) {
  this.message = i, this.expected = t, this.found = e, this.location = n, this.name = "SyntaxError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, ai);
}
m6(ai, Error);
ai.buildMessage = function(i, t) {
  var e = {
    literal: function(p) {
      return '"' + s(p.text) + '"';
    },
    class: function(p) {
      var v = "", b;
      for (b = 0; b < p.parts.length; b++)
        v += p.parts[b] instanceof Array ? a(p.parts[b][0]) + "-" + a(p.parts[b][1]) : a(p.parts[b]);
      return "[" + (p.inverted ? "^" : "") + v + "]";
    },
    any: function(p) {
      return "any character";
    },
    end: function(p) {
      return "end of input";
    },
    other: function(p) {
      return p.description;
    }
  };
  function n(d) {
    return d.charCodeAt(0).toString(16).toUpperCase();
  }
  function s(d) {
    return d.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(p) {
      return "\\x0" + n(p);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(p) {
      return "\\x" + n(p);
    });
  }
  function a(d) {
    return d.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(p) {
      return "\\x0" + n(p);
    }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(p) {
      return "\\x" + n(p);
    });
  }
  function l(d) {
    return e[d.type](d);
  }
  function c(d) {
    var p = new Array(d.length), v, b;
    for (v = 0; v < d.length; v++)
      p[v] = l(d[v]);
    if (p.sort(), p.length > 0) {
      for (v = 1, b = 1; v < p.length; v++)
        p[v - 1] !== p[v] && (p[b] = p[v], b++);
      p.length = b;
    }
    switch (p.length) {
      case 1:
        return p[0];
      case 2:
        return p[0] + " or " + p[1];
      default:
        return p.slice(0, -1).join(", ") + ", or " + p[p.length - 1];
    }
  }
  function u(d) {
    return d ? '"' + s(d) + '"' : "end of input";
  }
  return "Expected " + c(i) + " but " + u(t) + " found.";
};
function _6(i, t) {
  t = t !== void 0 ? t : {};
  var e = {}, n = {
    rules: la
  }, s = la, a = function() {
    return Be;
  }, l = function(h) {
    Be.tables.push(h);
  }, c = function(h) {
    Be.refs.push(h);
  }, u = function(h) {
    Be.enums.push(h);
  }, d = function(h) {
    Be.tableGroups.push(h);
  }, p = function(h) {
    Ba += 1, Ba > 1 && aa("Project is already defined"), Be.project = h, Be.tables = Be.tables.concat(h.tables), Be.refs = Be.refs.concat(h.refs), Be.enums = Be.enums.concat(h.enums), Be.tableGroups = Be.tableGroups.concat(h.tableGroups);
  }, v = "{", b = ie("{", !1), y = "}", _ = ie("}", !1), S = function(h, f) {
    return xt({
      name: h ? h[1] : null
    }, f);
  }, E = function(h) {
    var f = [], g = [], w = [], x = [], F = null, D = {};
    return h.forEach(function(V) {
      V.type === "table" ? f.push(V.value) : V.type === "ref" ? g.push(V.value) : V.type === "enum" ? w.push(V.value) : V.type === "table_group" ? x.push(V.value) : V.type === "note" ? F = V.value : D[V.value.name] = V.value.value;
    }), xt({
      tables: f,
      refs: g,
      enums: w,
      tableGroups: x,
      note: F
    }, D);
  }, P = function(h) {
    return {
      type: "note",
      value: h
    };
  }, A = function(h) {
    return {
      type: "table",
      value: h
    };
  }, m = function(h) {
    return {
      type: "ref",
      value: h
    };
  }, C = function(h) {
    return {
      type: "enum",
      value: h
    };
  }, $ = function(h) {
    return {
      type: "table_group",
      value: h
    };
  }, N = function(h) {
    return {
      type: "element",
      value: h
    };
  }, G = ":", T = ie(":", !1), M = function(h, f) {
    return {
      name: h,
      value: f.value
    };
  }, L = function(h, f, g) {
    return {
      name: f,
      schemaName: h,
      tables: g,
      token: Qe()
    };
  }, U = function(h) {
    return h.map(function(f) {
      return {
        name: f[1],
        schemaName: f[0]
      };
    });
  }, B = function(h) {
    var f = h.endpoints[0].schemaName;
    return xt(xt({}, h), {}, {
      schemaName: f
    });
  }, W = function(h, f) {
    var g = {
      name: h ? h[1] : null,
      endpoints: f.endpoints,
      token: Qe()
    };
    return Object.assign(g, f.settings), g;
  }, te = function(h, f, g, w) {
    var x = ja(f), F = [{
      schemaName: h.schemaName,
      tableName: h.tableName,
      fieldNames: h.fieldNames,
      relation: x[0],
      token: Qe()
    }, {
      schemaName: g.schemaName,
      tableName: g.tableName,
      fieldNames: g.fieldNames,
      relation: x[1],
      token: Qe()
    }];
    return {
      endpoints: F,
      settings: w
    };
  }, q = function(h) {
    return typeof h == "string" && (h = [h]), h;
  }, he = function(h) {
    return h;
  }, oe = "(", I = ie("(", !1), K = ")", Y = ie(")", !1), X = function(h, f) {
    var g = [h].concat(f.map(function(w) {
      return w[3];
    }));
    return g;
  }, ee = "[", ue = ie("[", !1), Te = "]", Ne = ie("]", !1), Ce = function(h, f) {
    var g = [h].concat(f.map(function(x) {
      return x[1];
    })), w = {};
    return g.forEach(function(x) {
      x.type === "update" && (w.onUpdate = x.value), x.type === "delete" && (w.onDelete = x.value);
    }), w;
  }, O = function(h) {
    return {
      type: "update",
      value: h
    };
  }, H = function(h) {
    return {
      type: "delete",
      value: h
    };
  }, re = "update:", ve = ie("update:", !0), pe = function(h) {
    return h;
  }, xe = "delete:", Ge = ie("delete:", !0), He = function(h, f, g, w, x) {
    var F = x.fields || [], D = x.indexes || [];
    F.forEach(function(Z) {
      (Z.inline_refs || []).forEach(function(be) {
        var ti = ja(be.relation), Wf = [{
          schemaName: be.schemaName,
          tableName: be.tableName,
          fieldNames: be.fieldNames,
          relation: ti[1],
          token: be.token
        }, {
          schemaName: h,
          tableName: f,
          fieldNames: [Z.name],
          relation: ti[0],
          token: be.token
        }], zf = {
          schemaName: h,
          name: null,
          // no name
          endpoints: Wf,
          token: be.token
        };
        Be.refs.push(zf);
      });
    }), g && (Be.aliases.find(function(Z) {
      return Z.name === g;
    }) && aa('Alias "'.concat(g, '" is already defined')), Be.aliases.push({
      name: g,
      kind: "table",
      value: {
        tableName: f,
        schemaName: h
      }
    }));
    var V = xt({
      name: f,
      schemaName: h,
      alias: g,
      fields: F,
      token: Qe(),
      indexes: D
    }, w);
    return x.note && (V = xt(xt({}, V), {}, {
      note: x.note
    })), V;
  }, me = function(h, f) {
    var g = gr.flatMap(f.filter(function(D) {
      return D.type === "indexes";
    }), function(D) {
      return D.value;
    }), w = f.slice().reverse().find(function(D) {
      return D.type === "note";
    }), x = [];
    if (h.forEach(function(D) {
      D.pk && x.push(D);
    }), x.length > 1) {
      var F = x.map(function(D) {
        return {
          value: D.name,
          type: "column"
        };
      });
      x.forEach(function(D) {
        return delete D.pk;
      }), g.push({
        columns: F,
        token: gr.head(x).token,
        pk: !0
      });
    }
    return {
      fields: h,
      indexes: g,
      note: w ? w.value : null
    };
  }, qe = function(h) {
    return {
      type: "indexes",
      value: h
    };
  }, Ye = function(h, f, g, w, x) {
    var F = {
      name: h,
      type: xt({
        schemaName: f
      }, g),
      token: Qe(),
      inline_refs: []
    };
    return Object.assign.apply(Object, [F].concat(tl(w.map(function(D) {
      return D[1];
    })))), x && Object.assign(F, x[1]), F;
  }, it = function(h, f, g) {
    return {
      name: f,
      schemaName: h,
      token: Qe(),
      values: g.enum_values
    };
  }, yn = function(h) {
    return {
      enum_values: h
    };
  }, wn = function(h, f) {
    var g = {
      name: h,
      token: Qe()
    };
    return Object.assign(g, f), g;
  }, _i = function(h) {
    return {
      note: h
    };
  }, Ft = function(h, f) {
    var g = [h].concat(f.map(function(x) {
      return x[1];
    })), w = {
      inline_refs: []
    };
    return g.forEach(function(x) {
      typeof x == "string" ? (x.toLowerCase() == "not null" && (w.not_null = !0), x.toLowerCase() == "null" && (w.not_null = !1), (x.toLowerCase() == "primary key" || x.toLowerCase() == "pk") && (w.pk = !0), x.toLowerCase() == "unique" && (w.unique = !0), x.toLowerCase() == "increment" && (w.increment = !0)) : (x.type === "note" && (w.note = x.value), x.type === "ref_inline" && w.inline_refs.push(x.value), x.type === "default" && (w.dbdefault = x.value));
    }), w;
  }, Hi = function(h, f) {
    var g = [h].concat(tl(f.map(function(x) {
      return x[1];
    }))), w = {};
    return g.forEach(function(x) {
      typeof x == "string" ? x.startsWith("#") && (w.headerColor = x.toUpperCase()) : x.type === "note" && (w.note = x.value);
    }), w;
  }, vi = function(h) {
    return {
      type: "note",
      value: h
    };
  }, bi = function(h) {
    return h;
  }, yi = "not null", Wi = ie("not null", !0), ut = function(h) {
    return h;
  }, zi = "null", J = ie("null", !0), ne = "primary key", fe = ie("primary key", !0), Se = "pk", Re = ie("pk", !0), We = "unique", Ue = ie("unique", !0), ft = "increment", je = ie("increment", !1), Kt = function(h) {
    return {
      type: "ref_inline",
      value: h
    };
  }, mh = function(h) {
    return {
      type: "default",
      value: h
    };
  }, _h = function(h) {
    return h;
  }, vh = function(h) {
    return h;
  }, bh = function(h) {
    return h;
  }, yh = function(h, f) {
    var g = {
      columns: [h],
      token: Qe()
    };
    return Object.assign(g, f), g;
  }, wh = function(h, f) {
    var g = {
      columns: h,
      token: Qe()
    };
    return Object.assign(g, f), g;
  }, Ch = function(h) {
    var f = {
      value: h,
      type: "column"
    };
    return f;
  }, Ms = "`", Gs = ie("`", !1), Is = /^[^`]/, Ds = lt(["`"], !0, !1), Sh = function(h) {
    return {
      value: h.join(""),
      type: "expression"
    };
  }, Eh = function(h, f) {
    var g = [h].concat(f.map(function(w) {
      return w[2];
    }));
    return g;
  }, xh = function(h, f) {
    var g = [h].concat(f.map(function(x) {
      return x[1];
    })), w = {};
    return g.forEach(function(x) {
      typeof x == "string" ? w[x.toLowerCase()] = !0 : w[x.type] = x.value;
    }), w;
  }, kh = function(h) {
    return {
      type: "name",
      value: h
    };
  }, $h = function(h) {
    return {
      type: "type",
      value: h
    };
  }, Ph = function() {
    return {
      type: "pk",
      value: !0
    };
  }, Th = "name:", Ah = ie("name:", !0), Oh = function(h) {
    return h.value;
  }, Nh = function(h) {
    return h;
  }, Rh = "note", Lh = ie("note", !0), Us = function(h) {
    return {
      value: h.value,
      token: Qe()
    };
  }, Fh = "note:", Mh = ie("note:", !0), Gh = "type:", Ih = ie("type:", !0), Bs = "ref:", Dh = ie("ref:", !1), Uh = function(h, f) {
    return {
      schemaName: f.schemaName,
      tableName: f.tableName,
      fieldNames: [f.fieldName],
      relation: h,
      token: Qe()
    };
  }, Bh = "default:", jh = ie("default:", !0), Vh = function(h) {
    return h;
  }, js = "as", Hh = ie("as", !1), Wh = function(h) {
    return h;
  }, zh = function(h, f) {
    return h + f.join("");
  }, Yh = Ee("project"), Kh = "project", Xh = ie("project", !0), qh = Ee("table"), Qh = "table", Jh = ie("table", !0), Zh = Ee("references"), ec = "ref", tc = ie("ref", !0), ic = Ee("unique"), rc = function() {
    return {
      unique: !0
    };
  }, nc = Ee("PK"), sc = function() {
    return {
      pk: !0
    };
  }, ac = Ee("indexes"), oc = "indexes", lc = ie("indexes", !0), hc = Ee("btree"), cc = "btree", uc = ie("btree", !0), fc = Ee("hash"), dc = "hash", gc = ie("hash", !0), pc = Ee("enum"), mc = "enum", _c = ie("enum", !0), vc = "headercolor", bc = ie("headercolor", !0), yc = Ee("Table Group"), wc = "tablegroup", Cc = ie("TableGroup", !0), Sc = Ee("no action"), Ec = "no action", xc = ie("no action", !0), kc = Ee("restrict"), $c = "restrict", Pc = ie("restrict", !0), Tc = Ee("cascade"), Ac = "cascade", Oc = ie("cascade", !0), Nc = Ee("set null"), Rc = "set null", Lc = ie("set null", !0), Fc = Ee("set default"), Mc = "set default", Gc = ie("set default", !0), Ic = Ee("<>, >, - or <"), Vs = "<>", Dc = ie("<>", !1), Uc = ">", Bc = ie(">", !1), jc = "<", Vc = ie("<", !1), Hs = "-", Ws = ie("-", !1), zs = Ee("valid name"), Yi = function(h) {
    return h.join("");
  }, Ki = /^[^"\n]/, Xi = lt(['"', `
`], !0, !1), Hc = Ee("schema name"), Ct = ".", St = ie(".", !1), Wc = function(h) {
    return h;
  }, zc = function(h, f, g) {
    return {
      schemaName: h,
      tableName: f,
      fieldNames: g
    };
  }, Yc = function(h, f) {
    return {
      schemaName: null,
      tableName: h,
      fieldNames: f
    };
  }, Kc = function(h, f, g) {
    return {
      schemaName: h,
      tableName: f,
      fieldName: g
    };
  }, Xc = function(h, f) {
    return {
      schemaName: null,
      tableName: h,
      fieldName: f
    };
  }, qc = Ee("type"), Qc = function(h, f) {
    return f = f ? f[3] : null, h.toLowerCase() !== "enum" && (h = f ? h + "(" + f + ")" : h), {
      type_name: h,
      args: f
    };
  }, Jc = Ee("expression"), Zc = function(h) {
    return gr.flattenDeep(h).join("");
  }, Ys = ",", Ks = ie(",", !1), qi = ");", Xs = ie(");", !1), Qi = Vu(), eu = function(h) {
    return gr.flattenDeep(h).join("");
  }, tu = /^[',.a-z0-9_+-`]/i, iu = lt(["'", ",", ".", ["a", "z"], ["0", "9"], "_", ["+", "`"]], !1, !0), ru = /^['.a-z0-9_+\-]/i, nu = lt(["'", ".", ["a", "z"], ["0", "9"], "_", "+", "-"], !1, !0), su = /^[[\]]/, au = lt(["[", "]"], !1, !1), ou = Ee("letter, number or underscore"), lu = /^[a-z0-9_]/i, hu = lt([["a", "z"], ["0", "9"], "_"], !1, !0), cu = /^[0-9a-fA-F]/, uu = lt([["0", "9"], ["a", "f"], ["A", "F"]], !1, !1), fu = function(h) {
    return h.toLowerCase();
  }, wi = '"', Ci = ie('"', !1), du = Ee("endline"), gu = "	", pu = ie("	", !1), qs = "//", mu = ie("//", !1), Qs = /^[^\n]/, Js = lt([`
`], !0, !1), Zs = "/*", _u = ie("/*", !1), Xt = "*/", Cn = ie("*/", !1), vu = Ee("comment"), bu = Ee("newline"), ea = `\r
`, yu = ie(`\r
`, !1), ta = `
`, ia = ie(`
`, !1), wu = Ee("whitespace"), Cu = /^[ \t\r\n\r]/, Su = lt([" ", "	", "\r", `
`, "\r"], !1, !1), Eu = " ", xu = ie(" ", !1), ku = "#", $u = ie("#", !1), Pu = function() {
    return "#";
  }, Tu = Ee("string"), ra = function(h) {
    return {
      value: h.join(""),
      type: "string"
    };
  }, qt = "'''", Sn = ie("'''", !1), Au = function(h) {
    var f = h.join(""), g = f.split(/\n|\r\n?/), w = function(Z) {
      for (var be = 0; be < Z.length && Z[be] === " "; )
        be += 1;
      return be;
    }, x = g.filter(function(V) {
      return V.replace(/\s+/g, "");
    }).reduce(function(V, Z) {
      return Math.min(V, w(Z));
    }, Number.MAX_SAFE_INTEGER);
    g = g.map(function(V) {
      return V && V.slice(x);
    });
    var F = function(Z) {
      for (var be = 0; be < Z.length && !Z[be].replace(/\s+/g, ""); )
        be += 1;
      return be;
    };
    g.splice(0, F(g)), g.splice(g.length - F(g.slice().reverse()));
    var D = g.join(`
`);
    return {
      value: D,
      type: "string"
    };
  }, En = "'", xn = ie("'", !1), Si = "\\", Ei = ie("\\", !1), Ou = function() {
    return '"';
  }, kn = function() {
    return ju();
  }, Ji = "\\'", na = ie("\\'", !1), sa = function() {
    return "'";
  }, Nu = function(h) {
    return h.join("");
  }, Ru = function() {
    return "";
  }, Qt = /^[0-9]/, Jt = lt([["0", "9"]], !1, !1), Lu = "true", Fu = ie("true", !0), Mu = "false", Gu = ie("false", !0), Iu = function(h) {
    return {
      type: "boolean",
      value: h
    };
  }, Du = function(h, f) {
    return {
      type: "number",
      value: h ? -f : f
    };
  }, Uu = function(h, f) {
    return parseFloat(h.join("") + "." + f.join(""));
  }, Bu = function(h) {
    return parseInt(h.join(""), 10);
  }, o = 0, j = 0, Zi = [{
    line: 1,
    column: 1
  }], ot = 0, $n = [], k = 0, er;
  if ("startRule" in t) {
    if (!(t.startRule in n))
      throw new Error(`Can't start parsing from rule "` + t.startRule + '".');
    s = n[t.startRule];
  }
  function ju() {
    return i.substring(j, o);
  }
  function Qe() {
    return tr(j, o);
  }
  function aa(r, h) {
    throw h = h !== void 0 ? h : tr(j, o), Wu(r, h);
  }
  function ie(r, h) {
    return {
      type: "literal",
      text: r,
      ignoreCase: h
    };
  }
  function lt(r, h, f) {
    return {
      type: "class",
      parts: r,
      inverted: h,
      ignoreCase: f
    };
  }
  function Vu() {
    return {
      type: "any"
    };
  }
  function Hu() {
    return {
      type: "end"
    };
  }
  function Ee(r) {
    return {
      type: "other",
      description: r
    };
  }
  function oa(r) {
    var h = Zi[r], f;
    if (h)
      return h;
    for (f = r - 1; !Zi[f]; )
      f--;
    for (h = Zi[f], h = {
      line: h.line,
      column: h.column
    }; f < r; )
      i.charCodeAt(f) === 10 ? (h.line++, h.column = 1) : h.column++, f++;
    return Zi[r] = h, h;
  }
  function tr(r, h) {
    var f = oa(r), g = oa(h);
    return {
      start: {
        offset: r,
        line: f.line,
        column: f.column
      },
      end: {
        offset: h,
        line: g.line,
        column: g.column
      }
    };
  }
  function R(r) {
    o < ot || (o > ot && (ot = o, $n = []), $n.push(r));
  }
  function Wu(r, h) {
    return new ai(r, null, null, h);
  }
  function zu(r, h, f) {
    return new ai(ai.buildMessage(r, h), r, h, f);
  }
  function la() {
    var r, h, f;
    for (r = o, h = [], f = ha(); f !== e; )
      h.push(f), f = ha();
    return h !== e && (j = r, h = a()), r = h, r;
  }
  function ha() {
    var r, h;
    return r = o, h = pa(), h !== e && (j = r, h = l(h)), r = h, r === e && (r = o, h = fa(), h !== e && (j = r, h = c(h)), r = h, r === e && (r = o, h = va(), h !== e && (j = r, h = u(h)), r = h, r === e && (r = o, h = ua(), h !== e && (j = r, h = d(h)), r = h, r === e && (r = o, h = Yu(), h !== e && (j = r, h = p(h)), r = h, r === e && (r = $i()))))), r;
  }
  function Yu() {
    var r, h, f, g, w, x, F, D, V;
    return r = o, h = Ef(), h !== e ? (f = o, g = $i(), g !== e ? (w = $e(), w !== e ? (g = [g, w], f = g) : (o = f, f = e)) : (o = f, f = e), f === e && (f = null), f !== e ? (g = z(), g !== e ? (i.charCodeAt(o) === 123 ? (w = v, o++) : (w = e, k === 0 && R(b)), w !== e ? (x = z(), x !== e ? (F = Ku(), F !== e ? (D = z(), D !== e ? (i.charCodeAt(o) === 125 ? (V = y, o++) : (V = e, k === 0 && R(_)), V !== e ? (j = r, h = S(f, F), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Ku() {
    var r, h, f, g;
    if (r = o, h = z(), h !== e) {
      for (f = [], g = ca(); g !== e; )
        f.push(g), g = ca();
      f !== e ? (g = z(), g !== e ? (j = r, h = E(f), r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function ca() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (f = Sa(), f !== e ? (g = z(), g !== e ? (j = r, h = P(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = pa(), f !== e ? (g = z(), g !== e ? (j = r, h = A(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = fa(), f !== e ? (g = z(), g !== e ? (j = r, h = m(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = va(), f !== e ? (g = z(), g !== e ? (j = r, h = C(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = ua(), h !== e ? (f = z(), f !== e ? (j = r, h = $(h), r = h) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = Xu(), f !== e ? (g = z(), g !== e ? (j = r, h = N(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)))))), r;
  }
  function Xu() {
    var r, h, f, g, w, x;
    return r = o, h = $e(), h !== e ? (f = z(), f !== e ? (i.charCodeAt(o) === 58 ? (g = G, o++) : (g = e, k === 0 && R(T)), g !== e ? (w = z(), w !== e ? (x = Pi(), x !== e ? (j = r, h = M(h, x), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function ua() {
    var r, h, f, g, w, x, F, D, V, Z, be;
    if (r = o, h = Nf(), h !== e) {
      if (f = [], g = Q(), g !== e)
        for (; g !== e; )
          f.push(g), g = Q();
      else
        f = e;
      f !== e ? (g = Zt(), g === e && (g = null), g !== e ? (w = $e(), w !== e ? (x = z(), x !== e ? (i.charCodeAt(o) === 123 ? (F = v, o++) : (F = e, k === 0 && R(b)), F !== e ? (D = z(), D !== e ? (V = qu(), V !== e ? (Z = z(), Z !== e ? (i.charCodeAt(o) === 125 ? (be = y, o++) : (be = e, k === 0 && R(_)), be !== e ? (j = r, h = L(g, w, V), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function qu() {
    var r, h, f, g, w, x;
    for (r = o, h = [], f = o, g = Zt(), g === e && (g = null), g !== e ? (w = $e(), w !== e ? (x = $i(), x !== e ? (g = [g, w, x], f = g) : (o = f, f = e)) : (o = f, f = e)) : (o = f, f = e); f !== e; )
      h.push(f), f = o, g = Zt(), g === e && (g = null), g !== e ? (w = $e(), w !== e ? (x = $i(), x !== e ? (g = [g, w, x], f = g) : (o = f, f = e)) : (o = f, f = e)) : (o = f, f = e);
    return h !== e && (j = r, h = U(h)), r = h, r;
  }
  function fa() {
    var r, h;
    return r = o, h = Qu(), h === e && (h = Ju()), h !== e && (j = r, h = B(h)), r = h, r;
  }
  function Qu() {
    var r, h, f, g, w, x, F, D, V;
    return r = o, h = xa(), h !== e ? (f = o, g = $i(), g !== e ? (w = $e(), w !== e ? (g = [g, w], f = g) : (o = f, f = e)) : (o = f, f = e), f === e && (f = null), f !== e ? (g = z(), g !== e ? (i.charCodeAt(o) === 123 ? (w = v, o++) : (w = e, k === 0 && R(b)), w !== e ? (x = z(), x !== e ? (F = da(), F !== e ? (D = z(), D !== e ? (i.charCodeAt(o) === 125 ? (V = y, o++) : (V = e, k === 0 && R(_)), V !== e ? (j = r, h = W(f, F), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Ju() {
    var r, h, f, g, w, x, F;
    if (r = o, h = xa(), h !== e) {
      if (f = o, g = [], w = Q(), w !== e)
        for (; w !== e; )
          g.push(w), w = Q();
      else
        g = e;
      if (g !== e ? (w = $e(), w !== e ? (g = [g, w], f = g) : (o = f, f = e)) : (o = f, f = e), f === e && (f = null), f !== e) {
        for (g = [], w = Q(); w !== e; )
          g.push(w), w = Q();
        if (g !== e)
          if (i.charCodeAt(o) === 58 ? (w = G, o++) : (w = e, k === 0 && R(T)), w !== e) {
            for (x = [], F = Q(); F !== e; )
              x.push(F), F = Q();
            x !== e ? (F = da(), F !== e ? (j = r, h = W(f, F), r = h) : (o = r, r = e)) : (o = r, r = e);
          } else
            o = r, r = e;
        else
          o = r, r = e;
      } else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function da() {
    var r, h, f, g, w, x, F, D;
    if (r = o, h = Ra(), h !== e) {
      if (f = [], g = Q(), g !== e)
        for (; g !== e; )
          f.push(g), g = Q();
      else
        f = e;
      if (f !== e)
        if (g = Na(), g !== e) {
          if (w = [], x = Q(), x !== e)
            for (; x !== e; )
              w.push(x), x = Q();
          else
            w = e;
          if (w !== e)
            if (x = Ra(), x !== e) {
              for (F = [], D = Q(); D !== e; )
                F.push(D), D = Q();
              F !== e ? (D = ef(), D === e && (D = null), D !== e ? (j = r, h = te(h, g, x, D), r = h) : (o = r, r = e)) : (o = r, r = e);
            } else
              o = r, r = e;
          else
            o = r, r = e;
        } else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function ga() {
    var r, h;
    return r = o, h = ir(), h === e && (h = Zu()), h !== e && (j = r, h = q(h)), r = h, r;
  }
  function ir() {
    var r, h;
    return r = o, h = $e(), h !== e && (j = r, h = he(h)), r = h, r;
  }
  function Zu() {
    var r, h, f, g, w, x, F, D, V, Z;
    if (r = o, i.charCodeAt(o) === 40 ? (h = oe, o++) : (h = e, k === 0 && R(I)), h !== e) {
      for (f = [], g = Q(); g !== e; )
        f.push(g), g = Q();
      if (f !== e)
        if (g = ir(), g !== e) {
          for (w = [], x = o, F = [], D = Q(); D !== e; )
            F.push(D), D = Q();
          if (F !== e)
            if (D = Je(), D !== e) {
              for (V = [], Z = Q(); Z !== e; )
                V.push(Z), Z = Q();
              V !== e ? (Z = ir(), Z !== e ? (F = [F, D, V, Z], x = F) : (o = x, x = e)) : (o = x, x = e);
            } else
              o = x, x = e;
          else
            o = x, x = e;
          for (; x !== e; ) {
            for (w.push(x), x = o, F = [], D = Q(); D !== e; )
              F.push(D), D = Q();
            if (F !== e)
              if (D = Je(), D !== e) {
                for (V = [], Z = Q(); Z !== e; )
                  V.push(Z), Z = Q();
                V !== e ? (Z = ir(), Z !== e ? (F = [F, D, V, Z], x = F) : (o = x, x = e)) : (o = x, x = e);
              } else
                o = x, x = e;
            else
              o = x, x = e;
          }
          if (w !== e) {
            for (x = [], F = Q(); F !== e; )
              x.push(F), F = Q();
            x !== e ? (i.charCodeAt(o) === 41 ? (F = K, o++) : (F = e, k === 0 && R(Y)), F !== e ? (j = r, h = X(g, w), r = h) : (o = r, r = e)) : (o = r, r = e);
          } else
            o = r, r = e;
        } else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function ef() {
    var r, h, f, g, w, x, F;
    if (r = o, i.charCodeAt(o) === 91 ? (h = ee, o++) : (h = e, k === 0 && R(ue)), h !== e)
      if (f = Pn(), f !== e) {
        for (g = [], w = o, x = Je(), x !== e ? (F = Pn(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e); w !== e; )
          g.push(w), w = o, x = Je(), x !== e ? (F = Pn(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e);
        g !== e ? (i.charCodeAt(o) === 93 ? (w = Te, o++) : (w = e, k === 0 && R(Ne)), w !== e ? (j = r, h = Ce(f, g), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function Pn() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (f = tf(), f !== e ? (g = z(), g !== e ? (j = r, h = O(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = rf(), f !== e ? (g = z(), g !== e ? (j = r, h = H(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function tf() {
    var r, h, f, g;
    return r = o, i.substr(o, 7).toLowerCase() === re ? (h = i.substr(o, 7), o += 7) : (h = e, k === 0 && R(ve)), h !== e ? (f = z(), f !== e ? (g = $a(), g === e && (g = Pa(), g === e && (g = Ta(), g === e && (g = Aa(), g === e && (g = Oa())))), g !== e ? (j = r, h = pe(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function rf() {
    var r, h, f, g;
    return r = o, i.substr(o, 7).toLowerCase() === xe ? (h = i.substr(o, 7), o += 7) : (h = e, k === 0 && R(Ge)), h !== e ? (f = z(), f !== e ? (g = $a(), g === e && (g = Pa(), g === e && (g = Ta(), g === e && (g = Aa(), g === e && (g = Oa())))), g !== e ? (j = r, h = pe(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function pa() {
    var r, h, f, g, w, x, F, D, V, Z, be, ti;
    if (r = o, h = xf(), h !== e) {
      if (f = [], g = Q(), g !== e)
        for (; g !== e; )
          f.push(g), g = Q();
      else
        f = e;
      if (f !== e)
        if (g = Zt(), g === e && (g = null), g !== e)
          if (w = $e(), w !== e)
            if (x = bf(), x === e && (x = null), x !== e) {
              for (F = [], D = Q(); D !== e; )
                F.push(D), D = Q();
              F !== e ? (D = lf(), D === e && (D = null), D !== e ? (V = z(), V !== e ? (i.charCodeAt(o) === 123 ? (Z = v, o++) : (Z = e, k === 0 && R(b)), Z !== e ? (be = nf(), be !== e ? (i.charCodeAt(o) === 125 ? (ti = y, o++) : (ti = e, k === 0 && R(_)), ti !== e ? (j = r, h = He(g, w, x, D, be), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e);
            } else
              o = r, r = e;
          else
            o = r, r = e;
        else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function nf() {
    var r, h, f, g, w, x;
    if (r = o, h = z(), h !== e) {
      if (f = [], g = _a(), g !== e)
        for (; g !== e; )
          f.push(g), g = _a();
      else
        f = e;
      if (f !== e)
        if (g = z(), g !== e) {
          for (w = [], x = ma(); x !== e; )
            w.push(x), x = ma();
          w !== e ? (x = z(), x !== e ? (j = r, h = me(f, w), r = h) : (o = r, r = e)) : (o = r, r = e);
        } else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function ma() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (f = hf(), f !== e ? (g = z(), g !== e ? (j = r, h = qe(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = Sa(), f !== e ? (g = z(), g !== e ? (j = r, h = P(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function _a() {
    var r, h, f, g, w, x, F, D, V, Z, be;
    if (r = o, h = z(), h !== e)
      if (f = $e(), f !== e) {
        if (g = [], w = Q(), w !== e)
          for (; w !== e; )
            g.push(w), w = Q();
        else
          g = e;
        if (g !== e)
          if (w = Zt(), w === e && (w = null), w !== e)
            if (x = Ff(), x !== e) {
              if (F = [], D = o, V = [], Z = Q(), Z !== e)
                for (; Z !== e; )
                  V.push(Z), Z = Q();
              else
                V = e;
              for (V !== e ? (Z = Ea(), Z !== e ? (V = [V, Z], D = V) : (o = D, D = e)) : (o = D, D = e); D !== e; ) {
                if (F.push(D), D = o, V = [], Z = Q(), Z !== e)
                  for (; Z !== e; )
                    V.push(Z), Z = Q();
                else
                  V = e;
                V !== e ? (Z = Ea(), Z !== e ? (V = [V, Z], D = V) : (o = D, D = e)) : (o = D, D = e);
              }
              if (F !== e) {
                if (D = o, V = [], Z = Q(), Z !== e)
                  for (; Z !== e; )
                    V.push(Z), Z = Q();
                else
                  V = e;
                if (V !== e ? (Z = of(), Z !== e ? (V = [V, Z], D = V) : (o = D, D = e)) : (o = D, D = e), D === e && (D = null), D !== e) {
                  for (V = [], Z = Q(); Z !== e; )
                    V.push(Z), Z = Q();
                  V !== e ? (Z = ei(), Z === e && (Z = null), Z !== e ? (be = sr(), be !== e ? (j = r, h = Ye(f, w, x, F, D), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e);
                } else
                  o = r, r = e;
              } else
                o = r, r = e;
            } else
              o = r, r = e;
          else
            o = r, r = e;
        else
          o = r, r = e;
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function va() {
    var r, h, f, g, w, x, F, D, V;
    if (r = o, h = Af(), h !== e) {
      if (f = [], g = Q(), g !== e)
        for (; g !== e; )
          f.push(g), g = Q();
      else
        f = e;
      f !== e ? (g = Zt(), g === e && (g = null), g !== e ? (w = $e(), w !== e ? (x = z(), x !== e ? (i.charCodeAt(o) === 123 ? (F = v, o++) : (F = e, k === 0 && R(b)), F !== e ? (D = sf(), D !== e ? (i.charCodeAt(o) === 125 ? (V = y, o++) : (V = e, k === 0 && R(_)), V !== e ? (j = r, h = it(g, w, D), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function sf() {
    var r, h, f, g;
    if (r = o, h = z(), h !== e) {
      if (f = [], g = ba(), g !== e)
        for (; g !== e; )
          f.push(g), g = ba();
      else
        f = e;
      f !== e ? (g = z(), g !== e ? (j = r, h = yn(f), r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function ba() {
    var r, h, f, g, w, x, F, D;
    if (r = o, h = z(), h !== e)
      if (f = $e(), f !== e) {
        for (g = [], w = Q(); w !== e; )
          g.push(w), w = Q();
        if (g !== e)
          if (w = af(), w === e && (w = null), w !== e) {
            for (x = [], F = Q(); F !== e; )
              x.push(F), F = Q();
            x !== e ? (F = ei(), F === e && (F = null), F !== e ? (D = sr(), D !== e ? (j = r, h = wn(f, w), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e);
          } else
            o = r, r = e;
        else
          o = r, r = e;
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function af() {
    var r, h, f, g, w, x;
    return r = o, i.charCodeAt(o) === 91 ? (h = ee, o++) : (h = e, k === 0 && R(ue)), h !== e ? (f = z(), f !== e ? (g = xi(), g !== e ? (w = z(), w !== e ? (i.charCodeAt(o) === 93 ? (x = Te, o++) : (x = e, k === 0 && R(Ne)), x !== e ? (j = r, h = _i(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function of() {
    var r, h, f, g, w, x, F;
    if (r = o, i.charCodeAt(o) === 91 ? (h = ee, o++) : (h = e, k === 0 && R(ue)), h !== e)
      if (f = An(), f !== e) {
        for (g = [], w = o, x = Je(), x !== e ? (F = An(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e); w !== e; )
          g.push(w), w = o, x = Je(), x !== e ? (F = An(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e);
        g !== e ? (i.charCodeAt(o) === 93 ? (w = Te, o++) : (w = e, k === 0 && R(Ne)), w !== e ? (j = r, h = Ft(f, g), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function lf() {
    var r, h, f, g, w, x, F;
    if (r = o, i.charCodeAt(o) === 91 ? (h = ee, o++) : (h = e, k === 0 && R(ue)), h !== e)
      if (f = Tn(), f !== e) {
        for (g = [], w = o, x = Je(), x !== e ? (F = Tn(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e); w !== e; )
          g.push(w), w = o, x = Je(), x !== e ? (F = Tn(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e);
        g !== e ? (i.charCodeAt(o) === 93 ? (w = Te, o++) : (w = e, k === 0 && R(Ne)), w !== e ? (j = r, h = Hi(f, g), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function Tn() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (f = xi(), f !== e ? (g = z(), g !== e ? (j = r, h = vi(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = yf(), f !== e ? (g = z(), g !== e ? (j = r, h = bi(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function An() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (i.substr(o, 8).toLowerCase() === yi ? (f = i.substr(o, 8), o += 8) : (f = e, k === 0 && R(Wi)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (i.substr(o, 4).toLowerCase() === zi ? (f = i.substr(o, 4), o += 4) : (f = e, k === 0 && R(J)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (i.substr(o, 11).toLowerCase() === ne ? (f = i.substr(o, 11), o += 11) : (f = e, k === 0 && R(fe)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (i.substr(o, 2).toLowerCase() === Se ? (f = i.substr(o, 2), o += 2) : (f = e, k === 0 && R(Re)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (i.substr(o, 6).toLowerCase() === We ? (f = i.substr(o, 6), o += 6) : (f = e, k === 0 && R(Ue)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (i.substr(o, 9) === ft ? (f = ft, o += 9) : (f = e, k === 0 && R(je)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = xi(), f !== e ? (g = z(), g !== e ? (j = r, h = vi(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = mf(), f !== e ? (g = z(), g !== e ? (j = r, h = Kt(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = _f(), f !== e ? (g = z(), g !== e ? (j = r, h = mh(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e))))))))), r;
  }
  function hf() {
    var r, h, f, g, w, x, F;
    return r = o, h = z(), h !== e ? (f = $f(), f !== e ? (g = z(), g !== e ? (i.charCodeAt(o) === 123 ? (w = v, o++) : (w = e, k === 0 && R(b)), w !== e ? (x = cf(), x !== e ? (i.charCodeAt(o) === 125 ? (F = y, o++) : (F = e, k === 0 && R(_)), F !== e ? (j = r, h = _h(x), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function cf() {
    var r, h, f, g;
    if (r = o, h = z(), h !== e) {
      if (f = [], g = ya(), g !== e)
        for (; g !== e; )
          f.push(g), g = ya();
      else
        f = e;
      f !== e ? (g = z(), g !== e ? (j = r, h = vh(f), r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function ya() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (f = uf(), f === e && (f = ff()), f !== e ? (g = z(), g !== e ? (j = r, h = bh(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function uf() {
    var r, h, f, g, w;
    if (r = o, h = z(), h !== e)
      if (f = rr(), f !== e) {
        for (g = [], w = Q(); w !== e; )
          g.push(w), w = Q();
        g !== e ? (w = Ca(), w === e && (w = null), w !== e ? (j = r, h = yh(f, w), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function ff() {
    var r, h, f, g, w;
    if (r = o, h = z(), h !== e)
      if (f = df(), f !== e) {
        for (g = [], w = Q(); w !== e; )
          g.push(w), w = Q();
        g !== e ? (w = Ca(), w === e && (w = null), w !== e ? (j = r, h = wh(f, w), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function rr() {
    var r, h, f, g;
    if (r = o, h = $e(), h !== e) {
      for (f = [], g = Q(); g !== e; )
        f.push(g), g = Q();
      f !== e ? (j = r, h = Ch(h), r = h) : (o = r, r = e);
    } else
      o = r, r = e;
    return r === e && (r = wa()), r;
  }
  function wa() {
    var r, h, f, g;
    if (r = o, i.charCodeAt(o) === 96 ? (h = Ms, o++) : (h = e, k === 0 && R(Gs)), h !== e) {
      for (f = [], Is.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Ds)); g !== e; )
        f.push(g), Is.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Ds));
      f !== e ? (i.charCodeAt(o) === 96 ? (g = Ms, o++) : (g = e, k === 0 && R(Gs)), g !== e ? (j = r, h = Sh(f), r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function df() {
    var r, h, f, g, w, x, F, D, V;
    if (r = o, i.charCodeAt(o) === 40 ? (h = oe, o++) : (h = e, k === 0 && R(I)), h !== e) {
      for (f = [], g = Q(); g !== e; )
        f.push(g), g = Q();
      if (f !== e)
        if (g = rr(), g !== e) {
          if (w = [], x = o, F = Je(), F !== e) {
            for (D = [], V = Q(); V !== e; )
              D.push(V), V = Q();
            D !== e ? (V = rr(), V !== e ? (F = [F, D, V], x = F) : (o = x, x = e)) : (o = x, x = e);
          } else
            o = x, x = e;
          for (; x !== e; )
            if (w.push(x), x = o, F = Je(), F !== e) {
              for (D = [], V = Q(); V !== e; )
                D.push(V), V = Q();
              D !== e ? (V = rr(), V !== e ? (F = [F, D, V], x = F) : (o = x, x = e)) : (o = x, x = e);
            } else
              o = x, x = e;
          w !== e ? (i.charCodeAt(o) === 41 ? (x = K, o++) : (x = e, k === 0 && R(Y)), x !== e ? (j = r, h = Eh(g, w), r = h) : (o = r, r = e)) : (o = r, r = e);
        } else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function Ca() {
    var r, h, f, g, w, x, F;
    if (r = o, i.charCodeAt(o) === 91 ? (h = ee, o++) : (h = e, k === 0 && R(ue)), h !== e)
      if (f = On(), f !== e) {
        for (g = [], w = o, x = Je(), x !== e ? (F = On(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e); w !== e; )
          g.push(w), w = o, x = Je(), x !== e ? (F = On(), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e);
        g !== e ? (i.charCodeAt(o) === 93 ? (w = Te, o++) : (w = e, k === 0 && R(Ne)), w !== e ? (j = r, h = xh(f, g), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function On() {
    var r, h, f, g;
    return r = o, h = z(), h !== e ? (i.substr(o, 6).toLowerCase() === We ? (f = i.substr(o, 6), o += 6) : (f = e, k === 0 && R(Ue)), f !== e ? (g = z(), g !== e ? (j = r, h = ut(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = gf(), f !== e ? (g = z(), g !== e ? (j = r, h = kh(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = pf(), f !== e ? (g = z(), g !== e ? (j = r, h = $h(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = xi(), f !== e ? (g = z(), g !== e ? (j = r, h = vi(f), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = z(), h !== e ? (f = ka(), f !== e ? (g = z(), g !== e ? (j = r, h = Ph(), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e))))), r;
  }
  function gf() {
    var r, h, f, g;
    return r = o, i.substr(o, 5).toLowerCase() === Th ? (h = i.substr(o, 5), o += 5) : (h = e, k === 0 && R(Ah)), h !== e ? (f = z(), f !== e ? (g = Pi(), g !== e ? (j = r, h = Oh(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Sa() {
    var r, h, f, g, w, x, F, D;
    return r = o, h = xi(), h !== e && (j = r, h = Nh(h)), r = h, r === e && (r = o, i.substr(o, 4).toLowerCase() === Rh ? (h = i.substr(o, 4), o += 4) : (h = e, k === 0 && R(Lh)), h !== e ? (f = z(), f !== e ? (i.charCodeAt(o) === 123 ? (g = v, o++) : (g = e, k === 0 && R(b)), g !== e ? (w = z(), w !== e ? (x = Pi(), x !== e ? (F = z(), F !== e ? (i.charCodeAt(o) === 125 ? (D = y, o++) : (D = e, k === 0 && R(_)), D !== e ? (j = r, h = Us(x), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function xi() {
    var r, h, f, g;
    return r = o, i.substr(o, 5).toLowerCase() === Fh ? (h = i.substr(o, 5), o += 5) : (h = e, k === 0 && R(Mh)), h !== e ? (f = z(), f !== e ? (g = Pi(), g !== e ? (j = r, h = Us(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function pf() {
    var r, h, f, g;
    return r = o, i.substr(o, 5).toLowerCase() === Gh ? (h = i.substr(o, 5), o += 5) : (h = e, k === 0 && R(Ih)), h !== e ? (f = z(), f !== e ? (g = Pf(), g === e && (g = Tf()), g !== e ? (j = r, h = pe(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function mf() {
    var r, h, f, g, w, x;
    if (r = o, i.substr(o, 4) === Bs ? (h = Bs, o += 4) : (h = e, k === 0 && R(Dh)), h !== e) {
      for (f = [], g = Q(); g !== e; )
        f.push(g), g = Q();
      if (f !== e)
        if (g = Na(), g !== e) {
          if (w = [], x = Q(), x !== e)
            for (; x !== e; )
              w.push(x), x = Q();
          else
            w = e;
          w !== e ? (x = Rf(), x !== e ? (j = r, h = Uh(g, x), r = h) : (o = r, r = e)) : (o = r, r = e);
        } else
          o = r, r = e;
      else
        o = r, r = e;
    } else
      o = r, r = e;
    return r;
  }
  function _f() {
    var r, h, f, g;
    return r = o, i.substr(o, 8).toLowerCase() === Bh ? (h = i.substr(o, 8), o += 8) : (h = e, k === 0 && R(jh)), h !== e ? (f = z(), f !== e ? (g = vf(), g !== e ? (j = r, h = Vh(g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function vf() {
    var r;
    return r = Pi(), r === e && (r = wa(), r === e && (r = Bf(), r === e && (r = jf()))), r;
  }
  function bf() {
    var r, h, f, g, w;
    if (r = o, h = [], f = Q(), f !== e)
      for (; f !== e; )
        h.push(f), f = Q();
    else
      h = e;
    if (h !== e)
      if (i.substr(o, 2) === js ? (f = js, o += 2) : (f = e, k === 0 && R(Hh)), f !== e) {
        if (g = [], w = Q(), w !== e)
          for (; w !== e; )
            g.push(w), w = Q();
        else
          g = e;
        g !== e ? (w = $e(), w !== e ? (j = r, h = Wh(w), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function yf() {
    var r, h, f, g, w, x, F, D;
    return r = o, h = z(), h !== e ? (f = Of(), f !== e ? (i.charCodeAt(o) === 58 ? (g = G, o++) : (g = e, k === 0 && R(T)), g !== e ? (w = z(), w !== e ? (x = Uf(), x !== e ? (F = wf(), F !== e ? (D = z(), D !== e ? (j = r, h = zh(x, F), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function wf() {
    var r;
    return r = Sf(), r === e && (r = Cf()), r;
  }
  function Cf() {
    var r, h, f, g;
    return r = o, h = dt(), h !== e ? (f = dt(), f !== e ? (g = dt(), g !== e ? (h = [h, f, g], r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Sf() {
    var r, h, f, g, w, x, F;
    return r = o, h = dt(), h !== e ? (f = dt(), f !== e ? (g = dt(), g !== e ? (w = dt(), w !== e ? (x = dt(), x !== e ? (F = dt(), F !== e ? (h = [h, f, g, w, x, F], r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Ea() {
    var r;
    return r = kf(), r === e && (r = ka()), r;
  }
  function Ef() {
    var r;
    return k++, i.substr(o, 7).toLowerCase() === Kh ? (r = i.substr(o, 7), o += 7) : (r = e, k === 0 && R(Xh)), k--, r === e && k === 0 && R(Yh), r;
  }
  function xf() {
    var r;
    return k++, i.substr(o, 5).toLowerCase() === Qh ? (r = i.substr(o, 5), o += 5) : (r = e, k === 0 && R(Jh)), k--, r === e && k === 0 && R(qh), r;
  }
  function xa() {
    var r;
    return k++, i.substr(o, 3).toLowerCase() === ec ? (r = i.substr(o, 3), o += 3) : (r = e, k === 0 && R(tc)), k--, r === e && k === 0 && R(Zh), r;
  }
  function kf() {
    var r, h;
    return k++, r = o, i.substr(o, 6).toLowerCase() === We ? (h = i.substr(o, 6), o += 6) : (h = e, k === 0 && R(Ue)), h !== e && (j = r, h = rc()), r = h, k--, r === e && (h = e, k === 0 && R(ic)), r;
  }
  function ka() {
    var r, h;
    return k++, r = o, i.substr(o, 2).toLowerCase() === Se ? (h = i.substr(o, 2), o += 2) : (h = e, k === 0 && R(Re)), h !== e && (j = r, h = sc()), r = h, k--, r === e && (h = e, k === 0 && R(nc)), r;
  }
  function $f() {
    var r;
    return k++, i.substr(o, 7).toLowerCase() === oc ? (r = i.substr(o, 7), o += 7) : (r = e, k === 0 && R(lc)), k--, r === e && k === 0 && R(ac), r;
  }
  function Pf() {
    var r;
    return k++, i.substr(o, 5).toLowerCase() === cc ? (r = i.substr(o, 5), o += 5) : (r = e, k === 0 && R(uc)), k--, r === e && k === 0 && R(hc), r;
  }
  function Tf() {
    var r;
    return k++, i.substr(o, 4).toLowerCase() === dc ? (r = i.substr(o, 4), o += 4) : (r = e, k === 0 && R(gc)), k--, r === e && k === 0 && R(fc), r;
  }
  function Af() {
    var r;
    return k++, i.substr(o, 4).toLowerCase() === mc ? (r = i.substr(o, 4), o += 4) : (r = e, k === 0 && R(_c)), k--, r === e && k === 0 && R(pc), r;
  }
  function Of() {
    var r;
    return i.substr(o, 11).toLowerCase() === vc ? (r = i.substr(o, 11), o += 11) : (r = e, k === 0 && R(bc)), r;
  }
  function Nf() {
    var r;
    return k++, i.substr(o, 10).toLowerCase() === wc ? (r = i.substr(o, 10), o += 10) : (r = e, k === 0 && R(Cc)), k--, r === e && k === 0 && R(yc), r;
  }
  function $a() {
    var r;
    return k++, i.substr(o, 9).toLowerCase() === Ec ? (r = i.substr(o, 9), o += 9) : (r = e, k === 0 && R(xc)), k--, r === e && k === 0 && R(Sc), r;
  }
  function Pa() {
    var r;
    return k++, i.substr(o, 8).toLowerCase() === $c ? (r = i.substr(o, 8), o += 8) : (r = e, k === 0 && R(Pc)), k--, r === e && k === 0 && R(kc), r;
  }
  function Ta() {
    var r;
    return k++, i.substr(o, 7).toLowerCase() === Ac ? (r = i.substr(o, 7), o += 7) : (r = e, k === 0 && R(Oc)), k--, r === e && k === 0 && R(Tc), r;
  }
  function Aa() {
    var r;
    return k++, i.substr(o, 8).toLowerCase() === Rc ? (r = i.substr(o, 8), o += 8) : (r = e, k === 0 && R(Lc)), k--, r === e && k === 0 && R(Nc), r;
  }
  function Oa() {
    var r;
    return k++, i.substr(o, 11).toLowerCase() === Mc ? (r = i.substr(o, 11), o += 11) : (r = e, k === 0 && R(Gc)), k--, r === e && k === 0 && R(Fc), r;
  }
  function Na() {
    var r;
    return k++, i.substr(o, 2) === Vs ? (r = Vs, o += 2) : (r = e, k === 0 && R(Dc)), r === e && (i.charCodeAt(o) === 62 ? (r = Uc, o++) : (r = e, k === 0 && R(Bc)), r === e && (i.charCodeAt(o) === 60 ? (r = jc, o++) : (r = e, k === 0 && R(Vc)), r === e && (i.charCodeAt(o) === 45 ? (r = Hs, o++) : (r = e, k === 0 && R(Ws))))), k--, r === e && k === 0 && R(Ic), r;
  }
  function $e() {
    var r, h, f, g;
    if (k++, r = o, h = [], f = ki(), f !== e)
      for (; f !== e; )
        h.push(f), f = ki();
    else
      h = e;
    if (h !== e && (j = r, h = Yi(h)), r = h, r === e)
      if (r = o, h = nr(), h !== e) {
        if (f = [], Ki.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Xi)), g !== e)
          for (; g !== e; )
            f.push(g), Ki.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Xi));
        else
          f = e;
        f !== e ? (g = nr(), g !== e ? (j = r, h = Yi(f), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    return k--, r === e && (h = e, k === 0 && R(zs)), r;
  }
  function Zt() {
    var r, h, f;
    return k++, r = o, h = $e(), h !== e ? (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e ? (j = r, h = Wc(h), r = h) : (o = r, r = e)) : (o = r, r = e), k--, r === e && (h = e, k === 0 && R(Hc)), r;
  }
  function Ra() {
    var r, h, f, g, w, x;
    return r = o, h = $e(), h !== e ? (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e ? (g = $e(), g !== e ? (i.charCodeAt(o) === 46 ? (w = Ct, o++) : (w = e, k === 0 && R(St)), w !== e ? (x = ga(), x !== e ? (j = r, h = zc(h, g, x), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = $e(), h !== e ? (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e ? (g = ga(), g !== e ? (j = r, h = Yc(h, g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function Rf() {
    var r, h, f, g, w, x;
    return r = o, h = $e(), h !== e ? (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e ? (g = $e(), g !== e ? (i.charCodeAt(o) === 46 ? (w = Ct, o++) : (w = e, k === 0 && R(St)), w !== e ? (x = $e(), x !== e ? (j = r, h = Kc(h, g, x), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = $e(), h !== e ? (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e ? (g = $e(), g !== e ? (j = r, h = Xc(h, g), r = h) : (o = r, r = e)) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function Lf() {
    var r, h, f, g;
    if (k++, r = o, h = [], f = Ga(), f !== e)
      for (; f !== e; )
        h.push(f), f = Ga();
    else
      h = e;
    if (h !== e && (j = r, h = Yi(h)), r = h, r === e)
      if (r = o, h = nr(), h !== e) {
        if (f = [], Ki.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Xi)), g !== e)
          for (; g !== e; )
            f.push(g), Ki.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Xi));
        else
          f = e;
        f !== e ? (g = nr(), g !== e ? (j = r, h = Yi(f), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
    return k--, r === e && (h = e, k === 0 && R(zs)), r;
  }
  function Ff() {
    var r, h, f, g, w, x, F, D, V;
    if (k++, r = o, h = Lf(), h !== e) {
      for (f = o, g = [], w = Q(); w !== e; )
        g.push(w), w = Q();
      if (g !== e)
        if (i.charCodeAt(o) === 40 ? (w = oe, o++) : (w = e, k === 0 && R(I)), w !== e) {
          for (x = [], F = Q(); F !== e; )
            x.push(F), F = Q();
          if (x !== e)
            if (F = Nn(), F !== e) {
              for (D = [], V = Q(); V !== e; )
                D.push(V), V = Q();
              D !== e ? (i.charCodeAt(o) === 41 ? (V = K, o++) : (V = e, k === 0 && R(Y)), V !== e ? (g = [g, w, x, F, D, V], f = g) : (o = f, f = e)) : (o = f, f = e);
            } else
              o = f, f = e;
          else
            o = f, f = e;
        } else
          o = f, f = e;
      else
        o = f, f = e;
      f === e && (f = null), f !== e ? (j = r, h = Qc(h, f), r = h) : (o = r, r = e);
    } else
      o = r, r = e;
    return k--, r === e && (h = e, k === 0 && R(qc)), r;
  }
  function Nn() {
    var r, h, f;
    for (k++, r = o, h = [], f = La(); f !== e; )
      h.push(f), f = La();
    return h !== e && (j = r, h = Zc(h)), r = h, k--, r === e && (h = e, k === 0 && R(Jc)), r;
  }
  function La() {
    var r, h, f, g, w, x, F;
    if (r = o, h = o, f = [], g = ki(), g !== e)
      for (; g !== e; )
        f.push(g), g = ki();
    else
      f = e;
    if (f !== e) {
      for (g = [], w = Q(); w !== e; )
        g.push(w), w = Q();
      g !== e ? (i.charCodeAt(o) === 40 ? (w = oe, o++) : (w = e, k === 0 && R(I)), w !== e ? (x = Nn(), x !== e ? (i.charCodeAt(o) === 41 ? (F = K, o++) : (F = e, k === 0 && R(Y)), F !== e ? (f = [f, g, w, x, F], h = f) : (o = h, h = e)) : (o = h, h = e)) : (o = h, h = e)) : (o = h, h = e);
    } else
      o = h, h = e;
    if (h === e && (h = o, i.charCodeAt(o) === 40 ? (f = oe, o++) : (f = e, k === 0 && R(I)), f !== e ? (g = Nn(), g !== e ? (i.charCodeAt(o) === 41 ? (w = K, o++) : (w = e, k === 0 && R(Y)), w !== e ? (f = [f, g, w], h = f) : (o = h, h = e)) : (o = h, h = e)) : (o = h, h = e), h === e)) {
      if (h = o, f = [], g = Ma(), g !== e)
        for (; g !== e; )
          f.push(g), g = Ma();
      else
        f = e;
      if (f !== e) {
        for (g = o, k++, w = [], x = Q(); x !== e; )
          w.push(x), x = Q();
        w === e && (i.charCodeAt(o) === 44 ? (w = Ys, o++) : (w = e, k === 0 && R(Ks)), w === e && (i.substr(o, 2) === qi ? (w = qi, o += 2) : (w = e, k === 0 && R(Xs)), w === e && (w = o, x = Mf(), x !== e ? (i.substr(o, 2) === qi ? (F = qi, o += 2) : (F = e, k === 0 && R(Xs)), F !== e ? (x = [x, F], w = x) : (o = w, w = e)) : (o = w, w = e)))), k--, w !== e ? (o = g, g = void 0) : g = e, g !== e ? (f = [f, g], h = f) : (o = h, h = e);
      } else
        o = h, h = e;
      if (h === e) {
        if (h = o, f = [], g = Fa(), g !== e)
          for (; g !== e; )
            f.push(g), g = Fa();
        else
          f = e;
        f !== e ? (g = o, k++, i.length > o ? (w = i.charAt(o), o++) : (w = e, k === 0 && R(Qi)), k--, w !== e ? (o = g, g = void 0) : g = e, g !== e ? (f = [f, g], h = f) : (o = h, h = e)) : (o = h, h = e);
      }
    }
    return h !== e && (j = r, h = eu(h)), r = h, r;
  }
  function Fa() {
    var r;
    return tu.test(i.charAt(o)) ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(iu)), r === e && (r = Q(), r === e && (r = sr(), r === e && (r = Gf()))), r;
  }
  function Ma() {
    var r;
    return ru.test(i.charAt(o)) ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(nu)), r;
  }
  function Ga() {
    var r;
    return r = ki(), r === e && (su.test(i.charAt(o)) ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(au))), r;
  }
  function ki() {
    var r;
    return k++, lu.test(i.charAt(o)) ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(hu)), k--, r === e && k === 0 && R(ou), r;
  }
  function dt() {
    var r, h;
    return r = o, cu.test(i.charAt(o)) ? (h = i.charAt(o), o++) : (h = e, k === 0 && R(uu)), h !== e && (j = r, h = fu(h)), r = h, r;
  }
  function nr() {
    var r;
    return i.charCodeAt(o) === 34 ? (r = wi, o++) : (r = e, k === 0 && R(Ci)), r;
  }
  function z() {
    var r, h;
    for (r = [], h = ei(), h === e && (h = ar()); h !== e; )
      r.push(h), h = ei(), h === e && (h = ar());
    return r;
  }
  function $i() {
    var r, h;
    if (r = [], h = ei(), h === e && (h = ar()), h !== e)
      for (; h !== e; )
        r.push(h), h = ei(), h === e && (h = ar());
    else
      r = e;
    return r;
  }
  function Mf() {
    var r, h, f;
    for (k++, r = o, h = [], f = Q(); f !== e; )
      h.push(f), f = Q();
    return h !== e ? (f = sr(), f !== e ? (h = [h, f], r = h) : (o = r, r = e)) : (o = r, r = e), k--, r === e && (h = e, k === 0 && R(du)), r;
  }
  function Gf() {
    var r;
    return i.charCodeAt(o) === 9 ? (r = gu, o++) : (r = e, k === 0 && R(pu)), r;
  }
  function If() {
    var r, h, f, g;
    if (r = o, i.substr(o, 2) === qs ? (h = qs, o += 2) : (h = e, k === 0 && R(mu)), h !== e) {
      for (f = [], Qs.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Js)); g !== e; )
        f.push(g), Qs.test(i.charAt(o)) ? (g = i.charAt(o), o++) : (g = e, k === 0 && R(Js));
      f !== e ? (h = [h, f], r = h) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function Df() {
    var r, h, f, g, w, x;
    if (r = o, i.substr(o, 2) === Zs ? (h = Zs, o += 2) : (h = e, k === 0 && R(_u)), h !== e) {
      for (f = [], g = o, w = o, k++, i.substr(o, 2) === Xt ? (x = Xt, o += 2) : (x = e, k === 0 && R(Cn)), k--, x === e ? w = void 0 : (o = w, w = e), w !== e ? (i.length > o ? (x = i.charAt(o), o++) : (x = e, k === 0 && R(Qi)), x !== e ? (w = [w, x], g = w) : (o = g, g = e)) : (o = g, g = e); g !== e; )
        f.push(g), g = o, w = o, k++, i.substr(o, 2) === Xt ? (x = Xt, o += 2) : (x = e, k === 0 && R(Cn)), k--, x === e ? w = void 0 : (o = w, w = e), w !== e ? (i.length > o ? (x = i.charAt(o), o++) : (x = e, k === 0 && R(Qi)), x !== e ? (w = [w, x], g = w) : (o = g, g = e)) : (o = g, g = e);
      f !== e ? (i.substr(o, 2) === Xt ? (g = Xt, o += 2) : (g = e, k === 0 && R(Cn)), g !== e ? (h = [h, f, g], r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    return r;
  }
  function ei() {
    var r;
    return k++, r = If(), r === e && (r = Df()), k--, r === e && k === 0 && R(vu), r;
  }
  function sr() {
    var r;
    return k++, i.substr(o, 2) === ea ? (r = ea, o += 2) : (r = e, k === 0 && R(yu)), r === e && (i.charCodeAt(o) === 10 ? (r = ta, o++) : (r = e, k === 0 && R(ia))), k--, r === e && k === 0 && R(bu), r;
  }
  function ar() {
    var r;
    return k++, Cu.test(i.charAt(o)) ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(Su)), k--, r === e && k === 0 && R(wu), r;
  }
  function Q() {
    var r;
    return i.charCodeAt(o) === 32 ? (r = Eu, o++) : (r = e, k === 0 && R(xu)), r;
  }
  function Je() {
    var r;
    return i.charCodeAt(o) === 44 ? (r = Ys, o++) : (r = e, k === 0 && R(Ks)), r;
  }
  function Uf() {
    var r, h;
    return r = o, i.charCodeAt(o) === 35 ? (h = ku, o++) : (h = e, k === 0 && R($u)), h !== e && (j = r, h = Pu()), r = h, r;
  }
  function Pi() {
    var r, h, f, g;
    if (k++, r = o, i.charCodeAt(o) === 34 ? (h = wi, o++) : (h = e, k === 0 && R(Ci)), h !== e) {
      for (f = [], g = Ia(); g !== e; )
        f.push(g), g = Ia();
      f !== e ? (i.charCodeAt(o) === 34 ? (g = wi, o++) : (g = e, k === 0 && R(Ci)), g !== e ? (j = r, h = ra(f), r = h) : (o = r, r = e)) : (o = r, r = e);
    } else
      o = r, r = e;
    if (r === e) {
      if (r = o, i.substr(o, 3) === qt ? (h = qt, o += 3) : (h = e, k === 0 && R(Sn)), h !== e) {
        for (f = [], g = Ua(); g !== e; )
          f.push(g), g = Ua();
        f !== e ? (i.substr(o, 3) === qt ? (g = qt, o += 3) : (g = e, k === 0 && R(Sn)), g !== e ? (j = r, h = Au(f), r = h) : (o = r, r = e)) : (o = r, r = e);
      } else
        o = r, r = e;
      if (r === e)
        if (r = o, i.charCodeAt(o) === 39 ? (h = En, o++) : (h = e, k === 0 && R(xn)), h !== e) {
          for (f = [], g = Da(); g !== e; )
            f.push(g), g = Da();
          f !== e ? (i.charCodeAt(o) === 39 ? (g = En, o++) : (g = e, k === 0 && R(xn)), g !== e ? (j = r, h = ra(f), r = h) : (o = r, r = e)) : (o = r, r = e);
        } else
          o = r, r = e;
    }
    return k--, r === e && (h = e, k === 0 && R(Tu)), r;
  }
  function Ia() {
    var r, h, f;
    return r = o, i.charCodeAt(o) === 92 ? (h = Si, o++) : (h = e, k === 0 && R(Ei)), h !== e ? (i.charCodeAt(o) === 34 ? (f = wi, o++) : (f = e, k === 0 && R(Ci)), f !== e ? (j = r, h = Ou(), r = h) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = o, k++, i.charCodeAt(o) === 34 ? (f = wi, o++) : (f = e, k === 0 && R(Ci)), k--, f === e ? h = void 0 : (o = h, h = e), h !== e ? (f = Rn(), f !== e ? (j = r, h = kn(), r = h) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function Da() {
    var r, h, f;
    return r = o, i.substr(o, 2) === Ji ? (h = Ji, o += 2) : (h = e, k === 0 && R(na)), h !== e && (j = r, h = sa()), r = h, r === e && (r = o, h = o, k++, i.charCodeAt(o) === 39 ? (f = En, o++) : (f = e, k === 0 && R(xn)), k--, f === e ? h = void 0 : (o = h, h = e), h !== e ? (f = Rn(), f !== e ? (j = r, h = kn(), r = h) : (o = r, r = e)) : (o = r, r = e)), r;
  }
  function Ua() {
    var r, h, f, g;
    if (r = o, i.substr(o, 2) === Ji ? (h = Ji, o += 2) : (h = e, k === 0 && R(na)), h !== e && (j = r, h = sa()), r = h, r === e) {
      if (r = o, i.charCodeAt(o) === 92 ? (h = Si, o++) : (h = e, k === 0 && R(Ei)), h !== e) {
        if (f = [], i.charCodeAt(o) === 92 ? (g = Si, o++) : (g = e, k === 0 && R(Ei)), g !== e)
          for (; g !== e; )
            f.push(g), i.charCodeAt(o) === 92 ? (g = Si, o++) : (g = e, k === 0 && R(Ei));
        else
          f = e;
        f !== e ? (j = r, h = Nu(f), r = h) : (o = r, r = e);
      } else
        o = r, r = e;
      r === e && (r = o, i.charCodeAt(o) === 92 ? (h = Si, o++) : (h = e, k === 0 && R(Ei)), h !== e ? (i.charCodeAt(o) === 10 ? (f = ta, o++) : (f = e, k === 0 && R(ia)), f === e && (f = null), f !== e ? (j = r, h = Ru(), r = h) : (o = r, r = e)) : (o = r, r = e), r === e && (r = o, h = o, k++, i.substr(o, 3) === qt ? (f = qt, o += 3) : (f = e, k === 0 && R(Sn)), k--, f === e ? h = void 0 : (o = h, h = e), h !== e ? (f = Rn(), f !== e ? (j = r, h = kn(), r = h) : (o = r, r = e)) : (o = r, r = e)));
    }
    return r;
  }
  function Rn() {
    var r;
    return i.length > o ? (r = i.charAt(o), o++) : (r = e, k === 0 && R(Qi)), r;
  }
  function Bf() {
    var r, h;
    return r = o, i.substr(o, 4).toLowerCase() === Lu ? (h = i.substr(o, 4), o += 4) : (h = e, k === 0 && R(Fu)), h === e && (i.substr(o, 5).toLowerCase() === Mu ? (h = i.substr(o, 5), o += 5) : (h = e, k === 0 && R(Gu)), h === e && (i.substr(o, 4).toLowerCase() === zi ? (h = i.substr(o, 4), o += 4) : (h = e, k === 0 && R(J)))), h !== e && (j = r, h = Iu(h)), r = h, r;
  }
  function jf() {
    var r, h, f;
    return r = o, i.charCodeAt(o) === 45 ? (h = Hs, o++) : (h = e, k === 0 && R(Ws)), h === e && (h = null), h !== e ? (f = Vf(), f === e && (f = Hf()), f !== e ? (j = r, h = Du(h, f), r = h) : (o = r, r = e)) : (o = r, r = e), r;
  }
  function Vf() {
    var r, h, f, g, w;
    if (r = o, h = [], Qt.test(i.charAt(o)) ? (f = i.charAt(o), o++) : (f = e, k === 0 && R(Jt)), f !== e)
      for (; f !== e; )
        h.push(f), Qt.test(i.charAt(o)) ? (f = i.charAt(o), o++) : (f = e, k === 0 && R(Jt));
    else
      h = e;
    if (h !== e)
      if (i.charCodeAt(o) === 46 ? (f = Ct, o++) : (f = e, k === 0 && R(St)), f !== e) {
        if (g = [], Qt.test(i.charAt(o)) ? (w = i.charAt(o), o++) : (w = e, k === 0 && R(Jt)), w !== e)
          for (; w !== e; )
            g.push(w), Qt.test(i.charAt(o)) ? (w = i.charAt(o), o++) : (w = e, k === 0 && R(Jt));
        else
          g = e;
        g !== e ? (j = r, h = Uu(h, g), r = h) : (o = r, r = e);
      } else
        o = r, r = e;
    else
      o = r, r = e;
    return r;
  }
  function Hf() {
    var r, h, f;
    if (r = o, h = [], Qt.test(i.charAt(o)) ? (f = i.charAt(o), o++) : (f = e, k === 0 && R(Jt)), f !== e)
      for (; f !== e; )
        h.push(f), Qt.test(i.charAt(o)) ? (f = i.charAt(o), o++) : (f = e, k === 0 && R(Jt));
    else
      h = e;
    return h !== e && (j = r, h = Bu(h)), r = h, r;
  }
  var Be = {
    schemas: [],
    tables: [],
    refs: [],
    enums: [],
    tableGroups: [],
    aliases: [],
    project: {}
  }, Ba = 0;
  function ja(r) {
    if (r === "<>") return ["*", "*"];
    if (r === ">") return ["*", "1"];
    if (r === "<") return ["1", "*"];
    if (r === "-") return ["1", "1"];
  }
  if (er = s(), er !== e && o === i.length)
    return er;
  throw er !== e && o < i.length && R(Hu()), zu($n, ot < i.length ? i.charAt(ot) : null, ot < i.length ? tr(ot, ot + 1) : tr(ot, ot));
}
var V6 = {
  parse: _6
};
export {
  I6 as E,
  P6 as G,
  D6 as K,
  A6 as L,
  N6 as P,
  T6 as R,
  R6 as S,
  O6 as T,
  M0 as a,
  U6 as b,
  es as c,
  G6 as d,
  B6 as e,
  j6 as f,
  gs as g,
  $6 as h,
  V6 as i,
  r2 as r
};
