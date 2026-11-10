var Je = Object.defineProperty;
var Ue = (e, t, n) => t in e ? Je(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var y = (e, t, n) => Ue(e, typeof t != "symbol" ? t + "" : t, n);
import { jsx as a, jsxs as v, Fragment as q } from "react/jsx-runtime";
import { T as je, a as Ze, d as ce, E as qe, G as N, R as K, L as Qe, P as et, b as tt, K as nt, e as ot, f as rt, S as st, h as at, i as lt } from "./vendor-Dj0neUjo.mjs";
import { createContext as H, useState as L, useContext as W, useMemo as D, useEffect as I, useCallback as it, useSyncExternalStore as ve, useRef as se, useLayoutEffect as ct } from "react";
const Se = ({ children: e }) => /* @__PURE__ */ a("div", { className: "flex items-center justify-center w-screen h-screen", children: e }), ut = () => /* @__PURE__ */ a(Se, { children: /* @__PURE__ */ a("p", { className: "text-center", children: "No table found" }) }), Ce = "sans-serif", xe = 150, R = 6, T = 30, U = T + R, ht = R + T + T / 2, b = {
  xs: 5,
  sm: 8,
  md: 10,
  lg: 20
}, ye = b.sm, B = {
  md: 15,
  tableTitle: 18
}, dt = {
  w: 5
}, mt = 200, ft = 50, gt = 50, j = 60, ue = 8, bt = 0.75, F = (e) => /* @__PURE__ */ a(je, { fontFamily: Ce, fontSize: B.md, ...e });
var k = /* @__PURE__ */ ((e) => (e.light = "light", e.dark = "dark", e))(k || {});
const pt = {
  text: {
    900: "#636363",
    700: "#9C9C9C"
  },
  connection: {
    active: "#029CFD",
    default: "#888"
  },
  colAccent: "aliceblue",
  table: {
    bg: "white",
    shadow: "black"
  },
  tableHeader: {
    bg: "#F8FAFC",
    fg: "black"
  },
  red: "red",
  green: "#00FF00",
  enumItem: "#ccc",
  white: "white",
  noteBg: "#000000d6",
  bg: "white"
}, Ee = {
  text: {
    900: "#E6E6E6",
    700: "#B3B3B3"
  },
  connection: {
    active: "#00BFFF",
    default: "#888888"
  },
  colAccent: "#333333",
  table: {
    bg: "#2F2F2F",
    shadow: "rgba(255, 255, 255, 0.1)"
  },
  tableHeader: {
    bg: "#1E1E1E",
    fg: "#CCCCCC"
  },
  red: "#FF6347",
  green: "#32CD32",
  enumItem: "#999999",
  white: "#FFFFFF",
  noteBg: "#3F3F3F",
  bg: "#1A1A1A"
}, we = H({
  themeColors: Ee,
  theme: k.dark,
  setTheme: () => {
  }
}), Tt = ({
  theme: e,
  themeColors: t,
  setTheme: n,
  children: o
}) => /* @__PURE__ */ a(we.Provider, { value: { setTheme: n, theme: e, themeColors: t }, children: o }), Ne = () => {
  const e = W(we);
  if (e === void 0)
    throw new Error("it seem you forgot to wrap your app with ThemeProvider");
  return e;
}, M = () => Ne().themeColors, vt = (e = k.light) => {
  const [t, n] = L(e), o = t === k.dark ? Ee : pt;
  return { setTheme: n, theme: t, themeColors: o };
}, he = [
  {
    regular: "#6366f1",
    lighter: "#e4e6ff"
  },
  {
    regular: "#8b5cf6",
    lighter: "#f0f1ff"
  },
  {
    regular: "#a855f7",
    lighter: "#f8f7ff"
  },
  {
    regular: "#d946ef",
    lighter: "#fdfbff"
  },
  {
    regular: "#ec4899",
    lighter: "#ffe6f0"
  },
  {
    regular: "#f43f5e",
    lighter: "#ffebec"
  },
  {
    regular: "#ef4444",
    lighter: "#ffefec"
  },
  {
    regular: "#f97316",
    lighter: "#fff8f5"
  },
  {
    regular: "#f59e0b",
    lighter: "#fffaf1"
  },
  {
    regular: "#eab308",
    lighter: "#fffcea"
  },
  {
    regular: "#84cc16",
    lighter: "#f6ffdf"
  },
  {
    regular: "#22c55e",
    lighter: "#eaffe6"
  },
  {
    regular: "#10b981",
    lighter: "#e1ffed"
  },
  {
    regular: "#14b8a6",
    lighter: "#eaffe9"
  },
  {
    regular: "#06b6d4",
    lighter: "#e7f8ff"
  },
  {
    regular: "#0ea5e9",
    lighter: "#edf7ff"
  },
  {
    regular: "#3b82f6",
    lighter: "#f7faff"
  }
], St = (e) => {
  const t = he.length;
  let n = 0;
  for (let r = 0; r < e.length; r++)
    n += e.charCodeAt(r);
  const o = n % t;
  return he[o];
};
function Ct(e) {
  const t = parseInt(e.slice(1, 3), 16), n = parseInt(e.slice(3, 5), 16), o = parseInt(e.slice(5, 7), 16), r = 0.95, s = Math.round(t + (255 - t) * r), l = Math.round(n + (255 - n) * r), i = Math.round(o + (255 - o) * r);
  return "#" + ((1 << 24) + (s << 16) + (l << 8) + i).toString(16).slice(1);
}
const xt = (e) => {
  const t = /* @__PURE__ */ new Map();
  return e.forEach((n) => {
    const o = n.headerColor ? { regular: n.headerColor, lighter: Ct(n.headerColor) } : St(n.name);
    t.set(n.name, o);
  }), t;
}, Pe = H(
  null
), yt = ({
  children: e,
  tables: t
}) => {
  const n = D(() => xt(t), [t]);
  return /* @__PURE__ */ a(Pe.Provider, { value: { tableColors: n }, children: e });
}, ae = (e) => {
  const t = W(Pe);
  if (t == null)
    throw new Error(
      "it seem you forgot to wrap your app with TablesColorContext"
    );
  return t.tableColors.get(e);
};
var g = /* @__PURE__ */ ((e) => (e.FullDetails = "FullDetails", e.KeyOnly = "KeyOnly", e.HeaderOnly = "HeaderOnly", e))(g || {});
function Le(e, t) {
  function n() {
    return t === g.FullDetails;
  }
  function o() {
    return t === g.KeyOnly;
  }
  function r(s) {
    return Array.isArray(s.relational_tables) ? s.relational_tables.length > 0 : !1;
  }
  return e.filter(
    (s) => n() || o() && r(s)
  );
}
const Et = (e, t) => t === g.HeaderOnly ? {} : e.reduce((n, o) => {
  const r = Le(
    o.fields,
    t
  ).reduce((s, l, i) => ({
    ...s,
    [Oe(o.name, l.name)]: i
  }), {});
  return {
    ...n,
    ...r
  };
}, {}), Oe = (e, t) => `${e}.${t}`;
class De {
}
class Me extends De {
  getItem(t) {
    const n = localStorage.getItem(t);
    return n === null ? null : JSON.parse(n);
  }
  setItem(t, n) {
    localStorage.setItem(t, JSON.stringify(n));
  }
  removeItem(t) {
    localStorage.removeItem(t);
  }
}
class le {
  constructor(t, n) {
    y(this, "storeName");
    y(this, "storage");
    this.storeName = t, this.storage = n ?? new Me();
  }
  createPersistanceKey(t) {
    return `${this.storeName}:${t}`;
  }
  persist(t, n) {
    const o = this.createPersistanceKey(t);
    this.storage.setItem(o, n);
  }
  retrieve(t) {
    const n = this.createPersistanceKey(t);
    return this.storage.getItem(n);
  }
  clear(t) {
    const n = this.createPersistanceKey(t);
    this.storage.removeItem(n);
  }
}
class wt extends le {
  constructor() {
    super("detailLevel", new Me());
    y(this, "detailLevel", g.FullDetails);
    y(this, "currentStoreKey", "none");
  }
  getCurrentDetailLevel() {
    return this.detailLevel;
  }
  saveCurrentState() {
    this.detailLevel === null ? this.persist(this.currentStoreKey, g.FullDetails) : this.persist(this.currentStoreKey, this.detailLevel);
  }
  switchTo(n) {
    this.currentStoreKey = n;
    const o = this.retrieve(this.currentStoreKey);
    o === null && (this.detailLevel = g.FullDetails);
    for (const r of Object.values(g))
      r.toString() === String(o) && (this.detailLevel = r);
  }
  set(n) {
    this.detailLevel = n;
  }
}
const V = new wt(), Fe = H({
  detailLevel: g.FullDetails,
  next() {
  }
}), Nt = ({
  children: e
}) => {
  const [t, n] = L(
    () => V.getCurrentDetailLevel()
  );
  I(() => {
    t !== V.getCurrentDetailLevel() && (V.set(t), V.saveCurrentState());
  }, [t]);
  const o = it(() => {
    t === g.FullDetails ? n(g.HeaderOnly) : t === g.HeaderOnly ? n(g.KeyOnly) : n(g.FullDetails);
  }, [t, n]);
  return /* @__PURE__ */ a(Fe.Provider, { value: { detailLevel: t, next: o }, children: e });
}, Q = () => {
  const e = W(Fe);
  if (e === void 0)
    throw new Error(
      "it seem you forgot to wrap your app with TableDetailLevelProvider"
    );
  return e;
}, Ie = H(void 0), Pt = ({ children: e, tables: t }) => {
  const [n, o] = L(null), { detailLevel: r } = Q(), s = Et(t, r);
  return /* @__PURE__ */ a(
    Ie.Provider,
    {
      value: { colsIndexes: s, hoveredTableName: n, setHoveredTableName: o },
      children: e
    }
  );
}, _e = (e) => e.not_null === !0 ? `${e.type.type_name} (!)` : e.type.type_name, He = (e) => e.map(
  (n) => `${n.name} ${_e(n)}`
), de = new Ze({
  fontFamily: Ce,
  fontSize: B.md
}), Y = (e, t) => t != null ? de.clone(t).measureSize(e) : de.measureSize(e), Lt = (e) => Y("a", e), We = (e) => Math.max(...e.map((t) => Y(t).width)), Ae = (e, t) => {
  const n = We(e), { width: o } = Y(t, {
    fontSize: B.tableTitle
  }), r = Math.max(n, o);
  return Math.max(
    r + ye * 2,
    xe
  );
}, Ot = (e) => {
  const t = He(e.fields), n = Ae(t, e.name), o = U + T * e.fields.length;
  return { width: n, height: o };
}, Dt = (e, t) => {
  const n = /* @__PURE__ */ new Map(), o = new ce.graphlib.Graph();
  return o.setGraph({
    nodesep: ft * 3,
    ranksep: gt * 3,
    rankdir: "LR"
  }), o.setDefaultEdgeLabel(function() {
    return {};
  }), e.forEach((r) => {
    const { height: s, width: l } = Ot(r);
    o.setNode(r.name, { width: l, height: s });
  }), t.forEach((r) => {
    o.setEdge(r.endpoints[0].tableName, r.endpoints[1].tableName);
  }), ce.layout(o), o.nodes().forEach((r) => {
    const { x: s, y: l } = o.node(r);
    n.set(r, { x: s, y: l });
  }), n;
}, E = new qe(), Mt = { x: 0, y: 0 }, $ = class $ extends le {
  constructor() {
    super("tableCoords");
    y(this, "tableCoords", /* @__PURE__ */ new Map());
    y(this, "currentStoreKey", "none");
  }
  getCurrentStore() {
    return this.tableCoords;
  }
  subscribeToReset(n) {
    return E.on($.RESET_POS_EVENT_NAME, n), () => {
      E.off($.RESET_POS_EVENT_NAME, n);
    };
  }
  resetPositions(n, o) {
    const r = Dt(n, o);
    this.tableCoords = r, E.emit($.RESET_POS_EVENT_NAME, r);
  }
  getCurrentStoreValue() {
    return this.tableCoords;
  }
  saveCurrentStore() {
    const n = Array.from(this.tableCoords);
    this.persist(this.currentStoreKey, n);
  }
  switchTo(n, o, r) {
    this.saveCurrentStore(), this.currentStoreKey = n;
    const s = this.retrieve(this.currentStoreKey);
    if (s === null || !Array.isArray(s)) {
      this.resetPositions(o, r);
      return;
    }
    this.tableCoords = new Map(s);
  }
  getCoords(n) {
    return this.tableCoords.get(n) ?? Mt;
  }
  setCoords(n, o) {
    this.tableCoords.set(n, o);
  }
  remove(n) {
    this.tableCoords.delete(n);
  }
};
y($, "RESET_POS_EVENT_NAME", "tableCoords:resetTablesPositions");
let ne = $;
const _ = new ne(), $e = H(null), Ft = ({
  tables: e,
  refs: t,
  children: n
}) => {
  const o = () => {
    _.resetPositions(e, t);
  }, r = D(() => ({ resetPositions: o }), [o]);
  return /* @__PURE__ */ a($e.Provider, { value: r, children: n });
}, Re = H(void 0), It = ({
  children: e,
  width: t
}) => {
  const n = D(() => ({ width: t }), [t]);
  return /* @__PURE__ */ a(Re.Provider, { value: n, children: e });
};
class _t {
  constructor(t) {
    y(this, "storeEventPrefix");
    this.storeEventPrefix = `store:${t}`;
  }
  getEventName(t) {
    return `${this.storeEventPrefix}:${t}`;
  }
  subscribe(t, n) {
    const o = this.getEventName(t);
    E.on(o, n);
  }
  unSubscribe(t, n) {
    const o = this.getEventName(t);
    E.off(o, n);
  }
  emit(t, n) {
    const o = this.getEventName(t);
    E.emit(o, n);
  }
}
class Ht extends _t {
  constructor() {
    super("tableWidth");
    y(this, "tableWidths", /* @__PURE__ */ new Map());
  }
  getWidth(n) {
    return this.tableWidths.get(n);
  }
  setWidth(n, o) {
    this.tableWidths.set(n, o), this.emit(n, o);
  }
  remove(n) {
    this.tableWidths.delete(n);
  }
}
const J = new Ht(), ee = () => {
  const e = W(Ie);
  if (e == null)
    throw new Error("useTablesInfo must be used within a TableInfoProvider");
  return e;
}, Ke = () => {
  const e = W($e);
  if (e == null)
    throw new Error(
      "useTablePosition must be used within the TablesPositionsContext"
    );
  return e;
}, Wt = (e) => ve(
  (n) => _.subscribeToReset(n),
  () => _.getCoords(e)
), At = (e) => {
  const t = He(e.fields);
  return D(() => {
    const o = Ae(t, e.name);
    return J.setWidth(e.name, o), o;
  }, [t]);
}, G = () => {
  const e = W(Re);
  return (e == null ? void 0 : e.width) ?? xe;
}, $t = ({ title: e }) => {
  const t = M(), n = ae(e), o = G(), r = (n == null ? void 0 : n.regular) ?? "red";
  return /* @__PURE__ */ v(N, { children: [
    /* @__PURE__ */ a(
      K,
      {
        cornerRadius: [b.sm, b.sm],
        fill: r,
        height: R,
        width: o
      }
    ),
    /* @__PURE__ */ a(
      K,
      {
        y: R,
        fill: t.tableHeader.bg,
        width: o,
        height: T
      }
    ),
    /* @__PURE__ */ a(
      F,
      {
        text: e,
        y: R,
        fill: t.tableHeader.fg,
        width: o,
        height: T,
        align: "center",
        strokeWidth: b.xs,
        padding: b.xs,
        fontSize: B.tableTitle
      }
    )
  ] });
}, Be = H(null), Rt = ({ children: e, enums: t }) => /* @__PURE__ */ a(Be.Provider, { value: { enums: t }, children: e }), Kt = () => {
  const e = W(Be);
  if (e == null)
    throw new Error("useEnums must be used within an EnumsProvider");
  return e;
}, Ye = (e) => Kt().enums.find((n) => n.name === e), ke = (e) => ` - ${e}`, me = Y("Enum"), Bt = ({ enumName: e, y: t }) => {
  const n = Ye(e), o = M();
  if (n === void 0)
    return null;
  const r = me.width + b.md;
  return /* @__PURE__ */ v(N, { y: t, children: [
    /* @__PURE__ */ a(F, { fontStyle: "bold", fill: o.red, text: "Enum" }),
    /* @__PURE__ */ a(
      F,
      {
        x: r,
        fill: o.green,
        text: n.name
      }
    ),
    n.values.map((s, l) => /* @__PURE__ */ a(
      F,
      {
        y: (l + 1) * me.height,
        text: ke(s.name),
        fill: o.enumItem
      },
      s.name
    ))
  ] });
}, Yt = (e, t) => {
  const n = t / 2, o = e + dt.w;
  return [e, n, o, n - 5, o, n + 5];
}, kt = ({ children: e }) => {
  const [t, n] = L(!1), o = M(), r = G(), s = () => {
    n(!0);
  }, l = () => {
    n(!1);
  }, i = r;
  return /* @__PURE__ */ v(
    N,
    {
      onMouseEnter: s,
      onMouseLeave: l,
      x: 0,
      y: 0,
      height: T,
      width: r,
      children: [
        /* @__PURE__ */ a(K, { x: 0, y: 0, height: T, width: r }),
        t ? /* @__PURE__ */ a(
          Qe,
          {
            fill: o.noteBg,
            closed: !0,
            points: Yt(i, T)
          }
        ) : null,
        /* @__PURE__ */ a(N, { x: r, children: /* @__PURE__ */ a(N, { x: b.xs, children: t ? e : null }) })
      ]
    }
  );
}, Gt = (e) => {
  const t = `Enum ${e.name}`, n = e.values.map(
    (o) => ke(o.name)
  );
  return We([t, ...n]);
}, zt = (e, t) => {
  let n = 1, o = 0;
  return e.split(" ").forEach((r) => {
    const s = Y(`${r}-`).width;
    if (o += s, o > t) {
      const l = Math.ceil(s / t);
      n += l, o = 0;
    }
  }), n;
}, Vt = (e, t) => {
  const n = t === void 0 ? 0 : Gt(t), o = e != null ? Y(e).width : 0, r = Math.max(n, o) + b.md, s = Math.min(r, mt), l = Lt(), i = e ? zt(e, s) * l.height : 0, c = t === void 0 ? 0 : l.height * (1 + t.values.length), u = c + (c > 0 ? b.md : 0), h = i + (i !== 0 ? b.lg : b.md), d = h + u;
  return { w: s, h: d, noteH: h };
}, Xt = ({ note: e, enumName: t = "" }) => {
  const n = M(), o = Ye(t), r = Vt(e, o);
  return /* @__PURE__ */ a(kt, { children: /* @__PURE__ */ v(N, { children: [
    /* @__PURE__ */ a(
      K,
      {
        fill: n.noteBg,
        width: r.w + b.md * 2,
        height: r.h,
        cornerRadius: 5
      }
    ),
    /* @__PURE__ */ v(N, { x: b.md, children: [
      /* @__PURE__ */ a(
        F,
        {
          y: b.md,
          width: r.w,
          fill: n.white,
          text: e
        }
      ),
      t !== void 0 ? /* @__PURE__ */ a(Bt, { y: r.noteH, enumName: t }) : null
    ] })
  ] }) });
}, Jt = (e, t, n, o) => !!(e || n === t && o || n && (o != null && o.includes(n))), Ut = ({
  children: e,
  offsetY: t,
  tableName: n,
  relationalTables: o,
  highlightColor: r
}) => {
  const { hoveredTableName: s } = ee(), [l, i] = L(!1), c = G(), u = () => {
    i(!0);
  }, h = () => {
    i(!1);
  }, d = Jt(
    l,
    n,
    s,
    o
  );
  return /* @__PURE__ */ v(N, { onMouseOver: u, onMouseLeave: h, y: t, children: [
    /* @__PURE__ */ a(
      K,
      {
        fill: d ? r : "transparent",
        width: c,
        height: T
      }
    ),
    e(d)
  ] });
}, jt = ({
  colName: e,
  tableName: t,
  type: n,
  isPrimaryKey: o = !1,
  offsetY: r,
  relationalTables: s,
  isEnum: l,
  note: i
}) => {
  const c = M(), u = ae(t), h = G(), d = c.text[900], p = c.text[700], m = o ? "bold" : "normal";
  return /* @__PURE__ */ a(
    Ut,
    {
      highlightColor: (u == null ? void 0 : u.lighter) ?? c.colAccent,
      relationalTables: s,
      offsetY: r,
      tableName: t,
      children: (C) => /* @__PURE__ */ v(q, { children: [
        /* @__PURE__ */ a(
          F,
          {
            ellipsis: !0,
            wrap: "none",
            text: e,
            fill: C && (u == null ? void 0 : u.regular) || d,
            width: h,
            fontStyle: m,
            padding: b.sm,
            height: T,
            fontSize: B.md
          }
        ),
        /* @__PURE__ */ a(
          F,
          {
            text: n,
            align: "right",
            width: h,
            fill: C && (u == null ? void 0 : u.regular) || p,
            padding: ye,
            fontStyle: m,
            fontSize: B.md,
            height: T
          }
        ),
        i != null || l ? /* @__PURE__ */ a(Xt, { note: i ?? "", enumName: n }) : null
      ] })
    }
  );
}, oe = (e) => `on:table:drag:${e}`, Zt = ({ fields: e, name: t }) => {
  const n = M(), { detailLevel: o } = Q(), r = se(null), { setHoveredTableName: s } = ee(), { x: l, y: i } = Wt(t), c = G(), u = D(() => Le(e, o), [o, e]);
  I(() => {
    r.current != null && (r.current.x(l), r.current.y(i), E.emit(d, { x: l, y: i }));
  }, [l, i]);
  const h = R + T + u.length * T + b.sm, d = oe(t), p = (f) => {
    const x = { x: f.x(), y: f.y() };
    E.emit(d, x), _.setCoords(t, x);
  };
  return /* @__PURE__ */ v(
    N,
    {
      ref: r,
      draggable: !0,
      onDragMove: (f) => {
        f.currentTarget.moveToTop(), p(f.target);
      },
      width: c,
      height: h,
      onMouseEnter: () => {
        s(t);
      },
      onMouseLeave: () => {
        s(null);
      },
      onClick: () => {
        r.current != null && r.current.moveToTop();
      },
      children: [
        /* @__PURE__ */ a(
          K,
          {
            shadowBlur: b.xs,
            shadowOpacity: 0.2,
            shadowColor: n.table.shadow,
            height: h,
            width: c,
            fill: n.table.bg,
            cornerRadius: b.sm
          }
        ),
        /* @__PURE__ */ a($t, { title: t }),
        o !== g.HeaderOnly ? /* @__PURE__ */ a(N, { y: U, children: u.map((f, x) => /* @__PURE__ */ a(
          jt,
          {
            colName: f.name,
            tableName: t,
            isEnum: f.type.is_enum,
            type: _e(f),
            isPrimaryKey: f.pk,
            offsetY: x * T,
            relationalTables: f.relational_tables,
            note: f.note
          },
          f.name
        )) }) : /* @__PURE__ */ a(q, {})
      ]
    }
  );
}, qt = ({ table: e }) => {
  const t = At(e);
  return /* @__PURE__ */ a(It, { width: t, children: /* @__PURE__ */ a(Zt, { ...e }) });
}, Qt = ({ tables: e }) => e.map((t) => /* @__PURE__ */ a(qt, { table: t }, t.name)), en = ({
  path: e,
  sourceTableName: t,
  targetTableName: n,
  relationOwner: o
}) => {
  const r = M(), { hoveredTableName: s } = ee(), l = ae(o), [i, c] = L(!1), h = s === t || s === n || i ? (l == null ? void 0 : l.regular) ?? r.connection.active : r.connection.default;
  return /* @__PURE__ */ a(
    et,
    {
      data: e,
      onMouseEnter: () => {
        c(!0);
      },
      onMouseLeave: () => {
        c(!1);
      },
      strokeWidth: 2,
      stroke: h
    }
  );
}, fe = (e) => ve((r) => (J.subscribe(e, r), () => {
  J.unSubscribe(e, r);
}), () => J.getWidth(e) ?? 0), ge = (e, t) => {
  const n = Oe(
    t.tableName,
    t.fieldNames[0]
  ), o = e[n] ?? 0;
  return ht + T * o;
};
var S = /* @__PURE__ */ ((e) => (e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom", e))(S || {});
const tn = 40, nn = ({
  sourceX: e,
  sourceW: t,
  targetW: n,
  targetX: o
}) => {
  const r = e + t, s = o + n;
  return Math.max(r, s) - Math.min(e, o) <= n + t + tn ? [S.Left, S.Left, e, o] : r < s ? [S.Right, S.Left, r, o] : [S.Left, S.Right, e, s];
}, on = (e, t) => {
  const n = ee(), o = ge(n.colsIndexes, e), r = ge(n.colsIndexes, t);
  return [o, r];
}, rn = (e, t) => {
  const [n, o] = L(
    () => _.getCoords(e.tableName)
  ), [r, s] = L(
    () => _.getCoords(t.tableName)
  ), [l, i] = on(e, t), c = fe(e.tableName), u = fe(t.tableName), h = oe(e == null ? void 0 : e.tableName), d = oe(t == null ? void 0 : t.tableName), { detailLevel: p } = Q();
  I(() => {
    const w = (A) => {
      o(A);
    };
    return E.on(h, w), () => {
      E.removeListener(h, w);
    };
  }, [h]), I(() => {
    const w = (A) => {
      s(A);
    };
    return E.on(d, w), () => {
      E.removeListener(d, w);
    };
  }, [d]);
  const [m, C, P, O] = nn({
    sourceW: c,
    sourceX: n.x,
    targetW: u,
    targetX: r.x
  });
  if (p === g.HeaderOnly)
    return {
      sourcePosition: m,
      targetPosition: C,
      sourceXY: {
        x: P,
        y: n.y + U / 2
      },
      targetXY: {
        x: O,
        y: r.y + U / 2
      }
    };
  const f = l + n.y, x = i + r.y;
  return {
    sourcePosition: m,
    targetPosition: C,
    sourceXY: { x: P, y: f },
    targetXY: { x: O, y: x }
  };
}, sn = ({ x: e, y: t }, n) => {
  const r = Z(n, { x: e, y: t });
  return `M${r.x},${t - 3} L${r.x},${t + 3}`;
}, Z = (e, t) => ({ x: e === S.Left ? t.x - ue : t.x + ue, y: t.y }), an = ({ x: e, y: t }, n) => {
  const r = Z(n, { x: e, y: t });
  return `M${e},${t - 5} L${r.x},${r.y} L${e},${t + 5}`;
}, be = (e, t, n) => e === "1" ? sn(n, t) : an(n, t);
function X(e, t) {
  return e >= 0 ? 0.5 * e : t * 25 * Math.sqrt(-e);
}
function pe({
  pos: e,
  x1: t,
  y1: n,
  x2: o,
  y2: r,
  c: s
}) {
  switch (e) {
    case S.Left:
      return [t - X(t - o, s), n];
    case S.Right:
      return [t + X(o - t, s), n];
    case S.Top:
      return [t, n - X(n - r, s)];
    case S.Bottom:
      return [t, n + X(r - n, s)];
  }
}
function ln({
  source: e,
  sourcePosition: t = S.Bottom,
  target: n,
  targetPosition: o = S.Top,
  curvature: r = 0.5
}) {
  const [s, l] = pe({
    pos: t,
    x1: e.x,
    y1: e.y,
    x2: n.x,
    y2: n.y,
    c: r
  }), [i, c] = pe({
    pos: o,
    x1: n.x,
    y1: n.y,
    x2: e.x,
    y2: e.y,
    c: r
  }), u = Z(t, e), h = Z(o, n);
  return `M${e.x},${e.y} L${u.x},${u.y} C${s},${l} ${i},${c} ${h.x},${h.y} L${n.x},${n.y}`;
}
const cn = ({
  relationSource: e,
  relationTarget: t,
  sourceXY: n,
  targetXY: o,
  sourcePosition: r,
  targetPosition: s
}) => {
  const l = ln({
    sourcePosition: r,
    targetPosition: s,
    source: n,
    target: o
  }), i = be(
    e,
    r,
    n
  ), c = be(
    t,
    s,
    o
  );
  return `${l} ${i} ${c}`;
}, un = ({ source: e, target: t }) => {
  const { sourcePosition: n, sourceXY: o, targetPosition: r, targetXY: s } = rn(e, t), { x: l, y: i } = o, { x: c, y: u } = s, h = D(() => cn({
    targetXY: s,
    sourceXY: o,
    sourcePosition: n,
    targetPosition: r,
    relationSource: e.relation,
    relationTarget: t.relation
  }), [n, r, l, c, i, u]), d = e.relation === "1" ? e.tableName : t.tableName;
  return /* @__PURE__ */ a(q, { children: /* @__PURE__ */ a(
    en,
    {
      path: h,
      sourceTableName: e.tableName,
      targetTableName: t.tableName,
      relationOwner: d
    }
  ) });
}, hn = ({ refs: e }) => e.map((t) => {
  const n = t.endpoints[0], o = t.endpoints[1], r = `${n.tableName}-${n.fieldNames[0]}-${o.tableName}-${o.fieldNames[0]}`;
  return /* @__PURE__ */ a(un, { source: n, target: o }, r);
}), te = ({
  onClick: e,
  title: t,
  children: n,
  className: o = "",
  ...r
}) => /* @__PURE__ */ a(
  "button",
  {
    title: t,
    onClick: e,
    className: `flex items-center p-1 text-gray-800 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 ${o}`,
    ...r,
    children: n
  }
), dn = () => {
  const { resetPositions: e } = Ke();
  return /* @__PURE__ */ v(te, { onClick: e, title: "Auto-arrange", children: [
    /* @__PURE__ */ a(tt, {}),
    /* @__PURE__ */ a("span", { className: "ml-2", children: "Auto-arrange" })
  ] });
}, mn = ({ onClick: e }) => /* @__PURE__ */ v(te, { title: "Full Details", onClick: e, children: [
  /* @__PURE__ */ a(rt, {}),
  /* @__PURE__ */ a("span", { className: "ml-2", children: "Full Details" })
] }), fn = ({ onClick: e }) => /* @__PURE__ */ v(te, { title: "Header Only", onClick: e, children: [
  /* @__PURE__ */ a(ot, {}),
  /* @__PURE__ */ a("span", { className: "ml-2", children: "Header Only" })
] }), gn = ({ onClick: e }) => /* @__PURE__ */ v(te, { title: "Key Only", onClick: e, children: [
  /* @__PURE__ */ a(nt, {}),
  /* @__PURE__ */ a("span", { className: "ml-2", children: "Key Only" })
] }), bn = {
  [g.FullDetails]: mn,
  [g.HeaderOnly]: fn,
  [g.KeyOnly]: gn
}, pn = () => {
  const { detailLevel: e, next: t } = Q(), n = D(() => bn[e], [e]);
  return /* @__PURE__ */ a(n, { onClick: t });
}, Tn = () => /* @__PURE__ */ v("div", { className: "flex absolute [&_svg]:w-5 [&_svg]:h-5 px-6 py-1 bottom-14 text-sm bg-gray-100 dark:bg-gray-700 shadow-lg rounded-2xl", children: [
  /* @__PURE__ */ a(dn, {}),
  /* @__PURE__ */ a(pn, {})
] });
function ie(e) {
  var o, r;
  const [t, n] = L({
    width: ((o = e.current) == null ? void 0 : o.offsetWidth) || 0,
    height: ((r = e.current) == null ? void 0 : r.offsetHeight) || 0
  });
  return ct(() => {
    const s = () => {
      var l, i;
      n({
        width: ((l = e.current) == null ? void 0 : l.offsetWidth) || 0,
        height: ((i = e.current) == null ? void 0 : i.offsetHeight) || 0
      });
    };
    return s(), window.addEventListener("resize", s), () => {
      window.removeEventListener("resize", s);
    };
  }, [e.current]), t;
}
const vn = (e) => ({
  onChange: () => {
    document.body.style.cursor = e;
  },
  onRestore: () => {
    document.body.style.cursor = "default";
  }
});
class Sn extends De {
  getItem(t) {
    const n = sessionStorage.getItem(t);
    return n === null ? null : JSON.parse(n);
  }
  setItem(t, n) {
    sessionStorage.setItem(t, JSON.stringify(n));
  }
  removeItem(t) {
    sessionStorage.removeItem(t);
  }
}
class Cn extends le {
  constructor() {
    super("stageState", new Sn());
    y(this, "stageState", null);
    y(this, "currentStoreKey", "none");
  }
  getCurrentStageState() {
    return this.stageState;
  }
  saveCurrentState() {
    this.stageState !== null && this.persist(this.currentStoreKey, this.stageState);
  }
  switchTo(n) {
    this.saveCurrentState(), this.currentStoreKey = n;
    const o = this.retrieve(this.currentStoreKey);
    o === null && (this.stageState = null), this.stageState = o;
  }
  set(n) {
    this.stageState = n;
  }
}
const Ge = new Cn(), xn = (e) => {
  const { height: t, width: n } = ie(e);
  return D(() => {
    const r = Ge.getCurrentStageState();
    if (r !== null)
      return r;
    let s = 0, l = 0, i = 0, c = 0;
    _.getCurrentStore().forEach(({ x: w, y: A }) => {
      s = Math.max(s, w), l = Math.max(l, A), i = Math.min(i, w), c = Math.min(c, A);
    });
    const u = s - i, h = l - c, d = (n - j) / u, p = (t - j) / h, m = Math.min(
      d,
      p,
      1
      /* scale must not ne higher than 1 */
    ) * bt, C = u * m, P = h * m, O = -i * m + (n - C) / 4, f = -c * m + (t - P) / 4;
    return {
      scale: m,
      position: { x: O, y: f }
    };
  }, []);
}, yn = ({ children: e, containerRef: t }) => {
  const { height: o, width: r } = ie(t), { onChange: s, onRestore: l } = vn("grabbing"), i = M(), c = se(null), { scale: u, position: h } = xn(t);
  return I(() => {
    c.current != null && (c.current.scale({
      x: u,
      y: u
    }), c.current.position(h));
  }, [u, h]), /* @__PURE__ */ v(q, { children: [
    /* @__PURE__ */ a(
      st,
      {
        draggable: !0,
        ref: c,
        onDragStart: s,
        onDragEnd: l,
        onWheel: (p) => {
          p.evt.preventDefault();
          const m = p.currentTarget, C = m.scaleX(), P = m.getPointerPosition(), O = {
            x: (P.x - m.x()) / C,
            y: (P.y - m.y()) / C
          };
          let f = p.evt.deltaY > 0 ? 1 : -1;
          p.evt.ctrlKey && (f = -f);
          const x = f > 0 ? C * 1.02 : C / 1.02;
          m.scale({ x, y: x });
          const w = {
            x: P.x - O.x * x,
            y: P.y - O.y * x
          };
          m.position(w), Ge.set({ scale: x, position: w });
        },
        width: r,
        height: o,
        style: { width: "fit-content", backgroundColor: i.bg },
        children: /* @__PURE__ */ a(at, { children: /* @__PURE__ */ a(N, { offsetX: -j, offsetY: -j, children: e }) })
      }
    ),
    /* @__PURE__ */ a(Tn, {})
  ] });
}, En = ({ children: e }) => {
  const { theme: t } = Ne(), [n, o] = L(!1), r = se(null), { resetPositions: s } = Ke(), { width: l } = ie(r);
  return I(() => {
    l > 0 && o(!0);
  }, [l]), I(() => {
    s();
  }, []), /* @__PURE__ */ a(
    "main",
    {
      ref: r,
      className: `relative flex flex-col items-center h-full min-h-[70vh] ${t === k.dark ? "dark" : ""}`,
      children: n ? /* @__PURE__ */ a(yn, { containerRef: r, children: e }) : null
    }
  );
}, wn = ({ enums: e, tables: t, children: n }) => /* @__PURE__ */ a(Pt, { tables: t, children: /* @__PURE__ */ a(yt, { tables: t, children: /* @__PURE__ */ a(Rt, { enums: e, children: n }) }) }), Nn = ({ refs: e, tables: t, enums: n }) => t.length === 0 ? /* @__PURE__ */ a(ut, {}) : /* @__PURE__ */ a(Nt, { children: /* @__PURE__ */ a(Ft, { tables: t, refs: e, children: /* @__PURE__ */ a(wn, { tables: t, enums: n, children: /* @__PURE__ */ v(En, { children: [
  /* @__PURE__ */ a(hn, { refs: e }),
  /* @__PURE__ */ a(Qt, { tables: t })
] }) }) }) }), Pn = () => /* @__PURE__ */ a(Se, { children: /* @__PURE__ */ a("p", { children: "No schema found" }) });
var ze = /* @__PURE__ */ ((e) => (e.SET_THEME_PREFERENCES = "SET_THEME_PREFERENCES", e))(ze || {});
const Un = ({ schema: e }) => {
  const { setTheme: t, theme: n, themeColors: o } = vt();
  return e === null ? /* @__PURE__ */ a(Pn, {}) : /* @__PURE__ */ a(
    Tt,
    {
      theme: n,
      setTheme: (s) => {
        var i;
        t(s);
        const l = {
          command: ze.SET_THEME_PREFERENCES,
          message: s
        };
        window.vsCodeWebviewAPI === void 0 ? console.error(
          "can't send message to extension due vsCodeWebviewAPI global variable is not defined"
        ) : (i = window.vsCodeWebviewAPI) == null || i.postMessage(l);
      },
      themeColors: o,
      children: /* @__PURE__ */ a(Nn, { ...e })
    }
  );
};
class Ln extends Error {
  constructor(t, n) {
    super(n), this.location = t, this.message = n;
  }
}
const On = "public", z = (e, t) => t != null && t !== On ? `${t}.${e}` : e, Ve = (e) => z(e.name, e.schemaName), Xe = (e) => z(e.name, e.schemaName), Dn = (e) => {
  const t = /* @__PURE__ */ new Set();
  return e.forEach((n) => {
    t.add(Xe(n));
  }), t;
}, re = (e, t) => `${e}.${t}`, Mn = (e) => {
  let t = /* @__PURE__ */ new Map();
  return e.forEach((n) => {
    const [o, r] = n.endpoints, s = re(
      o.tableName,
      o.fieldNames[0]
    );
    t = Te(
      t,
      s,
      r.tableName
    );
    const l = re(
      r.tableName,
      r.fieldNames[0]
    );
    t = Te(
      t,
      l,
      o.tableName
    );
  }), t;
}, Te = (e, t, n) => {
  const o = new Map(e);
  if (o.has(t))
    o.get(t).push(n);
  else {
    const r = [n];
    o.set(t, r);
  }
  return o;
}, Fn = (e) => ({
  name: Xe(e),
  values: e.values.map(
    ({ name: t, note: n }) => ({
      name: t,
      // the note returned by the dbml parser is not string
      // but an object there is an typing error in their package
      note: n == null ? void 0 : n.value
    })
  )
}), In = ({
  tableName: e,
  fieldNames: t,
  relation: n,
  schemaName: o
}) => ({
  relation: n,
  tableName: z(e, o),
  fieldNames: t
}), _n = (e) => ({
  name: e.name,
  endpoints: e.endpoints.map(In)
}), Hn = ({
  field: {
    name: e,
    pk: t,
    unique: n,
    note: o,
    dbdefault: r,
    increment: s,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    not_null: l,
    type: i
  },
  relationalFieldMap: c,
  enumsSet: u,
  ownerTable: h
}) => {
  const d = re(h, e), p = c.has(d), m = z(
    i.type_name,
    i.schemaName
  );
  return {
    name: e,
    pk: t,
    unique: n,
    // the note returned by the dbml parser is not string
    // but an object there is an typing error in their package
    note: o == null ? void 0 : o.value,
    not_null: l,
    type: {
      type_name: m,
      is_enum: u.has(m)
    },
    is_relation: p,
    relational_tables: p ? c.get(d) : null,
    increment: s,
    dbdefault: r
  };
}, Wn = ({
  type: e,
  value: t
}) => ({
  type: e,
  value: t
}), An = ({
  pk: e,
  unique: t,
  type: n,
  name: o,
  note: r,
  columns: s
}) => ({
  unique: t,
  type: n,
  pk: !!e,
  name: o,
  // the note returned by the dbml parser is not string
  // but an object there is an typing error in their package
  note: r == null ? void 0 : r.value,
  columns: s.map(Wn)
}), $n = (e, t, n) => {
  const { name: o, note: r, headerColor: s, fields: l, indexes: i } = e;
  return {
    name: Ve(e),
    headerColor: s,
    // the note returned by the dbml parser is not string
    // but an object there is an typing error in their package
    note: r == null ? void 0 : r.value,
    fields: l.map(
      (c) => Hn({
        field: c,
        enumsSet: n,
        relationalFieldMap: t,
        ownerTable: o
      })
    ),
    indexes: i.map(An)
  };
}, Rn = ({
  refs: e,
  enums: t,
  tables: n
}) => {
  const o = Mn(e), r = Dn(t), s = e.map(_n), l = t.map(Fn), i = n.map(
    (c) => $n(c, o, r)
  );
  return {
    refs: s,
    enums: l,
    tables: i
  };
};
class Kn extends Error {
  constructor(t) {
    super(`Table ${t} does not exist.`);
  }
}
class Bn extends Error {
  constructor(t, n) {
    super(`Field ${t} does not exist in table ${n}`);
  }
}
const Yn = (e, t) => {
  const n = /* @__PURE__ */ new Map();
  t.forEach((o) => {
    const r = Ve(o);
    n.set(r, o);
  }), e.forEach((o) => {
    o.endpoints.forEach((r) => {
      const s = z(
        r.tableName,
        r.schemaName
      );
      if (n.has(s)) {
        kn(r, n.get(s));
        return;
      }
      throw new Kn(s);
    });
  });
}, kn = (e, t) => {
  const n = e.fieldNames[0];
  if (!t.fields.some(
    (r) => n === r.name
  ))
    throw new Bn(n, t.name);
}, Gn = (e) => {
  Yn(e.refs, e.tables);
}, jn = (e) => {
  try {
    const t = lt.parse(e);
    return Gn(t), Rn(t);
  } catch (t) {
    if ("location" in t && "message" in t) {
      const n = t, o = n.location.end, r = n.location.start;
      throw o === void 0 || r === void 0 ? t : new Ln(
        {
          end: {
            column: o.column - 1,
            line: o.line - 1
          },
          start: {
            column: r.column - 1,
            line: r.line - 1
          }
        },
        n.message
      );
    }
    throw t;
  }
};
export {
  Un as App,
  jn as parseDBMLToJSON
};
