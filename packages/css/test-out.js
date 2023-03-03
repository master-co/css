// dist/index.mjs
var qs = Object.create;
var ls = Object.defineProperty;
var Xs = Object.getOwnPropertyDescriptor;
var Js = Object.getOwnPropertyNames;
var Ks = Object.getPrototypeOf;
var eo = Object.prototype.hasOwnProperty;
var to = (r, s, i) => s in r ? ls(r, s, { enumerable: true, configurable: true, writable: true, value: i }) : r[s] = i;
var ro = (r, s) => () => (s || r((s = { exports: {} }).exports, s), s.exports);
var io = (r, s, i, o) => {
  if (s && typeof s == "object" || typeof s == "function")
    for (let a of Js(s))
      !eo.call(r, a) && a !== i && ls(r, a, { get: () => s[a], enumerable: !(o = Xs(s, a)) || o.enumerable });
  return r;
};
var so = (r, s, i) => (i = r != null ? qs(Ks(r)) : {}, io(s || !r || !r.__esModule ? ls(i, "default", { value: r, enumerable: true }) : i, r));
var e = (r, s, i) => (to(r, typeof s != "symbol" ? s + "" : s, i), i);
var Us = ro((Vi) => {
  "use strict";
  Object.defineProperty(Vi, "__esModule", { value: true });
  Vi.dedent = void 0;
  function Hs(r) {
    for (var s = [], i = 1; i < arguments.length; i++)
      s[i - 1] = arguments[i];
    var o = Array.from(typeof r == "string" ? [r] : r);
    o[o.length - 1] = o[o.length - 1].replace(/\r?\n([\t ]*)$/, "");
    var a = o.reduce(function(d, h) {
      var m = h.match(/\n([\t ]+|(?!\s).)/g);
      return m ? d.concat(m.map(function(p) {
        var f, n;
        return (n = (f = p.match(/[\t ]/g)) === null || f === void 0 ? void 0 : f.length) !== null && n !== void 0 ? n : 0;
      })) : d;
    }, []);
    if (a.length) {
      var c = new RegExp(`
[	 ]{` + Math.min.apply(Math, a) + "}", "g");
      o = o.map(function(d) {
        return d.replace(c, `
`);
      });
    }
    o[0] = o[0].replace(/^\r?\n/, "");
    var l = o[0];
    return s.forEach(function(d, h) {
      var m = l.match(/(?:^|\n)( *)$/), p = m ? m[1] : "", f = d;
      typeof d == "string" && d.includes(`
`) && (f = String(d).split(`
`).map(function(n, u) {
        return u === 0 ? n : "" + p + n;
      }).join(`
`)), l += f + o[h + 1];
    }), l;
  }
  Vi.dedent = Hs;
  Vi.default = Hs;
});
var oo = { "3xs": 360, "2xs": 480, xs: 600, sm: 768, md: 1024, lg: 1280, xl: 1440, "2xl": 1600, "3xl": 1920, "4xl": 2560 };
var Ue = oo;
function Jr(r) {
  r.startsWith("#") && (r = r.slice(1));
  let s = r.match(/.{1,2}/g);
  return [parseInt(s[0], 16), parseInt(s[1], 16), parseInt(s[2], 16)];
}
function Hi(r, s, i) {
  return ((1 << 24) + (r << 16) + (s << 8) + i).toString(16).slice(1);
}
function j(r) {
  typeof r == "string" && (r = { "": r });
  let s = "" in r, i = false;
  for (let o in r)
    if (o && +o >= 100) {
      i = true;
      break;
    }
  if (!i && (!s || Object.keys(r).length > 1)) {
    let o = 0, a = "0" in r ? Jr(r[0]) : [0, 0, 0], c, l, d = [], h = () => {
      let m = c - o, p = l.map((f, n) => (f - a[n]) / m);
      for (let f of d) {
        let n = f - o, u = a.map((k, b) => Math.round(k + p[b] * n));
        r[f] = "#" + Hi.call(this, ...u);
      }
    };
    for (let m = 1; m < 100; m++)
      m in r ? (d.length ? (c = m, l = Jr(r[m]), h(), d.length = 0, a = l) : a = Jr(r[m]), o = m) : d.push(m);
    d.length && (c = 100, l = "100" in r ? Jr(r[100]) : [255, 255, 255], h());
  }
  return s || (r[""] = r[i ? "500" : "50"]), r;
}
var ao = { slate: j({ 5: "#141e2b", 10: "#19212d", 20: "#262f3e", 30: "#323e52", 40: "#41516b", 50: "#616a84", 55: "#6c7693", 60: "#959db3", 70: "#a3abbf", 80: "#d7dae3", 95: "#f6f7f8" }), gray: j({ 5: "#1e1d1f", 10: "#212022", 20: "#2f2e30", 30: "#3e3d40", 40: "#504f52", 50: "#6b6a6d", 55: "#777679", 60: "#9e9da0", 70: "#abaaae", 80: "#dad9db", 95: "#f5f4f7" }), brown: j({ 5: "#271b15", 10: "#2b1e18", 20: "#3c2b22", 30: "#50382c", 40: "#694839", 50: "#8d604b", 55: "#9d6b53", 60: "#b79788", 70: "#c1a598", 80: "#efd5c9", 95: "#faf2ef" }), orange: j({ 5: "#2e1907", 10: "#331b07", 20: "#47260b", 30: "#5d320e", 40: "#7a4111", 50: "#a15717", 55: "#b4611a", 60: "#e38739", 70: "#e79855", 80: "#f7d4b5", 95: "#fcf1e7" }), gold: j({ 5: "#281b00", 10: "#2d1e01", 20: "#3f2a00", 30: "#543800", 40: "#6d4900", 50: "#906000", 55: "#9c6d00", 60: "#d09100", 70: "#dca000", 80: "#fbd67f", 95: "#fff3d8" }), yellow: j({ 5: "#251d00", 10: "#282000", 20: "#3a2e01", 30: "#4b3b00", 40: "#624e00", 50: "#806700", 55: "#8e7200", 60: "#be9900", 70: "#d0a700", 80: "#edda8f", 95: "#fff5ca" }), grass: j({ 5: "#162106", 10: "#182406", 20: "#223308", 30: "#2c4408", 40: "#3a570b", 50: "#4e750e", 60: "#74ae15", 70: "#7dbc17", 80: "#bfe87c", 95: "#ebfad4" }), green: j({ 5: "#042311", 10: "#032611", 20: "#023717", 30: "#03481f", 40: "#025d26", 50: "#067b34", 55: "#07883a", 60: "#09b64d", 70: "#0ac553", 80: "#80f1a4", 95: "#e0fae8" }), beryl: j({ 5: "#002319", 10: "#00271c", 20: "#003626", 30: "#004732", 40: "#005c41", 50: "#007954", 55: "#00875e", 60: "#00b37c", 70: "#00c387", 80: "#72f0c5", 95: "#d6fcef" }), teal: j({ 5: "#012220", 10: "#012624", 20: "#003532", 30: "#004541", 40: "#005a54", 50: "#00776f", 55: "#00857c", 60: "#00b1a5", 70: "#00bfb2", 80: "#6aeee5", 95: "#d4fcf8" }), cyan: j({ 5: "#00222b", 10: "#00252e", 20: "#013340", 30: "#004457", 40: "#00576f", 50: "#007391", 55: "#0080a1", 60: "#00abd7", 70: "#00b9e9", 80: "#97e6fa", 95: "#dff8ff" }), sky: j({ 5: "#031f34", 10: "#032339", 20: "#04314e", 30: "#044169", 40: "#065386", 50: "#086eb3", 55: "#097ac5", 60: "#29a4f5", 70: "#4db3f7", 80: "#b3e0ff", 95: "#eaf6fe" }), blue: j({ 5: "#07194a", 10: "#081c53", 20: "#0a2773", 30: "#0e3496", 40: "#1146b6", 50: "#175fe9", 55: "#2671ea", 60: "#6b9ef1", 70: "#81acf3", 80: "#c6dbfe", 95: "#edf4fe" }), indigo: j({ 5: "#1f1645", 10: "#20174f", 20: "#2b1f74", 30: "#37289d", 40: "#463fb1", 50: "#5a5bd5", 55: "#6464f1", 60: "#9393f5", 70: "#a1a5ee", 80: "#d5d7fe", 95: "#f1f2ff" }), violet: j({ 5: "#2b0a4e", 10: "#2e0b57", 20: "#3d1179", 30: "#4e169f", 40: "#5f2eba", 50: "#7949e5", 55: "#8755f5", 60: "#ac8af8", 70: "#b89bf9", 80: "#e1d4fe", 95: "#f5f1ff" }), purple: j({ 5: "#2e0c47", 10: "#330c4e", 20: "#460f6c", 30: "#5b1390", 40: "#7421b1", 50: "#9832e4", 55: "#a348e7", 60: "#c184ef", 70: "#ca96f1", 80: "#ead1fe", 95: "#f9f0ff" }), fuchsia: j({ 5: "#39092a", 10: "#400932", 20: "#560d4a", 30: "#6f1165", 40: "#8c158a", 50: "#b61cbb", 55: "#ca1fce", 60: "#e66ee9", 70: "#ea86ed", 80: "#facbfb", 95: "#feefff" }), pink: j({ 5: "#3d0722", 10: "#430725", 20: "#5d0933", 30: "#790d44", 40: "#9a1058", 50: "#ca1473", 55: "#e11681", 60: "#f170b4", 70: "#f388c0", 80: "#fdcde6", 95: "#fff0f8" }), crimson: j({ 5: "#430213", 10: "#470314", 20: "#62041c", 30: "#800524", 40: "#9f1036", 50: "#ce1a4b", 55: "#e8144c", 60: "#f37596", 70: "#f58ba7", 80: "#fdceda", 95: "#fff1f4" }), red: j({ 5: "#450001", 10: "#490102", 20: "#640304", 30: "#800506", 40: "#a11012", 50: "#d11a1e", 55: "#ed0a0e", 60: "#f97476", 70: "#fa8b8d", 80: "#fdcfcf", 95: "#fff1f1" }), black: "#000000", white: "#ffffff" };
var cs = ao;
var ds = 16;
var no = "";
var Ts = no;
var lo = { "::scrollbar": "::-webkit-scrollbar", "::scrollbar-button": "::-webkit-scrollbar-button", "::scrollbar-thumb": "::-webkit-scrollbar-thumb", "::scrollbar-track": "::-webkit-scrollbar-track", "::scrollbar-track-piece": "::-webkit-scrollbar-track-piece", "::scrollbar-corner": "::-webkit-scrollbar-corner", "::slider-thumb": ["::-webkit-slider-thumb", "::-moz-range-thumb"], "::slider-runnable-track": ["::-webkit-slider-runnable-track", "::-moz-range-track"], "::meter": "::-webkit-meter", "::resizer": "::-webkit-resizer", "::progress": "::-webkit-progress", ":first": ":first-child", ":last": ":last-child", ":even": ":nth-child(2n)", ":odd": ":nth-child(odd)", ":nth(": ":nth-child(" };
var fs = lo;
var co = { square: { "aspect-ratio": "1/1" }, video: { "aspect-ratio": "16/9" }, rounded: { "border-radius": "1e9em" }, round: { "border-radius": "50%" }, hidden: { display: "none" }, hide: { display: "none" }, block: { display: "block" }, table: { display: "table" }, flex: { display: "flex" }, grid: { display: "grid" }, contents: { display: "contents" }, inline: { display: "inline" }, "inline-block": { display: "inline-block" }, "inline-flex": { display: "inline-flex" }, "inline-grid": { display: "inline-grid" }, "inline-table": { display: "inline-table" }, "table-cell": { display: "table-cell" }, "table-caption": { display: "table-caption" }, "flow-root": { display: "flow-root" }, "list-item": { display: "list-item" }, "table-row": { display: "table-row" }, "table-column": { display: "table-column" }, "table-row-group": { display: "table-row-group" }, "table-column-group": { display: "table-column-group" }, "table-header-group": { display: "table-header-group" }, "table-footer-group": { display: "table-footer-group" }, italic: { "font-style": "italic" }, oblique: { "font-style": "oblique" }, isolate: { isolation: "isolate" }, overflow: { overflow: "visible" }, untouchable: { "pointer-events": "none" }, static: { position: "static" }, fixed: { position: "fixed" }, abs: { position: "absolute" }, rel: { position: "relative" }, sticky: { position: "sticky" }, uppercase: { "text-transform": "uppercase" }, lowercase: { "text-transform": "lowercase" }, capitalize: { "text-transform": "capitalize" }, visible: { visibility: "visible" }, invisible: { visibility: "hidden" }, vw: { width: "100vw" }, vh: { height: "100vh" }, "max-vw": { "max-width": "100vw" }, "max-vh": { "max-height": "100vh" }, "min-vw": { "min-width": "100vw" }, "min-vh": { "min-height": "100vh" }, "center-content": { "justify-content": "center", "align-items": "center" }, "sr-only": { position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", "white-space": "nowrap", "border-width": "0" }, full: { width: "100%", height: "100%" }, center: { left: 0, right: 0, "margin-left": "auto", "margin-right": "auto" }, middle: { top: 0, bottom: 0, "margin-top": "auto", "margin-bottom": "auto" }, "break-spaces": { "white-space": "break-spaces" }, "break-word": { "overflow-wrap": "break-word", overflow: "hidden" } };
var ms = co;
var fo = ["dark", "light"];
var us = fo;
var ps = typeof Buffer < "u" ? Buffer : null;
function ws(r) {
  return !!(ps && r instanceof ps || r instanceof Date || r instanceof RegExp);
}
function Ms(r) {
  if (ps && r instanceof Buffer) {
    let s = Buffer.alloc(r.length);
    return r.copy(s), s;
  } else {
    if (r instanceof Date)
      return new Date(r.getTime());
    if (r instanceof RegExp)
      return new RegExp(r);
    throw new Error("Unexpected situation");
  }
}
function Os(r) {
  let s = [];
  return r.forEach(function(i, o) {
    typeof i == "object" && i !== null ? Array.isArray(i) ? s[o] = Os(i) : ws(i) ? s[o] = Ms(i) : s[o] = Z({}, i) : s[o] = i;
  }), s;
}
function Cs(r, s) {
  return s === "__proto__" ? void 0 : r[s];
}
function Z(...r) {
  let s = {}, i, o;
  return r.forEach(function(a) {
    typeof a != "object" || a === null || Array.isArray(a) || Object.keys(a).forEach(function(c) {
      if (o = Cs(s, c), i = Cs(a, c), i !== s)
        if (typeof i != "object" || i === null) {
          s[c] = i;
          return;
        } else if (Array.isArray(i)) {
          s[c] = Os(i);
          return;
        } else if (ws(i)) {
          s[c] = Ms(i);
          return;
        } else if (typeof o != "object" || o === null || Array.isArray(o)) {
          s[c] = Z({}, i);
          return;
        } else {
          s[c] = Z(o, i);
          return;
        }
    });
  }), s;
}
var Ui = { store: "theme" };
var Bs = typeof window < "u";
var Qe = class {
  constructor(s = typeof document < "u" ? document.documentElement : null, i) {
    this.host = s;
    this.options = i;
    this.options = Z(Ui, i), this.options.store && this.storage ? this.syncWithStorage() : this.options.default && this.set(this.options.default, { emit: false, store: false });
  }
  darkMQL = Bs ? window.matchMedia?.("(prefers-color-scheme:dark)") : void 0;
  get storage() {
    let { store: s } = this.options;
    if (s)
      return localStorage.getItem(s);
  }
  current;
  value;
  set(s, i = { store: true, emit: true }) {
    if (s !== this.value) {
      let o;
      s === "system" ? (this.darkMQL?.addEventListener?.("change", this.onThemeChange), o = this.darkMQL?.matches ? "dark" : "light") : (this.removeDarkMQLListener(), o = s), o && (this.host.classList.remove(this.current), this.host.classList.add(o), this.host.style && (this.host.style.colorScheme = o)), this.current = o, this.value = s, i.store, this.storage, this.options.store && localStorage.setItem(this.options.store, s), i.emit && this.host.dispatchEvent(new CustomEvent("theme", { detail: this }));
    }
  }
  syncWithStorage() {
    if (Bs && this.options.store) {
      let s = this.storage;
      (s === "system" && (s = this.darkMQL?.matches ? "dark" : "light") || s) && (this.host.classList.add(s), this.host.style.colorScheme = s, this.set(s, { emit: false, store: false }));
    }
  }
  removeDarkMQLListener() {
    this.darkMQL?.removeEventListener("change", this.onThemeChange);
  }
  onThemeChange = (s) => {
    this.set(s.matches ? "dark" : "light");
  };
  destroy() {
    this.darkMQL?.removeEventListener("change", this.onThemeChange);
  }
};
var mo = Ui;
var hs = mo;
var Kr = { content: "content-box", border: "border-box", padding: "padding-box" };
var Qi = { min: "min-content", max: "max-content" };
var J = { full: "100%", fit: "fit-content", max: "max-content", min: "min-content" };
for (let r in Ue)
  J[r] = Ue[r] / 16 + "rem";
var uo = { BackgroundClip: Kr, BackgroundOrigin: Kr, BoxSizing: { content: "content-box", border: "border-box" }, ClipPath: { ...Kr, margin: "margin-box", fill: "fill-box", stroke: "stroke-box", view: "view-box" }, FlexDirection: { col: "column", "col-reverse": "column-reverse" }, FontFamily: { mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace", sans: "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji", serif: "ui-serif,Georgia,Cambria,Times New Roman,Times,serif" }, FontWeight: { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, heavy: 900 }, GridAutoColumns: Qi, GridAutoRows: Qi, GridTemplateColumns: Qi, GridTemplateRows: Qi, Order: { first: -999999, last: 999999 }, Position: { abs: "absolute", rel: "relative" }, ShapeOutside: { ...Kr, margin: "margin-box" }, TransformBox: { ...Kr, fill: "fill-box", stroke: "stroke-box", view: "view-box" }, Width: J, MinWidth: J, MinHeight: J, MaxWidth: J, MaxHeight: J, Height: J, FlexBasis: J };
var gs = uo;
function Yi(r, s) {
  return (r ? r + ":" : "") + (s.unit ? s.value + s.unit : s.value) + (s.important ? "!important" : "");
}
var po = /^([+-.]?\d+(\.?\d+)?)(.*)?/;
function Zi(r, s, i) {
  if (i) {
    let o = "", a = r.match(po);
    if (a)
      if (r.includes("/")) {
        let [c, l] = r.split("/");
        return { value: +c / +l * 100 + "%", unit: o };
      } else {
        let c = +a[1];
        return o = a[3] || "", o || ((i === "rem" || i === "em") && (c = c / s), o = i || ""), { value: c, unit: o };
      }
  }
}
function As(r, s, i) {
  let o = (p) => p === "+" || p === "-" || p === "*" || p === "/", a = "", c, l = "", d = false, h = false;
  function m(p, f = "", n = "") {
    if (c === 2 && !h) {
      let u = Zi(l, s, i);
      u && (l = u.value + u.unit);
    }
    a += l + f + p + n, c = null, h = false, l = "";
  }
  for (let p = 0; p < r.length; p++) {
    let f = r[p];
    if (f === "(" || f === ")")
      d = f === ")", m(f);
    else if (f === ",")
      m(f, "", " ");
    else {
      switch (c) {
        case 1:
          break;
        case 2:
          if (o(f)) {
            m(f, " ", " ");
            continue;
          } else
            /[0-9]/.test(f) || (h = true);
          break;
        default:
          d && (a += " "), isNaN(+f) ? o(f) || (c = 1) : c = 2;
          break;
      }
      c ? l += f : a += f;
    }
  }
  return l && (a += l), a;
}
function qi(r, s, i, o, a, c) {
  let l = "", d = "", h;
  if (typeof r == "number")
    l = r, d = s || "";
  else {
    if (o) {
      let p = false, f = false;
      r = r.replace(new RegExp(`(^|,| |\\()((?:${i.join("|")})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, "gm"), (n, u, k, b) => {
        f = true;
        let R = o[k];
        if (R) {
          let C;
          for (let y of c)
            if (C = R[y])
              break;
          if (C) {
            p = true;
            let y = C;
            if (b) {
              let g = b.endsWith("%") ? parseFloat(b) / 100 : +b;
              g = isNaN(g) ? 1 : Math.min(Math.max(g, 0), 1), y += Math.round(g * 255).toString(16).toUpperCase().padStart(2, "0");
            }
            return u + y;
          }
        }
        return n;
      }), f && (h = p);
    }
    let m = Zi(r, a, s);
    if (m)
      return m;
    l = (r.indexOf("calc(") === -1 ? r : As(r, a, s)).replace(/\$\(((\w|-)+)\)/g, "var(--$1)");
  }
  return { value: l, unit: d, colorMatched: h };
}
var Ye = { "(": ")", "'": "'", '"': '"', "{": "}" };
var ho = ["!", "*", ">", "+", "~", ":", "[", "@", "_"];
function Y(r, s, i, o = []) {
  let a = [",", ...o], c = [], l = "", d = 0;
  return function h(m, p, f, n = "", u = [], k = []) {
    let b, R = false;
    p && (p === ")" && l.slice(-1) === "$" ? b = l.length - 1 : (p === "'" || p === '"') && (R = true), l += m[d++]);
    let C = () => {
      let y = l;
      if (l = "", s && y in s && !u.includes(y)) {
        let g = d;
        d = 0, h(s[y].toString(), void 0, void 0, void 0, [...u, y], k), d = g;
      } else if (i && y in i && !k.includes(y)) {
        let g = d;
        d = 0, h(i[y].toString(), void 0, void 0, void 0, u, [...k, y]), d = g;
      } else
        c.push({ value: y });
    };
    for (; d < m.length; d++) {
      let y = m[d];
      if (y === p) {
        if (l += y, R) {
          let g = 0;
          for (let x = l.length - 2; l[x] === "\\"; x--)
            g++;
          if (g % 2)
            continue;
        }
        b !== void 0 && (l = l.slice(0, b) + l.slice(b).replace(/\$\((.*)\)/, "var(--$1)")), f || (R ? c.push(l) : C(), n = "", l = "");
        break;
      } else if (!R && y in Ye)
        h(m, Ye[y], f === void 0 ? 0 : f + 1, n, u, k);
      else if ((y === "|" || y === " ") && p !== "}" && (!R || n === "path"))
        p ? l += " " : C();
      else {
        if (!p) {
          if (y === ".") {
            if (isNaN(+m[d + 1]))
              break;
            m[d - 1] === "-" && (l += "0");
          } else if (a.includes(y)) {
            l && C(), c.push(y);
            continue;
          } else if (y === "#" && (l || c.length && m[d - 1] !== "|" && c[d - 1] !== " ") || ho.includes(y))
            break;
          n += y;
        }
        l += y;
      }
    }
    f === void 0 && l && C();
  }(r), [c, r.slice(d)];
}
var Is = [":disabled", ":active", ":focus", ":hover"];
var ei = "matches";
var go = "semantics";
var Fs = "symbol";
var Es = "width";
var xs = "max-" + Es;
var vs = "min-" + Es;
var ys = "motion";
var Ws = "reduce";
var $s = Ws + "d-" + ys;
var bs = "px";
var xo = "rem";
var vo = /(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/;
var bo = (r) => r.split(vo).map((s, i) => i % 3 ? s : s.replace(/_/g, " ")).join("");
var t = class {
  constructor(s, i, o) {
    this.className = s;
    this.matching = i;
    this.css = o;
    let a = this.constructor, { id: c, unit: l, colorful: d, prop: h } = a, { rootSize: m, scope: p, important: f } = o.config, { themeNames: n, colorNames: u, colorThemesMap: k, selectors: b, globalValues: R, breakpoints: C, mediaQueries: y } = o, g = o.values[c], x = o.relationThemesMap[s], v = s, S, T, B, A;
    if (i.origin === go) {
      let [L, $] = i.value;
      B = v.slice(L.length), S = $;
    } else if (this.analyzeToken)
      [T, A, B] = this.analyzeToken(v, g, R);
    else {
      let L;
      if (i.origin === ei) {
        let $ = v.indexOf(":");
        this.prefix = v.slice(0, $ + 1), this.prefix.includes("(") ? (this.prefix = void 0, L = v) : L = v.slice($ + 1);
      } else
        i.origin === Fs && (this.symbol = v[0], L = v.slice(1));
      [A, B] = Y(L, g, R);
    }
    B[0] === "!" && (this.important = true, B = B.slice(1));
    let W = (L) => {
      let $ = bo(L), I = [], D = "", V = 0;
      for (let M = 0; M < $.length; M++) {
        let F = $[M];
        if (F === "\\") {
          D += F + $[++M];
          continue;
        }
        !V && F === "," ? (I.push(D), D = "") : (D += F, V && F === ")" ? V-- : F === "(" && V++);
      }
      return D && I.push(D), I;
    };
    this.prefixSelectors = T ? W(T) : [""];
    let O = B.split("@"), H = O[0];
    if (H) {
      this.vendorSuffixSelectors = {};
      let L = (M, F, w, E) => {
        for (let [N, z] of F)
          if (N.test(M)) {
            for (let Q of z)
              L(M.replace(N, Q), F, w, true);
            return;
          }
        E && w.push(M);
      }, $ = [];
      "" in b ? L(H, b[""], $, true) : $.push(H);
      let I = {};
      for (let [M, F] of Object.entries(b)) {
        if (!M)
          continue;
        let w = [];
        for (let E of $)
          L(E, F, w, false);
        w.length && (I[M] = w);
      }
      let D = (M, F) => {
        let w = F.reduce((E, N) => (E.push(...W(N)), E), []);
        M in this.vendorSuffixSelectors ? this.vendorSuffixSelectors[M].push(...w) : this.vendorSuffixSelectors[M] = w;
      }, V = Object.keys(I);
      if (V.length)
        for (let M of V)
          D(M, I[M]);
      else
        D("", $);
      for (let M of Object.values(this.vendorSuffixSelectors))
        for (let F of M) {
          this.hasWhere !== false && (this.hasWhere = F.includes(":where("));
          for (let w = 0; w < Is.length; w++)
            if (F.includes(Is[w])) {
              (this.priority === -1 || this.priority > w) && (this.priority = w);
              break;
            }
        }
    } else
      this.vendorSuffixSelectors = { "": [""] };
    for (let L = 1; L < O.length; L++) {
      let $ = O[L];
      if ($)
        if (n.includes($))
          this.theme = $;
        else if ($ === "rtl" || $ === "ltr")
          this.direction = $;
        else {
          let I, D, V = $.indexOf("_");
          if (V !== -1)
            I = $.slice(0, V), D = $.slice(V);
          else {
            let M = $.indexOf("(");
            M !== -1 && (I = $.slice(0, M), D = $.slice(M));
          }
          if (!I) {
            I = "media";
            let M = [];
            this.media = { token: $, features: {} };
            let F = $.split("&");
            for (let w of F)
              if (w === "all" || w === "print" || w === "screen" || w === "speech")
                this.media.type = w;
              else if (w === "\u{1F5A8}")
                this.media.type = "print";
              else if (w === "landscape" || w === "portrait")
                M.push("(orientation:" + w + ")");
              else if (w === ys || w === $s)
                M.push("(prefers-" + $s + ":" + (w === ys ? "no-preference" : Ws) + ")");
              else if (y && w in y)
                M.push(y[w]);
              else {
                let E = { token: w }, N = "", z = "", Q = 0;
                w.startsWith("<=") ? (z = "<=", N = xs) : w.startsWith(">=") || C[w] ? (z = ">=", N = vs) : w.startsWith(">") ? (z = ">", N = vs, Q = 0.02) : w.startsWith("<") && (z = "<", N = xs, Q = -0.02);
                let q = z ? w.replace(z, "") : w, P = C[q];
                switch (N) {
                  case xs:
                  case vs:
                    P ? Object.assign(E, qi(P, bs)) : Object.assign(E, qi(q, bs)), E.unit === bs && (E.value += Q), this.media.features[N] = E, M.push("(" + N + ":" + (E.value + E.unit) + ")");
                    break;
                }
              }
            D = "", this.media.type && (D = this.media.type), M.length && (D += (D ? " and " : "") + M.join(" and "));
          }
          D && (this.at[I] = (I in this.at ? this.at[I] + " and " : "") + D.replace(/_/g, " "));
        }
    }
    this.order === void 0 && (this.order = 0);
    let He = (L, $) => {
      let I, D, V = (F, w, E) => {
        let N = "";
        this.direction && (N += "[dir=" + this.direction + "] ");
        let z = this.prefixSelectors.map((P) => P + N), Q = (P, _i) => z.map((X) => (P ? "." + P + " " : "") + (p ? p + " " : "") + X).reduce((X, ns) => (X.push(E.reduce((ks, Zs) => (ks.push(ns + "." + CSS.escape(_i) + Zs), ks), []).join(",")), X), []).join(","), q = Q(w, s) + (x ? Object.entries(x).filter(([P]) => this.theme || !d || !w || !P || P === w).map(([P, _i]) => _i.reduce((X, ns) => X + "," + Q(this.theme ?? ((d || this.getThemeProps) && w || P), ns), "")).join("") : "") + "{" + F + "}";
        for (let P of Object.keys(this.at).sort((_i, X) => X === "supports" ? -1 : 1))
          q = "@" + P + " " + this.at[P] + "{" + q + "}";
        return q;
      }, M = [];
      if (A) {
        let F, w;
        for (let E of A)
          typeof E == "string" ? M.push(E) : (F = qi(E.value, l, d && u, d && k, m, this.theme ? [this.theme, ""] : [L]), F.colorMatched !== void 0 && w !== true && (w = F.colorMatched), M.push(F.value + F.unit));
        if ($ && (w === void 0 ? L : !w))
          return;
        if (M.length === 1 ? F ? (I = F.value, D = F.unit) : I = M[0] : I = M.reduce((E, N, z) => E + N + (N === "," || A[z + 1] === "," || z === A.length - 1 ? "" : " "), ""), typeof I != "object") {
          this.parseValue && (I = this.parseValue(I, this.css.config)), d && I === "current" && (I = "currentColor");
          let E = { unit: D, value: I, important: this.important };
          if (this.getThemeProps) {
            let N = this.getThemeProps(E, o);
            for (let z in N)
              for (let Q of Object.values(this.vendorSuffixSelectors))
                this.natives.push({ unit: D, value: I, text: V(Object.entries(N[z]).map(([q, P]) => Yi(q, { important: (this.important || f) && !P.endsWith("!important"), unit: "", value: P })).join(";"), z, Q), theme: z });
            return;
          } else
            this.get && (I = this.get(E));
        }
      } else
        I = S;
      for (let F of Object.values(this.vendorSuffixSelectors))
        this.natives.push({ unit: D, value: I, text: V(typeof I == "object" ? Object.entries(I).map(([w, E]) => Yi(w, { ...typeof E == "object" ? E : { unit: "", value: E }, important: this.important || f })).join(";") : Yi(h, { unit: D, value: I, important: this.important || f }), L, F), theme: L });
    };
    if (this.getThemeProps)
      He(void 0, false);
    else if (this.theme)
      He(this.theme, false);
    else if (d)
      for (let L of n)
        He(L, true);
    else
      He("", false);
  }
  prefix;
  symbol;
  token;
  prefixSelectors;
  vendorSuffixSelectors;
  important;
  media;
  at = {};
  direction;
  theme;
  unitToken;
  hasWhere;
  priority = -1;
  natives = [];
  static get prop() {
    return this.id?.replace(/(?!^)[A-Z]/g, (s) => "-" + s).toLowerCase();
  }
  static match(s, i, o, a) {
    let { colorStarts: c, symbol: l, prop: d } = this;
    if (i && i.test(s))
      return { origin: ei };
    if (c) {
      if (s.match("^" + c + "(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|current|inherit))"))
        return { origin: ei };
      if (a.length && s.indexOf("|") === -1) {
        let h = s.match("^" + c + "((?:" + a.join("|") + ")[0-9a-zA-Z-]*)");
        if (h && h[1] in o)
          return { origin: ei };
      }
    }
    if (l && s.startsWith(l))
      return { origin: Fs };
    if (d && s.startsWith(d + ":"))
      return { origin: ei };
  }
  get text() {
    return this.natives.map((s) => s.text).join("");
  }
};
e(t, "id"), e(t, "matches"), e(t, "colorStarts"), e(t, "symbol"), e(t, "unit", xo), e(t, "colorful");
var oe = class extends t {
};
e(oe, "id", "FontWeight"), e(oe, "matches", "^f(?:ont)?:(?:bolder|$values)(?!\\|)"), e(oe, "unit", "");
var Ze = class extends t {
};
e(Ze, "id", "FontFamily"), e(Ze, "matches", "^f(?:ont)?:(?:$values)(?!\\|)");
var qe = class extends t {
};
e(qe, "id", "FontSize"), e(qe, "matches", "^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Xe = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let i = this.prefix[0] === "m" ? "margin" : "padding", o = i + "-left", a = i + "-right", c = i + "-top", l = i + "-bottom";
    switch (this.prefix[1]) {
      case "x":
        return { [o]: r, [a]: r };
      case "y":
        return { [c]: r, [l]: r };
      case "l":
        return { [o]: r };
      case "r":
        return { [a]: r };
      case "t":
        return { [c]: r };
      case "b":
        return { [l]: r };
      default:
        return { [i]: r };
    }
  }
  get order() {
    return this.prefix === "p:" || this.prefix === "m:" ? -1 : 0;
  }
};
e(Xe, "id", "Spacing"), e(Xe, "matches", "^[pm][xytblr]?:.");
var Je = class extends t {
};
e(Je, "id", "Width"), e(Je, "matches", "^w:.");
var Ke = class extends t {
};
e(Ke, "id", "Height"), e(Ke, "matches", "^h:.");
var et = class extends t {
};
e(et, "id", "MinWidth"), e(et, "matches", "^min-w:.");
var tt = class extends t {
};
e(tt, "id", "MinHeight"), e(tt, "matches", "^min-h:.");
var ae = class extends t {
};
e(ae, "id", "LetterSpacing"), e(ae, "matches", "^ls:."), e(ae, "unit", "em");
var yo = "subpixel-antialiased";
var Ds = "-webkit-font-smoothing";
var Ls = "-moz-osx-font-smoothing";
var ne = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let s = {};
    switch (r.value) {
      case yo:
        s[Ds] = s[Ls] = { ...r, value: "auto" };
        break;
      case "antialiased":
        s[Ds] = { ...r, value: "antialiased" }, s[Ls] = { ...r, value: "grayscale" };
        break;
    }
    return s;
  }
};
e(ne, "id", "FontSmoothing"), e(ne, "matches", "^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)"), e(ne, "unit", "");
var le = class extends t {
};
e(le, "id", "FontStyle"), e(le, "matches", "^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)"), e(le, "unit", "deg");
var rt = class extends t {
};
e(rt, "id", "FontVariantNumeric"), e(rt, "matches", "^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)");
var it = class extends t {
};
e(it, "id", "FontFeatureSettings"), e(it, "matches", "^font-feature:.");
var ce = class extends t {
};
e(ce, "id", "LineHeight"), e(ce, "matches", "^lh:."), e(ce, "unit", "");
var st = class extends t {
};
e(st, "id", "ObjectFit"), e(st, "matches", "^(?:object|obj):(?:contain|cover|fill|scale-down|$values)");
var ot = class extends t {
};
e(ot, "id", "ObjectPosition"), e(ot, "matches", "^(?:object|obj):(?:top|bottom|right|left|center|$values)");
var at = class extends t {
};
e(at, "id", "TextAlign"), e(at, "matches", "^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)");
var de = class extends t {
  order = -1;
};
e(de, "id", "TextDecoration"), e(de, "matches", "^t(?:ext)?:(?:underline|line-through|overline|$values)"), e(de, "colorful", true);
var nt = class extends t {
};
e(nt, "id", "TextTransform"), e(nt, "matches", "^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)");
var lt = class extends t {
};
e(lt, "id", "VerticalAlign"), e(lt, "matches", "^(?:v|vertical):.");
var fe = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { overflow: { ...r, value: "hidden" }, display: { ...r, value: "-webkit-box" }, "overflow-wrap": { ...r, value: "break-word" }, "text-overflow": { ...r, value: "ellipsis" }, "-webkit-box-orient": { ...r, value: "vertical" }, "-webkit-line-clamp": r };
  }
};
e(fe, "id", "Lines"), e(fe, "matches", "^lines:."), e(fe, "unit", "");
var me = class extends t {
};
e(me, "id", "TransformOrigin"), e(me, "matches", "^transform:(?:top|bottom|right|left|center|[0-9]|$values)"), e(me, "unit", "px");
var ct = class extends t {
};
e(ct, "id", "TransformStyle"), e(ct, "matches", "^transform:(?:flat|preserve-3d|$values)(?!\\|)");
var dt = class extends t {
};
e(dt, "id", "TransformBox"), e(dt, "matches", "^transform:(?:$values)(?!\\|)");
var ue = class extends t {
  parseValue(r, { rootSize: s }) {
    return r.replace(/(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g, (i, o, a, c) => {
      let l, d;
      switch (o) {
        case "translate":
          l = "rem";
          break;
        case "skew":
          l = "deg";
          break;
        case "rotate":
          a === "3d" && (d = true), l = "deg";
          break;
        default:
          return i;
      }
      let h = c.split(",");
      return i.replace(c, h.map((m, p) => !d || h.length - 1 === p ? Number.isNaN(+m) ? m : m / (l === "rem" ? s : 1) + l : m).join(","));
    });
  }
};
e(ue, "id", "Transform"), e(ue, "matches", "^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\("), e(ue, "unit", "");
var ft = class extends t {
  order = -1;
};
e(ft, "id", "Transition"), e(ft, "symbol", "~");
var pe = class extends t {
};
e(pe, "id", "TransitionDelay"), e(pe, "matches", "^~delay:."), e(pe, "unit", "ms");
var he = class extends t {
};
e(he, "id", "TransitionDuration"), e(he, "matches", "^~duration:."), e(he, "unit", "ms");
var mt = class extends t {
};
e(mt, "id", "TransitionProperty"), e(mt, "matches", "^~property:.");
var ut = class extends t {
};
e(ut, "id", "TransitionTimingFunction"), e(ut, "matches", "^~easing:.");
var pt = class extends t {
};
e(pt, "id", "MaxHeight"), e(pt, "matches", "^max-h:.");
var ht = class extends t {
};
e(ht, "id", "MaxWidth"), e(ht, "matches", "^max-w:.");
var gt = class extends t {
};
e(gt, "id", "Display"), e(gt, "matches", "^d:.");
var xt = class extends t {
};
e(xt, "id", "BoxSizing"), e(xt, "matches", "^box:(?:$values)(?!\\|)");
var vt = class extends t {
};
e(vt, "id", "Opacity"), e(vt, "unit", "");
var ti = class extends t {
};
e(ti, "id", "Visibility");
var ri = class extends t {
};
e(ri, "id", "Clear");
var ii = class extends t {
};
e(ii, "id", "Float");
var si = class extends t {
};
e(si, "id", "Isolation");
var bt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    if (this.prefix)
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "overflow-x": r };
        case "y":
          return { "overflow-y": r };
      }
    return { overflow: r };
  }
  get order() {
    if (this.prefix)
      switch (this.prefix.slice(-2, -1)) {
        case "x":
        case "y":
          return 0;
      }
    return -1;
  }
};
e(bt, "id", "Overflow"), e(bt, "matches", "^overflow(?:-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\\$|var|$values)");
var yt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    switch (this.prefix.slice(-2, -1)) {
      case "x":
        return { "overscroll-behavior-x": r };
      case "y":
        return { "overscroll-behavior-y": r };
      default:
        return { "overscroll-behavior": r };
    }
  }
};
e(yt, "id", "OverscrollBehavior"), e(yt, "matches", "^overscroll-behavior(?:-[xy])?:");
var ge = class extends t {
};
e(ge, "id", "ZIndex"), e(ge, "matches", "^z:."), e(ge, "unit", "");
var xe = class extends t {
};
e(xe, "id", "AnimationDelay"), e(xe, "matches", "^@delay:."), e(xe, "unit", "ms");
var Rt = class extends t {
};
e(Rt, "id", "AnimationDirection"), e(Rt, "matches", "^@direction:.");
var St = class extends t {
};
e(St, "id", "AnimationFillMode"), e(St, "matches", "^@fill-mode:.");
var ve = class extends t {
};
e(ve, "id", "AnimationIterationCount"), e(ve, "matches", "^@iteration-count:."), e(ve, "unit", "");
var kt = class extends t {
};
e(kt, "id", "AnimationName"), e(kt, "matches", "^@name:.");
var Tt = class extends t {
};
e(Tt, "id", "AnimationPlayState"), e(Tt, "matches", "^@play-state:.");
var Ct = class extends t {
};
e(Ct, "id", "AnimationTimingFunction"), e(Ct, "matches", "^@easing:.");
var be = class extends t {
  order = -1;
};
e(be, "id", "Animation"), e(be, "symbol", "@"), e(be, "unit", "");
var Xi = "border-";
function K(r, s, i = "") {
  i && (i = "-" + i);
  let o = /^b(order)?-?(.)?/.exec(r)[2], a = Xi + "left" + i, c = Xi + "right" + i, l = Xi + "top" + i, d = Xi + "bottom" + i;
  switch (o) {
    case "x":
      return { [a]: s, [c]: s };
    case "y":
      return { [l]: s, [d]: s };
    case "l":
      return { [a]: s };
    case "r":
      return { [c]: s };
    case "t":
      return { [l]: s };
    case "b":
      return { [d]: s };
    default:
      return { ["border" + i]: s };
  }
}
var ee = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return K(this.prefix, r, "color");
  }
  get order() {
    return this.prefix === "border-color:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(ee, "id", "BorderColor"), e(ee, "matches", "^border(?:-(?:left|right|top|bottom))?-color:."), e(ee, "colorStarts", "b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?:"), e(ee, "colorful", true);
var Ji = "border-top-left-radius";
var Ki = "border-top-right-radius";
var es = "border-bottom-left-radius";
var ts = "border-bottom-right-radius";
var js = "border-radius";
var Ro = [Ji, Ki, es, ts];
var wt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    if (this.prefix) {
      let i = "", o = this.prefix.split("-");
      if (o.length > 1)
        for (let a = 1; a < o.length - 1; a++)
          i += o[a][0];
      else
        i = this.prefix.slice(1, -1);
      switch (i) {
        case "t":
          return { [Ji]: r, [Ki]: r };
        case "tl":
        case "lt":
          return { [Ji]: r };
        case "rt":
        case "tr":
          return { [Ki]: r };
        case "b":
          return { [es]: r, [ts]: r };
        case "bl":
        case "lb":
          return { [es]: r };
        case "br":
        case "rb":
          return { [ts]: r };
        case "l":
          return { [Ji]: r, [es]: r };
        case "r":
          return { [Ki]: r, [ts]: r };
        default:
          return { [js]: r };
      }
    }
    let s = this.prefix?.slice(0, -1);
    return { [Ro.includes(s) ? s : js]: r };
  }
  get order() {
    return this.prefix === "border-radius:" || this.prefix === "r:" ? -1 : 0;
  }
};
e(wt, "id", "BorderRadius"), e(wt, "matches", "^(?:r[tblr]?[tblr]?|border(?:-(?:top|bottom)-(?:left|right))?-radius):.");
var Mt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return K(this.prefix, r, "style");
  }
  get order() {
    return this.prefix === "border-style:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(Mt, "id", "BorderStyle"), e(Mt, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))");
var Ot = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return K(this.prefix, r, "width");
  }
  get order() {
    return this.prefix === "border-width:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(Ot, "id", "BorderWidth"), e(Ot, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)");
var ye = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return K(this.prefix, r);
  }
  get order() {
    return this.prefix === "border:" || this.prefix === "b:" ? -2 : -1;
  }
};
e(ye, "id", "Border"), e(ye, "matches", "^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):."), e(ye, "colorful", true);
var Bt = class extends t {
};
e(Bt, "id", "BackgroundAttachment"), e(Bt, "matches", "^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)");
var oi = class extends t {
};
e(oi, "id", "BackgroundBlendMode");
var At = class extends t {
  get(r) {
    return { "-webkit-background-clip": r, "background-clip": r };
  }
};
e(At, "id", "BackgroundClip"), e(At, "matches", "^(?:bg|background):(?:text|$values)(?!\\|)");
var te = class extends t {
};
e(te, "id", "BackgroundColor"), e(te, "colorStarts", "(?:bg|background):"), e(te, "unit", ""), e(te, "colorful", true);
var It = class extends t {
};
e(It, "id", "BackgroundOrigin"), e(It, "matches", "^(?:bg|background):(?:$values)(?!\\|)");
var Re = class extends t {
};
e(Re, "id", "BackgroundPosition"), e(Re, "matches", "^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)"), e(Re, "unit", "px");
var Ft = class extends t {
};
e(Ft, "id", "BackgroundRepeat"), e(Ft, "matches", "^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])");
var $t = class extends t {
};
e($t, "id", "BackgroundSize"), e($t, "matches", "^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)");
var Se = class extends t {
};
e(Se, "id", "BackgroundImage"), e(Se, "matches", "^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)"), e(Se, "colorful", true);
var ke = class extends t {
  order = -1;
};
e(ke, "id", "Background"), e(ke, "matches", "^bg:."), e(ke, "colorful", true);
var Et = class extends t {
};
e(Et, "id", "MixBlendMode"), e(Et, "matches", "^blend:.");
var ai = class extends t {
};
e(ai, "id", "Position");
function rs(r, s, { rootSize: i }) {
  let o = "", a = 0;
  return function c(l, d) {
    let h = "", m = d ? s(d) : "", p = () => {
      h && (o += !m || Number.isNaN(+h) ? h : +h / (m === "rem" ? i : 1) + m, h = "");
    };
    for (; a < r.length; a++) {
      let f = r[a];
      if (f === l && (l !== "'" || r[a + 1] === ")")) {
        p(), o += f;
        break;
      } else
        f === "," || f === " " ? (p(), o += f) : !h && f === "'" ? (o += f, a++, c(f), h = "") : h && f === "(" ? (o += h + f, a++, c(")", h), h = "") : h += f;
    }
    p();
  }(), o;
}
var Te = class extends t {
  get(r) {
    return { "backdrop-filter": r, "-webkit-backdrop-filter": r };
  }
  parseValue(r, s) {
    return rs(r, (i) => {
      switch (i) {
        case "blur":
        case "drop-shadow":
          return "rem";
        case "hue-rotate":
          return "deg";
      }
      return "";
    }, s);
  }
};
e(Te, "id", "BackdropFilter"), e(Te, "matches", "^bd:."), e(Te, "colorful", true);
var Ce = class extends t {
};
e(Ce, "id", "Fill"), e(Ce, "colorStarts", "fill:"), e(Ce, "colorful", true);
var Wt = class extends t {
};
e(Wt, "id", "Stroke"), e(Wt, "colorful", true);
var Dt = class extends t {
};
e(Dt, "id", "StrokeWidth"), e(Dt, "matches", "^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var we = class extends t {
  parseValue(r, s) {
    return rs(r, (i) => {
      switch (i) {
        case "blur":
        case "drop-shadow":
          return "rem";
        case "hue-rotate":
          return "deg";
      }
      return "";
    }, s);
  }
};
e(we, "id", "Filter"), e(we, "matches", "^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\("), e(we, "colorful", true);
var ni = class extends t {
};
e(ni, "id", "Cursor");
var li = class extends t {
};
e(li, "id", "PointerEvents");
var ci = class extends t {
};
e(ci, "id", "Resize");
var di = class extends t {
};
e(di, "id", "TouchAction");
var fi = class extends t {
  get(r) {
    return { "user-drag": r, "-webkit-user-drag": r };
  }
};
e(fi, "id", "UserDrag");
var mi = class extends t {
  get(r) {
    return { "user-select": r, "-webkit-user-select": r };
  }
};
e(mi, "id", "UserSelect");
var Me = class extends t {
};
e(Me, "id", "BoxShadow"), e(Me, "matches", "^s(?:hadow)?:."), e(Me, "colorful", true);
var Lt = class extends t {
};
e(Lt, "id", "TextShadow"), e(Lt, "colorful", true);
var Ns = 0.75;
var jt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let { unit: s, value: i } = r;
    return { "font-size": r, "line-height": { ...r, value: s === "em" ? i + Ns + s : `calc(${i}${s} + ${Ns}em)`, unit: "" } };
  }
};
e(jt, "id", "TextSize"), e(jt, "matches", "^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Nt = class extends t {
};
e(Nt, "id", "WordBreak"), e(Nt, "unit", "");
var Oe = class extends t {
  get(r) {
    return { display: { ...r, value: "grid" }, "grid-template-columns": { ...this, value: "repeat(" + r.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(Oe, "id", "GridColumns"), e(Oe, "matches", "^grid-cols:."), e(Oe, "unit", "");
var Pt = class extends t {
  get(r) {
    return { display: { ...r, value: "grid" }, "grid-auto-flow": { ...r, value: "column" }, "grid-template-rows": { ...r, value: "repeat(" + r.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(Pt, "id", "GridRows"), e(Pt, "unit", "");
var zt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    switch (this.prefix[4]) {
      case "x":
        return { "column-gap": r };
      case "y":
        return { "row-gap": r };
      default:
        return { gap: r };
    }
  }
  order = -1;
};
e(zt, "id", "Gap"), e(zt, "matches", "^gap(?:-x|-y)?:.");
var Gt = class extends t {
};
e(Gt, "id", "WordSpacing"), e(Gt, "unit", "em");
var Be = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { ["--" + this.prefix.slice(1, -1)]: r };
  }
};
e(Be, "id", "Variable"), e(Be, "matches", "^\\$[^ (){}A-Z]+:[^ ]"), e(Be, "unit", "");
var Ae = class extends t {
};
e(Ae, "id", "AspectRatio"), e(Ae, "matches", "^aspect:."), e(Ae, "unit", "");
var Vt = class extends t {
  get(r) {
    return { "box-decoration-break": r, "-webkit-box-decoration-break": r };
  }
};
e(Vt, "id", "BoxDecorationBreak"), e(Vt, "matches", "^box:(?:slice|clone|$values)(?!\\|)");
var ui = class extends t {
};
e(ui, "id", "BreakAfter");
var pi = class extends t {
};
e(pi, "id", "BreakBefore");
var hi = class extends t {
};
e(hi, "id", "BreakInside");
var _t = class extends t {
};
e(_t, "id", "FlexShrink"), e(_t, "unit", "");
var Ht = class extends t {
};
e(Ht, "id", "FlexDirection"), e(Ht, "matches", "^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)");
var Ut = class extends t {
};
e(Ut, "id", "FlexGrow"), e(Ut, "unit", "");
var Qt = class extends t {
};
e(Qt, "id", "FlexWrap"), e(Qt, "matches", "^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)");
var gi = class extends t {
};
e(gi, "id", "FlexBasis");
var Yt = class extends t {
  order = -1;
};
e(Yt, "id", "Flex"), e(Yt, "unit", "");
var Ie = class extends t {
};
e(Ie, "id", "Order"), e(Ie, "matches", "^o:."), e(Ie, "unit", "");
var Fe = class extends t {
  parseValue(r) {
    return this.prefix.slice(-5, -1) === "span" && r !== "auto" ? "span " + r + "/span " + r : r;
  }
  order = -1;
};
e(Fe, "id", "GridColumn"), e(Fe, "matches", "^grid-col(?:umn)?(?:-span)?:."), e(Fe, "unit", "");
var Zt = class extends t {
};
e(Zt, "id", "ColumnSpan"), e(Zt, "matches", "^col-span:.");
var $e = class extends t {
  parseValue(r) {
    return this.prefix.slice(-5, -1) === "span" && r !== "auto" ? "span " + r + "/span " + r : r;
  }
  order = -1;
};
e($e, "id", "GridRow"), e($e, "matches", "^grid-row-span:."), e($e, "unit", "");
var re = class extends t {
};
e(re, "id", "Color"), e(re, "matches", "^(?:color|fg|foreground):."), e(re, "colorful", true), e(re, "unit", "");
var qt = class extends t {
};
e(qt, "id", "AlignContent"), e(qt, "matches", "^ac:.");
var Xt = class extends t {
};
e(Xt, "id", "AlignItems"), e(Xt, "matches", "^ai:.");
var Jt = class extends t {
};
e(Jt, "id", "AlignSelf"), e(Jt, "matches", "^as:");
var Kt = class extends t {
};
e(Kt, "id", "GridAutoColumns"), e(Kt, "matches", "^grid-auto-cols:.");
var er = class extends t {
};
e(er, "id", "GridAutoFlow"), e(er, "matches", "^grid-flow:.");
var xi = class extends t {
};
e(xi, "id", "GridAutoRows");
var tr = class extends t {
};
e(tr, "id", "JustifyContent"), e(tr, "matches", "^jc:.");
var rr = class extends t {
};
e(rr, "id", "JustifyItems"), e(rr, "matches", "^ji:.");
var ir = class extends t {
};
e(ir, "id", "JustifySelf"), e(ir, "matches", "^js:.");
var vi = class extends t {
  order = -1;
};
e(vi, "id", "PlaceContent");
var bi = class extends t {
  order = -1;
};
e(bi, "id", "PlaceItems");
var yi = class extends t {
  order = -1;
};
e(yi, "id", "PlaceSelf");
var sr = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { [this.prefix.slice(0, -1)]: r };
  }
  get order() {
    return this.prefix === "padding:" ? -1 : 0;
  }
};
e(sr, "id", "Padding"), e(sr, "matches", "^padding(?:-(?:left|right|top|bottom))?:.");
var or = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { [this.prefix.slice(0, -1)]: r };
  }
  get order() {
    return this.prefix === "margin:" ? -1 : 0;
  }
};
e(or, "id", "Margin"), e(or, "matches", "^margin(?:-(?:left|right|top|bottom))?:.");
var ar = class extends t {
};
e(ar, "id", "TextOverflow"), e(ar, "matches", "^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))");
var nr = class extends t {
};
e(nr, "id", "ListStylePosition"), e(nr, "matches", "^list-style:(?:inside|outside|$values)(?!\\|)");
var lr = class extends t {
};
e(lr, "id", "ListStyleType"), e(lr, "matches", "^list-style:(?:disc|decimal|$values)(?!\\|)");
var Ri = class extends t {
  order = -1;
};
e(Ri, "id", "ListStyle");
var Ee = class extends t {
};
e(Ee, "id", "TextDecorationColor"), e(Ee, "colorStarts", "text-decoration:"), e(Ee, "colorful", true);
var cr = class extends t {
};
e(cr, "id", "TextDecorationStyle"), e(cr, "matches", "^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)");
var We = class extends t {
};
e(We, "id", "TextDecorationThickness"), e(We, "matches", "^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$"), e(We, "unit", "em");
var Si = class extends t {
};
e(Si, "id", "TextIndent");
var ki = class extends t {
};
e(ki, "id", "Content");
var De = class extends t {
};
e(De, "id", "OutlineColor"), e(De, "colorStarts", "outline:"), e(De, "colorful", true);
var Ti = class extends t {
};
e(Ti, "id", "OutlineOffset");
var dr = class extends t {
};
e(dr, "id", "OutlineStyle"), e(dr, "matches", "^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)");
var fr = class extends t {
};
e(fr, "id", "OutlineWidth"), e(fr, "matches", "^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var mr = class extends t {
  order = -1;
};
e(mr, "id", "Outline"), e(mr, "colorful", true);
var ur = class extends t {
};
e(ur, "id", "BorderCollapse"), e(ur, "matches", "^b(?:order)?:(?:collapse|separate|$values)(?!\\|)");
var Ci = class extends t {
};
e(Ci, "id", "BorderSpacing");
var wi = class extends t {
};
e(wi, "id", "TableLayout");
var Le = class extends t {
};
e(Le, "id", "AccentColor"), e(Le, "colorStarts", "accent:"), e(Le, "colorful", true);
var Mi = class extends t {
};
e(Mi, "id", "Appearance");
var je = class extends t {
};
e(je, "id", "CaretColor"), e(je, "colorStarts", "caret:"), e(je, "colorful", true);
var Oi = class extends t {
};
e(Oi, "id", "ScrollBehavior");
var pr = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    if (this.prefix.slice(-3, -2) === "m")
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "scroll-margin-left": r, "scroll-margin-right": r };
        case "y":
          return { "scroll-margin-top": r, "scroll-margin-bottom": r };
        case "l":
          return { "scroll-margin-left": r };
        case "r":
          return { "scroll-margin-right": r };
        case "t":
          return { "scroll-margin-top": r };
        case "b":
          return { "scroll-margin-bottom": r };
      }
    else
      return { [this.prefix.replace(/-m(?!argin)/, "-margin").slice(0, -1)]: r };
  }
  get order() {
    return this.prefix === "scroll-margin:" || this.prefix === "scroll-m:" ? -1 : 0;
  }
};
e(pr, "id", "ScrollMargin"), e(pr, "matches", "^scroll-m(?:[xytblr]|argin(?:-(?:top|bottom|left|right))?)?:.");
var hr = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    if (this.prefix.slice(-3, -2) === "p")
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "scroll-padding-left": r, "scroll-padding-right": r };
        case "y":
          return { "scroll-padding-top": r, "scroll-padding-bottom": r };
        case "l":
          return { "scroll-padding-left": r };
        case "r":
          return { "scroll-padding-right": r };
        case "t":
          return { "scroll-padding-top": r };
        case "b":
          return { "scroll-padding-bottom": r };
      }
    else
      return { [this.prefix.replace(/-p(?!adding)/, "-padding").slice(0, -1)]: r };
  }
  get order() {
    return this.prefix === "scroll-padding:" || this.prefix === "scroll-p:" ? -1 : 0;
  }
};
e(hr, "id", "ScrollPadding"), e(hr, "matches", "^scroll-p(?:[xytblr]|adding(?:-(?:top|bottom|left|right))?)?:.");
var gr = class extends t {
};
e(gr, "id", "ScrollSnapAlign"), e(gr, "matches", "^scroll-snap:(?:start|end|center|$values)");
var xr = class extends t {
};
e(xr, "id", "ScrollSnapStop"), e(xr, "matches", "^scroll-snap:(?:normal|always|$values)(?!\\|)");
var vr = class extends t {
};
e(vr, "id", "ScrollSnapType"), e(vr, "matches", "^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)");
var Bi = class extends t {
};
e(Bi, "id", "WillChange");
var Ai = class extends t {
};
e(Ai, "id", "TextUnderlineOffset");
var br = class extends t {
  get(r) {
    return { [this.prefix.slice(0, -1)]: r };
  }
};
e(br, "id", "Inset"), e(br, "matches", "^(?:top|bottom|left|right):.");
var Ne = class extends t {
  order = -1;
};
e(Ne, "id", "Columns"), e(Ne, "matches", "^(?:columns|cols):."), e(Ne, "unit", "");
var yr = class extends t {
};
e(yr, "id", "WhiteSpace"), e(yr, "unit", "");
var Rr = class extends t {
};
e(Rr, "id", "TextOrientation"), e(Rr, "matches", "^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)");
var Sr = class extends t {
};
e(Sr, "id", "WritingMode"), e(Sr, "matches", "^writing:.");
var Ii = class extends t {
};
e(Ii, "id", "Contain");
var Pe = class extends t {
};
e(Pe, "id", "AnimationDuration"), e(Pe, "matches", "^@duration:."), e(Pe, "unit", "ms");
var kr = class extends t {
};
e(kr, "id", "TextRendering"), e(kr, "matches", "^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)");
var Fi = class extends t {
};
e(Fi, "id", "Direction");
var Tr = class extends t {
};
e(Tr, "id", "TextDecorationLine"), e(Tr, "matches", "^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)");
var ze = class extends t {
};
e(ze, "id", "GridColumnStart"), e(ze, "matches", "^grid-col-start:."), e(ze, "unit", "");
var Cr = class extends t {
};
e(Cr, "id", "ListStyleImage"), e(Cr, "matches", "^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var wr = class extends t {
};
e(wr, "id", "ShapeOutside"), e(wr, "matches", "^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)");
var Mr = class extends t {
};
e(Mr, "id", "ShapeMargin"), e(Mr, "matches", "^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Or = class extends t {
};
e(Or, "id", "ShapeImageThreshold"), e(Or, "unit", "");
var Br = class extends t {
};
e(Br, "id", "ClipPath"), e(Br, "matches", "^clip:.");
var $i = class extends t {
  order = -1;
};
e($i, "id", "Grid");
var Ge = class extends t {
  order = -1;
};
e(Ge, "id", "Font"), e(Ge, "matches", "^f:."), e(Ge, "unit", "");
var Ei = class extends t {
};
e(Ei, "id", "Quotes");
var Wi = class extends t {
  order = -1;
};
e(Wi, "id", "GridTemplate");
var Ar = class extends t {
};
e(Ar, "id", "GridRowStart"), e(Ar, "unit", "");
var Di = class extends t {
};
e(Di, "id", "GridTemplateAreas");
var Ir = class extends t {
};
e(Ir, "id", "GridTemplateColumns"), e(Ir, "matches", "^grid-template-cols:.");
var Li = class extends t {
};
e(Li, "id", "GridTemplateRows");
var Fr = class extends t {
  order = -1;
};
e(Fr, "id", "GridArea"), e(Fr, "unit", "");
var Ve = class extends t {
};
e(Ve, "id", "GridColumnEnd"), e(Ve, "matches", "^grid-col-end:."), e(Ve, "unit", "");
var $r = class extends t {
};
e($r, "id", "GridRowEnd"), e($r, "unit", "");
var ji = class extends t {
  get(r) {
    return { "mask-image": r, "-webkit-mask-image": r };
  }
};
e(ji, "id", "MaskImage");
var ie = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-fill-color": r };
  }
};
e(ie, "id", "TextFillColor"), e(ie, "matches", "^text-fill-color:."), e(ie, "colorStarts", "(?:text-fill|text|t):"), e(ie, "colorful", true);
var Er = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-stroke": r };
  }
};
e(Er, "id", "TextStroke"), e(Er, "matches", "^text-stroke:.");
var Wr = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-stroke-width": r };
  }
};
e(Wr, "id", "TextStrokeWidth"), e(Wr, "matches", "^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)");
var se = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-stroke-color": r };
  }
};
e(se, "id", "TextStrokeColor"), e(se, "matches", "^text-stroke-color:."), e(se, "colorStarts", "text-stroke:"), e(se, "colorful", true);
var Ni = class extends t {
};
e(Ni, "id", "StrokeDasharray");
var Pi = class extends t {
};
e(Pi, "id", "StrokeDashoffset");
var Dr = class extends t {
};
e(Dr, "id", "X"), e(Dr, "unit", "");
var Lr = class extends t {
};
e(Lr, "id", "Y"), e(Lr, "unit", "");
var jr = class extends t {
};
e(jr, "id", "Cx"), e(jr, "unit", "");
var Nr = class extends t {
};
e(Nr, "id", "Cy"), e(Nr, "unit", "");
var Pr = class extends t {
};
e(Pr, "id", "Rx"), e(Pr, "unit", "");
var zr = class extends t {
};
e(zr, "id", "Ry"), e(zr, "unit", "");
var zi = class extends t {
};
e(zi, "id", "BorderImageOutset");
var Gr = class extends t {
};
e(Gr, "id", "BorderImageRepeat"), e(Gr, "matches", "^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)");
var Vr = class extends t {
};
e(Vr, "id", "BorderImageSlice"), e(Vr, "unit", "");
var _r = class extends t {
};
e(_r, "id", "BorderImageSource"), e(_r, "matches", "^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var Hr = class extends t {
};
e(Hr, "id", "BorderImageWidth"), e(Hr, "matches", "^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Ur = class extends t {
};
e(Ur, "id", "BorderImage"), e(Ur, "unit", "");
var So = /\{(.*)\}/;
var _e = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    let o = 0;
    for (; o < r.length && !(r[o] === "{" && r[o - 1] !== "\\"); o++)
      ;
    return [r.slice(0, o), ...Y(r.slice(o), s, i)];
  }
  getThemeProps(r, s) {
    let i = {}, o = (m, p) => {
      let f = p.indexOf(":");
      if (f !== -1) {
        m in i || (i[m] = {});
        let n = i[m], u = p.slice(0, f);
        u in n || (n[u] = p.slice(f + 1));
      }
    }, a = (m) => {
      let p = (f, n) => {
        let u = n.slice(CSS.escape(m.className).length).match(So)[1].split(";");
        for (let k of u)
          o(f, k);
      };
      if (this.theme) {
        let f = m.natives.find((n) => n.theme === this.theme) ?? m.natives.find((n) => !n.theme);
        f && p(this.theme, f.text);
      } else
        for (let f of m.natives)
          p(f.theme, f.text);
    }, c = [], l = "", d = () => {
      l && (c.push(l.replace(/ /g, "")), l = "");
    }, h = 1;
    (function m(p) {
      for (; h < r.value.length; h++) {
        let f = r.value[h];
        if (!p) {
          if (f === ";") {
            d();
            continue;
          }
          if (f === "}")
            break;
        }
        if (l += f, p === f) {
          if (p === "'" || p === '"') {
            let n = 0;
            for (let u = l.length - 2; l[u] === "\\"; u--)
              n++;
            if (n % 2)
              continue;
          }
          break;
        } else
          f in Ye && p !== "'" && p !== '"' && (h++, m(Ye[f]));
      }
    })(void 0), d();
    for (let m of c) {
      let p = s.create(m);
      if (Array.isArray(p))
        for (let f of p)
          a(f);
      else
        p ? a(p) : o(this.theme ?? "", m);
    }
    return i;
  }
};
e(_e, "id", "Group"), e(_e, "matches", "^(?:.+?[*_>~+])?\\{.+?\\}"), e(_e, "unit", "");
var Qr = class extends t {
};
e(Qr, "id", "CounterIncrement"), e(Qr, "unit", "");
var Yr = class extends t {
};
e(Yr, "id", "CounterReset"), e(Yr, "unit", "");
var Zr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Y(r, s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { width: { ...r, value: s }, height: { ...r, value: i } };
  }
};
e(Zr, "id", "WH"), e(Zr, "matches", "^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var qr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Y(r.slice(4), s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { "min-width": { ...r, value: s }, "min-height": { ...r, value: i } };
  }
};
e(qr, "id", "MinWH"), e(qr, "matches", "^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var Xr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Y(r.slice(4), s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { "max-width": { ...r, value: s }, "max-height": { ...r, value: i } };
  }
};
e(Xr, "id", "MaxWH"), e(Xr, "matches", "^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var ko = [_e, Be, qe, oe, Ze, ne, le, rt, it, Ge, re, Xe, or, sr, gi, Qt, Ut, _t, Ht, Yt, gt, Je, Ke, et, tt, Zr, qr, Xr, Ii, ki, Qr, Yr, ae, ce, st, ot, at, Ee, cr, We, Tr, de, Ai, ar, Rr, nt, kr, Si, lt, Ne, yr, br, fe, pt, ht, xt, vt, ti, ri, ii, si, bt, yt, ge, ai, ni, li, ci, di, Nt, Gt, fi, mi, Lt, jt, ie, Wr, se, Er, Me, wi, dt, ct, me, ue, mt, ut, he, pe, ft, xe, Rt, Pe, St, ve, kt, Tt, Ct, be, ee, wt, Mt, Ot, ur, Ci, zi, Gr, Vr, _r, Hr, Ur, ye, Bt, oi, te, At, It, Re, Ft, $t, Se, ke, Et, Te, we, Ce, Ni, Pi, Dt, Wt, Dr, Lr, jr, Nr, Pr, zr, ze, Ve, Fe, Oe, Ar, $r, $e, Pt, Kt, er, xi, Di, Ir, Li, Wi, Fr, $i, zt, Ie, hi, pi, ui, Vt, Ae, Zt, qt, Xt, Jt, tr, rr, ir, vi, bi, yi, nr, lr, Cr, Ri, De, Ti, dr, fr, mr, Le, Mi, je, Oi, pr, hr, gr, xr, vr, Bi, Sr, Fi, wr, Mr, Or, Br, Ei, ji];
var Rs = ko;
var Ps = false;
var zs = true;
var Gs = false;
var To = { colors: cs, breakpoints: Ue, semantics: ms, values: gs, selectors: fs, themes: us, theme: hs, Rules: Rs, rootSize: ds, scope: Ts, override: Ps, observe: zs, important: Gs };
var is = To;
var Co = [",", ".", "#", "[", "!", "*", ">", "+", "~", ":", "@"];
var wo = /^::-[a-z]+-/m;
var Mo = /^rgba?\( *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?:(?:\/|,) *0?(\.[0-9]))?\)$/;
var ss;
var os = typeof window < "u";
os && (ss = document.createElement("style"), ss.title = "master");
var _ = "max-width";
var G = "min-width";
var Oo = "attributes";
var Bo = os ? window.MutationObserver : Object;
var Gi = class extends Bo {
  constructor(i) {
    super((o) => {
      let a = {}, c = [], l = [], d = [], h = (n, u) => {
        u ? n.classList.forEach(p) : n.classList.forEach(m);
        let k = n.children;
        for (let b = 0; b < k.length; b++) {
          let R = k[b];
          R.classList && (l.push(R), h(R, u));
        }
      }, m = (n) => {
        n in a ? a[n]++ : a[n] = 1;
      }, p = (n) => {
        n in a ? a[n]-- : n in this.countOfClass && (a[n] = -1);
      }, f = (n, u) => {
        for (let k = 0; k < n.length; k++) {
          let b = n[k];
          b.classList && !l.includes(b) && !d.includes(b) && (b.isConnected !== u ? (l.push(b), h(b, u)) : d.push(b));
        }
      };
      for (let n = 0; n < o.length; n++) {
        let u = o[n], { addedNodes: k, removedNodes: b, type: R, target: C, oldValue: y } = u;
        if (R === Oo) {
          if (c.find((g) => g.target === C))
            continue;
          c.push(u);
        } else
          f(k, false), (!C.isConnected || !l.includes(C)) && f(b, true);
      }
      if (!(!c.length && !Object.keys(a).length)) {
        for (let { oldValue: n, target: u } of c) {
          let k = l.includes(u), b = u.classList, R = n ? n.split(" ") : [];
          if (k) {
            if (u.isConnected)
              continue;
            for (let C of R)
              b.contains(C) || p(C);
          } else if (u.isConnected) {
            b.forEach((C) => {
              R.includes(C) || m(C);
            });
            for (let C of R)
              b.contains(C) || p(C);
          }
        }
        for (let n in a) {
          let u = a[n], k = (this.countOfClass[n] || 0) + u;
          k === 0 ? (delete this.countOfClass[n], this.delete(n)) : (n in this.countOfClass || this.insert(n), this.countOfClass[n] = k);
        }
      }
    });
    this.config = i;
    this.config?.override || (this.config = Z(is, i)), this.cache(), os && this.config.observe && this.observe(document), Gi.instances.push(this), this.ready = true;
  }
  static refresh(i) {
    for (let o of this.instances)
      o.refresh(i);
  }
  style;
  rules = [];
  ruleOfClass = {};
  countOfClass = {};
  host;
  root;
  ready = false;
  semantics;
  classes;
  colorThemesMap;
  colorNames;
  themeNames;
  relationThemesMap;
  relations;
  selectors;
  values;
  globalValues;
  breakpoints;
  mediaQueries;
  matches;
  theme;
  cache() {
    this.semantics = [], this.classes = {}, this.colorThemesMap = {}, this.relationThemesMap = {}, this.relations = {}, this.colorNames = [], this.themeNames = [""], this.selectors = {}, this.values = {}, this.globalValues = {}, this.breakpoints = {}, this.mediaQueries = {}, this.matches = {};
    let { semantics: i, classes: o, selectors: a, themes: c, colors: l, values: d, breakpoints: h, mediaQueries: m, Rules: p } = this.config;
    function f(g) {
      return g.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    function n(g, x, v = "", S = {}) {
      let T = (O) => O ? (v ? v + "-" : "") + O : v, B = Object.entries(g), A = [], W = [];
      for (let O of B) {
        let H = O[1];
        (typeof H == "object" && !Array.isArray(H) ? A : W).push(O);
      }
      for (let [O, H] of A)
        n(H, x, T(O), S);
      if (x && v)
        W.length && (S[v] = W.reduce((O, [H, He]) => (O[H] = He, O), {}));
      else
        for (let [O, H] of W)
          S[T(O)] = H;
      return S;
    }
    if (i)
      for (let [g, x] of Object.entries(n(i, true)))
        this.semantics.push([new RegExp("^" + f(g) + "(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)", "m"), [g, x]]);
    if (a)
      for (let [g, x] of Object.entries(n(a, false))) {
        let v = new RegExp(f(g) + "(?![a-z-])");
        for (let S of Array.isArray(x) ? x : [x]) {
          let T = S.match(wo)?.[0] ?? "", B = this.selectors[T];
          B || (B = this.selectors[T] = []);
          let A = B.find(([W]) => W === v);
          A || (A = [v, []], B.push(A)), A[1].push(S);
        }
      }
    if (d)
      for (let [g, x] of Object.entries(d))
        typeof x == "object" ? this.values[g] = n(x, false) : this.globalValues[g] = x;
    h && (this.breakpoints = n(h, false)), m && (this.mediaQueries = n(m, false));
    let u = o ? n(o, false) : {}, k = c && !Array.isArray(c) ? Object.entries(c).filter(([, { classes: g }]) => g).reduce((g, [x, { classes: v }]) => (g[x] = n(v, false), g), {}) : {}, b = [...Object.keys(u), ...Object.entries(k).flatMap(([g, x]) => Object.keys(x))], R = (g) => {
      if (g in this.classes)
        return;
      let x = this.classes[g] = [], v = (S, T) => {
        if (!T)
          return;
        let B = Array.isArray(T) ? T : T.replace(/(?:\n(?:\s*))+/g, " ").trim().split(" ");
        for (let A of B) {
          let W = (O) => {
            O in this.relationThemesMap ? S in this.relationThemesMap[O] ? this.relationThemesMap[O][S].push(g) : this.relationThemesMap[O][S] = [g] : this.relationThemesMap[O] = { [S]: [g] }, x.includes(O) || x.push(O);
          };
          if (b.includes(A)) {
            R(A);
            for (let O of this.classes[A])
              W(O);
          } else
            W(A);
        }
      };
      v("", u?.[g]);
      for (let [S, T] of Object.entries(k))
        v(S, T?.[g]);
    };
    for (let g of b)
      R(g);
    for (let g in this.relationThemesMap) {
      let x = this.relations[g] = [];
      for (let v of Object.values(this.relationThemesMap[g]))
        for (let S of v)
          x.includes(S) || x.push(S);
    }
    let C = (g, x) => {
      if (!x)
        return;
      let v = n(x, true);
      for (let [S, T] of Object.entries(v)) {
        let B = typeof T == "string" ? { "": T } : T;
        for (let [A, W] of Object.entries(B)) {
          let O = S + (A ? "-" + A : "");
          O in this.colorThemesMap ? this.colorThemesMap[O][g] = W : this.colorThemesMap[O] = { [g]: W };
        }
      }
      for (let S in x)
        this.colorNames.includes(S) || this.colorNames.push(S);
    };
    if (C("", l), c)
      if (Array.isArray(c))
        this.themeNames.push(...c);
      else
        for (let g in c) {
          let x = c[g];
          C(g, x.colors), this.themeNames.push(g);
        }
    let y = (g) => {
      for (let [x, v] of Object.entries(this.colorThemesMap))
        for (let [S, T] of Object.entries(v))
          T.startsWith("#") || g(x, v, S, T);
    };
    if (y((g, x, v, S) => {
      let T = Mo.exec(S);
      if (T) {
        let B = "#" + Hi(+T[1], +T[2], +T[3]);
        T[4] && (B += Math.round(255 * +T[4]).toString(16)), x[v] = B;
      }
    }), y((g, x, v, S) => {
      let [T, B] = S.split("/"), A = this.colorThemesMap[T];
      if (A) {
        let W = (v ? A[v] : void 0) ?? A[""];
        x[v] = B ? W.slice(0, 7) + Math.round(255 * +B).toString(16) : W;
      } else
        console.warn(`\`${S}\` doesn't exist in the extended config \`.colors\``), delete x[v], Object.keys(x).length || delete this.colorThemesMap[g];
    }), p)
      for (let g of p) {
        let x = g.matches;
        if (x) {
          let v = Object.keys(this.values[g.id] ?? {}), S = x.indexOf("$values");
          this.matches[g.id] = new RegExp(S === -1 ? x : v.length ? x.slice(0, S) + v.join("|") + x.slice(S + 7) : x.slice(0, S - (x[S - 1] === "|" ? 1 : 0)) + x.slice(S + 7 + (x[S + 7] === "|" ? 1 : 0)));
        }
      }
  }
  observe(i, o = { subtree: true, childList: true }) {
    if (os && i) {
      this.root = i;
      let a = i === document;
      a && (Gi.root = this), this.host = a ? document.documentElement : i.host, this.theme = new Qe(this.host, this.config.theme);
      let c = a ? document.head : i, l = a ? document.styleSheets : i.styleSheets;
      for (let h of l) {
        let { title: m, href: p, ownerNode: f } = h;
        (m === "master" || p && p.startsWith(window.location.origin) && /master(?:\..+)?\.css/.test(p)) && (this.style = f);
      }
      if (this.style)
        for (let h = 0; h < this.style.sheet.cssRules.length; h++) {
          let m = (f) => {
            if (f.selectorText) {
              let u = f.selectorText.split(", ")[0].split(" ");
              for (let k = 0; k < u.length; k++) {
                let b = u[k];
                if (b[0] === ".") {
                  let R = b.slice(1), C = "";
                  for (let y = 0; y < R.length; y++) {
                    let g = R[y], x = R[y + 1];
                    if (g === "\\") {
                      if (y++, x !== "\\") {
                        C += x;
                        continue;
                      }
                    } else if (Co.includes(g))
                      break;
                    C += g;
                  }
                  if (!(C in this.ruleOfClass) && !(C in this.classes)) {
                    let y = this.create(C)[0];
                    if (y)
                      return y;
                  }
                }
              }
            } else if (f.cssRules)
              for (let n = 0; n < f.cssRules.length; n++) {
                let u = m(f.cssRules[n]);
                if (u)
                  return u;
              }
          }, p = m(this.style.sheet.cssRules[h]);
          if (p) {
            this.rules.push(p), this.ruleOfClass[p.className] = p;
            for (let f = 0; f < p.natives.length; f++)
              p.natives[f].cssRule = this.style.sheet.cssRules[h + f];
            h += p.natives.length - 1;
          }
        }
      else
        this.style = ss.cloneNode(), c.prepend(this.style);
      let d = (h) => {
        h.forEach((m) => {
          m in this.countOfClass ? this.countOfClass[m]++ : (this.countOfClass[m] = 1, this.insert(m));
        });
      };
      d(this.host.classList), o.subtree && this.host.querySelectorAll("[class]").forEach((h) => d(h.classList)), super.observe(i, { ...o, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
    }
    return this;
  }
  disconnect() {
    super.disconnect(), this.ruleOfClass = {}, this.countOfClass = {}, this.rules.length = 0;
    let i = this.style.sheet;
    if (i)
      for (let o = i.cssRules.length - 1; o >= 0; o--)
        i.deleteRule(o);
    this.style.remove(), this.style = null, this.theme?.destroy(), this.theme = null;
  }
  match(i) {
    for (let o of this.config.Rules) {
      let a = o.match(i, this.matches[o.id], this.colorThemesMap, this.colorNames);
      if (a)
        return { ...a, Rule: o };
    }
    for (let o of this.semantics)
      if (i.match(o[0]))
        return { origin: "semantics", value: o[1], Rule: t };
  }
  create(i) {
    let o = (a) => {
      if (a in this.ruleOfClass)
        return this.ruleOfClass[a];
      let c = this.match(a);
      if (c)
        return new c.Rule(a, c, this);
    };
    return (i in this.classes ? this.classes[i].map((a) => o(a)) : [o(i)]).filter((a) => a && a.text);
  }
  refresh(i) {
    if (i?.override ? this.config = i : this.config = Z(is, i), this.cache(), !this.style)
      return;
    let o = ss.cloneNode();
    this.style.replaceWith(o), this.style = o, this.rules.length = 0, this.ruleOfClass = {};
    for (let a in this.countOfClass)
      this.insert(a);
  }
  destroy() {
    let i = Gi.instances;
    this.disconnect(), i.splice(i.indexOf(this), 1);
  }
  delete(i) {
    let o = this.style.sheet, a = (c) => {
      let l = this.ruleOfClass[c];
      if (!(!l || c in this.relations && this.relations[c].some((d) => d in this.countOfClass))) {
        if (l.natives.length) {
          let d = l.natives[0];
          for (let h = 0; h < o.cssRules.length; h++)
            if (o.cssRules[h] === d.cssRule) {
              for (let p = 0; p < l.natives.length; p++)
                o.deleteRule(h);
              this.rules.splice(this.rules.indexOf(l), 1);
              break;
            }
        }
        delete this.ruleOfClass[c];
      }
    };
    if (i in this.classes) {
      for (let c of this.classes[i])
        c in this.countOfClass || a(c);
      delete this.ruleOfClass[i];
    } else
      a(i);
  }
  insert(i) {
    let o = this.create(i);
    return o.length ? (this.insertRules(o), true) : false;
  }
  insertRules(i) {
    for (let o of i) {
      if (this.ruleOfClass[o.className])
        continue;
      let a, c = this.rules.length - 1, { media: l, order: d, priority: h, hasWhere: m, className: p } = o, f = (n, u, k, b) => {
        let R = 0, C;
        u && (R = n.findIndex(u)), k && (C = n.findIndex(k)), R === -1 && (R = n.length), (C === void 0 || C === -1) && (C = n.length);
        let y = n.slice(R, C);
        for (let g = 0; g < y.length; g++) {
          let x = y[g];
          if (!(x.priority === -1 || b && b(x)) && (x.priority < h || x.priority === h && (m && !x.hasWhere || x.order >= d)))
            return R + g;
        }
        return R + y.length;
      };
      if (l) {
        let n = this.rules.findIndex((u) => u.media);
        if (n !== -1) {
          let u = l.features[_], k = l.features[G];
          if (u && k) {
            let b = u.value - k.value;
            for (let R = c; R >= n; R--) {
              a = R;
              let C = this.rules[R], y = C.media, g = y.features[_], x = y.features[G];
              if (!g || !x) {
                a++;
                break;
              }
              let v = g.value - x.value;
              if (v === b) {
                if (m !== C.hasWhere)
                  continue;
                if (h !== -1) {
                  let S = [this.rules[R]];
                  for (let T = R - 1; T >= n; T--) {
                    let B = this.rules[T];
                    if (B.hasWhere !== m)
                      break;
                    let A = B.media, W = A.features[_], O = A.features[G];
                    if (!W || !O || W.value - O.value !== v)
                      break;
                    S.unshift(this.rules[T]);
                  }
                  a = f(this.rules, (T) => T.media && T.priority !== -1 && T.media.features[G] && T.media.features[_]);
                }
                break;
              } else if (v > b)
                break;
            }
          } else if (k)
            for (let b = n; b <= c; b++) {
              a = b;
              let R = this.rules[b], C = R.media, y = C.features[_], g = C.features[G];
              if (y) {
                if (g)
                  break;
                continue;
              }
              let x = g?.value;
              if (x === k.value) {
                if (!m && R.hasWhere) {
                  a++;
                  continue;
                }
                if (h !== -1)
                  a = f(this.rules, (v) => v.media, (v) => v.media && v.priority !== -1 && v.media.features[G] && v.media.features[_], (v) => !v.media.features[G] && !v.media.features[_]);
                else
                  for (let v = b; v <= c; v++) {
                    let S = this.rules[v], T = S.media, B = T.features[G];
                    if (!T.features[_]) {
                      if (S.hasWhere !== m || B.value !== x || S.order >= d)
                        break;
                      a = v + 1;
                    }
                  }
                break;
              } else {
                if (x > k.value)
                  break;
                a++;
              }
            }
          else if (u)
            for (let b = c; b >= n; b--) {
              a = b;
              let R = this.rules[b], C = R.media, y = C.features[_];
              if (C.features[G])
                continue;
              let x = y?.value;
              if (!x || x > u.value) {
                a++;
                break;
              } else if (x === u.value) {
                if (m && !R.hasWhere)
                  continue;
                if (h !== -1)
                  a = f(this.rules, (v) => v.media, (v) => v.media && v.priority !== -1 && v.media.features[G] && v.media.features[_], (v) => !v.media.features[G] && !v.media.features[_]);
                else {
                  let v = [this.rules[b]];
                  for (let S = b - 1; S >= n; S--) {
                    let T = this.rules[S], B = T.media, A = B.features[G], W = B.features[_];
                    if (!A && (!W || W.value !== x || T.hasWhere !== m))
                      break;
                    v.unshift(T);
                  }
                  for (let S = 0; S < v.length; S++) {
                    let T = v[S];
                    if (!T.media.features[G]) {
                      if (T.order >= d)
                        break;
                      a = b - v.length + 2 + S;
                    }
                  }
                }
                break;
              }
            }
        }
        if (a === void 0)
          if (n === -1)
            a = c + 1;
          else if (h !== -1)
            a = n + f(this.rules.slice(n), void 0, (u) => u.media.features[_] || u.media.features[G]);
          else if (m) {
            let u = n;
            for (; u < this.rules.length; u++) {
              let k = this.rules[u];
              if (k.priority !== -1 || !k.hasWhere || k.order >= d) {
                a = u;
                break;
              }
            }
            a === void 0 && (a = u);
          } else
            for (let u = n; u <= c; u++) {
              a = u;
              let k = this.rules[u], b = k.media;
              if (k.priority !== -1 || b.features[_] || b.features[G])
                break;
              if (k.hasWhere)
                a++;
              else if (k.order >= d)
                break;
            }
      } else if (h === -1)
        if (m)
          a = this.rules.findIndex((n) => !n.hasWhere || n.media || n.priority !== -1 || n.order >= d), a === -1 && (a = c + 1);
        else {
          let n = 0;
          for (; n < this.rules.length; n++) {
            let u = this.rules[n];
            if (u.media || !u.hasWhere && (u.order >= d || u.priority !== -1)) {
              a = n;
              break;
            }
          }
          a === void 0 && (a = n);
        }
      else
        a = f(this.rules, void 0, (n) => n.media);
      if (this.rules.splice(a, 0, o), this.ruleOfClass[p] = o, this.style) {
        let n = this.style.sheet, u = 0, k = (b) => {
          let R = this.rules[b];
          if (R) {
            if (!R.natives.length)
              return k(b - 1);
            let C = R.natives[R.natives.length - 1].cssRule;
            for (let y = 0; y < n.cssRules.length; y++)
              if (n.cssRules[y] === C) {
                u = y + 1;
                break;
              }
          }
        };
        k(a - 1);
        for (let b = 0; b < o.natives.length; )
          try {
            let R = o.natives[b];
            n.insertRule(R.text, u), R.cssRule = n.cssRules[u++], b++;
          } catch (R) {
            console.error(R), o.natives.splice(b, 1);
          }
      }
    }
  }
  get text() {
    return this.rules.map((i) => i.text).join("");
  }
};
var U = Gi;
e(U, "instances", []), e(U, "root");
(() => {
  let r = typeof global < "u" ? global : window;
  if (!r.CSS && !r.CSS?.escape) {
    let s = function(i) {
      if (arguments.length == 0)
        throw new TypeError("`CSS.escape` requires an argument.");
      let o = String(i), a = o.length, c = -1, l = "", d, h = o.charCodeAt(0);
      if (a == 1 && h == 45)
        return "\\" + o;
      for (; ++c < a; ) {
        if (d = o.charCodeAt(c), d == 0) {
          l += "\uFFFD";
          continue;
        }
        if (d >= 1 && d <= 31 || d == 127 || c == 0 && d >= 48 && d <= 57 || c == 1 && d >= 48 && d <= 57 && h == 45) {
          l += "\\" + d.toString(16) + " ";
          continue;
        }
        if (d >= 128 || d == 45 || d == 95 || d >= 48 && d <= 57 || d >= 65 && d <= 90 || d >= 97 && d <= 122) {
          l += o.charAt(c);
          continue;
        }
        l += "\\" + o.charAt(c);
      }
      return l;
    };
    r.CSS || (r.CSS = {}), r.CSS.escape = s;
  }
})();
var Ss = so(Us());

// test.ts
console.log(fs);
