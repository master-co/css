// dist/index.mjs
var us = Object.defineProperty;
var $s = (r, s, i) => s in r ? us(r, s, { enumerable: true, configurable: true, writable: true, value: i }) : r[s] = i;
var Fs = (r, s) => {
  for (var i in s)
    us(r, i, { get: s[i], enumerable: true });
};
var e = (r, s, i) => ($s(r, typeof s != "symbol" ? s + "" : s, i), i);
var os = typeof Buffer < "u" ? Buffer : null;
function hs(r) {
  return !!(os && r instanceof os || r instanceof Date || r instanceof RegExp);
}
function gs(r) {
  if (os && r instanceof Buffer) {
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
function xs(r) {
  let s = [];
  return r.forEach(function(i, o) {
    typeof i == "object" && i !== null ? Array.isArray(i) ? s[o] = xs(i) : hs(i) ? s[o] = gs(i) : s[o] = Y({}, i) : s[o] = i;
  }), s;
}
function ps(r, s) {
  return s === "__proto__" ? void 0 : r[s];
}
function Y(...r) {
  let s = {}, i, o;
  return r.forEach(function(a) {
    typeof a != "object" || a === null || Array.isArray(a) || Object.keys(a).forEach(function(l) {
      if (o = ps(s, l), i = ps(a, l), i !== s)
        if (typeof i != "object" || i === null) {
          s[l] = i;
          return;
        } else if (Array.isArray(i)) {
          s[l] = xs(i);
          return;
        } else if (hs(i)) {
          s[l] = gs(i);
          return;
        } else if (typeof o != "object" || o === null || Array.isArray(o)) {
          s[l] = Y({}, i);
          return;
        } else {
          s[l] = Y(o, i);
          return;
        }
    });
  }), s;
}
function Vi(r, s, i) {
  return ((1 << 24) + (r << 16) + (s << 8) + i).toString(16).slice(1);
}
var Es = [",", ".", "#", "[", "!", "*", ">", "+", "~", ":", "@"];
var Ws = /^::-[a-z]+-/m;
var Ds = /^rgba?\( *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?:(?:\/|,) *0?(\.[0-9]))?\)$/;
var _i;
var Hi = typeof window < "u";
Hi && (_i = document.createElement("style"), _i.title = "master");
var _ = "max-width";
var G = "min-width";
var Ls = "attributes";
var js = Hi ? window.MutationObserver : Object;
var qr = class extends js {
  constructor(i) {
    super((o) => {
      let a = {}, l = [], c = [], d = [], h = (n, u) => {
        u ? n.classList.forEach(p) : n.classList.forEach(m);
        let k = n.children;
        for (let b = 0; b < k.length; b++) {
          let R = k[b];
          R.classList && (c.push(R), h(R, u));
        }
      }, m = (n) => {
        n in a ? a[n]++ : a[n] = 1;
      }, p = (n) => {
        n in a ? a[n]-- : n in this.countOfClass && (a[n] = -1);
      }, f = (n, u) => {
        for (let k = 0; k < n.length; k++) {
          let b = n[k];
          b.classList && !c.includes(b) && !d.includes(b) && (b.isConnected !== u ? (c.push(b), h(b, u)) : d.push(b));
        }
      };
      for (let n = 0; n < o.length; n++) {
        let u = o[n], { addedNodes: k, removedNodes: b, type: R, target: C, oldValue: y } = u;
        if (R === Ls) {
          if (l.find((g) => g.target === C))
            continue;
          l.push(u);
        } else
          f(k, false), (!C.isConnected || !c.includes(C)) && f(b, true);
      }
      if (!(!l.length && !Object.keys(a).length)) {
        for (let { oldValue: n, target: u } of l) {
          let k = c.includes(u), b = u.classList, R = n ? n.split(" ") : [];
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
    this.config?.override || (this.config = Y(Xr, i)), this.cache(), Hi && this.config.observe && this.observe(document), qr.instances.push(this), this.ready = true;
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
    let { semantics: i, classes: o, selectors: a, themes: l, colors: c, values: d, breakpoints: h, mediaQueries: m, Rules: p } = this.config;
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
          let T = S.match(Ws)?.[0] ?? "", B = this.selectors[T];
          B || (B = this.selectors[T] = []);
          let A = B.find(([W]) => W === v);
          A || (A = [v, []], B.push(A)), A[1].push(S);
        }
      }
    if (d)
      for (let [g, x] of Object.entries(d))
        typeof x == "object" ? this.values[g] = n(x, false) : this.globalValues[g] = x;
    h && (this.breakpoints = n(h, false)), m && (this.mediaQueries = n(m, false));
    let u = o ? n(o, false) : {}, k = l && !Array.isArray(l) ? Object.entries(l).filter(([, { classes: g }]) => g).reduce((g, [x, { classes: v }]) => (g[x] = n(v, false), g), {}) : {}, b = [...Object.keys(u), ...Object.entries(k).flatMap(([g, x]) => Object.keys(x))], R = (g) => {
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
    if (C("", c), l)
      if (Array.isArray(l))
        this.themeNames.push(...l);
      else
        for (let g in l) {
          let x = l[g];
          C(g, x.colors), this.themeNames.push(g);
        }
    let y = (g) => {
      for (let [x, v] of Object.entries(this.colorThemesMap))
        for (let [S, T] of Object.entries(v))
          T.startsWith("#") || g(x, v, S, T);
    };
    if (y((g, x, v, S) => {
      let T = Ds.exec(S);
      if (T) {
        let B = "#" + Vi(+T[1], +T[2], +T[3]);
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
    if (Hi && i) {
      this.root = i;
      let a = i === document;
      a && (qr.root = this), this.host = a ? document.documentElement : i.host, this.theme = new Ui(this.host, this.config.theme);
      let l = a ? document.head : i, c = a ? document.styleSheets : i.styleSheets;
      for (let h of c) {
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
                    } else if (Es.includes(g))
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
        this.style = _i.cloneNode(), l.prepend(this.style);
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
      let l = this.match(a);
      if (l)
        return new l.Rule(a, l, this);
    };
    return (i in this.classes ? this.classes[i].map((a) => o(a)) : [o(i)]).filter((a) => a && a.text);
  }
  refresh(i) {
    if (i?.override ? this.config = i : this.config = Y(Xr, i), this.cache(), !this.style)
      return;
    let o = _i.cloneNode();
    this.style.replaceWith(o), this.style = o, this.rules.length = 0, this.ruleOfClass = {};
    for (let a in this.countOfClass)
      this.insert(a);
  }
  destroy() {
    let i = qr.instances;
    this.disconnect(), i.splice(i.indexOf(this), 1);
  }
  delete(i) {
    let o = this.style.sheet, a = (l) => {
      let c = this.ruleOfClass[l];
      if (!(!c || l in this.relations && this.relations[l].some((d) => d in this.countOfClass))) {
        if (c.natives.length) {
          let d = c.natives[0];
          for (let h = 0; h < o.cssRules.length; h++)
            if (o.cssRules[h] === d.cssRule) {
              for (let p = 0; p < c.natives.length; p++)
                o.deleteRule(h);
              this.rules.splice(this.rules.indexOf(c), 1);
              break;
            }
        }
        delete this.ruleOfClass[l];
      }
    };
    if (i in this.classes) {
      for (let l of this.classes[i])
        l in this.countOfClass || a(l);
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
      let a, l = this.rules.length - 1, { media: c, order: d, priority: h, hasWhere: m, className: p } = o, f = (n, u, k, b) => {
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
      if (c) {
        let n = this.rules.findIndex((u) => u.media);
        if (n !== -1) {
          let u = c.features[_], k = c.features[G];
          if (u && k) {
            let b = u.value - k.value;
            for (let R = l; R >= n; R--) {
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
            for (let b = n; b <= l; b++) {
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
                  for (let v = b; v <= l; v++) {
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
            for (let b = l; b >= n; b--) {
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
            a = l + 1;
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
            for (let u = n; u <= l; u++) {
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
          a = this.rules.findIndex((n) => !n.hasWhere || n.media || n.priority !== -1 || n.order >= d), a === -1 && (a = l + 1);
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
var Z = qr;
e(Z, "instances", []), e(Z, "root");
function Qi(r, s) {
  return (r ? r + ":" : "") + (s.unit ? s.value + s.unit : s.value) + (s.important ? "!important" : "");
}
var Ns = /^([+-.]?\d+(\.?\d+)?)(.*)?/;
function Yi(r, s, i) {
  if (i) {
    let o = "", a = r.match(Ns);
    if (a)
      if (r.includes("/")) {
        let [l, c] = r.split("/");
        return { value: +l / +c * 100 + "%", unit: o };
      } else {
        let l = +a[1];
        return o = a[3] || "", o || ((i === "rem" || i === "em") && (l = l / s), o = i || ""), { value: l, unit: o };
      }
  }
}
function vs(r, s, i) {
  let o = (p) => p === "+" || p === "-" || p === "*" || p === "/", a = "", l, c = "", d = false, h = false;
  function m(p, f = "", n = "") {
    if (l === 2 && !h) {
      let u = Yi(c, s, i);
      u && (c = u.value + u.unit);
    }
    a += c + f + p + n, l = null, h = false, c = "";
  }
  for (let p = 0; p < r.length; p++) {
    let f = r[p];
    if (f === "(" || f === ")")
      d = f === ")", m(f);
    else if (f === ",")
      m(f, "", " ");
    else {
      switch (l) {
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
          d && (a += " "), isNaN(+f) ? o(f) || (l = 1) : l = 2;
          break;
      }
      l ? c += f : a += f;
    }
  }
  return c && (a += c), a;
}
function Zi(r, s, i, o, a, l) {
  let c = "", d = "", h;
  if (typeof r == "number")
    c = r, d = s || "";
  else {
    if (o) {
      let p = false, f = false;
      r = r.replace(new RegExp(`(^|,| |\\()((?:${i.join("|")})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, "gm"), (n, u, k, b) => {
        f = true;
        let R = o[k];
        if (R) {
          let C;
          for (let y of l)
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
    let m = Yi(r, a, s);
    if (m)
      return m;
    c = (r.indexOf("calc(") === -1 ? r : vs(r, a, s)).replace(/\$\(((\w|-)+)\)/g, "var(--$1)");
  }
  return { value: c, unit: d, colorMatched: h };
}
var Ue = { "(": ")", "'": "'", '"': '"', "{": "}" };
var Ps = ["!", "*", ">", "+", "~", ":", "[", "@", "_"];
function Q(r, s, i, o = []) {
  let a = [",", ...o], l = [], c = "", d = 0;
  return function h(m, p, f, n = "", u = [], k = []) {
    let b, R = false;
    p && (p === ")" && c.slice(-1) === "$" ? b = c.length - 1 : (p === "'" || p === '"') && (R = true), c += m[d++]);
    let C = () => {
      let y = c;
      if (c = "", s && y in s && !u.includes(y)) {
        let g = d;
        d = 0, h(s[y].toString(), void 0, void 0, void 0, [...u, y], k), d = g;
      } else if (i && y in i && !k.includes(y)) {
        let g = d;
        d = 0, h(i[y].toString(), void 0, void 0, void 0, u, [...k, y]), d = g;
      } else
        l.push({ value: y });
    };
    for (; d < m.length; d++) {
      let y = m[d];
      if (y === p) {
        if (c += y, R) {
          let g = 0;
          for (let x = c.length - 2; c[x] === "\\"; x--)
            g++;
          if (g % 2)
            continue;
        }
        b !== void 0 && (c = c.slice(0, b) + c.slice(b).replace(/\$\((.*)\)/, "var(--$1)")), f || (R ? l.push(c) : C(), n = "", c = "");
        break;
      } else if (!R && y in Ue)
        h(m, Ue[y], f === void 0 ? 0 : f + 1, n, u, k);
      else if ((y === "|" || y === " ") && p !== "}" && (!R || n === "path"))
        p ? c += " " : C();
      else {
        if (!p) {
          if (y === ".") {
            if (isNaN(+m[d + 1]))
              break;
            m[d - 1] === "-" && (c += "0");
          } else if (a.includes(y)) {
            c && C(), l.push(y);
            continue;
          } else if (y === "#" && (c || l.length && m[d - 1] !== "|" && l[d - 1] !== " ") || Ps.includes(y))
            break;
          n += y;
        }
        c += y;
      }
    }
    f === void 0 && c && C();
  }(r), [l, r.slice(d)];
}
var bs = [":disabled", ":active", ":focus", ":hover"];
var Jr = "matches";
var zs = "semantics";
var ys = "symbol";
var Ss = "width";
var as = "max-" + Ss;
var ns = "min-" + Ss;
var ls = "motion";
var ks = "reduce";
var Rs = ks + "d-" + ls;
var cs = "px";
var Gs = "rem";
var Vs = /(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/;
var _s = (r) => r.split(Vs).map((s, i) => i % 3 ? s : s.replace(/_/g, " ")).join("");
var t = class {
  constructor(s, i, o) {
    this.className = s;
    this.matching = i;
    this.css = o;
    let a = this.constructor, { id: l, unit: c, colorful: d, prop: h } = a, { rootSize: m, scope: p, important: f } = o.config, { themeNames: n, colorNames: u, colorThemesMap: k, selectors: b, globalValues: R, breakpoints: C, mediaQueries: y } = o, g = o.values[l], x = o.relationThemesMap[s], v = s, S, T, B, A;
    if (i.origin === zs) {
      let [L, F] = i.value;
      B = v.slice(L.length), S = F;
    } else if (this.analyzeToken)
      [T, A, B] = this.analyzeToken(v, g, R);
    else {
      let L;
      if (i.origin === Jr) {
        let F = v.indexOf(":");
        this.prefix = v.slice(0, F + 1), this.prefix.includes("(") ? (this.prefix = void 0, L = v) : L = v.slice(F + 1);
      } else
        i.origin === ys && (this.symbol = v[0], L = v.slice(1));
      [A, B] = Q(L, g, R);
    }
    B[0] === "!" && (this.important = true, B = B.slice(1));
    let W = (L) => {
      let F = _s(L), I = [], D = "", V = 0;
      for (let M = 0; M < F.length; M++) {
        let $ = F[M];
        if ($ === "\\") {
          D += $ + F[++M];
          continue;
        }
        !V && $ === "," ? (I.push(D), D = "") : (D += $, V && $ === ")" ? V-- : $ === "(" && V++);
      }
      return D && I.push(D), I;
    };
    this.prefixSelectors = T ? W(T) : [""];
    let O = B.split("@"), H = O[0];
    if (H) {
      this.vendorSuffixSelectors = {};
      let L = (M, $, w, E) => {
        for (let [j, z] of $)
          if (j.test(M)) {
            for (let U of z)
              L(M.replace(j, U), $, w, true);
            return;
          }
        E && w.push(M);
      }, F = [];
      "" in b ? L(H, b[""], F, true) : F.push(H);
      let I = {};
      for (let [M, $] of Object.entries(b)) {
        if (!M)
          continue;
        let w = [];
        for (let E of F)
          L(E, $, w, false);
        w.length && (I[M] = w);
      }
      let D = (M, $) => {
        let w = $.reduce((E, j) => (E.push(...W(j)), E), []);
        M in this.vendorSuffixSelectors ? this.vendorSuffixSelectors[M].push(...w) : this.vendorSuffixSelectors[M] = w;
      }, V = Object.keys(I);
      if (V.length)
        for (let M of V)
          D(M, I[M]);
      else
        D("", F);
      for (let M of Object.values(this.vendorSuffixSelectors))
        for (let $ of M) {
          this.hasWhere !== false && (this.hasWhere = $.includes(":where("));
          for (let w = 0; w < bs.length; w++)
            if ($.includes(bs[w])) {
              (this.priority === -1 || this.priority > w) && (this.priority = w);
              break;
            }
        }
    } else
      this.vendorSuffixSelectors = { "": [""] };
    for (let L = 1; L < O.length; L++) {
      let F = O[L];
      if (F)
        if (n.includes(F))
          this.theme = F;
        else if (F === "rtl" || F === "ltr")
          this.direction = F;
        else {
          let I, D, V = F.indexOf("_");
          if (V !== -1)
            I = F.slice(0, V), D = F.slice(V);
          else {
            let M = F.indexOf("(");
            M !== -1 && (I = F.slice(0, M), D = F.slice(M));
          }
          if (!I) {
            I = "media";
            let M = [];
            this.media = { token: F, features: {} };
            let $ = F.split("&");
            for (let w of $)
              if (w === "all" || w === "print" || w === "screen" || w === "speech")
                this.media.type = w;
              else if (w === "\u{1F5A8}")
                this.media.type = "print";
              else if (w === "landscape" || w === "portrait")
                M.push("(orientation:" + w + ")");
              else if (w === ls || w === Rs)
                M.push("(prefers-" + Rs + ":" + (w === ls ? "no-preference" : ks) + ")");
              else if (y && w in y)
                M.push(y[w]);
              else {
                let E = { token: w }, j = "", z = "", U = 0;
                w.startsWith("<=") ? (z = "<=", j = as) : w.startsWith(">=") || C[w] ? (z = ">=", j = ns) : w.startsWith(">") ? (z = ">", j = ns, U = 0.02) : w.startsWith("<") && (z = "<", j = as, U = -0.02);
                let q = z ? w.replace(z, "") : w, P = C[q];
                switch (j) {
                  case as:
                  case ns:
                    P ? Object.assign(E, Zi(P, cs)) : Object.assign(E, Zi(q, cs)), E.unit === cs && (E.value += U), this.media.features[j] = E, M.push("(" + j + ":" + (E.value + E.unit) + ")");
                    break;
                }
              }
            D = "", this.media.type && (D = this.media.type), M.length && (D += (D ? " and " : "") + M.join(" and "));
          }
          D && (this.at[I] = (I in this.at ? this.at[I] + " and " : "") + D.replace(/_/g, " "));
        }
    }
    this.order === void 0 && (this.order = 0);
    let He = (L, F) => {
      let I, D, V = ($, w, E) => {
        let j = "";
        this.direction && (j += "[dir=" + this.direction + "] ");
        let z = this.prefixSelectors.map((P) => P + j), U = (P, Gi) => z.map((X) => (P ? "." + P + " " : "") + (p ? p + " " : "") + X).reduce((X, ss) => (X.push(E.reduce((ms, Is) => (ms.push(ss + "." + CSS.escape(Gi) + Is), ms), []).join(",")), X), []).join(","), q = U(w, s) + (x ? Object.entries(x).filter(([P]) => this.theme || !d || !w || !P || P === w).map(([P, Gi]) => Gi.reduce((X, ss) => X + "," + U(this.theme ?? ((d || this.getThemeProps) && w || P), ss), "")).join("") : "") + "{" + $ + "}";
        for (let P of Object.keys(this.at).sort((Gi, X) => X === "supports" ? -1 : 1))
          q = "@" + P + " " + this.at[P] + "{" + q + "}";
        return q;
      }, M = [];
      if (A) {
        let $, w;
        for (let E of A)
          typeof E == "string" ? M.push(E) : ($ = Zi(E.value, c, d && u, d && k, m, this.theme ? [this.theme, ""] : [L]), $.colorMatched !== void 0 && w !== true && (w = $.colorMatched), M.push($.value + $.unit));
        if (F && (w === void 0 ? L : !w))
          return;
        if (M.length === 1 ? $ ? (I = $.value, D = $.unit) : I = M[0] : I = M.reduce((E, j, z) => E + j + (j === "," || A[z + 1] === "," || z === A.length - 1 ? "" : " "), ""), typeof I != "object") {
          this.parseValue && (I = this.parseValue(I, this.css.config)), d && I === "current" && (I = "currentColor");
          let E = { unit: D, value: I, important: this.important };
          if (this.getThemeProps) {
            let j = this.getThemeProps(E, o);
            for (let z in j)
              for (let U of Object.values(this.vendorSuffixSelectors))
                this.natives.push({ unit: D, value: I, text: V(Object.entries(j[z]).map(([q, P]) => Qi(q, { important: (this.important || f) && !P.endsWith("!important"), unit: "", value: P })).join(";"), z, U), theme: z });
            return;
          } else
            this.get && (I = this.get(E));
        }
      } else
        I = S;
      for (let $ of Object.values(this.vendorSuffixSelectors))
        this.natives.push({ unit: D, value: I, text: V(typeof I == "object" ? Object.entries(I).map(([w, E]) => Qi(w, { ...typeof E == "object" ? E : { unit: "", value: E }, important: this.important || f })).join(";") : Qi(h, { unit: D, value: I, important: this.important || f }), L, $), theme: L });
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
    let { colorStarts: l, symbol: c, prop: d } = this;
    if (i && i.test(s))
      return { origin: Jr };
    if (l) {
      if (s.match("^" + l + "(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|current|inherit))"))
        return { origin: Jr };
      if (a.length && s.indexOf("|") === -1) {
        let h = s.match("^" + l + "((?:" + a.join("|") + ")[0-9a-zA-Z-]*)");
        if (h && h[1] in o)
          return { origin: Jr };
      }
    }
    if (c && s.startsWith(c))
      return { origin: ys };
    if (d && s.startsWith(d + ":"))
      return { origin: Jr };
  }
  get text() {
    return this.natives.map((s) => s.text).join("");
  }
};
e(t, "id"), e(t, "matches"), e(t, "colorStarts"), e(t, "symbol"), e(t, "unit", Gs), e(t, "colorful");
var ds = { store: "theme" };
var Ts = typeof window < "u";
var Ui = class {
  constructor(s = typeof document < "u" ? document.documentElement : null, i) {
    this.host = s;
    this.options = i;
    this.options = Y(ds, i), this.options.store && this.storage ? this.syncWithStorage() : this.options.default && this.set(this.options.default, { emit: false, store: false });
  }
  darkMQL = Ts ? window.matchMedia?.("(prefers-color-scheme:dark)") : void 0;
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
    if (Ts && this.options.store) {
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
(() => {
  let r = typeof global < "u" ? global : window;
  if (!r.CSS && !r.CSS?.escape) {
    let s = function(i) {
      if (arguments.length == 0)
        throw new TypeError("`CSS.escape` requires an argument.");
      let o = String(i), a = o.length, l = -1, c = "", d, h = o.charCodeAt(0);
      if (a == 1 && h == 45)
        return "\\" + o;
      for (; ++l < a; ) {
        if (d = o.charCodeAt(l), d == 0) {
          c += "\uFFFD";
          continue;
        }
        if (d >= 1 && d <= 31 || d == 127 || l == 0 && d >= 48 && d <= 57 || l == 1 && d >= 48 && d <= 57 && h == 45) {
          c += "\\" + d.toString(16) + " ";
          continue;
        }
        if (d >= 128 || d == 45 || d == 95 || d >= 48 && d <= 57 || d >= 65 && d <= 90 || d >= 97 && d <= 122) {
          c += o.charAt(l);
          continue;
        }
        c += "\\" + o.charAt(l);
      }
      return c;
    };
    r.CSS || (r.CSS = {}), r.CSS.escape = s;
  }
})();
function Kr(r) {
  r.startsWith("#") && (r = r.slice(1));
  let s = r.match(/.{1,2}/g);
  return [parseInt(s[0], 16), parseInt(s[1], 16), parseInt(s[2], 16)];
}
function N(r) {
  typeof r == "string" && (r = { "": r });
  let s = "" in r, i = false;
  for (let o in r)
    if (o && +o >= 100) {
      i = true;
      break;
    }
  if (!i && (!s || Object.keys(r).length > 1)) {
    let o = 0, a = "0" in r ? Kr(r[0]) : [0, 0, 0], l, c, d = [], h = () => {
      let m = l - o, p = c.map((f, n) => (f - a[n]) / m);
      for (let f of d) {
        let n = f - o, u = a.map((k, b) => Math.round(k + p[b] * n));
        r[f] = "#" + Vi.call(this, ...u);
      }
    };
    for (let m = 1; m < 100; m++)
      m in r ? (d.length ? (l = m, c = Kr(r[m]), h(), d.length = 0, a = c) : a = Kr(r[m]), o = m) : d.push(m);
    d.length && (l = 100, c = "100" in r ? Kr(r[100]) : [255, 255, 255], h());
  }
  return s || (r[""] = r[i ? "500" : "50"]), r;
}
var Xr = {};
Fs(Xr, { Rules: () => to, breakpoints: () => qi, colors: () => Us, important: () => US, observe: () => _S, override: () => GS, rootSize: () => ea, scope: () => Qs, selectors: () => Ys, semantics: () => Zs, theme: () => ds, themes: () => qs, values: () => Xs });
var qi = { "3xs": 360, "2xs": 480, xs: 600, sm: 768, md: 1024, lg: 1280, xl: 1440, "2xl": 1600, "3xl": 1920, "4xl": 2560 };
var Us = { slate: N({ 5: "#141e2b", 10: "#19212d", 20: "#262f3e", 30: "#323e52", 40: "#41516b", 50: "#616a84", 55: "#6c7693", 60: "#959db3", 70: "#a3abbf", 80: "#d7dae3", 95: "#f6f7f8" }), gray: N({ 5: "#1e1d1f", 10: "#212022", 20: "#2f2e30", 30: "#3e3d40", 40: "#504f52", 50: "#6b6a6d", 55: "#777679", 60: "#9e9da0", 70: "#abaaae", 80: "#dad9db", 95: "#f5f4f7" }), brown: N({ 5: "#271b15", 10: "#2b1e18", 20: "#3c2b22", 30: "#50382c", 40: "#694839", 50: "#8d604b", 55: "#9d6b53", 60: "#b79788", 70: "#c1a598", 80: "#efd5c9", 95: "#faf2ef" }), orange: N({ 5: "#2e1907", 10: "#331b07", 20: "#47260b", 30: "#5d320e", 40: "#7a4111", 50: "#a15717", 55: "#b4611a", 60: "#e38739", 70: "#e79855", 80: "#f7d4b5", 95: "#fcf1e7" }), gold: N({ 5: "#281b00", 10: "#2d1e01", 20: "#3f2a00", 30: "#543800", 40: "#6d4900", 50: "#906000", 55: "#9c6d00", 60: "#d09100", 70: "#dca000", 80: "#fbd67f", 95: "#fff3d8" }), yellow: N({ 5: "#251d00", 10: "#282000", 20: "#3a2e01", 30: "#4b3b00", 40: "#624e00", 50: "#806700", 55: "#8e7200", 60: "#be9900", 70: "#d0a700", 80: "#edda8f", 95: "#fff5ca" }), grass: N({ 5: "#162106", 10: "#182406", 20: "#223308", 30: "#2c4408", 40: "#3a570b", 50: "#4e750e", 60: "#74ae15", 70: "#7dbc17", 80: "#bfe87c", 95: "#ebfad4" }), green: N({ 5: "#042311", 10: "#032611", 20: "#023717", 30: "#03481f", 40: "#025d26", 50: "#067b34", 55: "#07883a", 60: "#09b64d", 70: "#0ac553", 80: "#80f1a4", 95: "#e0fae8" }), beryl: N({ 5: "#002319", 10: "#00271c", 20: "#003626", 30: "#004732", 40: "#005c41", 50: "#007954", 55: "#00875e", 60: "#00b37c", 70: "#00c387", 80: "#72f0c5", 95: "#d6fcef" }), teal: N({ 5: "#012220", 10: "#012624", 20: "#003532", 30: "#004541", 40: "#005a54", 50: "#00776f", 55: "#00857c", 60: "#00b1a5", 70: "#00bfb2", 80: "#6aeee5", 95: "#d4fcf8" }), cyan: N({ 5: "#00222b", 10: "#00252e", 20: "#013340", 30: "#004457", 40: "#00576f", 50: "#007391", 55: "#0080a1", 60: "#00abd7", 70: "#00b9e9", 80: "#97e6fa", 95: "#dff8ff" }), sky: N({ 5: "#031f34", 10: "#032339", 20: "#04314e", 30: "#044169", 40: "#065386", 50: "#086eb3", 55: "#097ac5", 60: "#29a4f5", 70: "#4db3f7", 80: "#b3e0ff", 95: "#eaf6fe" }), blue: N({ 5: "#07194a", 10: "#081c53", 20: "#0a2773", 30: "#0e3496", 40: "#1146b6", 50: "#175fe9", 55: "#2671ea", 60: "#6b9ef1", 70: "#81acf3", 80: "#c6dbfe", 95: "#edf4fe" }), indigo: N({ 5: "#1f1645", 10: "#20174f", 20: "#2b1f74", 30: "#37289d", 40: "#463fb1", 50: "#5a5bd5", 55: "#6464f1", 60: "#9393f5", 70: "#a1a5ee", 80: "#d5d7fe", 95: "#f1f2ff" }), violet: N({ 5: "#2b0a4e", 10: "#2e0b57", 20: "#3d1179", 30: "#4e169f", 40: "#5f2eba", 50: "#7949e5", 55: "#8755f5", 60: "#ac8af8", 70: "#b89bf9", 80: "#e1d4fe", 95: "#f5f1ff" }), purple: N({ 5: "#2e0c47", 10: "#330c4e", 20: "#460f6c", 30: "#5b1390", 40: "#7421b1", 50: "#9832e4", 55: "#a348e7", 60: "#c184ef", 70: "#ca96f1", 80: "#ead1fe", 95: "#f9f0ff" }), fuchsia: N({ 5: "#39092a", 10: "#400932", 20: "#560d4a", 30: "#6f1165", 40: "#8c158a", 50: "#b61cbb", 55: "#ca1fce", 60: "#e66ee9", 70: "#ea86ed", 80: "#facbfb", 95: "#feefff" }), pink: N({ 5: "#3d0722", 10: "#430725", 20: "#5d0933", 30: "#790d44", 40: "#9a1058", 50: "#ca1473", 55: "#e11681", 60: "#f170b4", 70: "#f388c0", 80: "#fdcde6", 95: "#fff0f8" }), crimson: N({ 5: "#430213", 10: "#470314", 20: "#62041c", 30: "#800524", 40: "#9f1036", 50: "#ce1a4b", 55: "#e8144c", 60: "#f37596", 70: "#f58ba7", 80: "#fdceda", 95: "#fff1f4" }), red: N({ 5: "#450001", 10: "#490102", 20: "#640304", 30: "#800506", 40: "#a11012", 50: "#d11a1e", 55: "#ed0a0e", 60: "#f97476", 70: "#fa8b8d", 80: "#fdcfcf", 95: "#fff1f1" }), black: "#000000", white: "#ffffff" };
var ea = 16;
var Qs = "";
var Ys = { "::scrollbar": "::-webkit-scrollbar", "::scrollbar-button": "::-webkit-scrollbar-button", "::scrollbar-thumb": "::-webkit-scrollbar-thumb", "::scrollbar-track": "::-webkit-scrollbar-track", "::scrollbar-track-piece": "::-webkit-scrollbar-track-piece", "::scrollbar-corner": "::-webkit-scrollbar-corner", "::slider-thumb": ["::-webkit-slider-thumb", "::-moz-range-thumb"], "::slider-runnable-track": ["::-webkit-slider-runnable-track", "::-moz-range-track"], "::meter": "::-webkit-meter", "::resizer": "::-webkit-resizer", "::progress": "::-webkit-progress", ":first": ":first-child", ":last": ":last-child", ":even": ":nth-child(2n)", ":odd": ":nth-child(odd)", ":nth(": ":nth-child(" };
var Zs = { square: { "aspect-ratio": "1/1" }, video: { "aspect-ratio": "16/9" }, rounded: { "border-radius": "1e9em" }, round: { "border-radius": "50%" }, hidden: { display: "none" }, hide: { display: "none" }, block: { display: "block" }, table: { display: "table" }, flex: { display: "flex" }, grid: { display: "grid" }, contents: { display: "contents" }, inline: { display: "inline" }, "inline-block": { display: "inline-block" }, "inline-flex": { display: "inline-flex" }, "inline-grid": { display: "inline-grid" }, "inline-table": { display: "inline-table" }, "table-cell": { display: "table-cell" }, "table-caption": { display: "table-caption" }, "flow-root": { display: "flow-root" }, "list-item": { display: "list-item" }, "table-row": { display: "table-row" }, "table-column": { display: "table-column" }, "table-row-group": { display: "table-row-group" }, "table-column-group": { display: "table-column-group" }, "table-header-group": { display: "table-header-group" }, "table-footer-group": { display: "table-footer-group" }, italic: { "font-style": "italic" }, oblique: { "font-style": "oblique" }, isolate: { isolation: "isolate" }, overflow: { overflow: "visible" }, untouchable: { "pointer-events": "none" }, static: { position: "static" }, fixed: { position: "fixed" }, abs: { position: "absolute" }, rel: { position: "relative" }, sticky: { position: "sticky" }, uppercase: { "text-transform": "uppercase" }, lowercase: { "text-transform": "lowercase" }, capitalize: { "text-transform": "capitalize" }, visible: { visibility: "visible" }, invisible: { visibility: "hidden" }, vw: { width: "100vw" }, vh: { height: "100vh" }, "max-vw": { "max-width": "100vw" }, "max-vh": { "max-height": "100vh" }, "min-vw": { "min-width": "100vw" }, "min-vh": { "min-height": "100vh" }, "center-content": { "justify-content": "center", "align-items": "center" }, "sr-only": { position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", "white-space": "nowrap", "border-width": "0" }, full: { width: "100%", height: "100%" }, center: { left: 0, right: 0, "margin-left": "auto", "margin-right": "auto" }, middle: { top: 0, bottom: 0, "margin-top": "auto", "margin-bottom": "auto" }, "break-spaces": { "white-space": "break-spaces" }, "break-word": { "overflow-wrap": "break-word", overflow: "hidden" } };
var qs = ["dark", "light"];
var ei = { content: "content-box", border: "border-box", padding: "padding-box" };
var Xi = { min: "min-content", max: "max-content" };
var J = { full: "100%", fit: "fit-content", max: "max-content", min: "min-content" };
for (let r in qi)
  J[r] = qi[r] / 16 + "rem";
var Xs = { BackgroundClip: ei, BackgroundOrigin: ei, BoxSizing: { content: "content-box", border: "border-box" }, ClipPath: { ...ei, margin: "margin-box", fill: "fill-box", stroke: "stroke-box", view: "view-box" }, FlexDirection: { col: "column", "col-reverse": "column-reverse" }, FontFamily: { mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace", sans: "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji", serif: "ui-serif,Georgia,Cambria,Times New Roman,Times,serif" }, FontWeight: { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, heavy: 900 }, GridAutoColumns: Xi, GridAutoRows: Xi, GridTemplateColumns: Xi, GridTemplateRows: Xi, Order: { first: -999999, last: 999999 }, Position: { abs: "absolute", rel: "relative" }, ShapeOutside: { ...ei, margin: "margin-box" }, TransformBox: { ...ei, fill: "fill-box", stroke: "stroke-box", view: "view-box" }, Width: J, MinWidth: J, MinHeight: J, MaxWidth: J, MaxHeight: J, Height: J, FlexBasis: J };
var oe = class extends t {
};
e(oe, "id", "FontWeight"), e(oe, "matches", "^f(?:ont)?:(?:bolder|$values)(?!\\|)"), e(oe, "unit", "");
var Qe = class extends t {
};
e(Qe, "id", "FontFamily"), e(Qe, "matches", "^f(?:ont)?:(?:$values)(?!\\|)");
var Ye = class extends t {
};
e(Ye, "id", "FontSize"), e(Ye, "matches", "^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Ze = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let i = this.prefix[0] === "m" ? "margin" : "padding", o = i + "-left", a = i + "-right", l = i + "-top", c = i + "-bottom";
    switch (this.prefix[1]) {
      case "x":
        return { [o]: r, [a]: r };
      case "y":
        return { [l]: r, [c]: r };
      case "l":
        return { [o]: r };
      case "r":
        return { [a]: r };
      case "t":
        return { [l]: r };
      case "b":
        return { [c]: r };
      default:
        return { [i]: r };
    }
  }
  get order() {
    return this.prefix === "p:" || this.prefix === "m:" ? -1 : 0;
  }
};
e(Ze, "id", "Spacing"), e(Ze, "matches", "^[pm][xytblr]?:.");
var qe = class extends t {
};
e(qe, "id", "Width"), e(qe, "matches", "^w:.");
var Xe = class extends t {
};
e(Xe, "id", "Height"), e(Xe, "matches", "^h:.");
var Je = class extends t {
};
e(Je, "id", "MinWidth"), e(Je, "matches", "^min-w:.");
var Ke = class extends t {
};
e(Ke, "id", "MinHeight"), e(Ke, "matches", "^min-h:.");
var ae = class extends t {
};
e(ae, "id", "LetterSpacing"), e(ae, "matches", "^ls:."), e(ae, "unit", "em");
var Js = "subpixel-antialiased";
var Ms = "-webkit-font-smoothing";
var Os = "-moz-osx-font-smoothing";
var ne = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let s = {};
    switch (r.value) {
      case Js:
        s[Ms] = s[Os] = { ...r, value: "auto" };
        break;
      case "antialiased":
        s[Ms] = { ...r, value: "antialiased" }, s[Os] = { ...r, value: "grayscale" };
        break;
    }
    return s;
  }
};
e(ne, "id", "FontSmoothing"), e(ne, "matches", "^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)"), e(ne, "unit", "");
var ce = class extends t {
};
e(ce, "id", "FontStyle"), e(ce, "matches", "^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)"), e(ce, "unit", "deg");
var et = class extends t {
};
e(et, "id", "FontVariantNumeric"), e(et, "matches", "^f(?:ont)?:(?:ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions|$values)(?!\\|)");
var tt = class extends t {
};
e(tt, "id", "FontFeatureSettings"), e(tt, "matches", "^font-feature:.");
var le = class extends t {
};
e(le, "id", "LineHeight"), e(le, "matches", "^lh:."), e(le, "unit", "");
var rt = class extends t {
};
e(rt, "id", "ObjectFit"), e(rt, "matches", "^(?:object|obj):(?:contain|cover|fill|scale-down|$values)");
var it = class extends t {
};
e(it, "id", "ObjectPosition"), e(it, "matches", "^(?:object|obj):(?:top|bottom|right|left|center|$values)");
var st = class extends t {
};
e(st, "id", "TextAlign"), e(st, "matches", "^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)");
var de = class extends t {
  order = -1;
};
e(de, "id", "TextDecoration"), e(de, "matches", "^t(?:ext)?:(?:underline|line-through|overline|$values)"), e(de, "colorful", true);
var ot = class extends t {
};
e(ot, "id", "TextTransform"), e(ot, "matches", "^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)");
var at = class extends t {
};
e(at, "id", "VerticalAlign"), e(at, "matches", "^(?:v|vertical):.");
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
var nt = class extends t {
};
e(nt, "id", "TransformStyle"), e(nt, "matches", "^transform:(?:flat|preserve-3d|$values)(?!\\|)");
var ct = class extends t {
};
e(ct, "id", "TransformBox"), e(ct, "matches", "^transform:(?:$values)(?!\\|)");
var ue = class extends t {
  parseValue(r, { rootSize: s }) {
    return r.replace(/(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g, (i, o, a, l) => {
      let c, d;
      switch (o) {
        case "translate":
          c = "rem";
          break;
        case "skew":
          c = "deg";
          break;
        case "rotate":
          a === "3d" && (d = true), c = "deg";
          break;
        default:
          return i;
      }
      let h = l.split(",");
      return i.replace(l, h.map((m, p) => !d || h.length - 1 === p ? Number.isNaN(+m) ? m : m / (c === "rem" ? s : 1) + c : m).join(","));
    });
  }
};
e(ue, "id", "Transform"), e(ue, "matches", "^(?:translate|scale|skew|rotate|perspective|matrix)(?:3d|[XYZ])?\\("), e(ue, "unit", "");
var lt = class extends t {
  order = -1;
};
e(lt, "id", "Transition"), e(lt, "symbol", "~");
var pe = class extends t {
};
e(pe, "id", "TransitionDelay"), e(pe, "matches", "^~delay:."), e(pe, "unit", "ms");
var he = class extends t {
};
e(he, "id", "TransitionDuration"), e(he, "matches", "^~duration:."), e(he, "unit", "ms");
var dt = class extends t {
};
e(dt, "id", "TransitionProperty"), e(dt, "matches", "^~property:.");
var ft = class extends t {
};
e(ft, "id", "TransitionTimingFunction"), e(ft, "matches", "^~easing:.");
var mt = class extends t {
};
e(mt, "id", "MaxHeight"), e(mt, "matches", "^max-h:.");
var ut = class extends t {
};
e(ut, "id", "MaxWidth"), e(ut, "matches", "^max-w:.");
var pt = class extends t {
};
e(pt, "id", "Display"), e(pt, "matches", "^d:.");
var ht = class extends t {
};
e(ht, "id", "BoxSizing"), e(ht, "matches", "^box:(?:$values)(?!\\|)");
var gt = class extends t {
};
e(gt, "id", "Opacity"), e(gt, "unit", "");
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
var xt = class extends t {
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
e(xt, "id", "Overflow"), e(xt, "matches", "^overflow(?:-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\\$|var|$values)");
var vt = class extends t {
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
e(vt, "id", "OverscrollBehavior"), e(vt, "matches", "^overscroll-behavior(?:-[xy])?:");
var ge = class extends t {
};
e(ge, "id", "ZIndex"), e(ge, "matches", "^z:."), e(ge, "unit", "");
var xe = class extends t {
};
e(xe, "id", "AnimationDelay"), e(xe, "matches", "^@delay:."), e(xe, "unit", "ms");
var bt = class extends t {
};
e(bt, "id", "AnimationDirection"), e(bt, "matches", "^@direction:.");
var yt = class extends t {
};
e(yt, "id", "AnimationFillMode"), e(yt, "matches", "^@fill-mode:.");
var ve = class extends t {
};
e(ve, "id", "AnimationIterationCount"), e(ve, "matches", "^@iteration-count:."), e(ve, "unit", "");
var Rt = class extends t {
};
e(Rt, "id", "AnimationName"), e(Rt, "matches", "^@name:.");
var St = class extends t {
};
e(St, "id", "AnimationPlayState"), e(St, "matches", "^@play-state:.");
var kt = class extends t {
};
e(kt, "id", "AnimationTimingFunction"), e(kt, "matches", "^@easing:.");
var be = class extends t {
  order = -1;
};
e(be, "id", "Animation"), e(be, "symbol", "@"), e(be, "unit", "");
var Ji = "border-";
function K(r, s, i = "") {
  i && (i = "-" + i);
  let o = /^b(order)?-?(.)?/.exec(r)[2], a = Ji + "left" + i, l = Ji + "right" + i, c = Ji + "top" + i, d = Ji + "bottom" + i;
  switch (o) {
    case "x":
      return { [a]: s, [l]: s };
    case "y":
      return { [c]: s, [d]: s };
    case "l":
      return { [a]: s };
    case "r":
      return { [l]: s };
    case "t":
      return { [c]: s };
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
var Ki = "border-top-left-radius";
var es = "border-top-right-radius";
var ts = "border-bottom-left-radius";
var rs = "border-bottom-right-radius";
var Bs = "border-radius";
var Ks = [Ki, es, ts, rs];
var Tt = class extends t {
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
          return { [Ki]: r, [es]: r };
        case "tl":
        case "lt":
          return { [Ki]: r };
        case "rt":
        case "tr":
          return { [es]: r };
        case "b":
          return { [ts]: r, [rs]: r };
        case "bl":
        case "lb":
          return { [ts]: r };
        case "br":
        case "rb":
          return { [rs]: r };
        case "l":
          return { [Ki]: r, [ts]: r };
        case "r":
          return { [es]: r, [rs]: r };
        default:
          return { [Bs]: r };
      }
    }
    let s = this.prefix?.slice(0, -1);
    return { [Ks.includes(s) ? s : Bs]: r };
  }
  get order() {
    return this.prefix === "border-radius:" || this.prefix === "r:" ? -1 : 0;
  }
};
e(Tt, "id", "BorderRadius"), e(Tt, "matches", "^(?:r[tblr]?[tblr]?|border(?:-(?:top|bottom)-(?:left|right))?-radius):.");
var Ct = class extends t {
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
e(Ct, "id", "BorderStyle"), e(Ct, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))");
var wt = class extends t {
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
e(wt, "id", "BorderWidth"), e(wt, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)");
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
var Mt = class extends t {
};
e(Mt, "id", "BackgroundAttachment"), e(Mt, "matches", "^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)");
var oi = class extends t {
};
e(oi, "id", "BackgroundBlendMode");
var Ot = class extends t {
  get(r) {
    return { "-webkit-background-clip": r, "background-clip": r };
  }
};
e(Ot, "id", "BackgroundClip"), e(Ot, "matches", "^(?:bg|background):(?:text|$values)(?!\\|)");
var te = class extends t {
};
e(te, "id", "BackgroundColor"), e(te, "colorStarts", "(?:bg|background):"), e(te, "unit", ""), e(te, "colorful", true);
var Bt = class extends t {
};
e(Bt, "id", "BackgroundOrigin"), e(Bt, "matches", "^(?:bg|background):(?:$values)(?!\\|)");
var Re = class extends t {
};
e(Re, "id", "BackgroundPosition"), e(Re, "matches", "^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)"), e(Re, "unit", "px");
var At = class extends t {
};
e(At, "id", "BackgroundRepeat"), e(At, "matches", "^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])");
var It = class extends t {
};
e(It, "id", "BackgroundSize"), e(It, "matches", "^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)");
var Se = class extends t {
};
e(Se, "id", "BackgroundImage"), e(Se, "matches", "^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)"), e(Se, "colorful", true);
var ke = class extends t {
  order = -1;
};
e(ke, "id", "Background"), e(ke, "matches", "^bg:."), e(ke, "colorful", true);
var $t = class extends t {
};
e($t, "id", "MixBlendMode"), e($t, "matches", "^blend:.");
var ai = class extends t {
};
e(ai, "id", "Position");
function is(r, s, { rootSize: i }) {
  let o = "", a = 0;
  return function l(c, d) {
    let h = "", m = d ? s(d) : "", p = () => {
      h && (o += !m || Number.isNaN(+h) ? h : +h / (m === "rem" ? i : 1) + m, h = "");
    };
    for (; a < r.length; a++) {
      let f = r[a];
      if (f === c && (c !== "'" || r[a + 1] === ")")) {
        p(), o += f;
        break;
      } else
        f === "," || f === " " ? (p(), o += f) : !h && f === "'" ? (o += f, a++, l(f), h = "") : h && f === "(" ? (o += h + f, a++, l(")", h), h = "") : h += f;
    }
    p();
  }(), o;
}
var Te = class extends t {
  get(r) {
    return { "backdrop-filter": r, "-webkit-backdrop-filter": r };
  }
  parseValue(r, s) {
    return is(r, (i) => {
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
var Ft = class extends t {
};
e(Ft, "id", "Stroke"), e(Ft, "colorful", true);
var Et = class extends t {
};
e(Et, "id", "StrokeWidth"), e(Et, "matches", "^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var we = class extends t {
  parseValue(r, s) {
    return is(r, (i) => {
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
var ci = class extends t {
};
e(ci, "id", "PointerEvents");
var li = class extends t {
};
e(li, "id", "Resize");
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
var Wt = class extends t {
};
e(Wt, "id", "TextShadow"), e(Wt, "colorful", true);
var As = 0.75;
var Dt = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    let { unit: s, value: i } = r;
    return { "font-size": r, "line-height": { ...r, value: s === "em" ? i + As + s : `calc(${i}${s} + ${As}em)`, unit: "" } };
  }
};
e(Dt, "id", "TextSize"), e(Dt, "matches", "^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Lt = class extends t {
};
e(Lt, "id", "WordBreak"), e(Lt, "unit", "");
var Oe = class extends t {
  get(r) {
    return { display: { ...r, value: "grid" }, "grid-template-columns": { ...this, value: "repeat(" + r.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(Oe, "id", "GridColumns"), e(Oe, "matches", "^grid-cols:."), e(Oe, "unit", "");
var jt = class extends t {
  get(r) {
    return { display: { ...r, value: "grid" }, "grid-auto-flow": { ...r, value: "column" }, "grid-template-rows": { ...r, value: "repeat(" + r.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(jt, "id", "GridRows"), e(jt, "unit", "");
var Nt = class extends t {
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
e(Nt, "id", "Gap"), e(Nt, "matches", "^gap(?:-x|-y)?:.");
var Pt = class extends t {
};
e(Pt, "id", "WordSpacing"), e(Pt, "unit", "em");
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
var zt = class extends t {
  get(r) {
    return { "box-decoration-break": r, "-webkit-box-decoration-break": r };
  }
};
e(zt, "id", "BoxDecorationBreak"), e(zt, "matches", "^box:(?:slice|clone|$values)(?!\\|)");
var ui = class extends t {
};
e(ui, "id", "BreakAfter");
var pi = class extends t {
};
e(pi, "id", "BreakBefore");
var hi = class extends t {
};
e(hi, "id", "BreakInside");
var Gt = class extends t {
};
e(Gt, "id", "FlexShrink"), e(Gt, "unit", "");
var Vt = class extends t {
};
e(Vt, "id", "FlexDirection"), e(Vt, "matches", "^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)");
var _t = class extends t {
};
e(_t, "id", "FlexGrow"), e(_t, "unit", "");
var Ht = class extends t {
};
e(Ht, "id", "FlexWrap"), e(Ht, "matches", "^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)");
var gi = class extends t {
};
e(gi, "id", "FlexBasis");
var Ut = class extends t {
  order = -1;
};
e(Ut, "id", "Flex"), e(Ut, "unit", "");
var Ie = class extends t {
};
e(Ie, "id", "Order"), e(Ie, "matches", "^o:."), e(Ie, "unit", "");
var $e = class extends t {
  parseValue(r) {
    return this.prefix.slice(-5, -1) === "span" && r !== "auto" ? "span " + r + "/span " + r : r;
  }
  order = -1;
};
e($e, "id", "GridColumn"), e($e, "matches", "^grid-col(?:umn)?(?:-span)?:."), e($e, "unit", "");
var Qt = class extends t {
};
e(Qt, "id", "ColumnSpan"), e(Qt, "matches", "^col-span:.");
var Fe = class extends t {
  parseValue(r) {
    return this.prefix.slice(-5, -1) === "span" && r !== "auto" ? "span " + r + "/span " + r : r;
  }
  order = -1;
};
e(Fe, "id", "GridRow"), e(Fe, "matches", "^grid-row-span:."), e(Fe, "unit", "");
var re = class extends t {
};
e(re, "id", "Color"), e(re, "matches", "^(?:color|fg|foreground):."), e(re, "colorful", true), e(re, "unit", "");
var Yt = class extends t {
};
e(Yt, "id", "AlignContent"), e(Yt, "matches", "^ac:.");
var Zt = class extends t {
};
e(Zt, "id", "AlignItems"), e(Zt, "matches", "^ai:.");
var qt = class extends t {
};
e(qt, "id", "AlignSelf"), e(qt, "matches", "^as:");
var Xt = class extends t {
};
e(Xt, "id", "GridAutoColumns"), e(Xt, "matches", "^grid-auto-cols:.");
var Jt = class extends t {
};
e(Jt, "id", "GridAutoFlow"), e(Jt, "matches", "^grid-flow:.");
var xi = class extends t {
};
e(xi, "id", "GridAutoRows");
var Kt = class extends t {
};
e(Kt, "id", "JustifyContent"), e(Kt, "matches", "^jc:.");
var er = class extends t {
};
e(er, "id", "JustifyItems"), e(er, "matches", "^ji:.");
var tr = class extends t {
};
e(tr, "id", "JustifySelf"), e(tr, "matches", "^js:.");
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
var rr = class extends t {
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
e(rr, "id", "Padding"), e(rr, "matches", "^padding(?:-(?:left|right|top|bottom))?:.");
var ir = class extends t {
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
e(ir, "id", "Margin"), e(ir, "matches", "^margin(?:-(?:left|right|top|bottom))?:.");
var sr = class extends t {
};
e(sr, "id", "TextOverflow"), e(sr, "matches", "^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))");
var or = class extends t {
};
e(or, "id", "ListStylePosition"), e(or, "matches", "^list-style:(?:inside|outside|$values)(?!\\|)");
var ar = class extends t {
};
e(ar, "id", "ListStyleType"), e(ar, "matches", "^list-style:(?:disc|decimal|$values)(?!\\|)");
var Ri = class extends t {
  order = -1;
};
e(Ri, "id", "ListStyle");
var Ee = class extends t {
};
e(Ee, "id", "TextDecorationColor"), e(Ee, "colorStarts", "text-decoration:"), e(Ee, "colorful", true);
var nr = class extends t {
};
e(nr, "id", "TextDecorationStyle"), e(nr, "matches", "^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)");
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
var cr = class extends t {
};
e(cr, "id", "OutlineStyle"), e(cr, "matches", "^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)");
var lr = class extends t {
};
e(lr, "id", "OutlineWidth"), e(lr, "matches", "^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var dr = class extends t {
  order = -1;
};
e(dr, "id", "Outline"), e(dr, "colorful", true);
var fr = class extends t {
};
e(fr, "id", "BorderCollapse"), e(fr, "matches", "^b(?:order)?:(?:collapse|separate|$values)(?!\\|)");
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
var mr = class extends t {
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
e(mr, "id", "ScrollMargin"), e(mr, "matches", "^scroll-m(?:[xytblr]|argin(?:-(?:top|bottom|left|right))?)?:.");
var ur = class extends t {
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
e(ur, "id", "ScrollPadding"), e(ur, "matches", "^scroll-p(?:[xytblr]|adding(?:-(?:top|bottom|left|right))?)?:.");
var pr = class extends t {
};
e(pr, "id", "ScrollSnapAlign"), e(pr, "matches", "^scroll-snap:(?:start|end|center|$values)");
var hr = class extends t {
};
e(hr, "id", "ScrollSnapStop"), e(hr, "matches", "^scroll-snap:(?:normal|always|$values)(?!\\|)");
var gr = class extends t {
};
e(gr, "id", "ScrollSnapType"), e(gr, "matches", "^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)");
var Bi = class extends t {
};
e(Bi, "id", "WillChange");
var Ai = class extends t {
};
e(Ai, "id", "TextUnderlineOffset");
var xr = class extends t {
  get(r) {
    return { [this.prefix.slice(0, -1)]: r };
  }
};
e(xr, "id", "Inset"), e(xr, "matches", "^(?:top|bottom|left|right):.");
var Ne = class extends t {
  order = -1;
};
e(Ne, "id", "Columns"), e(Ne, "matches", "^(?:columns|cols):."), e(Ne, "unit", "");
var vr = class extends t {
};
e(vr, "id", "WhiteSpace"), e(vr, "unit", "");
var br = class extends t {
};
e(br, "id", "TextOrientation"), e(br, "matches", "^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)");
var yr = class extends t {
};
e(yr, "id", "WritingMode"), e(yr, "matches", "^writing:.");
var Ii = class extends t {
};
e(Ii, "id", "Contain");
var Pe = class extends t {
};
e(Pe, "id", "AnimationDuration"), e(Pe, "matches", "^@duration:."), e(Pe, "unit", "ms");
var Rr = class extends t {
};
e(Rr, "id", "TextRendering"), e(Rr, "matches", "^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)");
var $i = class extends t {
};
e($i, "id", "Direction");
var Sr = class extends t {
};
e(Sr, "id", "TextDecorationLine"), e(Sr, "matches", "^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)");
var ze = class extends t {
};
e(ze, "id", "GridColumnStart"), e(ze, "matches", "^grid-col-start:."), e(ze, "unit", "");
var kr = class extends t {
};
e(kr, "id", "ListStyleImage"), e(kr, "matches", "^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var Tr = class extends t {
};
e(Tr, "id", "ShapeOutside"), e(Tr, "matches", "^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)");
var Cr = class extends t {
};
e(Cr, "id", "ShapeMargin"), e(Cr, "matches", "^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var wr = class extends t {
};
e(wr, "id", "ShapeImageThreshold"), e(wr, "unit", "");
var Mr = class extends t {
};
e(Mr, "id", "ClipPath"), e(Mr, "matches", "^clip:.");
var Fi = class extends t {
  order = -1;
};
e(Fi, "id", "Grid");
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
var Or = class extends t {
};
e(Or, "id", "GridRowStart"), e(Or, "unit", "");
var Di = class extends t {
};
e(Di, "id", "GridTemplateAreas");
var Br = class extends t {
};
e(Br, "id", "GridTemplateColumns"), e(Br, "matches", "^grid-template-cols:.");
var Li = class extends t {
};
e(Li, "id", "GridTemplateRows");
var Ar = class extends t {
  order = -1;
};
e(Ar, "id", "GridArea"), e(Ar, "unit", "");
var Ve = class extends t {
};
e(Ve, "id", "GridColumnEnd"), e(Ve, "matches", "^grid-col-end:."), e(Ve, "unit", "");
var Ir = class extends t {
};
e(Ir, "id", "GridRowEnd"), e(Ir, "unit", "");
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
var $r = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-stroke": r };
  }
};
e($r, "id", "TextStroke"), e($r, "matches", "^text-stroke:.");
var Fr = class extends t {
  static get prop() {
    return "";
  }
  get(r) {
    return { "-webkit-text-stroke-width": r };
  }
};
e(Fr, "id", "TextStrokeWidth"), e(Fr, "matches", "^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)");
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
var Er = class extends t {
};
e(Er, "id", "X"), e(Er, "unit", "");
var Wr = class extends t {
};
e(Wr, "id", "Y"), e(Wr, "unit", "");
var Dr = class extends t {
};
e(Dr, "id", "Cx"), e(Dr, "unit", "");
var Lr = class extends t {
};
e(Lr, "id", "Cy"), e(Lr, "unit", "");
var jr = class extends t {
};
e(jr, "id", "Rx"), e(jr, "unit", "");
var Nr = class extends t {
};
e(Nr, "id", "Ry"), e(Nr, "unit", "");
var zi = class extends t {
};
e(zi, "id", "BorderImageOutset");
var Pr = class extends t {
};
e(Pr, "id", "BorderImageRepeat"), e(Pr, "matches", "^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)");
var zr = class extends t {
};
e(zr, "id", "BorderImageSlice"), e(zr, "unit", "");
var Gr = class extends t {
};
e(Gr, "id", "BorderImageSource"), e(Gr, "matches", "^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var Vr = class extends t {
};
e(Vr, "id", "BorderImageWidth"), e(Vr, "matches", "^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var _r = class extends t {
};
e(_r, "id", "BorderImage"), e(_r, "unit", "");
var eo = /\{(.*)\}/;
var _e = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    let o = 0;
    for (; o < r.length && !(r[o] === "{" && r[o - 1] !== "\\"); o++)
      ;
    return [r.slice(0, o), ...Q(r.slice(o), s, i)];
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
        let u = n.slice(CSS.escape(m.className).length).match(eo)[1].split(";");
        for (let k of u)
          o(f, k);
      };
      if (this.theme) {
        let f = m.natives.find((n) => n.theme === this.theme) ?? m.natives.find((n) => !n.theme);
        f && p(this.theme, f.text);
      } else
        for (let f of m.natives)
          p(f.theme, f.text);
    }, l = [], c = "", d = () => {
      c && (l.push(c.replace(/ /g, "")), c = "");
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
        if (c += f, p === f) {
          if (p === "'" || p === '"') {
            let n = 0;
            for (let u = c.length - 2; c[u] === "\\"; u--)
              n++;
            if (n % 2)
              continue;
          }
          break;
        } else
          f in Ue && p !== "'" && p !== '"' && (h++, m(Ue[f]));
      }
    })(void 0), d();
    for (let m of l) {
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
var Hr = class extends t {
};
e(Hr, "id", "CounterIncrement"), e(Hr, "unit", "");
var Ur = class extends t {
};
e(Ur, "id", "CounterReset"), e(Ur, "unit", "");
var Qr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Q(r, s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { width: { ...r, value: s }, height: { ...r, value: i } };
  }
};
e(Qr, "id", "WH"), e(Qr, "matches", "^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var Yr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Q(r.slice(4), s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { "min-width": { ...r, value: s }, "min-height": { ...r, value: i } };
  }
};
e(Yr, "id", "MinWH"), e(Yr, "matches", "^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var Zr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(r, s, i) {
    return ["", ...Q(r.slice(4), s, i, ["x"])];
  }
  get(r) {
    let [s, i] = r.value.split(" x ");
    return { "max-width": { ...r, value: s }, "max-height": { ...r, value: i } };
  }
};
e(Zr, "id", "MaxWH"), e(Zr, "matches", "^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var to = [_e, Be, Ye, oe, Qe, ne, ce, et, tt, Ge, re, Ze, ir, rr, gi, Ht, _t, Gt, Vt, Ut, pt, qe, Xe, Je, Ke, Qr, Yr, Zr, Ii, ki, Hr, Ur, ae, le, rt, it, st, Ee, nr, We, Sr, de, Ai, sr, br, ot, Rr, Si, at, Ne, vr, xr, fe, mt, ut, ht, gt, ti, ri, ii, si, xt, vt, ge, ai, ni, ci, li, di, Lt, Pt, fi, mi, Wt, Dt, ie, Fr, se, $r, Me, wi, ct, nt, me, ue, dt, ft, he, pe, lt, xe, bt, Pe, yt, ve, Rt, St, kt, be, ee, Tt, Ct, wt, fr, Ci, zi, Pr, zr, Gr, Vr, _r, ye, Mt, oi, te, Ot, Bt, Re, At, It, Se, ke, $t, Te, we, Ce, Ni, Pi, Et, Ft, Er, Wr, Dr, Lr, jr, Nr, ze, Ve, $e, Oe, Or, Ir, Fe, jt, Xt, Jt, xi, Di, Br, Li, Wi, Ar, Fi, Nt, Ie, hi, pi, ui, zt, Ae, Qt, Yt, Zt, qt, Kt, er, tr, vi, bi, yi, or, ar, kr, Ri, De, Ti, cr, lr, dr, Le, Mi, je, Oi, mr, ur, pr, hr, gr, Bi, yr, $i, Tr, Cr, wr, Mr, Ei, ji];
var GS = false;
var _S = true;
var US = false;

// test.ts
console.log(N);
