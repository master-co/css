// dist/index.mjs
var ui = Object.defineProperty;
var Ni = (r, s, i) => s in r ? ui(r, s, { enumerable: true, configurable: true, writable: true, value: i }) : r[s] = i;
var Li = (r, s) => {
  for (var i in s)
    ui(r, i, { get: s[i], enumerable: true });
};
var e = (r, s, i) => (Ni(r, typeof s != "symbol" ? s + "" : s, i), i);
var oi = typeof Buffer < "u" ? Buffer : null;
function hi(r) {
  return !!(oi && r instanceof oi || r instanceof Date || r instanceof RegExp);
}
function vi(r) {
  if (oi && r instanceof Buffer) {
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
function gi(r) {
  let s = [];
  return r.forEach(function(i, o) {
    typeof i == "object" && i !== null ? Array.isArray(i) ? s[o] = gi(i) : hi(i) ? s[o] = vi(i) : s[o] = Y({}, i) : s[o] = i;
  }), s;
}
function pi(r, s) {
  return s === "__proto__" ? void 0 : r[s];
}
function Y(...r) {
  let s = {}, i, o;
  return r.forEach(function(n) {
    typeof n != "object" || n === null || Array.isArray(n) || Object.keys(n).forEach(function(l) {
      if (o = pi(s, l), i = pi(n, l), i !== s)
        if (typeof i != "object" || i === null) {
          s[l] = i;
          return;
        } else if (Array.isArray(i)) {
          s[l] = gi(i);
          return;
        } else if (hi(i)) {
          s[l] = vi(i);
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
function Qs(r, s, i) {
  return ((1 << 24) + (r << 16) + (s << 8) + i).toString(16).slice(1);
}
var _i = [",", ".", "#", "[", "!", "*", ">", "+", "~", ":", "@"];
var zi = /^::-[a-z]+-/m;
var Ai = /^rgba?\( *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?: |,) *([0-9]{1,3}) *(?:(?:\/|,) *0?(\.[0-9]))?\)$/;
var Hs;
var Fs = typeof window < "u";
Fs && (Hs = document.createElement("style"), Hs.title = "master");
var H = "max-width";
var U = "min-width";
var Ii = "attributes";
var Wi = Fs ? window.MutationObserver : Object;
var Zr = class extends Wi {
  constructor(i) {
    super((o) => {
      let n = {}, l = [], d = [], c = [], h = (a, m) => {
        m ? a.classList.forEach(u) : a.classList.forEach(v);
        let R = a.children;
        for (let b = 0; b < R.length; b++) {
          let k = R[b];
          k.classList && (d.push(k), h(k, m));
        }
      }, v = (a) => {
        a in n ? n[a]++ : n[a] = 1;
      }, u = (a) => {
        a in n ? n[a]-- : a in this.countOfClass && (n[a] = -1);
      }, f = (a, m) => {
        for (let R = 0; R < a.length; R++) {
          let b = a[R];
          b.classList && !d.includes(b) && !c.includes(b) && (b.isConnected !== m ? (d.push(b), h(b, m)) : c.push(b));
        }
      };
      for (let a = 0; a < o.length; a++) {
        let m = o[a], { addedNodes: R, removedNodes: b, type: k, target: S, oldValue: y } = m;
        if (k === Ii) {
          if (l.find((p) => p.target === S))
            continue;
          l.push(m);
        } else
          f(R, false), (!S.isConnected || !d.includes(S)) && f(b, true);
      }
      if (!(!l.length && !Object.keys(n).length)) {
        for (let { oldValue: a, target: m } of l) {
          let R = d.includes(m), b = m.classList, k = a ? a.split(" ") : [];
          if (R) {
            if (m.isConnected)
              continue;
            for (let S of k)
              b.contains(S) || u(S);
          } else if (m.isConnected) {
            b.forEach((S) => {
              k.includes(S) || v(S);
            });
            for (let S of k)
              b.contains(S) || u(S);
          }
        }
        for (let a in n) {
          let m = n[a], R = (this.countOfClass[a] || 0) + m;
          R === 0 ? (delete this.countOfClass[a], this.delete(a)) : (a in this.countOfClass || this.insert(a), this.countOfClass[a] = R);
        }
      }
    });
    this.config = i;
    this.config?.override || (this.config = Y(Kr, i)), this.cache(), Fs && this.config.observe && this.observe(document), Zr.instances.push(this), this.ready = true;
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
    let { semantics: i, classes: o, selectors: n, themes: l, colors: d, values: c, breakpoints: h, mediaQueries: v, Rules: u } = this.config;
    function f(p) {
      return p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    function a(p, g, x = "", w = {}) {
      let M = (O) => O ? (x ? x + "-" : "") + O : x, $ = Object.entries(p), E = [], z = [];
      for (let O of $) {
        let F = O[1];
        (typeof F == "object" && !Array.isArray(F) ? E : z).push(O);
      }
      for (let [O, F] of E)
        a(F, g, M(O), w);
      if (g && x)
        z.length && (w[x] = z.reduce((O, [F, Fe]) => (O[F] = Fe, O), {}));
      else
        for (let [O, F] of z)
          w[M(O)] = F;
      return w;
    }
    if (i)
      for (let [p, g] of Object.entries(a(i, true)))
        this.semantics.push([new RegExp("^" + f(p) + "(?=!|\\*|>|\\+|~|:|\\[|@|_|\\.|$)", "m"), [p, g]]);
    if (n)
      for (let [p, g] of Object.entries(a(n, false))) {
        let x = new RegExp(f(p) + "(?![a-z-])");
        for (let w of Array.isArray(g) ? g : [g]) {
          let M = w.match(zi)?.[0] ?? "", $ = this.selectors[M];
          $ || ($ = this.selectors[M] = []);
          let E = $.find(([z]) => z === x);
          E || (E = [x, []], $.push(E)), E[1].push(w);
        }
      }
    if (c)
      for (let [p, g] of Object.entries(c))
        typeof g == "object" ? this.values[p] = a(g, false) : this.globalValues[p] = g;
    h && (this.breakpoints = a(h, false)), v && (this.mediaQueries = a(v, false));
    let m = o ? a(o, false) : {}, R = l && !Array.isArray(l) ? Object.entries(l).filter(([, { classes: p }]) => p).reduce((p, [g, { classes: x }]) => (p[g] = a(x, false), p), {}) : {}, b = [...Object.keys(m), ...Object.entries(R).flatMap(([p, g]) => Object.keys(g))], k = (p) => {
      if (p in this.classes)
        return;
      let g = this.classes[p] = [], x = (w, M) => {
        if (!M)
          return;
        let $ = Array.isArray(M) ? M : M.replace(/(?:\n(?:\s*))+/g, " ").trim().split(" ");
        for (let E of $) {
          let z = (O) => {
            O in this.relationThemesMap ? w in this.relationThemesMap[O] ? this.relationThemesMap[O][w].push(p) : this.relationThemesMap[O][w] = [p] : this.relationThemesMap[O] = { [w]: [p] }, g.includes(O) || g.push(O);
          };
          if (b.includes(E)) {
            k(E);
            for (let O of this.classes[E])
              z(O);
          } else
            z(E);
        }
      };
      x("", m?.[p]);
      for (let [w, M] of Object.entries(R))
        x(w, M?.[p]);
    };
    for (let p of b)
      k(p);
    for (let p in this.relationThemesMap) {
      let g = this.relations[p] = [];
      for (let x of Object.values(this.relationThemesMap[p]))
        for (let w of x)
          g.includes(w) || g.push(w);
    }
    let S = (p, g) => {
      if (!g)
        return;
      let x = a(g, true);
      for (let [w, M] of Object.entries(x)) {
        let $ = typeof M == "string" ? { "": M } : M;
        for (let [E, z] of Object.entries($)) {
          let O = w + (E ? "-" + E : "");
          O in this.colorThemesMap ? this.colorThemesMap[O][p] = z : this.colorThemesMap[O] = { [p]: z };
        }
      }
      for (let w in g)
        this.colorNames.includes(w) || this.colorNames.push(w);
    };
    if (S("", d), l)
      if (Array.isArray(l))
        this.themeNames.push(...l);
      else
        for (let p in l) {
          let g = l[p];
          S(p, g.colors), this.themeNames.push(p);
        }
    let y = (p) => {
      for (let [g, x] of Object.entries(this.colorThemesMap))
        for (let [w, M] of Object.entries(x))
          M.startsWith("#") || p(g, x, w, M);
    };
    if (y((p, g, x, w) => {
      let M = Ai.exec(w);
      if (M) {
        let $ = "#" + Qs(+M[1], +M[2], +M[3]);
        M[4] && ($ += Math.round(255 * +M[4]).toString(16)), g[x] = $;
      }
    }), y((p, g, x, w) => {
      let [M, $] = w.split("/"), E = this.colorThemesMap[M];
      if (E) {
        let z = (x ? E[x] : void 0) ?? E[""];
        g[x] = $ ? z.slice(0, 7) + Math.round(255 * +$).toString(16) : z;
      } else
        console.warn(`\`${w}\` doesn't exist in the extended config \`.colors\``), delete g[x], Object.keys(g).length || delete this.colorThemesMap[p];
    }), u)
      for (let p of u) {
        let g = p.matches;
        if (g) {
          let x = Object.keys(this.values[p.id] ?? {}), w = g.indexOf("$values");
          this.matches[p.id] = new RegExp(w === -1 ? g : x.length ? g.slice(0, w) + x.join("|") + g.slice(w + 7) : g.slice(0, w - (g[w - 1] === "|" ? 1 : 0)) + g.slice(w + 7 + (g[w + 7] === "|" ? 1 : 0)));
        }
      }
  }
  observe(i, o = { subtree: true, childList: true }) {
    if (Fs && i) {
      this.root = i;
      let n = i === document;
      n && (Zr.root = this), this.host = n ? document.documentElement : i.host, this.theme = new qs(this.host, this.config.theme);
      let l = n ? document.head : i, d = n ? document.styleSheets : i.styleSheets;
      for (let h of d) {
        let { title: v, href: u, ownerNode: f } = h;
        (v === "master" || u && u.startsWith(window.location.origin) && /master(?:\..+)?\.css/.test(u)) && (this.style = f);
      }
      if (this.style)
        for (let h = 0; h < this.style.sheet.cssRules.length; h++) {
          let v = (f) => {
            if (f.selectorText) {
              let m = f.selectorText.split(", ")[0].split(" ");
              for (let R = 0; R < m.length; R++) {
                let b = m[R];
                if (b[0] === ".") {
                  let k = b.slice(1), S = "";
                  for (let y = 0; y < k.length; y++) {
                    let p = k[y], g = k[y + 1];
                    if (p === "\\") {
                      if (y++, g !== "\\") {
                        S += g;
                        continue;
                      }
                    } else if (_i.includes(p))
                      break;
                    S += p;
                  }
                  if (!(S in this.ruleOfClass) && !(S in this.classes)) {
                    let y = this.create(S)[0];
                    if (y)
                      return y;
                  }
                }
              }
            } else if (f.cssRules)
              for (let a = 0; a < f.cssRules.length; a++) {
                let m = v(f.cssRules[a]);
                if (m)
                  return m;
              }
          }, u = v(this.style.sheet.cssRules[h]);
          if (u) {
            this.rules.push(u), this.ruleOfClass[u.className] = u;
            for (let f = 0; f < u.natives.length; f++)
              u.natives[f].cssRule = this.style.sheet.cssRules[h + f];
            h += u.natives.length - 1;
          }
        }
      else
        this.style = Hs.cloneNode(), l.prepend(this.style);
      let c = (h) => {
        h.forEach((v) => {
          v in this.countOfClass ? this.countOfClass[v]++ : (this.countOfClass[v] = 1, this.insert(v));
        });
      };
      c(this.host.classList), o.subtree && this.host.querySelectorAll("[class]").forEach((h) => c(h.classList)), super.observe(i, { ...o, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
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
      let n = o.match(i, this.matches[o.id], this.colorThemesMap, this.colorNames);
      if (n)
        return { ...n, Rule: o };
    }
    for (let o of this.semantics)
      if (i.match(o[0]))
        return { origin: "semantics", value: o[1], Rule: t };
  }
  create(i) {
    let o = (n) => {
      if (n in this.ruleOfClass)
        return this.ruleOfClass[n];
      let l = this.match(n);
      if (l)
        return new l.Rule(n, l, this);
    };
    return (i in this.classes ? this.classes[i].map((n) => o(n)) : [o(i)]).filter((n) => n && n.text);
  }
  refresh(i) {
    if (i?.override ? this.config = i : this.config = Y(Kr, i), this.cache(), !this.style)
      return;
    let o = Hs.cloneNode();
    this.style.replaceWith(o), this.style = o, this.rules.length = 0, this.ruleOfClass = {};
    for (let n in this.countOfClass)
      this.insert(n);
  }
  destroy() {
    let i = Zr.instances;
    this.disconnect(), i.splice(i.indexOf(this), 1);
  }
  delete(i) {
    let o = this.style.sheet, n = (l) => {
      let d = this.ruleOfClass[l];
      if (!(!d || l in this.relations && this.relations[l].some((c) => c in this.countOfClass))) {
        if (d.natives.length) {
          let c = d.natives[0];
          for (let h = 0; h < o.cssRules.length; h++)
            if (o.cssRules[h] === c.cssRule) {
              for (let u = 0; u < d.natives.length; u++)
                o.deleteRule(h);
              this.rules.splice(this.rules.indexOf(d), 1);
              break;
            }
        }
        delete this.ruleOfClass[l];
      }
    };
    if (i in this.classes) {
      for (let l of this.classes[i])
        l in this.countOfClass || n(l);
      delete this.ruleOfClass[i];
    } else
      n(i);
  }
  insert(i) {
    let o = this.create(i);
    return o.length ? (this.insertRules(o), true) : false;
  }
  insertRules(i) {
    for (let o of i) {
      if (this.ruleOfClass[o.className])
        continue;
      let n, l = this.rules.length - 1, { media: d, order: c, priority: h, hasWhere: v, className: u } = o, f = (a, m, R, b) => {
        let k = 0, S;
        m && (k = a.findIndex(m)), R && (S = a.findIndex(R)), k === -1 && (k = a.length), (S === void 0 || S === -1) && (S = a.length);
        let y = a.slice(k, S);
        for (let p = 0; p < y.length; p++) {
          let g = y[p];
          if (!(g.priority === -1 || b && b(g)) && (g.priority < h || g.priority === h && (v && !g.hasWhere || g.order >= c)))
            return k + p;
        }
        return k + y.length;
      };
      if (d) {
        let a = this.rules.findIndex((m) => m.media);
        if (a !== -1) {
          let m = d.features[H], R = d.features[U];
          if (m && R) {
            let b = m.value - R.value;
            for (let k = l; k >= a; k--) {
              n = k;
              let S = this.rules[k], y = S.media, p = y.features[H], g = y.features[U];
              if (!p || !g) {
                n++;
                break;
              }
              let x = p.value - g.value;
              if (x === b) {
                if (v !== S.hasWhere)
                  continue;
                if (h !== -1) {
                  let w = [this.rules[k]];
                  for (let M = k - 1; M >= a; M--) {
                    let $ = this.rules[M];
                    if ($.hasWhere !== v)
                      break;
                    let E = $.media, z = E.features[H], O = E.features[U];
                    if (!z || !O || z.value - O.value !== x)
                      break;
                    w.unshift(this.rules[M]);
                  }
                  n = f(this.rules, (M) => M.media && M.priority !== -1 && M.media.features[U] && M.media.features[H]);
                }
                break;
              } else if (x > b)
                break;
            }
          } else if (R)
            for (let b = a; b <= l; b++) {
              n = b;
              let k = this.rules[b], S = k.media, y = S.features[H], p = S.features[U];
              if (y) {
                if (p)
                  break;
                continue;
              }
              let g = p?.value;
              if (g === R.value) {
                if (!v && k.hasWhere) {
                  n++;
                  continue;
                }
                if (h !== -1)
                  n = f(this.rules, (x) => x.media, (x) => x.media && x.priority !== -1 && x.media.features[U] && x.media.features[H], (x) => !x.media.features[U] && !x.media.features[H]);
                else
                  for (let x = b; x <= l; x++) {
                    let w = this.rules[x], M = w.media, $ = M.features[U];
                    if (!M.features[H]) {
                      if (w.hasWhere !== v || $.value !== g || w.order >= c)
                        break;
                      n = x + 1;
                    }
                  }
                break;
              } else {
                if (g > R.value)
                  break;
                n++;
              }
            }
          else if (m)
            for (let b = l; b >= a; b--) {
              n = b;
              let k = this.rules[b], S = k.media, y = S.features[H];
              if (S.features[U])
                continue;
              let g = y?.value;
              if (!g || g > m.value) {
                n++;
                break;
              } else if (g === m.value) {
                if (v && !k.hasWhere)
                  continue;
                if (h !== -1)
                  n = f(this.rules, (x) => x.media, (x) => x.media && x.priority !== -1 && x.media.features[U] && x.media.features[H], (x) => !x.media.features[U] && !x.media.features[H]);
                else {
                  let x = [this.rules[b]];
                  for (let w = b - 1; w >= a; w--) {
                    let M = this.rules[w], $ = M.media, E = $.features[U], z = $.features[H];
                    if (!E && (!z || z.value !== g || M.hasWhere !== v))
                      break;
                    x.unshift(M);
                  }
                  for (let w = 0; w < x.length; w++) {
                    let M = x[w];
                    if (!M.media.features[U]) {
                      if (M.order >= c)
                        break;
                      n = b - x.length + 2 + w;
                    }
                  }
                }
                break;
              }
            }
        }
        if (n === void 0)
          if (a === -1)
            n = l + 1;
          else if (h !== -1)
            n = a + f(this.rules.slice(a), void 0, (m) => m.media.features[H] || m.media.features[U]);
          else if (v) {
            let m = a;
            for (; m < this.rules.length; m++) {
              let R = this.rules[m];
              if (R.priority !== -1 || !R.hasWhere || R.order >= c) {
                n = m;
                break;
              }
            }
            n === void 0 && (n = m);
          } else
            for (let m = a; m <= l; m++) {
              n = m;
              let R = this.rules[m], b = R.media;
              if (R.priority !== -1 || b.features[H] || b.features[U])
                break;
              if (R.hasWhere)
                n++;
              else if (R.order >= c)
                break;
            }
      } else if (h === -1)
        if (v)
          n = this.rules.findIndex((a) => !a.hasWhere || a.media || a.priority !== -1 || a.order >= c), n === -1 && (n = l + 1);
        else {
          let a = 0;
          for (; a < this.rules.length; a++) {
            let m = this.rules[a];
            if (m.media || !m.hasWhere && (m.order >= c || m.priority !== -1)) {
              n = a;
              break;
            }
          }
          n === void 0 && (n = a);
        }
      else
        n = f(this.rules, void 0, (a) => a.media);
      if (this.rules.splice(n, 0, o), this.ruleOfClass[u] = o, this.style) {
        let a = this.style.sheet, m = 0, R = (b) => {
          let k = this.rules[b];
          if (k) {
            if (!k.natives.length)
              return R(b - 1);
            let S = k.natives[k.natives.length - 1].cssRule;
            for (let y = 0; y < a.cssRules.length; y++)
              if (a.cssRules[y] === S) {
                m = y + 1;
                break;
              }
          }
        };
        R(n - 1);
        for (let b = 0; b < o.natives.length; )
          try {
            let k = o.natives[b];
            a.insertRule(k.text, m), k.cssRule = a.cssRules[m++], b++;
          } catch (k) {
            console.error(k), o.natives.splice(b, 1);
          }
      }
    }
  }
  get text() {
    return this.rules.map((i) => i.text).join("");
  }
};
var X = Zr;
e(X, "instances", []), e(X, "root");
function Bs(r, s) {
  return (r ? r + ":" : "") + (s.unit ? s.value + s.unit : s.value) + (s.important ? "!important" : "");
}
var Vi = /^([+-.]?\d+(\.?\d+)?)(.*)?/;
function Ys(r, s, i) {
  if (i) {
    let o = "", n = r.match(Vi);
    if (n)
      if (r.includes("/")) {
        let [l, d] = r.split("/");
        return { value: +l / +d * 100 + "%", unit: o };
      } else {
        let l = +n[1];
        return o = n[3] || "", o || ((i === "rem" || i === "em") && (l = l / s), o = i || ""), { value: l, unit: o };
      }
  }
}
function xi(r, s, i) {
  let o = (u) => u === "+" || u === "-" || u === "*" || u === "/", n = "", l, d = "", c = false, h = false;
  function v(u, f = "", a = "") {
    if (l === 2 && !h) {
      let m = Ys(d, s, i);
      m && (d = m.value + m.unit);
    }
    n += d + f + u + a, l = null, h = false, d = "";
  }
  for (let u = 0; u < r.length; u++) {
    let f = r[u];
    if (f === "(" || f === ")")
      c = f === ")", v(f);
    else if (f === ",")
      v(f, "", " ");
    else {
      switch (l) {
        case 1:
          break;
        case 2:
          if (o(f)) {
            v(f, " ", " ");
            continue;
          } else
            /[0-9]/.test(f) || (h = true);
          break;
        default:
          c && (n += " "), isNaN(+f) ? o(f) || (l = 1) : l = 2;
          break;
      }
      l ? d += f : n += f;
    }
  }
  return d && (n += d), n;
}
function Xs(r, s, i, o, n, l) {
  let d = "", c = "", h;
  if (typeof r == "number")
    d = r, c = s || "";
  else {
    if (o) {
      let u = false, f = false;
      r = r.replace(new RegExp(`(^|,| |\\()((?:${i.join("|")})(?:-(?:[0-9A-Za-z-]+))?)(?:\\/(\\.?[0-9]+%?))?(?=(\\)|\\}|,| |$))`, "gm"), (a, m, R, b) => {
        f = true;
        let k = o[R];
        if (k) {
          let S;
          for (let y of l)
            if (S = k[y])
              break;
          if (S) {
            u = true;
            let y = S;
            if (b) {
              let p = b.endsWith("%") ? parseFloat(b) / 100 : +b;
              p = isNaN(p) ? 1 : Math.min(Math.max(p, 0), 1), y += Math.round(p * 255).toString(16).toUpperCase().padStart(2, "0");
            }
            return m + y;
          }
        }
        return a;
      }), f && (h = u);
    }
    let v = Ys(r, n, s);
    if (v)
      return v;
    d = (r.indexOf("calc(") === -1 ? r : xi(r, n, s)).replace(/\$\(((\w|-)+)\)/g, "var(--$1)");
  }
  return { value: d, unit: c, colorMatched: h };
}
var qe = { "(": ")", "'": "'", '"': '"', "{": "}" };
var Di = ["!", "*", ">", "+", "~", ":", "[", "@", "_"];
function B(r, s, i, o = []) {
  let n = [",", ...o], l = [], d = "", c = 0;
  return function h(v, u, f, a = "", m = [], R = []) {
    let b, k = false;
    u && (u === ")" && d.slice(-1) === "$" ? b = d.length - 1 : (u === "'" || u === '"') && (k = true), d += v[c++]);
    let S = () => {
      let y = d;
      if (d = "", s && y in s && !m.includes(y)) {
        let p = c;
        c = 0, h(s[y].toString(), void 0, void 0, void 0, [...m, y], R), c = p;
      } else if (i && y in i && !R.includes(y)) {
        let p = c;
        c = 0, h(i[y].toString(), void 0, void 0, void 0, m, [...R, y]), c = p;
      } else
        l.push({ value: y });
    };
    for (; c < v.length; c++) {
      let y = v[c];
      if (y === u) {
        if (d += y, k) {
          let p = 0;
          for (let g = d.length - 2; d[g] === "\\"; g--)
            p++;
          if (p % 2)
            continue;
        }
        b !== void 0 && (d = d.slice(0, b) + d.slice(b).replace(/\$\((.*)\)/, "var(--$1)")), f || (k ? l.push(d) : S(), a = "", d = "");
        break;
      } else if (!k && y in qe)
        h(v, qe[y], f === void 0 ? 0 : f + 1, a, m, R);
      else if ((y === "|" || y === " ") && u !== "}" && (!k || a === "path"))
        u ? d += " " : S();
      else {
        if (!u) {
          if (y === ".") {
            if (isNaN(+v[c + 1]))
              break;
            v[c - 1] === "-" && (d += "0");
          } else if (n.includes(y)) {
            d && S(), l.push(y);
            continue;
          } else if (y === "#" && (d || l.length && v[c - 1] !== "|" && l[c - 1] !== " ") || Di.includes(y))
            break;
          a += y;
        }
        d += y;
      }
    }
    f === void 0 && d && S();
  }(r), [l, r.slice(c)];
}
var bi = [":disabled", ":active", ":focus", ":hover"];
var Jr = "matches";
var Pi = "semantics";
var yi = "symbol";
var ki = "width";
var ni = "max-" + ki;
var ai = "min-" + ki;
var li = "motion";
var wi = "reduce";
var Ri = wi + "d-" + li;
var ci = "px";
var Ui = "rem";
var Qi = /(\\'(?:.*?)[^\\]\\')(?=[*_>~+,)])|(\[[^=]+='(?:.*?)[^\\]'\])/;
var Hi = (r) => r.split(Qi).map((s, i) => i % 3 ? s : s.replace(/_/g, " ")).join("");
var t = class {
  constructor(s, i, o) {
    this.className = s;
    this.matching = i;
    this.css = o;
    let n = this.constructor, { id: l, unit: d, colorful: c, prop: h } = n, { rootSize: v, scope: u, important: f } = o.config, { themeNames: a, colorNames: m, colorThemesMap: R, selectors: b, globalValues: k, breakpoints: S, mediaQueries: y } = o, p = o.values[l], g = o.relationThemesMap[s], x = s, w, M, $, E;
    if (i.origin === Pi) {
      let [I, L] = i.value;
      $ = x.slice(I.length), w = L;
    } else if (this.analyzeToken)
      [M, E, $] = this.analyzeToken(x, p, k);
    else {
      let I;
      if (i.origin === Jr) {
        let L = x.indexOf(":");
        this.prefix = x.slice(0, L + 1), this.prefix.includes("(") ? (this.prefix = void 0, I = x) : I = x.slice(L + 1);
      } else
        i.origin === yi && (this.symbol = x[0], I = x.slice(1));
      [E, $] = B(I, p, k);
    }
    $[0] === "!" && (this.important = true, $ = $.slice(1));
    let z = (I) => {
      let L = Hi(I), j = [], A = "", Q = 0;
      for (let T = 0; T < L.length; T++) {
        let N = L[T];
        if (N === "\\") {
          A += N + L[++T];
          continue;
        }
        !Q && N === "," ? (j.push(A), A = "") : (A += N, Q && N === ")" ? Q-- : N === "(" && Q++);
      }
      return A && j.push(A), j;
    };
    this.prefixSelectors = M ? z(M) : [""];
    let O = $.split("@"), F = O[0];
    if (F) {
      this.vendorSuffixSelectors = {};
      let I = (T, N, C, _) => {
        for (let [W, P] of N)
          if (W.test(T)) {
            for (let q of P)
              I(T.replace(W, q), N, C, true);
            return;
          }
        _ && C.push(T);
      }, L = [];
      "" in b ? I(F, b[""], L, true) : L.push(F);
      let j = {};
      for (let [T, N] of Object.entries(b)) {
        if (!T)
          continue;
        let C = [];
        for (let _ of L)
          I(_, N, C, false);
        C.length && (j[T] = C);
      }
      let A = (T, N) => {
        let C = N.reduce((_, W) => (_.push(...z(W)), _), []);
        T in this.vendorSuffixSelectors ? this.vendorSuffixSelectors[T].push(...C) : this.vendorSuffixSelectors[T] = C;
      }, Q = Object.keys(j);
      if (Q.length)
        for (let T of Q)
          A(T, j[T]);
      else
        A("", L);
      for (let T of Object.values(this.vendorSuffixSelectors))
        for (let N of T) {
          this.hasWhere !== false && (this.hasWhere = N.includes(":where("));
          for (let C = 0; C < bi.length; C++)
            if (N.includes(bi[C])) {
              (this.priority === -1 || this.priority > C) && (this.priority = C);
              break;
            }
        }
    } else
      this.vendorSuffixSelectors = { "": [""] };
    for (let I = 1; I < O.length; I++) {
      let L = O[I];
      if (L)
        if (a.includes(L))
          this.theme = L;
        else if (L === "rtl" || L === "ltr")
          this.direction = L;
        else {
          let j, A, Q = L.indexOf("_");
          if (Q !== -1)
            j = L.slice(0, Q), A = L.slice(Q);
          else {
            let T = L.indexOf("(");
            T !== -1 && (j = L.slice(0, T), A = L.slice(T));
          }
          if (!j) {
            j = "media";
            let T = [];
            this.media = { token: L, features: {} };
            let N = L.split("&");
            for (let C of N)
              if (C === "all" || C === "print" || C === "screen" || C === "speech")
                this.media.type = C;
              else if (C === "\u{1F5A8}")
                this.media.type = "print";
              else if (C === "landscape" || C === "portrait")
                T.push("(orientation:" + C + ")");
              else if (C === li || C === Ri)
                T.push("(prefers-" + Ri + ":" + (C === li ? "no-preference" : wi) + ")");
              else if (y && C in y)
                T.push(y[C]);
              else {
                let _ = { token: C }, W = "", P = "", q = 0;
                C.startsWith("<=") ? (P = "<=", W = ni) : C.startsWith(">=") || S[C] ? (P = ">=", W = ai) : C.startsWith(">") ? (P = ">", W = ai, q = 0.02) : C.startsWith("<") && (P = "<", W = ni, q = -0.02);
                let Z = P ? C.replace(P, "") : C, D = S[Z];
                switch (W) {
                  case ni:
                  case ai:
                    D ? Object.assign(_, Xs(D, ci)) : Object.assign(_, Xs(Z, ci)), _.unit === ci && (_.value += q), this.media.features[W] = _, T.push("(" + W + ":" + (_.value + _.unit) + ")");
                    break;
                }
              }
            A = "", this.media.type && (A = this.media.type), T.length && (A += (A ? " and " : "") + T.join(" and "));
          }
          A && (this.at[j] = (j in this.at ? this.at[j] + " and " : "") + A.replace(/_/g, " "));
        }
    }
    this.order === void 0 && (this.order = 0);
    let Fe = (I, L) => {
      let j, A, Q = (N, C, _) => {
        let W = "";
        this.direction && (W += "[dir=" + this.direction + "] ");
        let P = this.prefixSelectors.map((D) => D + W), q = (D, Us) => P.map((K) => (D ? "." + D + " " : "") + (u ? u + " " : "") + K).reduce((K, ii) => (K.push(_.reduce((mi, ji) => (mi.push(ii + "." + CSS.escape(Us) + ji), mi), []).join(",")), K), []).join(","), Z = q(C, s) + (g ? Object.entries(g).filter(([D]) => this.theme || !c || !C || !D || D === C).map(([D, Us]) => Us.reduce((K, ii) => K + "," + q(this.theme ?? ((c || this.getThemeProps) && C || D), ii), "")).join("") : "") + "{" + N + "}";
        for (let D of Object.keys(this.at).sort((Us, K) => K === "supports" ? -1 : 1))
          Z = "@" + D + " " + this.at[D] + "{" + Z + "}";
        return Z;
      }, T = [];
      if (E) {
        let N, C;
        for (let _ of E)
          typeof _ == "string" ? T.push(_) : (N = Xs(_.value, d, c && m, c && R, v, this.theme ? [this.theme, ""] : [I]), N.colorMatched !== void 0 && C !== true && (C = N.colorMatched), T.push(N.value + N.unit));
        if (L && (C === void 0 ? I : !C))
          return;
        if (T.length === 1 ? N ? (j = N.value, A = N.unit) : j = T[0] : j = T.reduce((_, W, P) => _ + W + (W === "," || E[P + 1] === "," || P === E.length - 1 ? "" : " "), ""), typeof j != "object") {
          this.parseValue && (j = this.parseValue(j, this.css.config)), c && j === "current" && (j = "currentColor");
          let _ = { unit: A, value: j, important: this.important };
          if (this.getThemeProps) {
            let W = this.getThemeProps(_, o);
            for (let P in W)
              for (let q of Object.values(this.vendorSuffixSelectors))
                this.natives.push({ unit: A, value: j, text: Q(Object.entries(W[P]).map(([Z, D]) => Bs(Z, { important: (this.important || f) && !D.endsWith("!important"), unit: "", value: D })).join(";"), P, q), theme: P });
            return;
          } else
            this.get && (j = this.get(_));
        }
      } else
        j = w;
      for (let N of Object.values(this.vendorSuffixSelectors))
        this.natives.push({ unit: A, value: j, text: Q(typeof j == "object" ? Object.entries(j).map(([C, _]) => Bs(C, { ...typeof _ == "object" ? _ : { unit: "", value: _ }, important: this.important || f })).join(";") : Bs(h, { unit: A, value: j, important: this.important || f }), I, N), theme: I });
    };
    if (this.getThemeProps)
      Fe(void 0, false);
    else if (this.theme)
      Fe(this.theme, false);
    else if (c)
      for (let I of a)
        Fe(I, true);
    else
      Fe("", false);
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
  static match(s, i, o, n) {
    let { colorStarts: l, symbol: d, prop: c } = this;
    if (i && i.test(s))
      return { origin: Jr };
    if (l) {
      if (s.match("^" + l + "(?:(?:#|(rgb|hsl)\\(.*\\))((?!\\|).)*$|(?:transparent|current|inherit))"))
        return { origin: Jr };
      if (n.length && s.indexOf("|") === -1) {
        let h = s.match("^" + l + "((?:" + n.join("|") + ")[0-9a-zA-Z-]*)");
        if (h && h[1] in o)
          return { origin: Jr };
      }
    }
    if (d && s.startsWith(d))
      return { origin: yi };
    if (c && s.startsWith(c + ":"))
      return { origin: Jr };
  }
  get text() {
    return this.natives.map((s) => s.text).join("");
  }
};
e(t, "id"), e(t, "matches"), e(t, "colorStarts"), e(t, "symbol"), e(t, "unit", Ui), e(t, "colorful");
var di = { store: "theme" };
var Mi = typeof window < "u";
var qs = class {
  constructor(s = typeof document < "u" ? document.documentElement : null, i) {
    this.host = s;
    this.options = i;
    this.options = Y(di, i), this.options.store && this.storage ? this.syncWithStorage() : this.options.default && this.set(this.options.default, { emit: false, store: false });
  }
  darkMQL = Mi ? window.matchMedia?.("(prefers-color-scheme:dark)") : void 0;
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
    if (Mi && this.options.store) {
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
      let o = String(i), n = o.length, l = -1, d = "", c, h = o.charCodeAt(0);
      if (n == 1 && h == 45)
        return "\\" + o;
      for (; ++l < n; ) {
        if (c = o.charCodeAt(l), c == 0) {
          d += "\uFFFD";
          continue;
        }
        if (c >= 1 && c <= 31 || c == 127 || l == 0 && c >= 48 && c <= 57 || l == 1 && c >= 48 && c <= 57 && h == 45) {
          d += "\\" + c.toString(16) + " ";
          continue;
        }
        if (c >= 128 || c == 45 || c == 95 || c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122) {
          d += o.charAt(l);
          continue;
        }
        d += "\\" + o.charAt(l);
      }
      return d;
    };
    r.CSS || (r.CSS = {}), r.CSS.escape = s;
  }
})();
function Gr(r) {
  r.startsWith("#") && (r = r.slice(1));
  let s = r.match(/.{1,2}/g);
  return [parseInt(s[0], 16), parseInt(s[1], 16), parseInt(s[2], 16)];
}
function V(r) {
  typeof r == "string" && (r = { "": r });
  let s = "" in r, i = false;
  for (let o in r)
    if (o && +o >= 100) {
      i = true;
      break;
    }
  if (!i && (!s || Object.keys(r).length > 1)) {
    let o = 0, n = "0" in r ? Gr(r[0]) : [0, 0, 0], l, d, c = [], h = () => {
      let v = l - o, u = d.map((f, a) => (f - n[a]) / v);
      for (let f of c) {
        let a = f - o, m = n.map((R, b) => Math.round(R + u[b] * a));
        r[f] = "#" + Qs.call(this, ...m);
      }
    };
    for (let v = 1; v < 100; v++)
      v in r ? (c.length ? (l = v, d = Gr(r[v]), h(), c.length = 0, n = d) : n = Gr(r[v]), o = v) : c.push(v);
    c.length && (l = 100, d = "100" in r ? Gr(r[100]) : [255, 255, 255], h());
  }
  return s || (r[""] = r[i ? "500" : "50"]), r;
}
var Kr = {};
Li(Kr, { Rules: () => to, breakpoints: () => Zs, colors: () => qi, important: () => fy, observe: () => ly, override: () => ay, rootSize: () => en, scope: () => Bi, selectors: () => Yi, semantics: () => Xi, theme: () => di, themes: () => Zi, values: () => Ki });
var Zs = { "3xs": 360, "2xs": 480, xs: 600, sm: 768, md: 1024, lg: 1280, xl: 1440, "2xl": 1600, "3xl": 1920, "4xl": 2560 };
var qi = { slate: V({ 5: "#141e2b", 10: "#19212d", 20: "#262f3e", 30: "#323e52", 40: "#41516b", 50: "#616a84", 55: "#6c7693", 60: "#959db3", 70: "#a3abbf", 80: "#d7dae3", 95: "#f6f7f8" }), gray: V({ 5: "#1e1d1f", 10: "#212022", 20: "#2f2e30", 30: "#3e3d40", 40: "#504f52", 50: "#6b6a6d", 55: "#777679", 60: "#9e9da0", 70: "#abaaae", 80: "#dad9db", 95: "#f5f4f7" }), brown: V({ 5: "#271b15", 10: "#2b1e18", 20: "#3c2b22", 30: "#50382c", 40: "#694839", 50: "#8d604b", 55: "#9d6b53", 60: "#b79788", 70: "#c1a598", 80: "#efd5c9", 95: "#faf2ef" }), orange: V({ 5: "#2e1907", 10: "#331b07", 20: "#47260b", 30: "#5d320e", 40: "#7a4111", 50: "#a15717", 55: "#b4611a", 60: "#e38739", 70: "#e79855", 80: "#f7d4b5", 95: "#fcf1e7" }), gold: V({ 5: "#281b00", 10: "#2d1e01", 20: "#3f2a00", 30: "#543800", 40: "#6d4900", 50: "#906000", 55: "#9c6d00", 60: "#d09100", 70: "#dca000", 80: "#fbd67f", 95: "#fff3d8" }), yellow: V({ 5: "#251d00", 10: "#282000", 20: "#3a2e01", 30: "#4b3b00", 40: "#624e00", 50: "#806700", 55: "#8e7200", 60: "#be9900", 70: "#d0a700", 80: "#edda8f", 95: "#fff5ca" }), grass: V({ 5: "#162106", 10: "#182406", 20: "#223308", 30: "#2c4408", 40: "#3a570b", 50: "#4e750e", 60: "#74ae15", 70: "#7dbc17", 80: "#bfe87c", 95: "#ebfad4" }), green: V({ 5: "#042311", 10: "#032611", 20: "#023717", 30: "#03481f", 40: "#025d26", 50: "#067b34", 55: "#07883a", 60: "#09b64d", 70: "#0ac553", 80: "#80f1a4", 95: "#e0fae8" }), beryl: V({ 5: "#002319", 10: "#00271c", 20: "#003626", 30: "#004732", 40: "#005c41", 50: "#007954", 55: "#00875e", 60: "#00b37c", 70: "#00c387", 80: "#72f0c5", 95: "#d6fcef" }), teal: V({ 5: "#012220", 10: "#012624", 20: "#003532", 30: "#004541", 40: "#005a54", 50: "#00776f", 55: "#00857c", 60: "#00b1a5", 70: "#00bfb2", 80: "#6aeee5", 95: "#d4fcf8" }), cyan: V({ 5: "#00222b", 10: "#00252e", 20: "#013340", 30: "#004457", 40: "#00576f", 50: "#007391", 55: "#0080a1", 60: "#00abd7", 70: "#00b9e9", 80: "#97e6fa", 95: "#dff8ff" }), sky: V({ 5: "#031f34", 10: "#032339", 20: "#04314e", 30: "#044169", 40: "#065386", 50: "#086eb3", 55: "#097ac5", 60: "#29a4f5", 70: "#4db3f7", 80: "#b3e0ff", 95: "#eaf6fe" }), blue: V({ 5: "#07194a", 10: "#081c53", 20: "#0a2773", 30: "#0e3496", 40: "#1146b6", 50: "#175fe9", 55: "#2671ea", 60: "#6b9ef1", 70: "#81acf3", 80: "#c6dbfe", 95: "#edf4fe" }), indigo: V({ 5: "#1f1645", 10: "#20174f", 20: "#2b1f74", 30: "#37289d", 40: "#463fb1", 50: "#5a5bd5", 55: "#6464f1", 60: "#9393f5", 70: "#a1a5ee", 80: "#d5d7fe", 95: "#f1f2ff" }), violet: V({ 5: "#2b0a4e", 10: "#2e0b57", 20: "#3d1179", 30: "#4e169f", 40: "#5f2eba", 50: "#7949e5", 55: "#8755f5", 60: "#ac8af8", 70: "#b89bf9", 80: "#e1d4fe", 95: "#f5f1ff" }), purple: V({ 5: "#2e0c47", 10: "#330c4e", 20: "#460f6c", 30: "#5b1390", 40: "#7421b1", 50: "#9832e4", 55: "#a348e7", 60: "#c184ef", 70: "#ca96f1", 80: "#ead1fe", 95: "#f9f0ff" }), fuchsia: V({ 5: "#39092a", 10: "#400932", 20: "#560d4a", 30: "#6f1165", 40: "#8c158a", 50: "#b61cbb", 55: "#ca1fce", 60: "#e66ee9", 70: "#ea86ed", 80: "#facbfb", 95: "#feefff" }), pink: V({ 5: "#3d0722", 10: "#430725", 20: "#5d0933", 30: "#790d44", 40: "#9a1058", 50: "#ca1473", 55: "#e11681", 60: "#f170b4", 70: "#f388c0", 80: "#fdcde6", 95: "#fff0f8" }), crimson: V({ 5: "#430213", 10: "#470314", 20: "#62041c", 30: "#800524", 40: "#9f1036", 50: "#ce1a4b", 55: "#e8144c", 60: "#f37596", 70: "#f58ba7", 80: "#fdceda", 95: "#fff1f4" }), red: V({ 5: "#450001", 10: "#490102", 20: "#640304", 30: "#800506", 40: "#a11012", 50: "#d11a1e", 55: "#ed0a0e", 60: "#f97476", 70: "#fa8b8d", 80: "#fdcfcf", 95: "#fff1f1" }), black: "#000000", white: "#ffffff" };
var en = 16;
var Bi = "";
var Yi = { "::scrollbar": "::-webkit-scrollbar", "::scrollbar-button": "::-webkit-scrollbar-button", "::scrollbar-thumb": "::-webkit-scrollbar-thumb", "::scrollbar-track": "::-webkit-scrollbar-track", "::scrollbar-track-piece": "::-webkit-scrollbar-track-piece", "::scrollbar-corner": "::-webkit-scrollbar-corner", "::slider-thumb": ["::-webkit-slider-thumb", "::-moz-range-thumb"], "::slider-runnable-track": ["::-webkit-slider-runnable-track", "::-moz-range-track"], "::meter": "::-webkit-meter", "::resizer": "::-webkit-resizer", "::progress": "::-webkit-progress", ":first": ":first-child", ":last": ":last-child", ":even": ":nth-child(2n)", ":odd": ":nth-child(odd)", ":nth(": ":nth-child(" };
var Xi = { square: { "aspect-ratio": "1/1" }, video: { "aspect-ratio": "16/9" }, rounded: { "border-radius": "1e9em" }, round: { "border-radius": "50%" }, hidden: { display: "none" }, hide: { display: "none" }, block: { display: "block" }, table: { display: "table" }, flex: { display: "flex" }, grid: { display: "grid" }, contents: { display: "contents" }, inline: { display: "inline" }, "inline-block": { display: "inline-block" }, "inline-flex": { display: "inline-flex" }, "inline-grid": { display: "inline-grid" }, "inline-table": { display: "inline-table" }, "table-cell": { display: "table-cell" }, "table-caption": { display: "table-caption" }, "flow-root": { display: "flow-root" }, "list-item": { display: "list-item" }, "table-row": { display: "table-row" }, "table-column": { display: "table-column" }, "table-row-group": { display: "table-row-group" }, "table-column-group": { display: "table-column-group" }, "table-header-group": { display: "table-header-group" }, "table-footer-group": { display: "table-footer-group" }, italic: { "font-style": "italic" }, oblique: { "font-style": "oblique" }, isolate: { isolation: "isolate" }, overflow: { overflow: "visible" }, untouchable: { "pointer-events": "none" }, static: { position: "static" }, fixed: { position: "fixed" }, abs: { position: "absolute" }, rel: { position: "relative" }, sticky: { position: "sticky" }, uppercase: { "text-transform": "uppercase" }, lowercase: { "text-transform": "lowercase" }, capitalize: { "text-transform": "capitalize" }, visible: { visibility: "visible" }, invisible: { visibility: "hidden" }, vw: { width: "100vw" }, vh: { height: "100vh" }, "max-vw": { "max-width": "100vw" }, "max-vh": { "max-height": "100vh" }, "min-vw": { "min-width": "100vw" }, "min-vh": { "min-height": "100vh" }, "center-content": { "justify-content": "center", "align-items": "center" }, "sr-only": { position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", "white-space": "nowrap", "border-width": "0" }, full: { width: "100%", height: "100%" }, center: { left: 0, right: 0, "margin-left": "auto", "margin-right": "auto" }, middle: { top: 0, bottom: 0, "margin-top": "auto", "margin-bottom": "auto" }, "break-spaces": { "white-space": "break-spaces" }, "break-word": { "overflow-wrap": "break-word", overflow: "hidden" } };
var Zi = ["dark", "light"];
var es = { content: "content-box", border: "border-box", padding: "padding-box" };
var Ks = { min: "min-content", max: "max-content" };
var J = { full: "100%", fit: "fit-content", max: "max-content", min: "min-content" };
for (let r in Zs)
  J[r] = Zs[r] / 16 + "rem";
var Ki = { BackgroundClip: es, BackgroundOrigin: es, BoxSizing: { content: "content-box", border: "border-box" }, ClipPath: { ...es, margin: "margin-box", fill: "fill-box", stroke: "stroke-box", view: "view-box" }, FlexDirection: { col: "column", "col-reverse": "column-reverse" }, FontFamily: { mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace", sans: "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji", serif: "ui-serif,Georgia,Cambria,Times New Roman,Times,serif" }, FontWeight: { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, heavy: 900 }, GridAutoColumns: Ks, GridAutoRows: Ks, GridTemplateColumns: Ks, GridTemplateRows: Ks, Order: { first: -999999, last: 999999 }, Position: { abs: "absolute", rel: "relative" }, ShapeOutside: { ...es, margin: "margin-box" }, TransformBox: { ...es, fill: "fill-box", stroke: "stroke-box", view: "view-box" }, Width: J, MinWidth: J, MinHeight: J, MaxWidth: J, MaxHeight: J, Height: J, FlexBasis: J };
var oe = class extends t {
};
e(oe, "id", "FontWeight"), e(oe, "matches", "^f(?:ont)?:(?:bolder|$values)(?!\\|)"), e(oe, "unit", "");
var Be = class extends t {
};
e(Be, "id", "FontFamily"), e(Be, "matches", "^f(?:ont)?:(?:$values)(?!\\|)");
var Ye = class extends t {
};
e(Ye, "id", "FontSize"), e(Ye, "matches", "^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Xe = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    let o = this.prefix[0] === "m" ? "margin" : "padding", n = o + "-left", l = o + "-right", d = o + "-top", c = o + "-bottom";
    switch (this.prefix[1]) {
      case "x":
        return { [n]: s, [l]: s };
      case "y":
        return { [d]: s, [c]: s };
      case "l":
        return { [n]: s };
      case "r":
        return { [l]: s };
      case "t":
        return { [d]: s };
      case "b":
        return { [c]: s };
      default:
        return { [o]: s };
    }
  }
  get order() {
    return this.prefix === "p:" || this.prefix === "m:" ? -1 : 0;
  }
};
e(Xe, "id", "Spacing"), e(Xe, "matches", "^[pm][xytblr]?:.");
var Ze = class extends t {
};
e(Ze, "id", "Width"), e(Ze, "matches", "^w:.");
var Ke = class extends t {
};
e(Ke, "id", "Height"), e(Ke, "matches", "^h:.");
var Je = class extends t {
};
e(Je, "id", "MinWidth"), e(Je, "matches", "^min-w:.");
var Ge = class extends t {
};
e(Ge, "id", "MinHeight"), e(Ge, "matches", "^min-h:.");
var ne = class extends t {
};
e(ne, "id", "LetterSpacing"), e(ne, "matches", "^ls:."), e(ne, "unit", "em");
var Ji = "subpixel-antialiased";
var Ti = "-webkit-font-smoothing";
var Oi = "-moz-osx-font-smoothing";
var ae = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    let i = {};
    switch (s.value) {
      case Ji:
        i[Ti] = i[Oi] = { ...s, value: "auto" };
        break;
      case "antialiased":
        i[Ti] = { ...s, value: "antialiased" }, i[Oi] = { ...s, value: "grayscale" };
        break;
    }
    return i;
  }
};
e(ae, "id", "FontSmoothing"), e(ae, "matches", "^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)"), e(ae, "unit", "");
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
var st = class extends t {
};
e(st, "id", "ObjectPosition"), e(st, "matches", "^(?:object|obj):(?:top|bottom|right|left|center|$values)");
var it = class extends t {
};
e(it, "id", "TextAlign"), e(it, "matches", "^t(?:ext)?:(?:justify|center|left|right|start|end|$values)(?!\\|)");
var de = class extends t {
  order = -1;
};
e(de, "id", "TextDecoration"), e(de, "matches", "^t(?:ext)?:(?:underline|line-through|overline|$values)"), e(de, "colorful", true);
var ot = class extends t {
};
e(ot, "id", "TextTransform"), e(ot, "matches", "^t(?:ext)?:(?:uppercase|lowercase|capitalize|$values)(?!\\|)");
var nt = class extends t {
};
e(nt, "id", "VerticalAlign"), e(nt, "matches", "^(?:v|vertical):.");
var fe = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { overflow: { ...s, value: "hidden" }, display: { ...s, value: "-webkit-box" }, "overflow-wrap": { ...s, value: "break-word" }, "text-overflow": { ...s, value: "ellipsis" }, "-webkit-box-orient": { ...s, value: "vertical" }, "-webkit-line-clamp": s };
  }
};
e(fe, "id", "Lines"), e(fe, "matches", "^lines:."), e(fe, "unit", "");
var me = class extends t {
};
e(me, "id", "TransformOrigin"), e(me, "matches", "^transform:(?:top|bottom|right|left|center|[0-9]|$values)"), e(me, "unit", "px");
var at = class extends t {
};
e(at, "id", "TransformStyle"), e(at, "matches", "^transform:(?:flat|preserve-3d|$values)(?!\\|)");
var ct = class extends t {
};
e(ct, "id", "TransformBox"), e(ct, "matches", "^transform:(?:$values)(?!\\|)");
var ue = class extends t {
  parseValue(s, { rootSize: i }) {
    return s.replace(/(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g, (o, n, l, d) => {
      let c, h;
      switch (n) {
        case "translate":
          c = "rem";
          break;
        case "skew":
          c = "deg";
          break;
        case "rotate":
          l === "3d" && (h = true), c = "deg";
          break;
        default:
          return o;
      }
      let v = d.split(",");
      return o.replace(d, v.map((u, f) => !h || v.length - 1 === f ? Number.isNaN(+u) ? u : u / (c === "rem" ? i : 1) + c : u).join(","));
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
var vt = class extends t {
};
e(vt, "id", "Opacity"), e(vt, "unit", "");
var ts = class extends t {
};
e(ts, "id", "Visibility");
var rs = class extends t {
};
e(rs, "id", "Clear");
var ss = class extends t {
};
e(ss, "id", "Float");
var is = class extends t {
};
e(is, "id", "Isolation");
var gt = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    if (this.prefix)
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "overflow-x": s };
        case "y":
          return { "overflow-y": s };
      }
    return { overflow: s };
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
e(gt, "id", "Overflow"), e(gt, "matches", "^overflow(?:-x|-y)?:(?:visible|overlay|hidden|scroll|auto|clip|inherit|initial|revert|revert-layer|unset|\\$|var|$values)");
var xt = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    switch (this.prefix.slice(-2, -1)) {
      case "x":
        return { "overscroll-behavior-x": s };
      case "y":
        return { "overscroll-behavior-y": s };
      default:
        return { "overscroll-behavior": s };
    }
  }
};
e(xt, "id", "OverscrollBehavior"), e(xt, "matches", "^overscroll-behavior(?:-[xy])?:");
var ve = class extends t {
};
e(ve, "id", "ZIndex"), e(ve, "matches", "^z:."), e(ve, "unit", "");
var ge = class extends t {
};
e(ge, "id", "AnimationDelay"), e(ge, "matches", "^@delay:."), e(ge, "unit", "ms");
var bt = class extends t {
};
e(bt, "id", "AnimationDirection"), e(bt, "matches", "^@direction:.");
var yt = class extends t {
};
e(yt, "id", "AnimationFillMode"), e(yt, "matches", "^@fill-mode:.");
var xe = class extends t {
};
e(xe, "id", "AnimationIterationCount"), e(xe, "matches", "^@iteration-count:."), e(xe, "unit", "");
var Rt = class extends t {
};
e(Rt, "id", "AnimationName"), e(Rt, "matches", "^@name:.");
var kt = class extends t {
};
e(kt, "id", "AnimationPlayState"), e(kt, "matches", "^@play-state:.");
var wt = class extends t {
};
e(wt, "id", "AnimationTimingFunction"), e(wt, "matches", "^@easing:.");
var be = class extends t {
  order = -1;
};
e(be, "id", "Animation"), e(be, "symbol", "@"), e(be, "unit", "");
var Js = "border-";
function G(r, s, i = "") {
  i && (i = "-" + i);
  let o = /^b(order)?-?(.)?/.exec(r)[2], n = Js + "left" + i, l = Js + "right" + i, d = Js + "top" + i, c = Js + "bottom" + i;
  switch (o) {
    case "x":
      return { [n]: s, [l]: s };
    case "y":
      return { [d]: s, [c]: s };
    case "l":
      return { [n]: s };
    case "r":
      return { [l]: s };
    case "t":
      return { [d]: s };
    case "b":
      return { [c]: s };
    default:
      return { ["border" + i]: s };
  }
}
var ee = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return G(this.prefix, s, "color");
  }
  get order() {
    return this.prefix === "border-color:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(ee, "id", "BorderColor"), e(ee, "matches", "^border(?:-(?:left|right|top|bottom))?-color:."), e(ee, "colorStarts", "b(?:[xytblr]|(?:order(?:-(?:left|right|top|bottom))?))?:"), e(ee, "colorful", true);
var Gs = "border-top-left-radius";
var ei = "border-top-right-radius";
var ti = "border-bottom-left-radius";
var ri = "border-bottom-right-radius";
var $i = "border-radius";
var Gi = [Gs, ei, ti, ri];
var Mt = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    if (this.prefix) {
      let o = "", n = this.prefix.split("-");
      if (n.length > 1)
        for (let l = 1; l < n.length - 1; l++)
          o += n[l][0];
      else
        o = this.prefix.slice(1, -1);
      switch (o) {
        case "t":
          return { [Gs]: s, [ei]: s };
        case "tl":
        case "lt":
          return { [Gs]: s };
        case "rt":
        case "tr":
          return { [ei]: s };
        case "b":
          return { [ti]: s, [ri]: s };
        case "bl":
        case "lb":
          return { [ti]: s };
        case "br":
        case "rb":
          return { [ri]: s };
        case "l":
          return { [Gs]: s, [ti]: s };
        case "r":
          return { [ei]: s, [ri]: s };
        default:
          return { [$i]: s };
      }
    }
    let i = this.prefix?.slice(0, -1);
    return { [Gi.includes(i) ? i : $i]: s };
  }
  get order() {
    return this.prefix === "border-radius:" || this.prefix === "r:" ? -1 : 0;
  }
};
e(Mt, "id", "BorderRadius"), e(Mt, "matches", "^(?:r[tblr]?[tblr]?|border(?:-(?:top|bottom)-(?:left|right))?-radius):.");
var St = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return G(this.prefix, s, "style");
  }
  get order() {
    return this.prefix === "border-style:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(St, "id", "BorderStyle"), e(St, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-style:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|))");
var Ct = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return G(this.prefix, s, "width");
  }
  get order() {
    return this.prefix === "border-width:" || this.prefix === "b:" || this.prefix === "border:" ? -1 : 0;
  }
};
e(Ct, "id", "BorderWidth"), e(Ct, "matches", "^(?:border(?:-(?:left|right|top|bottom))?-width:.|b(?:[xytblr]|order(?:-(?:left|right|top|bottom))?)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$)");
var ye = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return G(this.prefix, s);
  }
  get order() {
    return this.prefix === "border:" || this.prefix === "b:" ? -2 : -1;
  }
};
e(ye, "id", "Border"), e(ye, "matches", "^b(?:[xytblr]?|order(?:-(?:left|right|top|bottom))?):."), e(ye, "colorful", true);
var Tt = class extends t {
};
e(Tt, "id", "BackgroundAttachment"), e(Tt, "matches", "^(?:bg|background):(?:fixed|local|scroll|$values)(?!\\|)");
var os = class extends t {
};
e(os, "id", "BackgroundBlendMode");
var Ot = class extends t {
  get(s) {
    return { "-webkit-background-clip": s, "background-clip": s };
  }
};
e(Ot, "id", "BackgroundClip"), e(Ot, "matches", "^(?:bg|background):(?:text|$values)(?!\\|)");
var te = class extends t {
};
e(te, "id", "BackgroundColor"), e(te, "colorStarts", "(?:bg|background):"), e(te, "unit", ""), e(te, "colorful", true);
var $t = class extends t {
};
e($t, "id", "BackgroundOrigin"), e($t, "matches", "^(?:bg|background):(?:$values)(?!\\|)");
var Re = class extends t {
};
e(Re, "id", "BackgroundPosition"), e(Re, "matches", "^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)"), e(Re, "unit", "px");
var Et = class extends t {
};
e(Et, "id", "BackgroundRepeat"), e(Et, "matches", "^(?:bg|background):(?:space|round|repeat|no-repeat|repeat-x|repeat-y|$values)(?![|a-zA-Z])");
var jt = class extends t {
};
e(jt, "id", "BackgroundSize"), e(jt, "matches", "^(?:bg|background):(?:\\.?\\[0-9]+|auto|cover|contain|$values)(?!\\|)");
var ke = class extends t {
};
e(ke, "id", "BackgroundImage"), e(ke, "matches", "^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)"), e(ke, "colorful", true);
var we = class extends t {
  order = -1;
};
e(we, "id", "Background"), e(we, "matches", "^bg:."), e(we, "colorful", true);
var Nt = class extends t {
};
e(Nt, "id", "MixBlendMode"), e(Nt, "matches", "^blend:.");
var ns = class extends t {
};
e(ns, "id", "Position");
function si(r, s, { rootSize: i }) {
  let o = "", n = 0;
  return function l(d, c) {
    let h = "", v = c ? s(c) : "", u = () => {
      h && (o += !v || Number.isNaN(+h) ? h : +h / (v === "rem" ? i : 1) + v, h = "");
    };
    for (; n < r.length; n++) {
      let f = r[n];
      if (f === d && (d !== "'" || r[n + 1] === ")")) {
        u(), o += f;
        break;
      } else
        f === "," || f === " " ? (u(), o += f) : !h && f === "'" ? (o += f, n++, l(f), h = "") : h && f === "(" ? (o += h + f, n++, l(")", h), h = "") : h += f;
    }
    u();
  }(), o;
}
var Me = class extends t {
  get(s) {
    return { "backdrop-filter": s, "-webkit-backdrop-filter": s };
  }
  parseValue(s, i) {
    return si(s, (o) => {
      switch (o) {
        case "blur":
        case "drop-shadow":
          return "rem";
        case "hue-rotate":
          return "deg";
      }
      return "";
    }, i);
  }
};
e(Me, "id", "BackdropFilter"), e(Me, "matches", "^bd:."), e(Me, "colorful", true);
var Se = class extends t {
};
e(Se, "id", "Fill"), e(Se, "colorStarts", "fill:"), e(Se, "colorful", true);
var Lt = class extends t {
};
e(Lt, "id", "Stroke"), e(Lt, "colorful", true);
var _t = class extends t {
};
e(_t, "id", "StrokeWidth"), e(_t, "matches", "^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Ce = class extends t {
  parseValue(s, i) {
    return si(s, (o) => {
      switch (o) {
        case "blur":
        case "drop-shadow":
          return "rem";
        case "hue-rotate":
          return "deg";
      }
      return "";
    }, i);
  }
};
e(Ce, "id", "Filter"), e(Ce, "matches", "^(?:blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\\("), e(Ce, "colorful", true);
var as = class extends t {
};
e(as, "id", "Cursor");
var cs = class extends t {
};
e(cs, "id", "PointerEvents");
var ls = class extends t {
};
e(ls, "id", "Resize");
var ds = class extends t {
};
e(ds, "id", "TouchAction");
var fs = class extends t {
  get(s) {
    return { "user-drag": s, "-webkit-user-drag": s };
  }
};
e(fs, "id", "UserDrag");
var ms = class extends t {
  get(s) {
    return { "user-select": s, "-webkit-user-select": s };
  }
};
e(ms, "id", "UserSelect");
var Te = class extends t {
};
e(Te, "id", "BoxShadow"), e(Te, "matches", "^s(?:hadow)?:."), e(Te, "colorful", true);
var zt = class extends t {
};
e(zt, "id", "TextShadow"), e(zt, "colorful", true);
var Ei = 0.75;
var At = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    let { unit: i, value: o } = s;
    return { "font-size": s, "line-height": { ...s, value: i === "em" ? o + Ei + i : `calc(${o}${i} + ${Ei}em)`, unit: "" } };
  }
};
e(At, "id", "TextSize"), e(At, "matches", "^t(?:ext)?:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var It = class extends t {
};
e(It, "id", "WordBreak"), e(It, "unit", "");
var Oe = class extends t {
  get(s) {
    return { display: { ...s, value: "grid" }, "grid-template-columns": { ...this, value: "repeat(" + s.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(Oe, "id", "GridColumns"), e(Oe, "matches", "^grid-cols:."), e(Oe, "unit", "");
var Wt = class extends t {
  get(s) {
    return { display: { ...s, value: "grid" }, "grid-auto-flow": { ...s, value: "column" }, "grid-template-rows": { ...s, value: "repeat(" + s.value + ",minmax(" + 0 + "," + 1 + "fr))" } };
  }
};
e(Wt, "id", "GridRows"), e(Wt, "unit", "");
var Vt = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    switch (this.prefix[4]) {
      case "x":
        return { "column-gap": s };
      case "y":
        return { "row-gap": s };
      default:
        return { gap: s };
    }
  }
  order = -1;
};
e(Vt, "id", "Gap"), e(Vt, "matches", "^gap(?:-x|-y)?:.");
var Dt = class extends t {
};
e(Dt, "id", "WordSpacing"), e(Dt, "unit", "em");
var $e = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { ["--" + this.prefix.slice(1, -1)]: s };
  }
};
e($e, "id", "Variable"), e($e, "matches", "^\\$[^ (){}A-Z]+:[^ ]"), e($e, "unit", "");
var Ee = class extends t {
};
e(Ee, "id", "AspectRatio"), e(Ee, "matches", "^aspect:."), e(Ee, "unit", "");
var Pt = class extends t {
  get(s) {
    return { "box-decoration-break": s, "-webkit-box-decoration-break": s };
  }
};
e(Pt, "id", "BoxDecorationBreak"), e(Pt, "matches", "^box:(?:slice|clone|$values)(?!\\|)");
var us = class extends t {
};
e(us, "id", "BreakAfter");
var ps = class extends t {
};
e(ps, "id", "BreakBefore");
var hs = class extends t {
};
e(hs, "id", "BreakInside");
var Ut = class extends t {
};
e(Ut, "id", "FlexShrink"), e(Ut, "unit", "");
var Qt = class extends t {
};
e(Qt, "id", "FlexDirection"), e(Qt, "matches", "^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)");
var Ht = class extends t {
};
e(Ht, "id", "FlexGrow"), e(Ht, "unit", "");
var Ft = class extends t {
};
e(Ft, "id", "FlexWrap"), e(Ft, "matches", "^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)");
var vs = class extends t {
};
e(vs, "id", "FlexBasis");
var qt = class extends t {
  order = -1;
};
e(qt, "id", "Flex"), e(qt, "unit", "");
var je = class extends t {
};
e(je, "id", "Order"), e(je, "matches", "^o:."), e(je, "unit", "");
var Ne = class extends t {
  parseValue(s) {
    return this.prefix.slice(-5, -1) === "span" && s !== "auto" ? "span " + s + "/span " + s : s;
  }
  order = -1;
};
e(Ne, "id", "GridColumn"), e(Ne, "matches", "^grid-col(?:umn)?(?:-span)?:."), e(Ne, "unit", "");
var Bt = class extends t {
};
e(Bt, "id", "ColumnSpan"), e(Bt, "matches", "^col-span:.");
var Le = class extends t {
  parseValue(s) {
    return this.prefix.slice(-5, -1) === "span" && s !== "auto" ? "span " + s + "/span " + s : s;
  }
  order = -1;
};
e(Le, "id", "GridRow"), e(Le, "matches", "^grid-row-span:."), e(Le, "unit", "");
var re = class extends t {
};
e(re, "id", "Color"), e(re, "matches", "^(?:color|fg|foreground):."), e(re, "colorful", true), e(re, "unit", "");
var Yt = class extends t {
};
e(Yt, "id", "AlignContent"), e(Yt, "matches", "^ac:.");
var Xt = class extends t {
};
e(Xt, "id", "AlignItems"), e(Xt, "matches", "^ai:.");
var Zt = class extends t {
};
e(Zt, "id", "AlignSelf"), e(Zt, "matches", "^as:");
var Kt = class extends t {
};
e(Kt, "id", "GridAutoColumns"), e(Kt, "matches", "^grid-auto-cols:.");
var Jt = class extends t {
};
e(Jt, "id", "GridAutoFlow"), e(Jt, "matches", "^grid-flow:.");
var gs = class extends t {
};
e(gs, "id", "GridAutoRows");
var Gt = class extends t {
};
e(Gt, "id", "JustifyContent"), e(Gt, "matches", "^jc:.");
var er = class extends t {
};
e(er, "id", "JustifyItems"), e(er, "matches", "^ji:.");
var tr = class extends t {
};
e(tr, "id", "JustifySelf"), e(tr, "matches", "^js:.");
var xs = class extends t {
  order = -1;
};
e(xs, "id", "PlaceContent");
var bs = class extends t {
  order = -1;
};
e(bs, "id", "PlaceItems");
var ys = class extends t {
  order = -1;
};
e(ys, "id", "PlaceSelf");
var rr = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { [this.prefix.slice(0, -1)]: s };
  }
  get order() {
    return this.prefix === "padding:" ? -1 : 0;
  }
};
e(rr, "id", "Padding"), e(rr, "matches", "^padding(?:-(?:left|right|top|bottom))?:.");
var sr = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { [this.prefix.slice(0, -1)]: s };
  }
  get order() {
    return this.prefix === "margin:" ? -1 : 0;
  }
};
e(sr, "id", "Margin"), e(sr, "matches", "^margin(?:-(?:left|right|top|bottom))?:.");
var ir = class extends t {
};
e(ir, "id", "TextOverflow"), e(ir, "matches", "^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))");
var or = class extends t {
};
e(or, "id", "ListStylePosition"), e(or, "matches", "^list-style:(?:inside|outside|$values)(?!\\|)");
var nr = class extends t {
};
e(nr, "id", "ListStyleType"), e(nr, "matches", "^list-style:(?:disc|decimal|$values)(?!\\|)");
var Rs = class extends t {
  order = -1;
};
e(Rs, "id", "ListStyle");
var _e = class extends t {
};
e(_e, "id", "TextDecorationColor"), e(_e, "colorStarts", "text-decoration:"), e(_e, "colorful", true);
var ar = class extends t {
};
e(ar, "id", "TextDecorationStyle"), e(ar, "matches", "^t(?:ext)?:(?:solid|double|dotted|dashed|wavy|$values)(?!\\|)");
var ze = class extends t {
};
e(ze, "id", "TextDecorationThickness"), e(ze, "matches", "^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$"), e(ze, "unit", "em");
var ks = class extends t {
};
e(ks, "id", "TextIndent");
var ws = class extends t {
};
e(ws, "id", "Content");
var Ae = class extends t {
};
e(Ae, "id", "OutlineColor"), e(Ae, "colorStarts", "outline:"), e(Ae, "colorful", true);
var Ms = class extends t {
};
e(Ms, "id", "OutlineOffset");
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
var Ss = class extends t {
};
e(Ss, "id", "BorderSpacing");
var Cs = class extends t {
};
e(Cs, "id", "TableLayout");
var Ie = class extends t {
};
e(Ie, "id", "AccentColor"), e(Ie, "colorStarts", "accent:"), e(Ie, "colorful", true);
var Ts = class extends t {
};
e(Ts, "id", "Appearance");
var We = class extends t {
};
e(We, "id", "CaretColor"), e(We, "colorStarts", "caret:"), e(We, "colorful", true);
var Os = class extends t {
};
e(Os, "id", "ScrollBehavior");
var mr = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    if (this.prefix.slice(-3, -2) === "m")
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "scroll-margin-left": s, "scroll-margin-right": s };
        case "y":
          return { "scroll-margin-top": s, "scroll-margin-bottom": s };
        case "l":
          return { "scroll-margin-left": s };
        case "r":
          return { "scroll-margin-right": s };
        case "t":
          return { "scroll-margin-top": s };
        case "b":
          return { "scroll-margin-bottom": s };
      }
    else
      return { [this.prefix.replace(/-m(?!argin)/, "-margin").slice(0, -1)]: s };
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
  get(s) {
    if (this.prefix.slice(-3, -2) === "p")
      switch (this.prefix.slice(-2, -1)) {
        case "x":
          return { "scroll-padding-left": s, "scroll-padding-right": s };
        case "y":
          return { "scroll-padding-top": s, "scroll-padding-bottom": s };
        case "l":
          return { "scroll-padding-left": s };
        case "r":
          return { "scroll-padding-right": s };
        case "t":
          return { "scroll-padding-top": s };
        case "b":
          return { "scroll-padding-bottom": s };
      }
    else
      return { [this.prefix.replace(/-p(?!adding)/, "-padding").slice(0, -1)]: s };
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
var vr = class extends t {
};
e(vr, "id", "ScrollSnapType"), e(vr, "matches", "^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)");
var $s = class extends t {
};
e($s, "id", "WillChange");
var Es = class extends t {
};
e(Es, "id", "TextUnderlineOffset");
var gr = class extends t {
  get(s) {
    return { [this.prefix.slice(0, -1)]: s };
  }
};
e(gr, "id", "Inset"), e(gr, "matches", "^(?:top|bottom|left|right):.");
var Ve = class extends t {
  order = -1;
};
e(Ve, "id", "Columns"), e(Ve, "matches", "^(?:columns|cols):."), e(Ve, "unit", "");
var xr = class extends t {
};
e(xr, "id", "WhiteSpace"), e(xr, "unit", "");
var br = class extends t {
};
e(br, "id", "TextOrientation"), e(br, "matches", "^t(?:ext)?:(?:mixed|upright|sideways-right|sideways|use-glyph-orientation|$values)(?!\\|)");
var yr = class extends t {
};
e(yr, "id", "WritingMode"), e(yr, "matches", "^writing:.");
var js = class extends t {
};
e(js, "id", "Contain");
var De = class extends t {
};
e(De, "id", "AnimationDuration"), e(De, "matches", "^@duration:."), e(De, "unit", "ms");
var Rr = class extends t {
};
e(Rr, "id", "TextRendering"), e(Rr, "matches", "^t(?:ext)?:(?:optimizeSpeed|optimizeLegibility|geometricPrecision|$values)(?!\\|)");
var Ns = class extends t {
};
e(Ns, "id", "Direction");
var kr = class extends t {
};
e(kr, "id", "TextDecorationLine"), e(kr, "matches", "^t(?:ext)?:(?:none|underline|overline|line-through|$values)(?!\\|)");
var Pe = class extends t {
};
e(Pe, "id", "GridColumnStart"), e(Pe, "matches", "^grid-col-start:."), e(Pe, "unit", "");
var wr = class extends t {
};
e(wr, "id", "ListStyleImage"), e(wr, "matches", "^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var Mr = class extends t {
};
e(Mr, "id", "ShapeOutside"), e(Mr, "matches", "^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)");
var Sr = class extends t {
};
e(Sr, "id", "ShapeMargin"), e(Sr, "matches", "^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Cr = class extends t {
};
e(Cr, "id", "ShapeImageThreshold"), e(Cr, "unit", "");
var Tr = class extends t {
};
e(Tr, "id", "ClipPath"), e(Tr, "matches", "^clip:.");
var Ls = class extends t {
  order = -1;
};
e(Ls, "id", "Grid");
var Ue = class extends t {
  order = -1;
};
e(Ue, "id", "Font"), e(Ue, "matches", "^f:."), e(Ue, "unit", "");
var _s = class extends t {
};
e(_s, "id", "Quotes");
var zs = class extends t {
  order = -1;
};
e(zs, "id", "GridTemplate");
var Or = class extends t {
};
e(Or, "id", "GridRowStart"), e(Or, "unit", "");
var As = class extends t {
};
e(As, "id", "GridTemplateAreas");
var $r = class extends t {
};
e($r, "id", "GridTemplateColumns"), e($r, "matches", "^grid-template-cols:.");
var Is = class extends t {
};
e(Is, "id", "GridTemplateRows");
var Er = class extends t {
  order = -1;
};
e(Er, "id", "GridArea"), e(Er, "unit", "");
var Qe = class extends t {
};
e(Qe, "id", "GridColumnEnd"), e(Qe, "matches", "^grid-col-end:."), e(Qe, "unit", "");
var jr = class extends t {
};
e(jr, "id", "GridRowEnd"), e(jr, "unit", "");
var Ws = class extends t {
  get(s) {
    return { "mask-image": s, "-webkit-mask-image": s };
  }
};
e(Ws, "id", "MaskImage");
var se = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { "-webkit-text-fill-color": s };
  }
};
e(se, "id", "TextFillColor"), e(se, "matches", "^text-fill-color:."), e(se, "colorStarts", "(?:text-fill|text|t):"), e(se, "colorful", true);
var Nr = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { "-webkit-text-stroke": s };
  }
};
e(Nr, "id", "TextStroke"), e(Nr, "matches", "^text-stroke:.");
var Lr = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { "-webkit-text-stroke-width": s };
  }
};
e(Lr, "id", "TextStrokeWidth"), e(Lr, "matches", "^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)");
var ie = class extends t {
  static get prop() {
    return "";
  }
  get(s) {
    return { "-webkit-text-stroke-color": s };
  }
};
e(ie, "id", "TextStrokeColor"), e(ie, "matches", "^text-stroke-color:."), e(ie, "colorStarts", "text-stroke:"), e(ie, "colorful", true);
var Vs = class extends t {
};
e(Vs, "id", "StrokeDasharray");
var Ds = class extends t {
};
e(Ds, "id", "StrokeDashoffset");
var _r = class extends t {
};
e(_r, "id", "X"), e(_r, "unit", "");
var zr = class extends t {
};
e(zr, "id", "Y"), e(zr, "unit", "");
var Ar = class extends t {
};
e(Ar, "id", "Cx"), e(Ar, "unit", "");
var Ir = class extends t {
};
e(Ir, "id", "Cy"), e(Ir, "unit", "");
var Wr = class extends t {
};
e(Wr, "id", "Rx"), e(Wr, "unit", "");
var Vr = class extends t {
};
e(Vr, "id", "Ry"), e(Vr, "unit", "");
var Ps = class extends t {
};
e(Ps, "id", "BorderImageOutset");
var Dr = class extends t {
};
e(Dr, "id", "BorderImageRepeat"), e(Dr, "matches", "^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)");
var Pr = class extends t {
};
e(Pr, "id", "BorderImageSlice"), e(Pr, "unit", "");
var Ur = class extends t {
};
e(Ur, "id", "BorderImageSource"), e(Ur, "matches", "^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)");
var Qr = class extends t {
};
e(Qr, "id", "BorderImageWidth"), e(Qr, "matches", "^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$");
var Hr = class extends t {
};
e(Hr, "id", "BorderImage"), e(Hr, "unit", "");
var eo = /\{(.*)\}/;
var He = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(s, i, o) {
    let n = 0;
    for (; n < s.length && !(s[n] === "{" && s[n - 1] !== "\\"); n++)
      ;
    return [s.slice(0, n), ...B(s.slice(n), i, o)];
  }
  getThemeProps(s, i) {
    let o = {}, n = (u, f) => {
      let a = f.indexOf(":");
      if (a !== -1) {
        u in o || (o[u] = {});
        let m = o[u], R = f.slice(0, a);
        R in m || (m[R] = f.slice(a + 1));
      }
    }, l = (u) => {
      let f = (a, m) => {
        let R = m.slice(CSS.escape(u.className).length).match(eo)[1].split(";");
        for (let b of R)
          n(a, b);
      };
      if (this.theme) {
        let a = u.natives.find((m) => m.theme === this.theme) ?? u.natives.find((m) => !m.theme);
        a && f(this.theme, a.text);
      } else
        for (let a of u.natives)
          f(a.theme, a.text);
    }, d = [], c = "", h = () => {
      c && (d.push(c.replace(/ /g, "")), c = "");
    }, v = 1;
    (function u(f) {
      for (; v < s.value.length; v++) {
        let a = s.value[v];
        if (!f) {
          if (a === ";") {
            h();
            continue;
          }
          if (a === "}")
            break;
        }
        if (c += a, f === a) {
          if (f === "'" || f === '"') {
            let m = 0;
            for (let R = c.length - 2; c[R] === "\\"; R--)
              m++;
            if (m % 2)
              continue;
          }
          break;
        } else
          a in qe && f !== "'" && f !== '"' && (v++, u(qe[a]));
      }
    })(void 0), h();
    for (let u of d) {
      let f = i.create(u);
      if (Array.isArray(f))
        for (let a of f)
          l(a);
      else
        f ? l(f) : n(this.theme ?? "", u);
    }
    return o;
  }
};
e(He, "id", "Group"), e(He, "matches", "^(?:.+?[*_>~+])?\\{.+?\\}"), e(He, "unit", "");
var Fr = class extends t {
};
e(Fr, "id", "CounterIncrement"), e(Fr, "unit", "");
var qr = class extends t {
};
e(qr, "id", "CounterReset"), e(qr, "unit", "");
var Br = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(s, i, o) {
    return ["", ...B(s, i, o, ["x"])];
  }
  get(s) {
    let [i, o] = s.value.split(" x ");
    return { width: { ...s, value: i }, height: { ...s, value: o } };
  }
};
e(Br, "id", "WH"), e(Br, "matches", "^(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var Yr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(s, i, o) {
    return ["", ...B(s.slice(4), i, o, ["x"])];
  }
  get(s) {
    let [i, o] = s.value.split(" x ");
    return { "min-width": { ...s, value: i }, "min-height": { ...s, value: o } };
  }
};
e(Yr, "id", "MinWH"), e(Yr, "matches", "^min:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var Xr = class extends t {
  static get prop() {
    return "";
  }
  analyzeToken(s, i, o) {
    return ["", ...B(s.slice(4), i, o, ["x"])];
  }
  get(s) {
    let [i, o] = s.value.split(" x ");
    return { "max-width": { ...s, value: i }, "max-height": { ...s, value: o } };
  }
};
e(Xr, "id", "MaxWH"), e(Xr, "matches", "^max:(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)x(?:(?:max|min|clamp|calc)\\(.+\\)|[0-9]+[a-z]*?)");
var to = [He, $e, Ye, oe, Be, ae, ce, et, tt, Ue, re, Xe, sr, rr, vs, Ft, Ht, Ut, Qt, qt, pt, Ze, Ke, Je, Ge, Br, Yr, Xr, js, ws, Fr, qr, ne, le, rt, st, it, _e, ar, ze, kr, de, Es, ir, br, ot, Rr, ks, nt, Ve, xr, gr, fe, mt, ut, ht, vt, ts, rs, ss, is, gt, xt, ve, ns, as, cs, ls, ds, It, Dt, fs, ms, zt, At, se, Lr, ie, Nr, Te, Cs, ct, at, me, ue, dt, ft, he, pe, lt, ge, bt, De, yt, xe, Rt, kt, wt, be, ee, Mt, St, Ct, fr, Ss, Ps, Dr, Pr, Ur, Qr, Hr, ye, Tt, os, te, Ot, $t, Re, Et, jt, ke, we, Nt, Me, Ce, Se, Vs, Ds, _t, Lt, _r, zr, Ar, Ir, Wr, Vr, Pe, Qe, Ne, Oe, Or, jr, Le, Wt, Kt, Jt, gs, As, $r, Is, zs, Er, Ls, Vt, je, hs, ps, us, Pt, Ee, Bt, Yt, Xt, Zt, Gt, er, tr, xs, bs, ys, or, nr, wr, Rs, Ae, Ms, cr, lr, dr, Ie, Ts, We, Os, mr, ur, pr, hr, vr, $s, yr, Ns, Mr, Sr, Cr, Tr, _s, Ws];
var ay = false;
var ly = true;
var fy = false;

// test.ts
console.log(V);
