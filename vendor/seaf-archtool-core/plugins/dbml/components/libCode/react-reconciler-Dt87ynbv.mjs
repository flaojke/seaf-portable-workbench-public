import Ay from "react";
import { r as jy, g as y1 } from "./vendor-Dj0neUjo.mjs";
var Xp = { exports: {} };
/**
 * @license React
 * react-reconciler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Gp, Hy;
function S1() {
  return Hy || (Hy = 1, Gp = function(E) {
    var G = {}, xo = Ay, Ie = jy(), lt = Object.assign;
    function j(n) {
      for (var a = "https://reactjs.org/docs/error-decoder.html?invariant=" + n, u = 1; u < arguments.length; u++) a += "&args[]=" + encodeURIComponent(arguments[u]);
      return "Minified React error #" + n + "; visit " + a + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
    }
    var va = xo.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Wn = Symbol.for("react.element"), D = Symbol.for("react.portal"), Ar = Symbol.for("react.fragment"), ut = Symbol.for("react.strict_mode"), La = Symbol.for("react.profiler"), ec = Symbol.for("react.provider"), Oa = Symbol.for("react.context"), Gu = Symbol.for("react.forward_ref"), Ju = Symbol.for("react.suspense"), Ro = Symbol.for("react.suspense_list"), Xu = Symbol.for("react.memo"), pa = Symbol.for("react.lazy"), tc = Symbol.for("react.offscreen"), Le = Symbol.iterator;
    function se(n) {
      return n === null || typeof n != "object" ? null : (n = Le && n[Le] || n["@@iterator"], typeof n == "function" ? n : null);
    }
    function Vn(n) {
      if (n == null) return null;
      if (typeof n == "function") return n.displayName || n.name || null;
      if (typeof n == "string") return n;
      switch (n) {
        case Ar:
          return "Fragment";
        case D:
          return "Portal";
        case La:
          return "Profiler";
        case ut:
          return "StrictMode";
        case Ju:
          return "Suspense";
        case Ro:
          return "SuspenseList";
      }
      if (typeof n == "object") switch (n.$$typeof) {
        case Oa:
          return (n.displayName || "Context") + ".Consumer";
        case ec:
          return (n._context.displayName || "Context") + ".Provider";
        case Gu:
          var a = n.render;
          return n = n.displayName, n || (n = a.displayName || a.name || "", n = n !== "" ? "ForwardRef(" + n + ")" : "ForwardRef"), n;
        case Xu:
          return a = n.displayName || null, a !== null ? a : Vn(n.type) || "Memo";
        case pa:
          a = n._payload, n = n._init;
          try {
            return Vn(n(a));
          } catch {
          }
      }
      return null;
    }
    function De(n) {
      var a = n.type;
      switch (n.tag) {
        case 24:
          return "Cache";
        case 9:
          return (a.displayName || "Context") + ".Consumer";
        case 10:
          return (a._context.displayName || "Context") + ".Provider";
        case 18:
          return "DehydratedFragment";
        case 11:
          return n = a.render, n = n.displayName || n.name || "", a.displayName || (n !== "" ? "ForwardRef(" + n + ")" : "ForwardRef");
        case 7:
          return "Fragment";
        case 5:
          return a;
        case 4:
          return "Portal";
        case 3:
          return "Root";
        case 6:
          return "Text";
        case 16:
          return Vn(a);
        case 8:
          return a === ut ? "StrictMode" : "Mode";
        case 22:
          return "Offscreen";
        case 12:
          return "Profiler";
        case 21:
          return "Scope";
        case 13:
          return "Suspense";
        case 19:
          return "SuspenseList";
        case 25:
          return "TracingMarker";
        case 1:
        case 0:
        case 17:
        case 2:
        case 14:
        case 15:
          if (typeof a == "function") return a.displayName || a.name || null;
          if (typeof a == "string") return a;
      }
      return null;
    }
    function je(n) {
      var a = n, u = n;
      if (n.alternate) for (; a.return; ) a = a.return;
      else {
        n = a;
        do
          a = n, a.flags & 4098 && (u = a.return), n = a.return;
        while (n);
      }
      return a.tag === 3 ? u : null;
    }
    function ne(n) {
      if (je(n) !== n) throw Error(j(188));
    }
    function Ye(n) {
      var a = n.alternate;
      if (!a) {
        if (a = je(n), a === null) throw Error(j(188));
        return a !== n ? null : n;
      }
      for (var u = n, o = a; ; ) {
        var c = u.return;
        if (c === null) break;
        var f = c.alternate;
        if (f === null) {
          if (o = c.return, o !== null) {
            u = o;
            continue;
          }
          break;
        }
        if (c.child === f.child) {
          for (f = c.child; f; ) {
            if (f === u) return ne(c), n;
            if (f === o) return ne(c), a;
            f = f.sibling;
          }
          throw Error(j(188));
        }
        if (u.return !== o.return) u = c, o = f;
        else {
          for (var m = !1, g = c.child; g; ) {
            if (g === u) {
              m = !0, u = c, o = f;
              break;
            }
            if (g === o) {
              m = !0, o = c, u = f;
              break;
            }
            g = g.sibling;
          }
          if (!m) {
            for (g = f.child; g; ) {
              if (g === u) {
                m = !0, u = f, o = c;
                break;
              }
              if (g === o) {
                m = !0, o = f, u = c;
                break;
              }
              g = g.sibling;
            }
            if (!m) throw Error(j(189));
          }
        }
        if (u.alternate !== o) throw Error(j(190));
      }
      if (u.tag !== 3) throw Error(j(188));
      return u.stateNode.current === u ? n : a;
    }
    function jr(n) {
      return n = Ye(n), n !== null ? nu(n) : null;
    }
    function nu(n) {
      if (n.tag === 5 || n.tag === 6) return n;
      for (n = n.child; n !== null; ) {
        var a = nu(n);
        if (a !== null) return a;
        n = n.sibling;
      }
      return null;
    }
    function au(n) {
      if (n.tag === 5 || n.tag === 6) return n;
      for (n = n.child; n !== null; ) {
        if (n.tag !== 4) {
          var a = au(n);
          if (a !== null) return a;
        }
        n = n.sibling;
      }
      return null;
    }
    var bn = Array.isArray, _e = E.getPublicInstance, kn = E.getRootHostContext, Qe = E.getChildHostContext, In = E.prepareForCommit, we = E.resetAfterCommit, ru = E.createInstance, ar = E.appendInitialChild, Sl = E.finalizeInitialChildren, an = E.prepareUpdate, rr = E.shouldSetTextContent, Nt = E.createTextInstance, Vr = E.scheduleTimeout, To = E.cancelTimeout, lu = E.noTimeout, lr = E.isPrimaryRenderer, vt = E.supportsMutation, Fa = E.supportsPersistence, rn = E.supportsHydration, Co = E.getInstanceFromNode, Do = E.preparePortalMount, zo = E.getCurrentEventPriority, gl = E.detachDeletedInstance, Ku = E.supportsMicrotasks, Zu = E.scheduleMicrotask, Aa = E.supportsTestSelectors, Zt = E.findFiberRoot, id = E.getBoundingRect, od = E.getTextContent, El = E.isHiddenSubtree, sd = E.matchAccessibilityRole, cd = E.setFocusIfFocusable, fd = E.setupIntersectionObserver, nc = E.appendChild, dd = E.appendChildToContainer, Br = E.commitTextUpdate, vd = E.commitMount, ac = E.commitUpdate, Oe = E.insertBefore, pd = E.insertInContainerBefore, rc = E.removeChild, ce = E.removeChildFromContainer, b = E.resetTextContent, xl = E.hideInstance, it = E.hideTextInstance, Ee = E.unhideInstance, ur = E.unhideTextInstance, uu = E.clearContainer, lc = E.cloneInstance, xe = E.createContainerChildSet, ma = E.appendChildToContainerChildSet, Qr = E.finalizeContainerChildren, ir = E.replaceContainerChildren, ja = E.cloneHiddenInstance, ha = E.cloneHiddenTextInstance, wr = E.canHydrateInstance, No = E.canHydrateTextInstance, md = E.canHydrateSuspenseInstance, iu = E.isSuspenseInstancePending, Ut = E.isSuspenseInstanceFallback, Uo = E.getSuspenseInstanceFallbackErrorDetails, uc = E.registerSuspenseInstanceRetry, Rl = E.getNextHydratableSibling, qr = E.getFirstHydratableChild, _o = E.getFirstHydratableChildWithinContainer, or = E.getFirstHydratableChildWithinSuspenseInstance, Mo = E.hydrateInstance, Ho = E.hydrateTextInstance, ou = E.hydrateSuspenseInstance, su = E.getNextHydratableInstanceAfterSuspenseInstance, Tl = E.commitHydratedContainer, Va = E.commitHydratedSuspenseInstance, hd = E.clearSuspenseBoundary, Pu = E.clearSuspenseBoundaryFromContainer, yd = E.shouldDeleteUnhydratedTailInstances, Sd = E.didNotMatchHydratedContainerTextInstance, ic = E.didNotMatchHydratedTextInstance, Wu;
    function Yr(n) {
      if (Wu === void 0) try {
        throw Error();
      } catch (u) {
        var a = u.stack.trim().match(/\n( *(at )?)/);
        Wu = a && a[1] || "";
      }
      return `
` + Wu + n;
    }
    var bu = !1;
    function Lo(n, a) {
      if (!n || bu) return "";
      bu = !0;
      var u = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        if (a) if (a = function() {
          throw Error();
        }, Object.defineProperty(a.prototype, "props", { set: function() {
          throw Error();
        } }), typeof Reflect == "object" && Reflect.construct) {
          try {
            Reflect.construct(a, []);
          } catch (A) {
            var o = A;
          }
          Reflect.construct(n, [], a);
        } else {
          try {
            a.call();
          } catch (A) {
            o = A;
          }
          n.call(a.prototype);
        }
        else {
          try {
            throw Error();
          } catch (A) {
            o = A;
          }
          n();
        }
      } catch (A) {
        if (A && o && typeof A.stack == "string") {
          for (var c = A.stack.split(`
`), f = o.stack.split(`
`), m = c.length - 1, g = f.length - 1; 1 <= m && 0 <= g && c[m] !== f[g]; ) g--;
          for (; 1 <= m && 0 <= g; m--, g--) if (c[m] !== f[g]) {
            if (m !== 1 || g !== 1)
              do
                if (m--, g--, 0 > g || c[m] !== f[g]) {
                  var z = `
` + c[m].replace(" at new ", " at ");
                  return n.displayName && z.includes("<anonymous>") && (z = z.replace("<anonymous>", n.displayName)), z;
                }
              while (1 <= m && 0 <= g);
            break;
          }
        }
      } finally {
        bu = !1, Error.prepareStackTrace = u;
      }
      return (n = n ? n.displayName || n.name : "") ? Yr(n) : "";
    }
    var oc = Object.prototype.hasOwnProperty, Oo = [], St = -1;
    function ya(n) {
      return { current: n };
    }
    function Ge(n) {
      0 > St || (n.current = Oo[St], Oo[St] = null, St--);
    }
    function qe(n, a) {
      St++, Oo[St] = n.current, n.current = a;
    }
    var sr = {}, wt = ya(sr), ln = ya(!1), Ba = sr;
    function Gr(n, a) {
      var u = n.type.contextTypes;
      if (!u) return sr;
      var o = n.stateNode;
      if (o && o.__reactInternalMemoizedUnmaskedChildContext === a) return o.__reactInternalMemoizedMaskedChildContext;
      var c = {}, f;
      for (f in u) c[f] = a[f];
      return o && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = a, n.__reactInternalMemoizedMaskedChildContext = c), c;
    }
    function Pt(n) {
      return n = n.childContextTypes, n != null;
    }
    function Cl() {
      Ge(ln), Ge(wt);
    }
    function Fo(n, a, u) {
      if (wt.current !== sr) throw Error(j(168));
      qe(wt, a), qe(ln, u);
    }
    function Ao(n, a, u) {
      var o = n.stateNode;
      if (a = a.childContextTypes, typeof o.getChildContext != "function") return u;
      o = o.getChildContext();
      for (var c in o) if (!(c in a)) throw Error(j(108, De(n) || "Unknown", c));
      return lt({}, u, o);
    }
    function ku(n) {
      return n = (n = n.stateNode) && n.__reactInternalMemoizedMergedChildContext || sr, Ba = wt.current, qe(wt, n), qe(ln, ln.current), !0;
    }
    function Iu(n, a, u) {
      var o = n.stateNode;
      if (!o) throw Error(j(169));
      u ? (n = Ao(n, a, Ba), o.__reactInternalMemoizedMergedChildContext = n, Ge(ln), Ge(wt), qe(wt, n)) : Ge(ln), qe(ln, u);
    }
    var un = Math.clz32 ? Math.clz32 : $u, gd = Math.log, En = Math.LN2;
    function $u(n) {
      return n >>>= 0, n === 0 ? 32 : 31 - (gd(n) / En | 0) | 0;
    }
    var Wt = 64, ei = 4194304;
    function cu(n) {
      switch (n & -n) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return n & 4194240;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          return n & 130023424;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 1073741824;
        default:
          return n;
      }
    }
    function ti(n, a) {
      var u = n.pendingLanes;
      if (u === 0) return 0;
      var o = 0, c = n.suspendedLanes, f = n.pingedLanes, m = u & 268435455;
      if (m !== 0) {
        var g = m & ~c;
        g !== 0 ? o = cu(g) : (f &= m, f !== 0 && (o = cu(f)));
      } else m = u & ~c, m !== 0 ? o = cu(m) : f !== 0 && (o = cu(f));
      if (o === 0) return 0;
      if (a !== 0 && a !== o && !(a & c) && (c = o & -o, f = a & -a, c >= f || c === 16 && (f & 4194240) !== 0)) return a;
      if (o & 4 && (o |= u & 16), a = n.entangledLanes, a !== 0) for (n = n.entanglements, a &= o; 0 < a; ) u = 31 - un(a), c = 1 << u, o |= n[u], a &= ~c;
      return o;
    }
    function Ed(n, a) {
      switch (n) {
        case 1:
        case 2:
        case 4:
          return a + 250;
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return a + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          return -1;
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function xd(n, a) {
      for (var u = n.suspendedLanes, o = n.pingedLanes, c = n.expirationTimes, f = n.pendingLanes; 0 < f; ) {
        var m = 31 - un(f), g = 1 << m, z = c[m];
        z === -1 ? (!(g & u) || g & o) && (c[m] = Ed(g, a)) : z <= a && (n.expiredLanes |= g), f &= ~g;
      }
    }
    function jo(n) {
      return n = n.pendingLanes & -1073741825, n !== 0 ? n : n & 1073741824 ? 1073741824 : 0;
    }
    function Jr() {
      var n = Wt;
      return Wt <<= 1, !(Wt & 4194240) && (Wt = 64), n;
    }
    function Vo(n) {
      for (var a = [], u = 0; 31 > u; u++) a.push(n);
      return a;
    }
    function fu(n, a, u) {
      n.pendingLanes |= a, a !== 536870912 && (n.suspendedLanes = 0, n.pingedLanes = 0), n = n.eventTimes, a = 31 - un(a), n[a] = u;
    }
    function Rd(n, a) {
      var u = n.pendingLanes & ~a;
      n.pendingLanes = a, n.suspendedLanes = 0, n.pingedLanes = 0, n.expiredLanes &= a, n.mutableReadLanes &= a, n.entangledLanes &= a, a = n.entanglements;
      var o = n.eventTimes;
      for (n = n.expirationTimes; 0 < u; ) {
        var c = 31 - un(u), f = 1 << c;
        a[c] = 0, o[c] = -1, n[c] = -1, u &= ~f;
      }
    }
    function Xr(n, a) {
      var u = n.entangledLanes |= a;
      for (n = n.entanglements; u; ) {
        var o = 31 - un(u), c = 1 << o;
        c & a | n[o] & a && (n[o] |= a), u &= ~c;
      }
    }
    var ze = 0;
    function sc(n) {
      return n &= -n, 1 < n ? 4 < n ? n & 268435455 ? 16 : 536870912 : 4 : 1;
    }
    var Bo = Ie.unstable_scheduleCallback, cc = Ie.unstable_cancelCallback, Td = Ie.unstable_shouldYield, Cd = Ie.unstable_requestPaint, gt = Ie.unstable_now, Qo = Ie.unstable_ImmediatePriority, Dd = Ie.unstable_UserBlockingPriority, wo = Ie.unstable_NormalPriority, zd = Ie.unstable_IdlePriority, ni = null, $n = null;
    function Nd(n) {
      if ($n && typeof $n.onCommitFiberRoot == "function") try {
        $n.onCommitFiberRoot(ni, n, void 0, (n.current.flags & 128) === 128);
      } catch {
      }
    }
    function Ud(n, a) {
      return n === a && (n !== 0 || 1 / n === 1 / a) || n !== n && a !== a;
    }
    var ea = typeof Object.is == "function" ? Object.is : Ud, Qa = null, ai = !1, qo = !1;
    function Yo(n) {
      Qa === null ? Qa = [n] : Qa.push(n);
    }
    function fc(n) {
      ai = !0, Yo(n);
    }
    function Sa() {
      if (!qo && Qa !== null) {
        qo = !0;
        var n = 0, a = ze;
        try {
          var u = Qa;
          for (ze = 1; n < u.length; n++) {
            var o = u[n];
            do
              o = o(!0);
            while (o !== null);
          }
          Qa = null, ai = !1;
        } catch (c) {
          throw Qa !== null && (Qa = Qa.slice(n + 1)), Bo(Qo, Sa), c;
        } finally {
          ze = a, qo = !1;
        }
      }
      return null;
    }
    var cr = [], Kr = 0, du = null, ri = 0, Bn = [], Qn = 0, fr = null, ta = 1, wa = "";
    function Zr(n, a) {
      cr[Kr++] = ri, cr[Kr++] = du, du = n, ri = a;
    }
    function vu(n, a, u) {
      Bn[Qn++] = ta, Bn[Qn++] = wa, Bn[Qn++] = fr, fr = n;
      var o = ta;
      n = wa;
      var c = 32 - un(o) - 1;
      o &= ~(1 << c), u += 1;
      var f = 32 - un(a) + c;
      if (30 < f) {
        var m = c - c % 5;
        f = (o & (1 << m) - 1).toString(32), o >>= m, c -= m, ta = 1 << 32 - un(a) + c | u << c | o, wa = f + n;
      } else ta = 1 << f | u << c | o, wa = n;
    }
    function Go(n) {
      n.return !== null && (Zr(n, 1), vu(n, 1, 0));
    }
    function Jo(n) {
      for (; n === du; ) du = cr[--Kr], cr[Kr] = null, ri = cr[--Kr], cr[Kr] = null;
      for (; n === fr; ) fr = Bn[--Qn], Bn[Qn] = null, wa = Bn[--Qn], Bn[Qn] = null, ta = Bn[--Qn], Bn[Qn] = null;
    }
    var xn = null, wn = null, Pe = !1, pu = !1, na = null;
    function dc(n, a) {
      var u = Hn(5, null, null, 0);
      u.elementType = "DELETED", u.stateNode = a, u.return = n, a = n.deletions, a === null ? (n.deletions = [u], n.flags |= 16) : a.push(u);
    }
    function vc(n, a) {
      switch (n.tag) {
        case 5:
          return a = wr(a, n.type, n.pendingProps), a !== null ? (n.stateNode = a, xn = n, wn = qr(a), !0) : !1;
        case 6:
          return a = No(a, n.pendingProps), a !== null ? (n.stateNode = a, xn = n, wn = null, !0) : !1;
        case 13:
          if (a = md(a), a !== null) {
            var u = fr !== null ? { id: ta, overflow: wa } : null;
            return n.memoizedState = { dehydrated: a, treeContext: u, retryLane: 1073741824 }, u = Hn(18, null, null, 0), u.stateNode = a, u.return = n, n.child = u, xn = n, wn = null, !0;
          }
          return !1;
        default:
          return !1;
      }
    }
    function Xo(n) {
      return (n.mode & 1) !== 0 && (n.flags & 128) === 0;
    }
    function Ko(n) {
      if (Pe) {
        var a = wn;
        if (a) {
          var u = a;
          if (!vc(n, a)) {
            if (Xo(n)) throw Error(j(418));
            a = Rl(u);
            var o = xn;
            a && vc(n, a) ? dc(o, u) : (n.flags = n.flags & -4097 | 2, Pe = !1, xn = n);
          }
        } else {
          if (Xo(n)) throw Error(j(418));
          n.flags = n.flags & -4097 | 2, Pe = !1, xn = n;
        }
      }
    }
    function pc(n) {
      for (n = n.return; n !== null && n.tag !== 5 && n.tag !== 3 && n.tag !== 13; ) n = n.return;
      xn = n;
    }
    function li(n) {
      if (!rn || n !== xn) return !1;
      if (!Pe) return pc(n), Pe = !0, !1;
      if (n.tag !== 3 && (n.tag !== 5 || yd(n.type) && !rr(n.type, n.memoizedProps))) {
        var a = wn;
        if (a) {
          if (Xo(n)) throw mc(), Error(j(418));
          for (; a; ) dc(n, a), a = Rl(a);
        }
      }
      if (pc(n), n.tag === 13) {
        if (!rn) throw Error(j(316));
        if (n = n.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(j(317));
        wn = su(n);
      } else wn = xn ? Rl(n.stateNode) : null;
      return !0;
    }
    function mc() {
      for (var n = wn; n; ) n = Rl(n);
    }
    function Dl() {
      rn && (wn = xn = null, pu = Pe = !1);
    }
    function Zo(n) {
      na === null ? na = [n] : na.push(n);
    }
    var _d = va.ReactCurrentBatchConfig;
    function ui(n, a) {
      if (ea(n, a)) return !0;
      if (typeof n != "object" || n === null || typeof a != "object" || a === null) return !1;
      var u = Object.keys(n), o = Object.keys(a);
      if (u.length !== o.length) return !1;
      for (o = 0; o < u.length; o++) {
        var c = u[o];
        if (!oc.call(a, c) || !ea(n[c], a[c])) return !1;
      }
      return !0;
    }
    function Md(n) {
      switch (n.tag) {
        case 5:
          return Yr(n.type);
        case 16:
          return Yr("Lazy");
        case 13:
          return Yr("Suspense");
        case 19:
          return Yr("SuspenseList");
        case 0:
        case 2:
        case 15:
          return n = Lo(n.type, !1), n;
        case 11:
          return n = Lo(n.type.render, !1), n;
        case 1:
          return n = Lo(n.type, !0), n;
        default:
          return "";
      }
    }
    function mu(n, a, u) {
      if (n = u.ref, n !== null && typeof n != "function" && typeof n != "object") {
        if (u._owner) {
          if (u = u._owner, u) {
            if (u.tag !== 1) throw Error(j(309));
            var o = u.stateNode;
          }
          if (!o) throw Error(j(147, n));
          var c = o, f = "" + n;
          return a !== null && a.ref !== null && typeof a.ref == "function" && a.ref._stringRef === f ? a.ref : (a = function(m) {
            var g = c.refs;
            m === null ? delete g[f] : g[f] = m;
          }, a._stringRef = f, a);
        }
        if (typeof n != "string") throw Error(j(284));
        if (!u._owner) throw Error(j(290, n));
      }
      return n;
    }
    function ii(n, a) {
      throw n = Object.prototype.toString.call(a), Error(j(31, n === "[object Object]" ? "object with keys {" + Object.keys(a).join(", ") + "}" : n));
    }
    function hc(n) {
      var a = n._init;
      return a(n._payload);
    }
    function yc(n) {
      function a(R, S) {
        if (n) {
          var U = R.deletions;
          U === null ? (R.deletions = [S], R.flags |= 16) : U.push(S);
        }
      }
      function u(R, S) {
        if (!n) return null;
        for (; S !== null; ) a(R, S), S = S.sibling;
        return null;
      }
      function o(R, S) {
        for (R = /* @__PURE__ */ new Map(); S !== null; ) S.key !== null ? R.set(S.key, S) : R.set(S.index, S), S = S.sibling;
        return R;
      }
      function c(R, S) {
        return R = Ka(R, S), R.index = 0, R.sibling = null, R;
      }
      function f(R, S, U) {
        return R.index = U, n ? (U = R.alternate, U !== null ? (U = U.index, U < S ? (R.flags |= 2, S) : U) : (R.flags |= 2, S)) : (R.flags |= 1048576, S);
      }
      function m(R) {
        return n && R.alternate === null && (R.flags |= 2), R;
      }
      function g(R, S, U, w) {
        return S === null || S.tag !== 6 ? (S = Lu(U, R.mode, w), S.return = R, S) : (S = c(S, U), S.return = R, S);
      }
      function z(R, S, U, w) {
        var k = U.type;
        return k === Ar ? Q(R, S, U.props.children, w, U.key) : S !== null && (S.elementType === k || typeof k == "object" && k !== null && k.$$typeof === pa && hc(k) === S.type) ? (w = c(S, U.props), w.ref = mu(R, S, U), w.return = R, w) : (w = Hu(U.type, U.key, U.props, null, R.mode, w), w.ref = mu(R, S, U), w.return = R, w);
      }
      function A(R, S, U, w) {
        return S === null || S.tag !== 4 || S.stateNode.containerInfo !== U.containerInfo || S.stateNode.implementation !== U.implementation ? (S = ys(U, R.mode, w), S.return = R, S) : (S = c(S, U.children || []), S.return = R, S);
      }
      function Q(R, S, U, w, k) {
        return S === null || S.tag !== 7 ? (S = Za(U, R.mode, w, k), S.return = R, S) : (S = c(S, U), S.return = R, S);
      }
      function re(R, S, U) {
        if (typeof S == "string" && S !== "" || typeof S == "number") return S = Lu("" + S, R.mode, U), S.return = R, S;
        if (typeof S == "object" && S !== null) {
          switch (S.$$typeof) {
            case Wn:
              return U = Hu(S.type, S.key, S.props, null, R.mode, U), U.ref = mu(R, null, S), U.return = R, U;
            case D:
              return S = ys(S, R.mode, U), S.return = R, S;
            case pa:
              var w = S._init;
              return re(R, w(S._payload), U);
          }
          if (bn(S) || se(S)) return S = Za(S, R.mode, U, null), S.return = R, S;
          ii(R, S);
        }
        return null;
      }
      function J(R, S, U, w) {
        var k = S !== null ? S.key : null;
        if (typeof U == "string" && U !== "" || typeof U == "number") return k !== null ? null : g(R, S, "" + U, w);
        if (typeof U == "object" && U !== null) {
          switch (U.$$typeof) {
            case Wn:
              return U.key === k ? z(R, S, U, w) : null;
            case D:
              return U.key === k ? A(R, S, U, w) : null;
            case pa:
              return k = U._init, J(
                R,
                S,
                k(U._payload),
                w
              );
          }
          if (bn(U) || se(U)) return k !== null ? null : Q(R, S, U, w, null);
          ii(R, U);
        }
        return null;
      }
      function Ke(R, S, U, w, k) {
        if (typeof w == "string" && w !== "" || typeof w == "number") return R = R.get(U) || null, g(S, R, "" + w, k);
        if (typeof w == "object" && w !== null) {
          switch (w.$$typeof) {
            case Wn:
              return R = R.get(w.key === null ? U : w.key) || null, z(S, R, w, k);
            case D:
              return R = R.get(w.key === null ? U : w.key) || null, A(S, R, w, k);
            case pa:
              var oe = w._init;
              return Ke(R, S, U, oe(w._payload), k);
          }
          if (bn(w) || se(w)) return R = R.get(U) || null, Q(S, R, w, k, null);
          ii(S, w);
        }
        return null;
      }
      function de(R, S, U, w) {
        for (var k = null, oe = null, le = S, ye = S = 0, $e = null; le !== null && ye < U.length; ye++) {
          le.index > ye ? ($e = le, le = null) : $e = le.sibling;
          var Se = J(R, le, U[ye], w);
          if (Se === null) {
            le === null && (le = $e);
            break;
          }
          n && le && Se.alternate === null && a(R, le), S = f(Se, S, ye), oe === null ? k = Se : oe.sibling = Se, oe = Se, le = $e;
        }
        if (ye === U.length) return u(R, le), Pe && Zr(R, ye), k;
        if (le === null) {
          for (; ye < U.length; ye++) le = re(R, U[ye], w), le !== null && (S = f(le, S, ye), oe === null ? k = le : oe.sibling = le, oe = le);
          return Pe && Zr(R, ye), k;
        }
        for (le = o(R, le); ye < U.length; ye++) $e = Ke(le, R, ye, U[ye], w), $e !== null && (n && $e.alternate !== null && le.delete($e.key === null ? ye : $e.key), S = f($e, S, ye), oe === null ? k = $e : oe.sibling = $e, oe = $e);
        return n && le.forEach(function(mn) {
          return a(R, mn);
        }), Pe && Zr(R, ye), k;
      }
      function Te(R, S, U, w) {
        var k = se(U);
        if (typeof k != "function") throw Error(j(150));
        if (U = k.call(U), U == null) throw Error(j(151));
        for (var oe = k = null, le = S, ye = S = 0, $e = null, Se = U.next(); le !== null && !Se.done; ye++, Se = U.next()) {
          le.index > ye ? ($e = le, le = null) : $e = le.sibling;
          var mn = J(R, le, Se.value, w);
          if (mn === null) {
            le === null && (le = $e);
            break;
          }
          n && le && mn.alternate === null && a(R, le), S = f(mn, S, ye), oe === null ? k = mn : oe.sibling = mn, oe = mn, le = $e;
        }
        if (Se.done) return u(
          R,
          le
        ), Pe && Zr(R, ye), k;
        if (le === null) {
          for (; !Se.done; ye++, Se = U.next()) Se = re(R, Se.value, w), Se !== null && (S = f(Se, S, ye), oe === null ? k = Se : oe.sibling = Se, oe = Se);
          return Pe && Zr(R, ye), k;
        }
        for (le = o(R, le); !Se.done; ye++, Se = U.next()) Se = Ke(le, R, ye, Se.value, w), Se !== null && (n && Se.alternate !== null && le.delete(Se.key === null ? ye : Se.key), S = f(Se, S, ye), oe === null ? k = Se : oe.sibling = Se, oe = Se);
        return n && le.forEach(function(eo) {
          return a(R, eo);
        }), Pe && Zr(R, ye), k;
      }
      function Pa(R, S, U, w) {
        if (typeof U == "object" && U !== null && U.type === Ar && U.key === null && (U = U.props.children), typeof U == "object" && U !== null) {
          switch (U.$$typeof) {
            case Wn:
              e: {
                for (var k = U.key, oe = S; oe !== null; ) {
                  if (oe.key === k) {
                    if (k = U.type, k === Ar) {
                      if (oe.tag === 7) {
                        u(R, oe.sibling), S = c(oe, U.props.children), S.return = R, R = S;
                        break e;
                      }
                    } else if (oe.elementType === k || typeof k == "object" && k !== null && k.$$typeof === pa && hc(k) === oe.type) {
                      u(R, oe.sibling), S = c(oe, U.props), S.ref = mu(R, oe, U), S.return = R, R = S;
                      break e;
                    }
                    u(R, oe);
                    break;
                  } else a(R, oe);
                  oe = oe.sibling;
                }
                U.type === Ar ? (S = Za(U.props.children, R.mode, w, U.key), S.return = R, R = S) : (w = Hu(U.type, U.key, U.props, null, R.mode, w), w.ref = mu(R, S, U), w.return = R, R = w);
              }
              return m(R);
            case D:
              e: {
                for (oe = U.key; S !== null; ) {
                  if (S.key === oe) if (S.tag === 4 && S.stateNode.containerInfo === U.containerInfo && S.stateNode.implementation === U.implementation) {
                    u(R, S.sibling), S = c(S, U.children || []), S.return = R, R = S;
                    break e;
                  } else {
                    u(R, S);
                    break;
                  }
                  else a(R, S);
                  S = S.sibling;
                }
                S = ys(U, R.mode, w), S.return = R, R = S;
              }
              return m(R);
            case pa:
              return oe = U._init, Pa(R, S, oe(U._payload), w);
          }
          if (bn(U)) return de(R, S, U, w);
          if (se(U)) return Te(R, S, U, w);
          ii(R, U);
        }
        return typeof U == "string" && U !== "" || typeof U == "number" ? (U = "" + U, S !== null && S.tag === 6 ? (u(R, S.sibling), S = c(S, U), S.return = R, R = S) : (u(R, S), S = Lu(U, R.mode, w), S.return = R, R = S), m(R)) : u(R, S);
      }
      return Pa;
    }
    var zl = yc(!0), Sc = yc(!1), oi = ya(null), si = null, ga = null, ci = null;
    function fi() {
      ci = ga = si = null;
    }
    function Po(n, a, u) {
      lr ? (qe(oi, a._currentValue), a._currentValue = u) : (qe(oi, a._currentValue2), a._currentValue2 = u);
    }
    function di(n) {
      var a = oi.current;
      Ge(oi), lr ? n._currentValue = a : n._currentValue2 = a;
    }
    function vi(n, a, u) {
      for (; n !== null; ) {
        var o = n.alternate;
        if ((n.childLanes & a) !== a ? (n.childLanes |= a, o !== null && (o.childLanes |= a)) : o !== null && (o.childLanes & a) !== a && (o.childLanes |= a), n === u) break;
        n = n.return;
      }
    }
    function Pr(n, a) {
      si = n, ci = ga = null, n = n.dependencies, n !== null && n.firstContext !== null && (n.lanes & a && (xt = !0), n.firstContext = null);
    }
    function Rn(n) {
      var a = lr ? n._currentValue : n._currentValue2;
      if (ci !== n) if (n = { context: n, memoizedValue: a, next: null }, ga === null) {
        if (si === null) throw Error(j(308));
        ga = n, si.dependencies = { lanes: 0, firstContext: n };
      } else ga = ga.next = n;
      return a;
    }
    var dr = null;
    function Wo(n) {
      dr === null ? dr = [n] : dr.push(n);
    }
    function gc(n, a, u, o) {
      var c = a.interleaved;
      return c === null ? (u.next = u, Wo(a)) : (u.next = c.next, c.next = u), a.interleaved = u, qn(n, o);
    }
    function qn(n, a) {
      n.lanes |= a;
      var u = n.alternate;
      for (u !== null && (u.lanes |= a), u = n, n = n.return; n !== null; ) n.childLanes |= a, u = n.alternate, u !== null && (u.childLanes |= a), u = n, n = n.return;
      return u.tag === 3 ? u.stateNode : null;
    }
    var Ea = !1;
    function xa(n) {
      n.updateQueue = { baseState: n.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
    }
    function pi(n, a) {
      n = n.updateQueue, a.updateQueue === n && (a.updateQueue = { baseState: n.baseState, firstBaseUpdate: n.firstBaseUpdate, lastBaseUpdate: n.lastBaseUpdate, shared: n.shared, effects: n.effects });
    }
    function Yn(n, a) {
      return { eventTime: n, lane: a, tag: 0, payload: null, callback: null, next: null };
    }
    function vr(n, a, u) {
      var o = n.updateQueue;
      if (o === null) return null;
      if (o = o.shared, pe & 2) {
        var c = o.pending;
        return c === null ? a.next = a : (a.next = c.next, c.next = a), o.pending = a, qn(n, u);
      }
      return c = o.interleaved, c === null ? (a.next = a, Wo(o)) : (a.next = c.next, c.next = a), o.interleaved = a, qn(n, u);
    }
    function Nl(n, a, u) {
      if (a = a.updateQueue, a !== null && (a = a.shared, (u & 4194240) !== 0)) {
        var o = a.lanes;
        o &= n.pendingLanes, u |= o, a.lanes = u, Xr(n, u);
      }
    }
    function Ec(n, a) {
      var u = n.updateQueue, o = n.alternate;
      if (o !== null && (o = o.updateQueue, u === o)) {
        var c = null, f = null;
        if (u = u.firstBaseUpdate, u !== null) {
          do {
            var m = { eventTime: u.eventTime, lane: u.lane, tag: u.tag, payload: u.payload, callback: u.callback, next: null };
            f === null ? c = f = m : f = f.next = m, u = u.next;
          } while (u !== null);
          f === null ? c = f = a : f = f.next = a;
        } else c = f = a;
        u = { baseState: o.baseState, firstBaseUpdate: c, lastBaseUpdate: f, shared: o.shared, effects: o.effects }, n.updateQueue = u;
        return;
      }
      n = u.lastBaseUpdate, n === null ? u.firstBaseUpdate = a : n.next = a, u.lastBaseUpdate = a;
    }
    function Ul(n, a, u, o) {
      var c = n.updateQueue;
      Ea = !1;
      var f = c.firstBaseUpdate, m = c.lastBaseUpdate, g = c.shared.pending;
      if (g !== null) {
        c.shared.pending = null;
        var z = g, A = z.next;
        z.next = null, m === null ? f = A : m.next = A, m = z;
        var Q = n.alternate;
        Q !== null && (Q = Q.updateQueue, g = Q.lastBaseUpdate, g !== m && (g === null ? Q.firstBaseUpdate = A : g.next = A, Q.lastBaseUpdate = z));
      }
      if (f !== null) {
        var re = c.baseState;
        m = 0, Q = A = z = null, g = f;
        do {
          var J = g.lane, Ke = g.eventTime;
          if ((o & J) === J) {
            Q !== null && (Q = Q.next = {
              eventTime: Ke,
              lane: 0,
              tag: g.tag,
              payload: g.payload,
              callback: g.callback,
              next: null
            });
            e: {
              var de = n, Te = g;
              switch (J = a, Ke = u, Te.tag) {
                case 1:
                  if (de = Te.payload, typeof de == "function") {
                    re = de.call(Ke, re, J);
                    break e;
                  }
                  re = de;
                  break e;
                case 3:
                  de.flags = de.flags & -65537 | 128;
                case 0:
                  if (de = Te.payload, J = typeof de == "function" ? de.call(Ke, re, J) : de, J == null) break e;
                  re = lt({}, re, J);
                  break e;
                case 2:
                  Ea = !0;
              }
            }
            g.callback !== null && g.lane !== 0 && (n.flags |= 64, J = c.effects, J === null ? c.effects = [g] : J.push(g));
          } else Ke = { eventTime: Ke, lane: J, tag: g.tag, payload: g.payload, callback: g.callback, next: null }, Q === null ? (A = Q = Ke, z = re) : Q = Q.next = Ke, m |= J;
          if (g = g.next, g === null) {
            if (g = c.shared.pending, g === null) break;
            J = g, g = J.next, J.next = null, c.lastBaseUpdate = J, c.shared.pending = null;
          }
        } while (!0);
        if (Q === null && (z = re), c.baseState = z, c.firstBaseUpdate = A, c.lastBaseUpdate = Q, a = c.shared.interleaved, a !== null) {
          c = a;
          do
            m |= c.lane, c = c.next;
          while (c !== a);
        } else f === null && (c.shared.lanes = 0);
        ol |= m, n.lanes = m, n.memoizedState = re;
      }
    }
    function xc(n, a, u) {
      if (n = a.effects, a.effects = null, n !== null) for (a = 0; a < n.length; a++) {
        var o = n[a], c = o.callback;
        if (c !== null) {
          if (o.callback = null, o = u, typeof c != "function") throw Error(j(191, c));
          c.call(o);
        }
      }
    }
    var Wr = {}, Tn = ya(Wr), _l = ya(Wr), br = ya(Wr);
    function Cn(n) {
      if (n === Wr) throw Error(j(174));
      return n;
    }
    function Dn(n, a) {
      qe(br, a), qe(_l, n), qe(Tn, Wr), n = kn(a), Ge(Tn), qe(Tn, n);
    }
    function pr() {
      Ge(Tn), Ge(_l), Ge(br);
    }
    function hu(n) {
      var a = Cn(br.current), u = Cn(Tn.current);
      a = Qe(u, n.type, a), u !== a && (qe(_l, n), qe(Tn, a));
    }
    function aa(n) {
      _l.current === n && (Ge(Tn), Ge(_l));
    }
    var Me = ya(0);
    function pt(n) {
      for (var a = n; a !== null; ) {
        if (a.tag === 13) {
          var u = a.memoizedState;
          if (u !== null && (u = u.dehydrated, u === null || iu(u) || Ut(u))) return a;
        } else if (a.tag === 19 && a.memoizedProps.revealOrder !== void 0) {
          if (a.flags & 128) return a;
        } else if (a.child !== null) {
          a.child.return = a, a = a.child;
          continue;
        }
        if (a === n) break;
        for (; a.sibling === null; ) {
          if (a.return === null || a.return === n) return null;
          a = a.return;
        }
        a.sibling.return = a.return, a = a.sibling;
      }
      return null;
    }
    var mt = [];
    function yu() {
      for (var n = 0; n < mt.length; n++) {
        var a = mt[n];
        lr ? a._workInProgressVersionPrimary = null : a._workInProgressVersionSecondary = null;
      }
      mt.length = 0;
    }
    var qt = va.ReactCurrentDispatcher, ra = va.ReactCurrentBatchConfig, Yt = 0, Je = null, We = null, ht = null, qa = !1, mr = !1, on = 0, mi = 0;
    function Et() {
      throw Error(j(321));
    }
    function hi(n, a) {
      if (a === null) return !1;
      for (var u = 0; u < a.length && u < n.length; u++) if (!ea(n[u], a[u])) return !1;
      return !0;
    }
    function yi(n, a, u, o, c, f) {
      if (Yt = f, Je = a, a.memoizedState = null, a.updateQueue = null, a.lanes = 0, qt.current = n === null || n.memoizedState === null ? es : ts, n = u(o, c), mr) {
        f = 0;
        do {
          if (mr = !1, on = 0, 25 <= f) throw Error(j(301));
          f += 1, ht = We = null, a.updateQueue = null, qt.current = ns, n = u(o, c);
        } while (mr);
      }
      if (qt.current = Ll, a = We !== null && We.next !== null, Yt = 0, ht = We = Je = null, qa = !1, a) throw Error(j(300));
      return n;
    }
    function Ml() {
      var n = on !== 0;
      return on = 0, n;
    }
    function la() {
      var n = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
      return ht === null ? Je.memoizedState = ht = n : ht = ht.next = n, ht;
    }
    function Gn() {
      if (We === null) {
        var n = Je.alternate;
        n = n !== null ? n.memoizedState : null;
      } else n = We.next;
      var a = ht === null ? Je.memoizedState : ht.next;
      if (a !== null) ht = a, We = n;
      else {
        if (n === null) throw Error(j(310));
        We = n, n = { memoizedState: We.memoizedState, baseState: We.baseState, baseQueue: We.baseQueue, queue: We.queue, next: null }, ht === null ? Je.memoizedState = ht = n : ht = ht.next = n;
      }
      return ht;
    }
    function Ra(n, a) {
      return typeof a == "function" ? a(n) : a;
    }
    function Si(n) {
      var a = Gn(), u = a.queue;
      if (u === null) throw Error(j(311));
      u.lastRenderedReducer = n;
      var o = We, c = o.baseQueue, f = u.pending;
      if (f !== null) {
        if (c !== null) {
          var m = c.next;
          c.next = f.next, f.next = m;
        }
        o.baseQueue = c = f, u.pending = null;
      }
      if (c !== null) {
        f = c.next, o = o.baseState;
        var g = m = null, z = null, A = f;
        do {
          var Q = A.lane;
          if ((Yt & Q) === Q) z !== null && (z = z.next = { lane: 0, action: A.action, hasEagerState: A.hasEagerState, eagerState: A.eagerState, next: null }), o = A.hasEagerState ? A.eagerState : n(o, A.action);
          else {
            var re = {
              lane: Q,
              action: A.action,
              hasEagerState: A.hasEagerState,
              eagerState: A.eagerState,
              next: null
            };
            z === null ? (g = z = re, m = o) : z = z.next = re, Je.lanes |= Q, ol |= Q;
          }
          A = A.next;
        } while (A !== null && A !== f);
        z === null ? m = o : z.next = g, ea(o, a.memoizedState) || (xt = !0), a.memoizedState = o, a.baseState = m, a.baseQueue = z, u.lastRenderedState = o;
      }
      if (n = u.interleaved, n !== null) {
        c = n;
        do
          f = c.lane, Je.lanes |= f, ol |= f, c = c.next;
        while (c !== n);
      } else c === null && (u.lanes = 0);
      return [a.memoizedState, u.dispatch];
    }
    function I(n) {
      var a = Gn(), u = a.queue;
      if (u === null) throw Error(j(311));
      u.lastRenderedReducer = n;
      var o = u.dispatch, c = u.pending, f = a.memoizedState;
      if (c !== null) {
        u.pending = null;
        var m = c = c.next;
        do
          f = n(f, m.action), m = m.next;
        while (m !== c);
        ea(f, a.memoizedState) || (xt = !0), a.memoizedState = f, a.baseQueue === null && (a.baseState = f), u.lastRenderedState = f;
      }
      return [f, o];
    }
    function he() {
    }
    function Ue(n, a) {
      var u = Je, o = Gn(), c = a(), f = !ea(o.memoizedState, c);
      if (f && (o.memoizedState = c, xt = !0), o = o.queue, ia(bo.bind(null, u, o, n), [n]), o.getSnapshot !== a || f || ht !== null && ht.memoizedState.tag & 1) {
        if (u.flags |= 2048, kr(9, ua.bind(null, u, o, c, a), void 0, null), Tt === null) throw Error(j(349));
        Yt & 30 || be(u, a, c);
      }
      return c;
    }
    function be(n, a, u) {
      n.flags |= 16384, n = { getSnapshot: a, value: u }, a = Je.updateQueue, a === null ? (a = { lastEffect: null, stores: null }, Je.updateQueue = a, a.stores = [n]) : (u = a.stores, u === null ? a.stores = [n] : u.push(n));
    }
    function ua(n, a, u, o) {
      a.value = u, a.getSnapshot = o, Rc(a) && Tc(n);
    }
    function bo(n, a, u) {
      return u(function() {
        Rc(a) && Tc(n);
      });
    }
    function Rc(n) {
      var a = n.getSnapshot;
      n = n.value;
      try {
        var u = a();
        return !ea(n, u);
      } catch {
        return !0;
      }
    }
    function Tc(n) {
      var a = qn(n, 1);
      a !== null && Ot(a, n, 1, -1);
    }
    function Cc(n) {
      var a = la();
      return typeof n == "function" && (n = n()), a.memoizedState = a.baseState = n, n = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Ra, lastRenderedState: n }, a.queue = n, n = n.dispatch = $o.bind(null, Je, n), [a.memoizedState, n];
    }
    function kr(n, a, u, o) {
      return n = { tag: n, create: a, destroy: u, deps: o, next: null }, a = Je.updateQueue, a === null ? (a = { lastEffect: null, stores: null }, Je.updateQueue = a, a.lastEffect = n.next = n) : (u = a.lastEffect, u === null ? a.lastEffect = n.next = n : (o = u.next, u.next = n, n.next = o, a.lastEffect = n)), n;
    }
    function O() {
      return Gn().memoizedState;
    }
    function et(n, a, u, o) {
      var c = la();
      Je.flags |= n, c.memoizedState = kr(1 | a, u, void 0, o === void 0 ? null : o);
    }
    function ee(n, a, u, o) {
      var c = Gn();
      o = o === void 0 ? null : o;
      var f = void 0;
      if (We !== null) {
        var m = We.memoizedState;
        if (f = m.destroy, o !== null && hi(o, m.deps)) {
          c.memoizedState = kr(a, u, f, o);
          return;
        }
      }
      Je.flags |= n, c.memoizedState = kr(1 | a, u, f, o);
    }
    function Ir(n, a) {
      return et(8390656, 8, n, a);
    }
    function ia(n, a) {
      return ee(2048, 8, n, a);
    }
    function hr(n, a) {
      return ee(4, 2, n, a);
    }
    function oa(n, a) {
      return ee(4, 4, n, a);
    }
    function Hl(n, a) {
      if (typeof a == "function") return n = n(), a(n), function() {
        a(null);
      };
      if (a != null) return n = n(), a.current = n, function() {
        a.current = null;
      };
    }
    function $r(n, a, u) {
      return u = u != null ? u.concat([n]) : null, ee(4, 4, Hl.bind(null, a, n), u);
    }
    function el() {
    }
    function gi(n, a) {
      var u = Gn();
      a = a === void 0 ? null : a;
      var o = u.memoizedState;
      return o !== null && a !== null && hi(a, o[1]) ? o[0] : (u.memoizedState = [n, a], n);
    }
    function Ei(n, a) {
      var u = Gn();
      a = a === void 0 ? null : a;
      var o = u.memoizedState;
      return o !== null && a !== null && hi(a, o[1]) ? o[0] : (n = n(), u.memoizedState = [n, a], n);
    }
    function xi(n, a, u) {
      return Yt & 21 ? (ea(u, a) || (u = Jr(), Je.lanes |= u, ol |= u, n.baseState = !0), a) : (n.baseState && (n.baseState = !1, xt = !0), n.memoizedState = u);
    }
    function ko(n, a) {
      var u = ze;
      ze = u !== 0 && 4 > u ? u : 4, n(!0);
      var o = ra.transition;
      ra.transition = {};
      try {
        n(!1), a();
      } finally {
        ze = u, ra.transition = o;
      }
    }
    function Ri() {
      return Gn().memoizedState;
    }
    function Io(n, a, u) {
      var o = Ja(n);
      if (u = { lane: o, action: u, hasEagerState: !1, eagerState: null, next: null }, Ti(n)) Ci(a, u);
      else if (u = gc(n, a, u, o), u !== null) {
        var c = Xe();
        Ot(u, n, o, c), Di(u, a, o);
      }
    }
    function $o(n, a, u) {
      var o = Ja(n), c = { lane: o, action: u, hasEagerState: !1, eagerState: null, next: null };
      if (Ti(n)) Ci(a, c);
      else {
        var f = n.alternate;
        if (n.lanes === 0 && (f === null || f.lanes === 0) && (f = a.lastRenderedReducer, f !== null)) try {
          var m = a.lastRenderedState, g = f(m, u);
          if (c.hasEagerState = !0, c.eagerState = g, ea(g, m)) {
            var z = a.interleaved;
            z === null ? (c.next = c, Wo(a)) : (c.next = z.next, z.next = c), a.interleaved = c;
            return;
          }
        } catch {
        } finally {
        }
        u = gc(n, a, c, o), u !== null && (c = Xe(), Ot(u, n, o, c), Di(u, a, o));
      }
    }
    function Ti(n) {
      var a = n.alternate;
      return n === Je || a !== null && a === Je;
    }
    function Ci(n, a) {
      mr = qa = !0;
      var u = n.pending;
      u === null ? a.next = a : (a.next = u.next, u.next = a), n.pending = a;
    }
    function Di(n, a, u) {
      if (u & 4194240) {
        var o = a.lanes;
        o &= n.pendingLanes, u |= o, a.lanes = u, Xr(n, u);
      }
    }
    var Ll = { readContext: Rn, useCallback: Et, useContext: Et, useEffect: Et, useImperativeHandle: Et, useInsertionEffect: Et, useLayoutEffect: Et, useMemo: Et, useReducer: Et, useRef: Et, useState: Et, useDebugValue: Et, useDeferredValue: Et, useTransition: Et, useMutableSource: Et, useSyncExternalStore: Et, useId: Et, unstable_isNewReconciler: !1 }, es = { readContext: Rn, useCallback: function(n, a) {
      return la().memoizedState = [n, a === void 0 ? null : a], n;
    }, useContext: Rn, useEffect: Ir, useImperativeHandle: function(n, a, u) {
      return u = u != null ? u.concat([n]) : null, et(
        4194308,
        4,
        Hl.bind(null, a, n),
        u
      );
    }, useLayoutEffect: function(n, a) {
      return et(4194308, 4, n, a);
    }, useInsertionEffect: function(n, a) {
      return et(4, 2, n, a);
    }, useMemo: function(n, a) {
      var u = la();
      return a = a === void 0 ? null : a, n = n(), u.memoizedState = [n, a], n;
    }, useReducer: function(n, a, u) {
      var o = la();
      return a = u !== void 0 ? u(a) : a, o.memoizedState = o.baseState = a, n = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: n, lastRenderedState: a }, o.queue = n, n = n.dispatch = Io.bind(null, Je, n), [o.memoizedState, n];
    }, useRef: function(n) {
      var a = la();
      return n = { current: n }, a.memoizedState = n;
    }, useState: Cc, useDebugValue: el, useDeferredValue: function(n) {
      return la().memoizedState = n;
    }, useTransition: function() {
      var n = Cc(!1), a = n[0];
      return n = ko.bind(null, n[1]), la().memoizedState = n, [a, n];
    }, useMutableSource: function() {
    }, useSyncExternalStore: function(n, a, u) {
      var o = Je, c = la();
      if (Pe) {
        if (u === void 0) throw Error(j(407));
        u = u();
      } else {
        if (u = a(), Tt === null) throw Error(j(349));
        Yt & 30 || be(o, a, u);
      }
      c.memoizedState = u;
      var f = { value: u, getSnapshot: a };
      return c.queue = f, Ir(bo.bind(
        null,
        o,
        f,
        n
      ), [n]), o.flags |= 2048, kr(9, ua.bind(null, o, f, u, a), void 0, null), u;
    }, useId: function() {
      var n = la(), a = Tt.identifierPrefix;
      if (Pe) {
        var u = wa, o = ta;
        u = (o & ~(1 << 32 - un(o) - 1)).toString(32) + u, a = ":" + a + "R" + u, u = on++, 0 < u && (a += "H" + u.toString(32)), a += ":";
      } else u = mi++, a = ":" + a + "r" + u.toString(32) + ":";
      return n.memoizedState = a;
    }, unstable_isNewReconciler: !1 }, ts = {
      readContext: Rn,
      useCallback: gi,
      useContext: Rn,
      useEffect: ia,
      useImperativeHandle: $r,
      useInsertionEffect: hr,
      useLayoutEffect: oa,
      useMemo: Ei,
      useReducer: Si,
      useRef: O,
      useState: function() {
        return Si(Ra);
      },
      useDebugValue: el,
      useDeferredValue: function(n) {
        var a = Gn();
        return xi(a, We.memoizedState, n);
      },
      useTransition: function() {
        var n = Si(Ra)[0], a = Gn().memoizedState;
        return [n, a];
      },
      useMutableSource: he,
      useSyncExternalStore: Ue,
      useId: Ri,
      unstable_isNewReconciler: !1
    }, ns = { readContext: Rn, useCallback: gi, useContext: Rn, useEffect: ia, useImperativeHandle: $r, useInsertionEffect: hr, useLayoutEffect: oa, useMemo: Ei, useReducer: I, useRef: O, useState: function() {
      return I(Ra);
    }, useDebugValue: el, useDeferredValue: function(n) {
      var a = Gn();
      return We === null ? a.memoizedState = n : xi(a, We.memoizedState, n);
    }, useTransition: function() {
      var n = I(Ra)[0], a = Gn().memoizedState;
      return [n, a];
    }, useMutableSource: he, useSyncExternalStore: Ue, useId: Ri, unstable_isNewReconciler: !1 };
    function zn(n, a) {
      if (n && n.defaultProps) {
        a = lt({}, a), n = n.defaultProps;
        for (var u in n) a[u] === void 0 && (a[u] = n[u]);
        return a;
      }
      return a;
    }
    function Ol(n, a, u, o) {
      a = n.memoizedState, u = u(o, a), u = u == null ? a : lt({}, a, u), n.memoizedState = u, n.lanes === 0 && (n.updateQueue.baseState = u);
    }
    var Ya = { isMounted: function(n) {
      return (n = n._reactInternals) ? je(n) === n : !1;
    }, enqueueSetState: function(n, a, u) {
      n = n._reactInternals;
      var o = Xe(), c = Ja(n), f = Yn(o, c);
      f.payload = a, u != null && (f.callback = u), a = vr(n, f, c), a !== null && (Ot(a, n, c, o), Nl(a, n, c));
    }, enqueueReplaceState: function(n, a, u) {
      n = n._reactInternals;
      var o = Xe(), c = Ja(n), f = Yn(o, c);
      f.tag = 1, f.payload = a, u != null && (f.callback = u), a = vr(n, f, c), a !== null && (Ot(a, n, c, o), Nl(a, n, c));
    }, enqueueForceUpdate: function(n, a) {
      n = n._reactInternals;
      var u = Xe(), o = Ja(n), c = Yn(u, o);
      c.tag = 2, a != null && (c.callback = a), a = vr(n, c, o), a !== null && (Ot(a, n, o, u), Nl(a, n, o));
    } };
    function zi(n, a, u, o, c, f, m) {
      return n = n.stateNode, typeof n.shouldComponentUpdate == "function" ? n.shouldComponentUpdate(o, f, m) : a.prototype && a.prototype.isPureReactComponent ? !ui(u, o) || !ui(c, f) : !0;
    }
    function Ni(n, a, u) {
      var o = !1, c = sr, f = a.contextType;
      return typeof f == "object" && f !== null ? f = Rn(f) : (c = Pt(a) ? Ba : wt.current, o = a.contextTypes, f = (o = o != null) ? Gr(n, c) : sr), a = new a(u, f), n.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Ya, n.stateNode = a, a._reactInternals = n, o && (n = n.stateNode, n.__reactInternalMemoizedUnmaskedChildContext = c, n.__reactInternalMemoizedMaskedChildContext = f), a;
    }
    function Ui(n, a, u, o) {
      n = a.state, typeof a.componentWillReceiveProps == "function" && a.componentWillReceiveProps(u, o), typeof a.UNSAFE_componentWillReceiveProps == "function" && a.UNSAFE_componentWillReceiveProps(u, o), a.state !== n && Ya.enqueueReplaceState(a, a.state, null);
    }
    function Su(n, a, u, o) {
      var c = n.stateNode;
      c.props = u, c.state = n.memoizedState, c.refs = {}, xa(n);
      var f = a.contextType;
      typeof f == "object" && f !== null ? c.context = Rn(f) : (f = Pt(a) ? Ba : wt.current, c.context = Gr(n, f)), c.state = n.memoizedState, f = a.getDerivedStateFromProps, typeof f == "function" && (Ol(n, a, f, u), c.state = n.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof c.getSnapshotBeforeUpdate == "function" || typeof c.UNSAFE_componentWillMount != "function" && typeof c.componentWillMount != "function" || (a = c.state, typeof c.componentWillMount == "function" && c.componentWillMount(), typeof c.UNSAFE_componentWillMount == "function" && c.UNSAFE_componentWillMount(), a !== c.state && Ya.enqueueReplaceState(c, c.state, null), Ul(n, u, c, o), c.state = n.memoizedState), typeof c.componentDidMount == "function" && (n.flags |= 4194308);
    }
    function tl(n, a) {
      try {
        var u = "", o = a;
        do
          u += Md(o), o = o.return;
        while (o);
        var c = u;
      } catch (f) {
        c = `
Error generating stack: ` + f.message + `
` + f.stack;
      }
      return { value: n, source: a, stack: c, digest: null };
    }
    function nl(n, a, u) {
      return { value: n, source: null, stack: u ?? null, digest: a ?? null };
    }
    function _i(n, a) {
      try {
        console.error(a.value);
      } catch (u) {
        setTimeout(function() {
          throw u;
        });
      }
    }
    var gu = typeof WeakMap == "function" ? WeakMap : Map;
    function yr(n, a, u) {
      u = Yn(-1, u), u.tag = 3, u.payload = { element: null };
      var o = a.value;
      return u.callback = function() {
        Ki || (Ki = !0, Uu = o), _i(n, a);
      }, u;
    }
    function sn(n, a, u) {
      u = Yn(-1, u), u.tag = 3;
      var o = n.type.getDerivedStateFromError;
      if (typeof o == "function") {
        var c = a.value;
        u.payload = function() {
          return o(c);
        }, u.callback = function() {
          _i(n, a);
        };
      }
      var f = n.stateNode;
      return f !== null && typeof f.componentDidCatch == "function" && (u.callback = function() {
        _i(n, a), typeof o != "function" && (xr === null ? xr = /* @__PURE__ */ new Set([this]) : xr.add(this));
        var m = a.stack;
        this.componentDidCatch(a.value, { componentStack: m !== null ? m : "" });
      }), u;
    }
    function Dc(n, a, u) {
      var o = n.pingCache;
      if (o === null) {
        o = n.pingCache = new gu();
        var c = /* @__PURE__ */ new Set();
        o.set(a, c);
      } else c = o.get(a), c === void 0 && (c = /* @__PURE__ */ new Set(), o.set(a, c));
      c.has(u) || (c.add(u), n = Tr.bind(null, n, a, u), a.then(n, n));
    }
    function Ve(n) {
      do {
        var a;
        if ((a = n.tag === 13) && (a = n.memoizedState, a = a !== null ? a.dehydrated !== null : !0), a) return n;
        n = n.return;
      } while (n !== null);
      return null;
    }
    function Eu(n, a, u, o, c) {
      return n.mode & 1 ? (n.flags |= 65536, n.lanes = c, n) : (n === a ? n.flags |= 65536 : (n.flags |= 128, u.flags |= 131072, u.flags &= -52805, u.tag === 1 && (u.alternate === null ? u.tag = 17 : (a = Yn(-1, 1), a.tag = 2, vr(u, a, 1))), u.lanes |= 1), n);
    }
    var Mi = va.ReactCurrentOwner, xt = !1;
    function Rt(n, a, u, o) {
      a.child = n === null ? Sc(a, null, u, o) : zl(a, n.child, u, o);
    }
    function zc(n, a, u, o, c) {
      u = u.render;
      var f = a.ref;
      return Pr(a, c), o = yi(n, a, u, o, f, c), u = Ml(), n !== null && !xt ? (a.updateQueue = n.updateQueue, a.flags &= -2053, n.lanes &= ~c, cn(n, a, c)) : (Pe && u && Go(a), a.flags |= 1, Rt(n, a, o, c), a.child);
    }
    function Nc(n, a, u, o, c) {
      if (n === null) {
        var f = u.type;
        return typeof f == "function" && !Ii(f) && f.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (a.tag = 15, a.type = f, Uc(n, a, f, o, c)) : (n = Hu(u.type, null, o, a, a.mode, c), n.ref = a.ref, n.return = a, a.child = n);
      }
      if (f = n.child, !(n.lanes & c)) {
        var m = f.memoizedProps;
        if (u = u.compare, u = u !== null ? u : ui, u(m, o) && n.ref === a.ref) return cn(n, a, c);
      }
      return a.flags |= 1, n = Ka(f, o), n.ref = a.ref, n.return = a, a.child = n;
    }
    function Uc(n, a, u, o, c) {
      if (n !== null) {
        var f = n.memoizedProps;
        if (ui(f, o) && n.ref === a.ref) if (xt = !1, a.pendingProps = o = f, (n.lanes & c) !== 0) n.flags & 131072 && (xt = !0);
        else return a.lanes = n.lanes, cn(n, a, c);
      }
      return as(n, a, u, o, c);
    }
    function _c(n, a, u) {
      var o = a.pendingProps, c = o.children, f = n !== null ? n.memoizedState : null;
      if (o.mode === "hidden") if (!(a.mode & 1)) a.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, qe(il, _n), _n |= u;
      else {
        if (!(u & 1073741824)) return n = f !== null ? f.baseLanes | u : u, a.lanes = a.childLanes = 1073741824, a.memoizedState = { baseLanes: n, cachePool: null, transitions: null }, a.updateQueue = null, qe(il, _n), _n |= n, null;
        a.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, o = f !== null ? f.baseLanes : u, qe(il, _n), _n |= o;
      }
      else f !== null ? (o = f.baseLanes | u, a.memoizedState = null) : o = u, qe(il, _n), _n |= o;
      return Rt(n, a, c, u), a.child;
    }
    function Hi(n, a) {
      var u = a.ref;
      (n === null && u !== null || n !== null && n.ref !== u) && (a.flags |= 512, a.flags |= 2097152);
    }
    function as(n, a, u, o, c) {
      var f = Pt(u) ? Ba : wt.current;
      return f = Gr(a, f), Pr(a, c), u = yi(n, a, u, o, f, c), o = Ml(), n !== null && !xt ? (a.updateQueue = n.updateQueue, a.flags &= -2053, n.lanes &= ~c, cn(n, a, c)) : (Pe && o && Go(a), a.flags |= 1, Rt(n, a, u, c), a.child);
    }
    function Li(n, a, u, o, c) {
      if (Pt(u)) {
        var f = !0;
        ku(a);
      } else f = !1;
      if (Pr(a, c), a.stateNode === null) Gt(n, a), Ni(a, u, o), Su(a, u, o, c), o = !0;
      else if (n === null) {
        var m = a.stateNode, g = a.memoizedProps;
        m.props = g;
        var z = m.context, A = u.contextType;
        typeof A == "object" && A !== null ? A = Rn(A) : (A = Pt(u) ? Ba : wt.current, A = Gr(a, A));
        var Q = u.getDerivedStateFromProps, re = typeof Q == "function" || typeof m.getSnapshotBeforeUpdate == "function";
        re || typeof m.UNSAFE_componentWillReceiveProps != "function" && typeof m.componentWillReceiveProps != "function" || (g !== o || z !== A) && Ui(a, m, o, A), Ea = !1;
        var J = a.memoizedState;
        m.state = J, Ul(a, o, m, c), z = a.memoizedState, g !== o || J !== z || ln.current || Ea ? (typeof Q == "function" && (Ol(a, u, Q, o), z = a.memoizedState), (g = Ea || zi(a, u, g, o, J, z, A)) ? (re || typeof m.UNSAFE_componentWillMount != "function" && typeof m.componentWillMount != "function" || (typeof m.componentWillMount == "function" && m.componentWillMount(), typeof m.UNSAFE_componentWillMount == "function" && m.UNSAFE_componentWillMount()), typeof m.componentDidMount == "function" && (a.flags |= 4194308)) : (typeof m.componentDidMount == "function" && (a.flags |= 4194308), a.memoizedProps = o, a.memoizedState = z), m.props = o, m.state = z, m.context = A, o = g) : (typeof m.componentDidMount == "function" && (a.flags |= 4194308), o = !1);
      } else {
        m = a.stateNode, pi(n, a), g = a.memoizedProps, A = a.type === a.elementType ? g : zn(a.type, g), m.props = A, re = a.pendingProps, J = m.context, z = u.contextType, typeof z == "object" && z !== null ? z = Rn(z) : (z = Pt(u) ? Ba : wt.current, z = Gr(a, z));
        var Ke = u.getDerivedStateFromProps;
        (Q = typeof Ke == "function" || typeof m.getSnapshotBeforeUpdate == "function") || typeof m.UNSAFE_componentWillReceiveProps != "function" && typeof m.componentWillReceiveProps != "function" || (g !== re || J !== z) && Ui(a, m, o, z), Ea = !1, J = a.memoizedState, m.state = J, Ul(a, o, m, c);
        var de = a.memoizedState;
        g !== re || J !== de || ln.current || Ea ? (typeof Ke == "function" && (Ol(a, u, Ke, o), de = a.memoizedState), (A = Ea || zi(a, u, A, o, J, de, z) || !1) ? (Q || typeof m.UNSAFE_componentWillUpdate != "function" && typeof m.componentWillUpdate != "function" || (typeof m.componentWillUpdate == "function" && m.componentWillUpdate(o, de, z), typeof m.UNSAFE_componentWillUpdate == "function" && m.UNSAFE_componentWillUpdate(o, de, z)), typeof m.componentDidUpdate == "function" && (a.flags |= 4), typeof m.getSnapshotBeforeUpdate == "function" && (a.flags |= 1024)) : (typeof m.componentDidUpdate != "function" || g === n.memoizedProps && J === n.memoizedState || (a.flags |= 4), typeof m.getSnapshotBeforeUpdate != "function" || g === n.memoizedProps && J === n.memoizedState || (a.flags |= 1024), a.memoizedProps = o, a.memoizedState = de), m.props = o, m.state = de, m.context = z, o = A) : (typeof m.componentDidUpdate != "function" || g === n.memoizedProps && J === n.memoizedState || (a.flags |= 4), typeof m.getSnapshotBeforeUpdate != "function" || g === n.memoizedProps && J === n.memoizedState || (a.flags |= 1024), o = !1);
      }
      return Oi(n, a, u, o, f, c);
    }
    function Oi(n, a, u, o, c, f) {
      Hi(n, a);
      var m = (a.flags & 128) !== 0;
      if (!o && !m) return c && Iu(a, u, !1), cn(n, a, f);
      o = a.stateNode, Mi.current = a;
      var g = m && typeof u.getDerivedStateFromError != "function" ? null : o.render();
      return a.flags |= 1, n !== null && m ? (a.child = zl(a, n.child, null, f), a.child = zl(a, null, g, f)) : Rt(n, a, g, f), a.memoizedState = o.state, c && Iu(a, u, !0), a.child;
    }
    function Mc(n) {
      var a = n.stateNode;
      a.pendingContext ? Fo(n, a.pendingContext, a.pendingContext !== a.context) : a.context && Fo(n, a.context, !1), Dn(n, a.containerInfo);
    }
    function Hc(n, a, u, o, c) {
      return Dl(), Zo(c), a.flags |= 256, Rt(n, a, u, o), a.child;
    }
    var Fl = { dehydrated: null, treeContext: null, retryLane: 0 };
    function rs(n) {
      return { baseLanes: n, cachePool: null, transitions: null };
    }
    function ls(n, a, u) {
      var o = a.pendingProps, c = Me.current, f = !1, m = (a.flags & 128) !== 0, g;
      if ((g = m) || (g = n !== null && n.memoizedState === null ? !1 : (c & 2) !== 0), g ? (f = !0, a.flags &= -129) : (n === null || n.memoizedState !== null) && (c |= 1), qe(Me, c & 1), n === null)
        return Ko(a), n = a.memoizedState, n !== null && (n = n.dehydrated, n !== null) ? (a.mode & 1 ? Ut(n) ? a.lanes = 8 : a.lanes = 1073741824 : a.lanes = 1, null) : (m = o.children, n = o.fallback, f ? (o = a.mode, f = a.child, m = { mode: "hidden", children: m }, !(o & 1) && f !== null ? (f.childLanes = 0, f.pendingProps = m) : f = Yl(m, o, 0, null), n = Za(n, o, u, null), f.return = a, n.return = a, f.sibling = n, a.child = f, a.child.memoizedState = rs(u), a.memoizedState = Fl, n) : Fi(a, m));
      if (c = n.memoizedState, c !== null && (g = c.dehydrated, g !== null)) return al(n, a, m, o, g, c, u);
      if (f) {
        f = o.fallback, m = a.mode, c = n.child, g = c.sibling;
        var z = { mode: "hidden", children: o.children };
        return !(m & 1) && a.child !== c ? (o = a.child, o.childLanes = 0, o.pendingProps = z, a.deletions = null) : (o = Ka(c, z), o.subtreeFlags = c.subtreeFlags & 14680064), g !== null ? f = Ka(g, f) : (f = Za(f, m, u, null), f.flags |= 2), f.return = a, o.return = a, o.sibling = f, a.child = o, o = f, f = a.child, m = n.child.memoizedState, m = m === null ? rs(u) : { baseLanes: m.baseLanes | u, cachePool: null, transitions: m.transitions }, f.memoizedState = m, f.childLanes = n.childLanes & ~u, a.memoizedState = Fl, o;
      }
      return f = n.child, n = f.sibling, o = Ka(f, { mode: "visible", children: o.children }), !(a.mode & 1) && (o.lanes = u), o.return = a, o.sibling = null, n !== null && (u = a.deletions, u === null ? (a.deletions = [n], a.flags |= 16) : u.push(n)), a.child = o, a.memoizedState = null, o;
    }
    function Fi(n, a) {
      return a = Yl({ mode: "visible", children: a }, n.mode, 0, null), a.return = n, n.child = a;
    }
    function Ai(n, a, u, o) {
      return o !== null && Zo(o), zl(a, n.child, null, u), n = Fi(a, a.pendingProps.children), n.flags |= 2, a.memoizedState = null, n;
    }
    function al(n, a, u, o, c, f, m) {
      if (u)
        return a.flags & 256 ? (a.flags &= -257, o = nl(Error(j(422))), Ai(n, a, m, o)) : a.memoizedState !== null ? (a.child = n.child, a.flags |= 128, null) : (f = o.fallback, c = a.mode, o = Yl({ mode: "visible", children: o.children }, c, 0, null), f = Za(f, c, m, null), f.flags |= 2, o.return = a, f.return = a, o.sibling = f, a.child = o, a.mode & 1 && zl(a, n.child, null, m), a.child.memoizedState = rs(m), a.memoizedState = Fl, f);
      if (!(a.mode & 1)) return Ai(n, a, m, null);
      if (Ut(c)) return o = Uo(c).digest, f = Error(j(419)), o = nl(
        f,
        o,
        void 0
      ), Ai(n, a, m, o);
      if (u = (m & n.childLanes) !== 0, xt || u) {
        if (o = Tt, o !== null) {
          switch (m & -m) {
            case 4:
              c = 2;
              break;
            case 16:
              c = 8;
              break;
            case 64:
            case 128:
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
            case 67108864:
              c = 32;
              break;
            case 536870912:
              c = 268435456;
              break;
            default:
              c = 0;
          }
          c = c & (o.suspendedLanes | m) ? 0 : c, c !== 0 && c !== f.retryLane && (f.retryLane = c, qn(n, c), Ot(
            o,
            n,
            c,
            -1
          ));
        }
        return Wi(), o = nl(Error(j(421))), Ai(n, a, m, o);
      }
      return iu(c) ? (a.flags |= 128, a.child = n.child, a = Fd.bind(null, n), uc(c, a), null) : (n = f.treeContext, rn && (wn = or(c), xn = a, Pe = !0, na = null, pu = !1, n !== null && (Bn[Qn++] = ta, Bn[Qn++] = wa, Bn[Qn++] = fr, ta = n.id, wa = n.overflow, fr = a)), a = Fi(a, o.children), a.flags |= 4096, a);
    }
    function Al(n, a, u) {
      n.lanes |= a;
      var o = n.alternate;
      o !== null && (o.lanes |= a), vi(n.return, a, u);
    }
    function Ga(n, a, u, o, c) {
      var f = n.memoizedState;
      f === null ? n.memoizedState = { isBackwards: a, rendering: null, renderingStartTime: 0, last: o, tail: u, tailMode: c } : (f.isBackwards = a, f.rendering = null, f.renderingStartTime = 0, f.last = o, f.tail = u, f.tailMode = c);
    }
    function ji(n, a, u) {
      var o = a.pendingProps, c = o.revealOrder, f = o.tail;
      if (Rt(n, a, o.children, u), o = Me.current, o & 2) o = o & 1 | 2, a.flags |= 128;
      else {
        if (n !== null && n.flags & 128) e: for (n = a.child; n !== null; ) {
          if (n.tag === 13) n.memoizedState !== null && Al(n, u, a);
          else if (n.tag === 19) Al(n, u, a);
          else if (n.child !== null) {
            n.child.return = n, n = n.child;
            continue;
          }
          if (n === a) break e;
          for (; n.sibling === null; ) {
            if (n.return === null || n.return === a) break e;
            n = n.return;
          }
          n.sibling.return = n.return, n = n.sibling;
        }
        o &= 1;
      }
      if (qe(Me, o), !(a.mode & 1)) a.memoizedState = null;
      else switch (c) {
        case "forwards":
          for (u = a.child, c = null; u !== null; ) n = u.alternate, n !== null && pt(n) === null && (c = u), u = u.sibling;
          u = c, u === null ? (c = a.child, a.child = null) : (c = u.sibling, u.sibling = null), Ga(a, !1, c, u, f);
          break;
        case "backwards":
          for (u = null, c = a.child, a.child = null; c !== null; ) {
            if (n = c.alternate, n !== null && pt(n) === null) {
              a.child = c;
              break;
            }
            n = c.sibling, c.sibling = u, u = c, c = n;
          }
          Ga(a, !0, u, null, f);
          break;
        case "together":
          Ga(a, !1, null, null, void 0);
          break;
        default:
          a.memoizedState = null;
      }
      return a.child;
    }
    function Gt(n, a) {
      !(a.mode & 1) && n !== null && (n.alternate = null, a.alternate = null, a.flags |= 2);
    }
    function cn(n, a, u) {
      if (n !== null && (a.dependencies = n.dependencies), ol |= a.lanes, !(u & a.childLanes)) return null;
      if (n !== null && a.child !== n.child) throw Error(j(153));
      if (a.child !== null) {
        for (n = a.child, u = Ka(n, n.pendingProps), a.child = u, u.return = a; n.sibling !== null; ) n = n.sibling, u = u.sibling = Ka(n, n.pendingProps), u.return = a;
        u.sibling = null;
      }
      return a.child;
    }
    function fe(n, a, u) {
      switch (a.tag) {
        case 3:
          Mc(a), Dl();
          break;
        case 5:
          hu(a);
          break;
        case 1:
          Pt(a.type) && ku(a);
          break;
        case 4:
          Dn(a, a.stateNode.containerInfo);
          break;
        case 10:
          Po(a, a.type._context, a.memoizedProps.value);
          break;
        case 13:
          var o = a.memoizedState;
          if (o !== null)
            return o.dehydrated !== null ? (qe(Me, Me.current & 1), a.flags |= 128, null) : u & a.child.childLanes ? ls(n, a, u) : (qe(Me, Me.current & 1), n = cn(n, a, u), n !== null ? n.sibling : null);
          qe(Me, Me.current & 1);
          break;
        case 19:
          if (o = (u & a.childLanes) !== 0, n.flags & 128) {
            if (o) return ji(
              n,
              a,
              u
            );
            a.flags |= 128;
          }
          var c = a.memoizedState;
          if (c !== null && (c.rendering = null, c.tail = null, c.lastEffect = null), qe(Me, Me.current), o) break;
          return null;
        case 22:
        case 23:
          return a.lanes = 0, _c(n, a, u);
      }
      return cn(n, a, u);
    }
    function Nn(n) {
      n.flags |= 4;
    }
    function us(n, a) {
      if (n !== null && n.child === a.child) return !0;
      if (a.flags & 16) return !1;
      for (n = a.child; n !== null; ) {
        if (n.flags & 12854 || n.subtreeFlags & 12854) return !1;
        n = n.sibling;
      }
      return !0;
    }
    var Vi, xu, jl, Sr;
    if (vt) Vi = function(n, a) {
      for (var u = a.child; u !== null; ) {
        if (u.tag === 5 || u.tag === 6) ar(n, u.stateNode);
        else if (u.tag !== 4 && u.child !== null) {
          u.child.return = u, u = u.child;
          continue;
        }
        if (u === a) break;
        for (; u.sibling === null; ) {
          if (u.return === null || u.return === a) return;
          u = u.return;
        }
        u.sibling.return = u.return, u = u.sibling;
      }
    }, xu = function() {
    }, jl = function(n, a, u, o, c) {
      if (n = n.memoizedProps, n !== o) {
        var f = a.stateNode, m = Cn(Tn.current);
        u = an(f, u, n, o, c, m), (a.updateQueue = u) && Nn(a);
      }
    }, Sr = function(n, a, u, o) {
      u !== o && Nn(a);
    };
    else if (Fa) {
      Vi = function(n, a, u, o) {
        for (var c = a.child; c !== null; ) {
          if (c.tag === 5) {
            var f = c.stateNode;
            u && o && (f = ja(f, c.type, c.memoizedProps, c)), ar(n, f);
          } else if (c.tag === 6) f = c.stateNode, u && o && (f = ha(f, c.memoizedProps, c)), ar(n, f);
          else if (c.tag !== 4) {
            if (c.tag === 22 && c.memoizedState !== null) f = c.child, f !== null && (f.return = c), Vi(n, c, !0, !0);
            else if (c.child !== null) {
              c.child.return = c, c = c.child;
              continue;
            }
          }
          if (c === a) break;
          for (; c.sibling === null; ) {
            if (c.return === null || c.return === a) return;
            c = c.return;
          }
          c.sibling.return = c.return, c = c.sibling;
        }
      };
      var Lc = function(n, a, u, o) {
        for (var c = a.child; c !== null; ) {
          if (c.tag === 5) {
            var f = c.stateNode;
            u && o && (f = ja(f, c.type, c.memoizedProps, c)), ma(n, f);
          } else if (c.tag === 6) f = c.stateNode, u && o && (f = ha(f, c.memoizedProps, c)), ma(n, f);
          else if (c.tag !== 4) {
            if (c.tag === 22 && c.memoizedState !== null) f = c.child, f !== null && (f.return = c), Lc(n, c, !0, !0);
            else if (c.child !== null) {
              c.child.return = c, c = c.child;
              continue;
            }
          }
          if (c === a) break;
          for (; c.sibling === null; ) {
            if (c.return === null || c.return === a) return;
            c = c.return;
          }
          c.sibling.return = c.return, c = c.sibling;
        }
      };
      xu = function(n, a) {
        var u = a.stateNode;
        if (!us(n, a)) {
          n = u.containerInfo;
          var o = xe(n);
          Lc(o, a, !1, !1), u.pendingChildren = o, Nn(a), Qr(n, o);
        }
      }, jl = function(n, a, u, o, c) {
        var f = n.stateNode, m = n.memoizedProps;
        if ((n = us(n, a)) && m === o) a.stateNode = f;
        else {
          var g = a.stateNode, z = Cn(Tn.current), A = null;
          m !== o && (A = an(g, u, m, o, c, z)), n && A === null ? a.stateNode = f : (f = lc(f, A, u, m, o, a, n, g), Sl(f, u, o, c, z) && Nn(a), a.stateNode = f, n ? Nn(a) : Vi(f, a, !1, !1));
        }
      }, Sr = function(n, a, u, o) {
        u !== o ? (n = Cn(br.current), u = Cn(Tn.current), a.stateNode = Nt(o, n, u, a), Nn(a)) : a.stateNode = n.stateNode;
      };
    } else xu = function() {
    }, jl = function() {
    }, Sr = function() {
    };
    function Vl(n, a) {
      if (!Pe) switch (n.tailMode) {
        case "hidden":
          a = n.tail;
          for (var u = null; a !== null; ) a.alternate !== null && (u = a), a = a.sibling;
          u === null ? n.tail = null : u.sibling = null;
          break;
        case "collapsed":
          u = n.tail;
          for (var o = null; u !== null; ) u.alternate !== null && (o = u), u = u.sibling;
          o === null ? a || n.tail === null ? n.tail = null : n.tail.sibling = null : o.sibling = null;
      }
    }
    function Jt(n) {
      var a = n.alternate !== null && n.alternate.child === n.child, u = 0, o = 0;
      if (a) for (var c = n.child; c !== null; ) u |= c.lanes | c.childLanes, o |= c.subtreeFlags & 14680064, o |= c.flags & 14680064, c.return = n, c = c.sibling;
      else for (c = n.child; c !== null; ) u |= c.lanes | c.childLanes, o |= c.subtreeFlags, o |= c.flags, c.return = n, c = c.sibling;
      return n.subtreeFlags |= o, n.childLanes = u, a;
    }
    function is(n, a, u) {
      var o = a.pendingProps;
      switch (Jo(a), a.tag) {
        case 2:
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return Jt(a), null;
        case 1:
          return Pt(a.type) && Cl(), Jt(a), null;
        case 3:
          return u = a.stateNode, pr(), Ge(ln), Ge(wt), yu(), u.pendingContext && (u.context = u.pendingContext, u.pendingContext = null), (n === null || n.child === null) && (li(a) ? Nn(a) : n === null || n.memoizedState.isDehydrated && !(a.flags & 256) || (a.flags |= 1024, na !== null && (vn(na), na = null))), xu(n, a), Jt(a), null;
        case 5:
          aa(a), u = Cn(br.current);
          var c = a.type;
          if (n !== null && a.stateNode != null) jl(n, a, c, o, u), n.ref !== a.ref && (a.flags |= 512, a.flags |= 2097152);
          else {
            if (!o) {
              if (a.stateNode === null) throw Error(j(166));
              return Jt(a), null;
            }
            if (n = Cn(Tn.current), li(a)) {
              if (!rn) throw Error(j(175));
              n = Mo(a.stateNode, a.type, a.memoizedProps, u, n, a, !pu), a.updateQueue = n, n !== null && Nn(a);
            } else {
              var f = ru(c, o, u, n, a);
              Vi(f, a, !1, !1), a.stateNode = f, Sl(f, c, o, u, n) && Nn(a);
            }
            a.ref !== null && (a.flags |= 512, a.flags |= 2097152);
          }
          return Jt(a), null;
        case 6:
          if (n && a.stateNode != null) Sr(n, a, n.memoizedProps, o);
          else {
            if (typeof o != "string" && a.stateNode === null) throw Error(j(166));
            if (n = Cn(br.current), u = Cn(Tn.current), li(a)) {
              if (!rn) throw Error(j(176));
              if (n = a.stateNode, u = a.memoizedProps, (o = Ho(n, u, a, !pu)) && (c = xn, c !== null)) switch (c.tag) {
                case 3:
                  Sd(c.stateNode.containerInfo, n, u, (c.mode & 1) !== 0);
                  break;
                case 5:
                  ic(c.type, c.memoizedProps, c.stateNode, n, u, (c.mode & 1) !== 0);
              }
              o && Nn(a);
            } else a.stateNode = Nt(o, n, u, a);
          }
          return Jt(a), null;
        case 13:
          if (Ge(Me), o = a.memoizedState, n === null || n.memoizedState !== null && n.memoizedState.dehydrated !== null) {
            if (Pe && wn !== null && a.mode & 1 && !(a.flags & 128)) mc(), Dl(), a.flags |= 98560, c = !1;
            else if (c = li(a), o !== null && o.dehydrated !== null) {
              if (n === null) {
                if (!c) throw Error(j(318));
                if (!rn) throw Error(j(344));
                if (c = a.memoizedState, c = c !== null ? c.dehydrated : null, !c) throw Error(j(317));
                ou(c, a);
              } else Dl(), !(a.flags & 128) && (a.memoizedState = null), a.flags |= 4;
              Jt(a), c = !1;
            } else na !== null && (vn(na), na = null), c = !0;
            if (!c) return a.flags & 65536 ? a : null;
          }
          return a.flags & 128 ? (a.lanes = u, a) : (u = o !== null, u !== (n !== null && n.memoizedState !== null) && u && (a.child.flags |= 8192, a.mode & 1 && (n === null || Me.current & 1 ? ft === 0 && (ft = 3) : Wi())), a.updateQueue !== null && (a.flags |= 4), Jt(a), null);
        case 4:
          return pr(), xu(n, a), n === null && Do(a.stateNode.containerInfo), Jt(a), null;
        case 10:
          return di(a.type._context), Jt(a), null;
        case 17:
          return Pt(a.type) && Cl(), Jt(a), null;
        case 19:
          if (Ge(Me), c = a.memoizedState, c === null) return Jt(a), null;
          if (o = (a.flags & 128) !== 0, f = c.rendering, f === null) if (o) Vl(c, !1);
          else {
            if (ft !== 0 || n !== null && n.flags & 128) for (n = a.child; n !== null; ) {
              if (f = pt(n), f !== null) {
                for (a.flags |= 128, Vl(c, !1), n = f.updateQueue, n !== null && (a.updateQueue = n, a.flags |= 4), a.subtreeFlags = 0, n = u, u = a.child; u !== null; ) o = u, c = n, o.flags &= 14680066, f = o.alternate, f === null ? (o.childLanes = 0, o.lanes = c, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = f.childLanes, o.lanes = f.lanes, o.child = f.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = f.memoizedProps, o.memoizedState = f.memoizedState, o.updateQueue = f.updateQueue, o.type = f.type, c = f.dependencies, o.dependencies = c === null ? null : { lanes: c.lanes, firstContext: c.firstContext }), u = u.sibling;
                return qe(Me, Me.current & 1 | 2), a.child;
              }
              n = n.sibling;
            }
            c.tail !== null && gt() > ps && (a.flags |= 128, o = !0, Vl(c, !1), a.lanes = 4194304);
          }
          else {
            if (!o) if (n = pt(f), n !== null) {
              if (a.flags |= 128, o = !0, n = n.updateQueue, n !== null && (a.updateQueue = n, a.flags |= 4), Vl(c, !0), c.tail === null && c.tailMode === "hidden" && !f.alternate && !Pe) return Jt(a), null;
            } else 2 * gt() - c.renderingStartTime > ps && u !== 1073741824 && (a.flags |= 128, o = !0, Vl(c, !1), a.lanes = 4194304);
            c.isBackwards ? (f.sibling = a.child, a.child = f) : (n = c.last, n !== null ? n.sibling = f : a.child = f, c.last = f);
          }
          return c.tail !== null ? (a = c.tail, c.rendering = a, c.tail = a.sibling, c.renderingStartTime = gt(), a.sibling = null, n = Me.current, qe(Me, o ? n & 1 | 2 : n & 1), a) : (Jt(a), null);
        case 22:
        case 23:
          return ms(), u = a.memoizedState !== null, n !== null && n.memoizedState !== null !== u && (a.flags |= 8192), u && a.mode & 1 ? _n & 1073741824 && (Jt(a), vt && a.subtreeFlags & 6 && (a.flags |= 8192)) : Jt(a), null;
        case 24:
          return null;
        case 25:
          return null;
      }
      throw Error(j(
        156,
        a.tag
      ));
    }
    function Hd(n, a) {
      switch (Jo(a), a.tag) {
        case 1:
          return Pt(a.type) && Cl(), n = a.flags, n & 65536 ? (a.flags = n & -65537 | 128, a) : null;
        case 3:
          return pr(), Ge(ln), Ge(wt), yu(), n = a.flags, n & 65536 && !(n & 128) ? (a.flags = n & -65537 | 128, a) : null;
        case 5:
          return aa(a), null;
        case 13:
          if (Ge(Me), n = a.memoizedState, n !== null && n.dehydrated !== null) {
            if (a.alternate === null) throw Error(j(340));
            Dl();
          }
          return n = a.flags, n & 65536 ? (a.flags = n & -65537 | 128, a) : null;
        case 19:
          return Ge(Me), null;
        case 4:
          return pr(), null;
        case 10:
          return di(a.type._context), null;
        case 22:
        case 23:
          return ms(), null;
        case 24:
          return null;
        default:
          return null;
      }
    }
    var Ru = !1, _t = !1, Oc = typeof WeakSet == "function" ? WeakSet : Set, q = null;
    function Ta(n, a) {
      var u = n.ref;
      if (u !== null) if (typeof u == "function") try {
        u(null);
      } catch (o) {
        Re(n, a, o);
      }
      else u.current = null;
    }
    function rl(n, a, u) {
      try {
        u();
      } catch (o) {
        Re(n, a, o);
      }
    }
    var Bi = !1;
    function Tu(n, a) {
      for (In(n.containerInfo), q = a; q !== null; ) if (n = q, a = n.child, (n.subtreeFlags & 1028) !== 0 && a !== null) a.return = n, q = a;
      else for (; q !== null; ) {
        n = q;
        try {
          var u = n.alternate;
          if (n.flags & 1024) switch (n.tag) {
            case 0:
            case 11:
            case 15:
              break;
            case 1:
              if (u !== null) {
                var o = u.memoizedProps, c = u.memoizedState, f = n.stateNode, m = f.getSnapshotBeforeUpdate(n.elementType === n.type ? o : zn(n.type, o), c);
                f.__reactInternalSnapshotBeforeUpdate = m;
              }
              break;
            case 3:
              vt && uu(n.stateNode.containerInfo);
              break;
            case 5:
            case 6:
            case 4:
            case 17:
              break;
            default:
              throw Error(j(163));
          }
        } catch (g) {
          Re(n, n.return, g);
        }
        if (a = n.sibling, a !== null) {
          a.return = n.return, q = a;
          break;
        }
        q = n.return;
      }
      return u = Bi, Bi = !1, u;
    }
    function bt(n, a, u) {
      var o = a.updateQueue;
      if (o = o !== null ? o.lastEffect : null, o !== null) {
        var c = o = o.next;
        do {
          if ((c.tag & n) === n) {
            var f = c.destroy;
            c.destroy = void 0, f !== void 0 && rl(a, u, f);
          }
          c = c.next;
        } while (c !== o);
      }
    }
    function tt(n, a) {
      if (a = a.updateQueue, a = a !== null ? a.lastEffect : null, a !== null) {
        var u = a = a.next;
        do {
          if ((u.tag & n) === n) {
            var o = u.create;
            u.destroy = o();
          }
          u = u.next;
        } while (u !== a);
      }
    }
    function os(n) {
      var a = n.ref;
      if (a !== null) {
        var u = n.stateNode;
        switch (n.tag) {
          case 5:
            n = _e(u);
            break;
          default:
            n = u;
        }
        typeof a == "function" ? a(n) : a.current = n;
      }
    }
    function Fc(n) {
      var a = n.alternate;
      a !== null && (n.alternate = null, Fc(a)), n.child = null, n.deletions = null, n.sibling = null, n.tag === 5 && (a = n.stateNode, a !== null && gl(a)), n.stateNode = null, n.return = null, n.dependencies = null, n.memoizedProps = null, n.memoizedState = null, n.pendingProps = null, n.stateNode = null, n.updateQueue = null;
    }
    function Ac(n) {
      return n.tag === 5 || n.tag === 3 || n.tag === 4;
    }
    function ss(n) {
      e: for (; ; ) {
        for (; n.sibling === null; ) {
          if (n.return === null || Ac(n.return)) return null;
          n = n.return;
        }
        for (n.sibling.return = n.return, n = n.sibling; n.tag !== 5 && n.tag !== 6 && n.tag !== 18; ) {
          if (n.flags & 2 || n.child === null || n.tag === 4) continue e;
          n.child.return = n, n = n.child;
        }
        if (!(n.flags & 2)) return n.stateNode;
      }
    }
    function Qi(n, a, u) {
      var o = n.tag;
      if (o === 5 || o === 6) n = n.stateNode, a ? pd(u, n, a) : dd(u, n);
      else if (o !== 4 && (n = n.child, n !== null)) for (Qi(n, a, u), n = n.sibling; n !== null; ) Qi(n, a, u), n = n.sibling;
    }
    function wi(n, a, u) {
      var o = n.tag;
      if (o === 5 || o === 6) n = n.stateNode, a ? Oe(u, n, a) : nc(u, n);
      else if (o !== 4 && (n = n.child, n !== null)) for (wi(n, a, u), n = n.sibling; n !== null; ) wi(n, a, u), n = n.sibling;
    }
    var Mt = null, sa = !1;
    function Ca(n, a, u) {
      for (u = u.child; u !== null; ) ot(n, a, u), u = u.sibling;
    }
    function ot(n, a, u) {
      if ($n && typeof $n.onCommitFiberUnmount == "function") try {
        $n.onCommitFiberUnmount(ni, u);
      } catch {
      }
      switch (u.tag) {
        case 5:
          _t || Ta(u, a);
        case 6:
          if (vt) {
            var o = Mt, c = sa;
            Mt = null, Ca(n, a, u), Mt = o, sa = c, Mt !== null && (sa ? ce(Mt, u.stateNode) : rc(Mt, u.stateNode));
          } else Ca(n, a, u);
          break;
        case 18:
          vt && Mt !== null && (sa ? Pu(Mt, u.stateNode) : hd(Mt, u.stateNode));
          break;
        case 4:
          vt ? (o = Mt, c = sa, Mt = u.stateNode.containerInfo, sa = !0, Ca(n, a, u), Mt = o, sa = c) : (Fa && (o = u.stateNode.containerInfo, c = xe(o), ir(o, c)), Ca(n, a, u));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          if (!_t && (o = u.updateQueue, o !== null && (o = o.lastEffect, o !== null))) {
            c = o = o.next;
            do {
              var f = c, m = f.destroy;
              f = f.tag, m !== void 0 && (f & 2 || f & 4) && rl(u, a, m), c = c.next;
            } while (c !== o);
          }
          Ca(n, a, u);
          break;
        case 1:
          if (!_t && (Ta(u, a), o = u.stateNode, typeof o.componentWillUnmount == "function")) try {
            o.props = u.memoizedProps, o.state = u.memoizedState, o.componentWillUnmount();
          } catch (g) {
            Re(u, a, g);
          }
          Ca(n, a, u);
          break;
        case 21:
          Ca(n, a, u);
          break;
        case 22:
          u.mode & 1 ? (_t = (o = _t) || u.memoizedState !== null, Ca(n, a, u), _t = o) : Ca(n, a, u);
          break;
        default:
          Ca(
            n,
            a,
            u
          );
      }
    }
    function Cu(n) {
      var a = n.updateQueue;
      if (a !== null) {
        n.updateQueue = null;
        var u = n.stateNode;
        u === null && (u = n.stateNode = new Oc()), a.forEach(function(o) {
          var c = qc.bind(null, n, o);
          u.has(o) || (u.add(o), o.then(c, c));
        });
      }
    }
    function Jn(n, a) {
      var u = a.deletions;
      if (u !== null) for (var o = 0; o < u.length; o++) {
        var c = u[o];
        try {
          var f = n, m = a;
          if (vt) {
            var g = m;
            e: for (; g !== null; ) {
              switch (g.tag) {
                case 5:
                  Mt = g.stateNode, sa = !1;
                  break e;
                case 3:
                  Mt = g.stateNode.containerInfo, sa = !0;
                  break e;
                case 4:
                  Mt = g.stateNode.containerInfo, sa = !0;
                  break e;
              }
              g = g.return;
            }
            if (Mt === null) throw Error(j(160));
            ot(f, m, c), Mt = null, sa = !1;
          } else ot(f, m, c);
          var z = c.alternate;
          z !== null && (z.return = null), c.return = null;
        } catch (A) {
          Re(c, a, A);
        }
      }
      if (a.subtreeFlags & 12854) for (a = a.child; a !== null; ) ll(a, n), a = a.sibling;
    }
    function ll(n, a) {
      var u = n.alternate, o = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          if (Jn(a, n), ca(n), o & 4) {
            try {
              bt(3, n, n.return), tt(3, n);
            } catch (J) {
              Re(n, n.return, J);
            }
            try {
              bt(5, n, n.return);
            } catch (J) {
              Re(n, n.return, J);
            }
          }
          break;
        case 1:
          Jn(a, n), ca(n), o & 512 && u !== null && Ta(u, u.return);
          break;
        case 5:
          if (Jn(a, n), ca(n), o & 512 && u !== null && Ta(u, u.return), vt) {
            if (n.flags & 32) {
              var c = n.stateNode;
              try {
                b(c);
              } catch (J) {
                Re(n, n.return, J);
              }
            }
            if (o & 4 && (c = n.stateNode, c != null)) {
              var f = n.memoizedProps;
              if (u = u !== null ? u.memoizedProps : f, o = n.type, a = n.updateQueue, n.updateQueue = null, a !== null) try {
                ac(c, a, o, u, f, n);
              } catch (J) {
                Re(n, n.return, J);
              }
            }
          }
          break;
        case 6:
          if (Jn(a, n), ca(n), o & 4 && vt) {
            if (n.stateNode === null) throw Error(j(162));
            c = n.stateNode, f = n.memoizedProps, u = u !== null ? u.memoizedProps : f;
            try {
              Br(c, u, f);
            } catch (J) {
              Re(n, n.return, J);
            }
          }
          break;
        case 3:
          if (Jn(a, n), ca(n), o & 4) {
            if (vt && rn && u !== null && u.memoizedState.isDehydrated) try {
              Tl(a.containerInfo);
            } catch (J) {
              Re(n, n.return, J);
            }
            if (Fa) {
              c = a.containerInfo, f = a.pendingChildren;
              try {
                ir(c, f);
              } catch (J) {
                Re(n, n.return, J);
              }
            }
          }
          break;
        case 4:
          if (Jn(
            a,
            n
          ), ca(n), o & 4 && Fa) {
            f = n.stateNode, c = f.containerInfo, f = f.pendingChildren;
            try {
              ir(c, f);
            } catch (J) {
              Re(n, n.return, J);
            }
          }
          break;
        case 13:
          Jn(a, n), ca(n), c = n.child, c.flags & 8192 && (f = c.memoizedState !== null, c.stateNode.isHidden = f, !f || c.alternate !== null && c.alternate.memoizedState !== null || (Xi = gt())), o & 4 && Cu(n);
          break;
        case 22:
          var m = u !== null && u.memoizedState !== null;
          if (n.mode & 1 ? (_t = (u = _t) || m, Jn(a, n), _t = u) : Jn(a, n), ca(n), o & 8192) {
            if (u = n.memoizedState !== null, (n.stateNode.isHidden = u) && !m && n.mode & 1) for (q = n, o = n.child; o !== null; ) {
              for (a = q = o; q !== null; ) {
                m = q;
                var g = m.child;
                switch (m.tag) {
                  case 0:
                  case 11:
                  case 14:
                  case 15:
                    bt(4, m, m.return);
                    break;
                  case 1:
                    Ta(m, m.return);
                    var z = m.stateNode;
                    if (typeof z.componentWillUnmount == "function") {
                      var A = m, Q = m.return;
                      try {
                        var re = A;
                        z.props = re.memoizedProps, z.state = re.memoizedState, z.componentWillUnmount();
                      } catch (J) {
                        Re(A, Q, J);
                      }
                    }
                    break;
                  case 5:
                    Ta(m, m.return);
                    break;
                  case 22:
                    if (m.memoizedState !== null) {
                      Ht(a);
                      continue;
                    }
                }
                g !== null ? (g.return = m, q = g) : Ht(a);
              }
              o = o.sibling;
            }
            if (vt) {
              e: if (o = null, vt) for (a = n; ; ) {
                if (a.tag === 5) {
                  if (o === null) {
                    o = a;
                    try {
                      c = a.stateNode, u ? xl(c) : Ee(a.stateNode, a.memoizedProps);
                    } catch (J) {
                      Re(n, n.return, J);
                    }
                  }
                } else if (a.tag === 6) {
                  if (o === null) try {
                    f = a.stateNode, u ? it(f) : ur(f, a.memoizedProps);
                  } catch (J) {
                    Re(n, n.return, J);
                  }
                } else if ((a.tag !== 22 && a.tag !== 23 || a.memoizedState === null || a === n) && a.child !== null) {
                  a.child.return = a, a = a.child;
                  continue;
                }
                if (a === n) break e;
                for (; a.sibling === null; ) {
                  if (a.return === null || a.return === n) break e;
                  o === a && (o = null), a = a.return;
                }
                o === a && (o = null), a.sibling.return = a.return, a = a.sibling;
              }
            }
          }
          break;
        case 19:
          Jn(a, n), ca(n), o & 4 && Cu(n);
          break;
        case 21:
          break;
        default:
          Jn(a, n), ca(n);
      }
    }
    function ca(n) {
      var a = n.flags;
      if (a & 2) {
        try {
          if (vt) {
            e: {
              for (var u = n.return; u !== null; ) {
                if (Ac(u)) {
                  var o = u;
                  break e;
                }
                u = u.return;
              }
              throw Error(j(160));
            }
            switch (o.tag) {
              case 5:
                var c = o.stateNode;
                o.flags & 32 && (b(c), o.flags &= -33);
                var f = ss(n);
                wi(n, f, c);
                break;
              case 3:
              case 4:
                var m = o.stateNode.containerInfo, g = ss(n);
                Qi(n, g, m);
                break;
              default:
                throw Error(j(161));
            }
          }
        } catch (z) {
          Re(n, n.return, z);
        }
        n.flags &= -3;
      }
      a & 4096 && (n.flags &= -4097);
    }
    function Ld(n, a, u) {
      q = n, jc(n);
    }
    function jc(n, a, u) {
      for (var o = (n.mode & 1) !== 0; q !== null; ) {
        var c = q, f = c.child;
        if (c.tag === 22 && o) {
          var m = c.memoizedState !== null || Ru;
          if (!m) {
            var g = c.alternate, z = g !== null && g.memoizedState !== null || _t;
            g = Ru;
            var A = _t;
            if (Ru = m, (_t = z) && !A) for (q = c; q !== null; ) m = q, z = m.child, m.tag === 22 && m.memoizedState !== null ? Y(c) : z !== null ? (z.return = m, q = z) : Y(c);
            for (; f !== null; ) q = f, jc(f), f = f.sibling;
            q = c, Ru = g, _t = A;
          }
          ul(n);
        } else c.subtreeFlags & 8772 && f !== null ? (f.return = c, q = f) : ul(n);
      }
    }
    function ul(n) {
      for (; q !== null; ) {
        var a = q;
        if (a.flags & 8772) {
          var u = a.alternate;
          try {
            if (a.flags & 8772) switch (a.tag) {
              case 0:
              case 11:
              case 15:
                _t || tt(5, a);
                break;
              case 1:
                var o = a.stateNode;
                if (a.flags & 4 && !_t) if (u === null) o.componentDidMount();
                else {
                  var c = a.elementType === a.type ? u.memoizedProps : zn(a.type, u.memoizedProps);
                  o.componentDidUpdate(c, u.memoizedState, o.__reactInternalSnapshotBeforeUpdate);
                }
                var f = a.updateQueue;
                f !== null && xc(a, f, o);
                break;
              case 3:
                var m = a.updateQueue;
                if (m !== null) {
                  if (u = null, a.child !== null) switch (a.child.tag) {
                    case 5:
                      u = _e(a.child.stateNode);
                      break;
                    case 1:
                      u = a.child.stateNode;
                  }
                  xc(a, m, u);
                }
                break;
              case 5:
                var g = a.stateNode;
                u === null && a.flags & 4 && vd(g, a.type, a.memoizedProps, a);
                break;
              case 6:
                break;
              case 4:
                break;
              case 12:
                break;
              case 13:
                if (rn && a.memoizedState === null) {
                  var z = a.alternate;
                  if (z !== null) {
                    var A = z.memoizedState;
                    if (A !== null) {
                      var Q = A.dehydrated;
                      Q !== null && Va(Q);
                    }
                  }
                }
                break;
              case 19:
              case 17:
              case 21:
              case 22:
              case 23:
              case 25:
                break;
              default:
                throw Error(j(163));
            }
            _t || a.flags & 512 && os(a);
          } catch (re) {
            Re(a, a.return, re);
          }
        }
        if (a === n) {
          q = null;
          break;
        }
        if (u = a.sibling, u !== null) {
          u.return = a.return, q = u;
          break;
        }
        q = a.return;
      }
    }
    function Ht(n) {
      for (; q !== null; ) {
        var a = q;
        if (a === n) {
          q = null;
          break;
        }
        var u = a.sibling;
        if (u !== null) {
          u.return = a.return, q = u;
          break;
        }
        q = a.return;
      }
    }
    function Y(n) {
      for (; q !== null; ) {
        var a = q;
        try {
          switch (a.tag) {
            case 0:
            case 11:
            case 15:
              var u = a.return;
              try {
                tt(4, a);
              } catch (z) {
                Re(a, u, z);
              }
              break;
            case 1:
              var o = a.stateNode;
              if (typeof o.componentDidMount == "function") {
                var c = a.return;
                try {
                  o.componentDidMount();
                } catch (z) {
                  Re(a, c, z);
                }
              }
              var f = a.return;
              try {
                os(a);
              } catch (z) {
                Re(a, f, z);
              }
              break;
            case 5:
              var m = a.return;
              try {
                os(a);
              } catch (z) {
                Re(a, m, z);
              }
          }
        } catch (z) {
          Re(a, a.return, z);
        }
        if (a === n) {
          q = null;
          break;
        }
        var g = a.sibling;
        if (g !== null) {
          g.return = a.return, q = g;
          break;
        }
        q = a.return;
      }
    }
    var Un = 0, fn = 1, qi = 2, Yi = 3, Gi = 4;
    if (typeof Symbol == "function" && Symbol.for) {
      var Du = Symbol.for;
      Un = Du("selector.component"), fn = Du("selector.has_pseudo_class"), qi = Du("selector.role"), Yi = Du("selector.test_id"), Gi = Du("selector.text");
    }
    function cs(n) {
      var a = Co(n);
      if (a != null) {
        if (typeof a.memoizedProps["data-testname"] != "string") throw Error(j(364));
        return a;
      }
      if (n = Zt(n), n === null) throw Error(j(362));
      return n.stateNode.current;
    }
    function st(n, a) {
      switch (a.$$typeof) {
        case Un:
          if (n.type === a.value) return !0;
          break;
        case fn:
          e: {
            a = a.value, n = [n, 0];
            for (var u = 0; u < n.length; ) {
              var o = n[u++], c = n[u++], f = a[c];
              if (o.tag !== 5 || !El(o)) {
                for (; f != null && st(o, f); ) c++, f = a[c];
                if (c === a.length) {
                  a = !0;
                  break e;
                } else for (o = o.child; o !== null; ) n.push(o, c), o = o.sibling;
              }
            }
            a = !1;
          }
          return a;
        case qi:
          if (n.tag === 5 && sd(n.stateNode, a.value)) return !0;
          break;
        case Gi:
          if ((n.tag === 5 || n.tag === 6) && (n = od(n), n !== null && 0 <= n.indexOf(a.value))) return !0;
          break;
        case Yi:
          if (n.tag === 5 && (n = n.memoizedProps["data-testname"], typeof n == "string" && n.toLowerCase() === a.value.toLowerCase())) return !0;
          break;
        default:
          throw Error(j(365));
      }
      return !1;
    }
    function fs(n) {
      switch (n.$$typeof) {
        case Un:
          return "<" + (Vn(n.value) || "Unknown") + ">";
        case fn:
          return ":has(" + (fs(n) || "") + ")";
        case qi:
          return '[role="' + n.value + '"]';
        case Gi:
          return '"' + n.value + '"';
        case Yi:
          return '[data-testname="' + n.value + '"]';
        default:
          throw Error(j(365));
      }
    }
    function Vc(n, a) {
      var u = [];
      n = [n, 0];
      for (var o = 0; o < n.length; ) {
        var c = n[o++], f = n[o++], m = a[f];
        if (c.tag !== 5 || !El(c)) {
          for (; m != null && st(c, m); ) f++, m = a[f];
          if (f === a.length) u.push(c);
          else for (c = c.child; c !== null; ) n.push(c, f), c = c.sibling;
        }
      }
      return u;
    }
    function ds(n, a) {
      if (!Aa) throw Error(j(363));
      n = cs(n), n = Vc(n, a), a = [], n = Array.from(n);
      for (var u = 0; u < n.length; ) {
        var o = n[u++];
        if (o.tag === 5) El(o) || a.push(o.stateNode);
        else for (o = o.child; o !== null; ) n.push(o), o = o.sibling;
      }
      return a;
    }
    var Bc = Math.ceil, gr = va.ReactCurrentDispatcher, Er = va.ReactCurrentOwner, nt = va.ReactCurrentBatchConfig, pe = 0, Tt = null, ct = null, Lt = 0, _n = 0, il = ya(0), ft = 0, zu = null, ol = 0, Ji = 0, vs = 0, Nu = null, dn = null, Xi = 0, ps = 1 / 0, Da = null;
    function Bl() {
      ps = gt() + 500;
    }
    var Ki = !1, Uu = null, xr = null, Xt = !1, Kt = null, Ql = 0, sl = 0, Zi = null, Pi = -1, _u = 0;
    function Xe() {
      return pe & 6 ? gt() : Pi !== -1 ? Pi : Pi = gt();
    }
    function Ja(n) {
      return n.mode & 1 ? pe & 2 && Lt !== 0 ? Lt & -Lt : _d.transition !== null ? (_u === 0 && (_u = Jr()), _u) : (n = ze, n !== 0 ? n : zo()) : 1;
    }
    function Ot(n, a, u, o) {
      if (50 < sl) throw sl = 0, Zi = null, Error(j(185));
      fu(n, u, o), (!(pe & 2) || n !== Tt) && (n === Tt && (!(pe & 2) && (Ji |= u), ft === 4 && pn(n, Lt)), yt(n, o), u === 1 && pe === 0 && !(a.mode & 1) && (Bl(), ai && Sa()));
    }
    function yt(n, a) {
      var u = n.callbackNode;
      xd(n, a);
      var o = ti(n, n === Tt ? Lt : 0);
      if (o === 0) u !== null && cc(u), n.callbackNode = null, n.callbackPriority = 0;
      else if (a = o & -o, n.callbackPriority !== a) {
        if (u != null && cc(u), a === 1) n.tag === 0 ? fc(za.bind(null, n)) : Yo(za.bind(null, n)), Ku ? Zu(function() {
          !(pe & 6) && Sa();
        }) : Bo(Qo, Sa), u = null;
        else {
          switch (sc(o)) {
            case 1:
              u = Qo;
              break;
            case 4:
              u = Dd;
              break;
            case 16:
              u = wo;
              break;
            case 536870912:
              u = zd;
              break;
            default:
              u = wo;
          }
          u = Gc(u, Mu.bind(null, n));
        }
        n.callbackPriority = a, n.callbackNode = u;
      }
    }
    function Mu(n, a) {
      if (Pi = -1, _u = 0, pe & 6) throw Error(j(327));
      var u = n.callbackNode;
      if (ke() && n.callbackNode !== u) return null;
      var o = ti(n, n === Tt ? Lt : 0);
      if (o === 0) return null;
      if (o & 30 || o & n.expiredLanes || a) a = ql(n, o);
      else {
        a = o;
        var c = pe;
        pe |= 2;
        var f = Rr();
        (Tt !== n || Lt !== a) && (Da = null, Bl(), cl(n, a));
        do
          try {
            Od();
            break;
          } catch (g) {
            Qc(n, g);
          }
        while (!0);
        fi(), gr.current = f, pe = c, ct !== null ? a = 0 : (Tt = null, Lt = 0, a = ft);
      }
      if (a !== 0) {
        if (a === 2 && (c = jo(n), c !== 0 && (o = c, a = wl(n, c))), a === 1) throw u = zu, cl(n, 0), pn(n, o), yt(n, gt()), u;
        if (a === 6) pn(n, o);
        else {
          if (c = n.current.alternate, !(o & 30) && !Xn(c) && (a = ql(n, o), a === 2 && (f = jo(n), f !== 0 && (o = f, a = wl(n, f))), a === 1)) throw u = zu, cl(n, 0), pn(n, o), yt(n, gt()), u;
          switch (n.finishedWork = c, n.finishedLanes = o, a) {
            case 0:
            case 1:
              throw Error(j(345));
            case 2:
              fl(n, dn, Da);
              break;
            case 3:
              if (pn(n, o), (o & 130023424) === o && (a = Xi + 500 - gt(), 10 < a)) {
                if (ti(n, 0) !== 0) break;
                if (c = n.suspendedLanes, (c & o) !== o) {
                  Xe(), n.pingedLanes |= n.suspendedLanes & c;
                  break;
                }
                n.timeoutHandle = Vr(fl.bind(null, n, dn, Da), a);
                break;
              }
              fl(n, dn, Da);
              break;
            case 4:
              if (pn(n, o), (o & 4194240) === o) break;
              for (a = n.eventTimes, c = -1; 0 < o; ) {
                var m = 31 - un(o);
                f = 1 << m, m = a[m], m > c && (c = m), o &= ~f;
              }
              if (o = c, o = gt() - o, o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * Bc(o / 1960)) - o, 10 < o) {
                n.timeoutHandle = Vr(fl.bind(null, n, dn, Da), o);
                break;
              }
              fl(n, dn, Da);
              break;
            case 5:
              fl(n, dn, Da);
              break;
            default:
              throw Error(j(329));
          }
        }
      }
      return yt(n, gt()), n.callbackNode === u ? Mu.bind(null, n) : null;
    }
    function wl(n, a) {
      var u = Nu;
      return n.current.memoizedState.isDehydrated && (cl(n, a).flags |= 256), n = ql(n, a), n !== 2 && (a = dn, dn = u, a !== null && vn(a)), n;
    }
    function vn(n) {
      dn === null ? dn = n : dn.push.apply(dn, n);
    }
    function Xn(n) {
      for (var a = n; ; ) {
        if (a.flags & 16384) {
          var u = a.updateQueue;
          if (u !== null && (u = u.stores, u !== null)) for (var o = 0; o < u.length; o++) {
            var c = u[o], f = c.getSnapshot;
            c = c.value;
            try {
              if (!ea(f(), c)) return !1;
            } catch {
              return !1;
            }
          }
        }
        if (u = a.child, a.subtreeFlags & 16384 && u !== null) u.return = a, a = u;
        else {
          if (a === n) break;
          for (; a.sibling === null; ) {
            if (a.return === null || a.return === n) return !0;
            a = a.return;
          }
          a.sibling.return = a.return, a = a.sibling;
        }
      }
      return !0;
    }
    function pn(n, a) {
      for (a &= ~vs, a &= ~Ji, n.suspendedLanes |= a, n.pingedLanes &= ~a, n = n.expirationTimes; 0 < a; ) {
        var u = 31 - un(a), o = 1 << u;
        n[u] = -1, a &= ~o;
      }
    }
    function za(n) {
      if (pe & 6) throw Error(j(327));
      ke();
      var a = ti(n, 0);
      if (!(a & 1)) return yt(n, gt()), null;
      var u = ql(n, a);
      if (n.tag !== 0 && u === 2) {
        var o = jo(n);
        o !== 0 && (a = o, u = wl(n, o));
      }
      if (u === 1) throw u = zu, cl(n, 0), pn(n, a), yt(n, gt()), u;
      if (u === 6) throw Error(j(345));
      return n.finishedWork = n.current.alternate, n.finishedLanes = a, fl(n, dn, Da), yt(n, gt()), null;
    }
    function Na(n) {
      Kt !== null && Kt.tag === 0 && !(pe & 6) && ke();
      var a = pe;
      pe |= 1;
      var u = nt.transition, o = ze;
      try {
        if (nt.transition = null, ze = 1, n) return n();
      } finally {
        ze = o, nt.transition = u, pe = a, !(pe & 6) && Sa();
      }
    }
    function ms() {
      _n = il.current, Ge(il);
    }
    function cl(n, a) {
      n.finishedWork = null, n.finishedLanes = 0;
      var u = n.timeoutHandle;
      if (u !== lu && (n.timeoutHandle = lu, To(u)), ct !== null) for (u = ct.return; u !== null; ) {
        var o = u;
        switch (Jo(o), o.tag) {
          case 1:
            o = o.type.childContextTypes, o != null && Cl();
            break;
          case 3:
            pr(), Ge(ln), Ge(wt), yu();
            break;
          case 5:
            aa(o);
            break;
          case 4:
            pr();
            break;
          case 13:
            Ge(Me);
            break;
          case 19:
            Ge(Me);
            break;
          case 10:
            di(o.type._context);
            break;
          case 22:
          case 23:
            ms();
        }
        u = u.return;
      }
      if (Tt = n, ct = n = Ka(n.current, null), Lt = _n = a, ft = 0, zu = null, vs = Ji = ol = 0, dn = Nu = null, dr !== null) {
        for (a = 0; a < dr.length; a++) if (u = dr[a], o = u.interleaved, o !== null) {
          u.interleaved = null;
          var c = o.next, f = u.pending;
          if (f !== null) {
            var m = f.next;
            f.next = c, o.next = m;
          }
          u.pending = o;
        }
        dr = null;
      }
      return n;
    }
    function Qc(n, a) {
      do {
        var u = ct;
        try {
          if (fi(), qt.current = Ll, qa) {
            for (var o = Je.memoizedState; o !== null; ) {
              var c = o.queue;
              c !== null && (c.pending = null), o = o.next;
            }
            qa = !1;
          }
          if (Yt = 0, ht = We = Je = null, mr = !1, on = 0, Er.current = null, u === null || u.return === null) {
            ft = 1, zu = a, ct = null;
            break;
          }
          e: {
            var f = n, m = u.return, g = u, z = a;
            if (a = Lt, g.flags |= 32768, z !== null && typeof z == "object" && typeof z.then == "function") {
              var A = z, Q = g, re = Q.tag;
              if (!(Q.mode & 1) && (re === 0 || re === 11 || re === 15)) {
                var J = Q.alternate;
                J ? (Q.updateQueue = J.updateQueue, Q.memoizedState = J.memoizedState, Q.lanes = J.lanes) : (Q.updateQueue = null, Q.memoizedState = null);
              }
              var Ke = Ve(m);
              if (Ke !== null) {
                Ke.flags &= -257, Eu(Ke, m, g, f, a), Ke.mode & 1 && Dc(f, A, a), a = Ke, z = A;
                var de = a.updateQueue;
                if (de === null) {
                  var Te = /* @__PURE__ */ new Set();
                  Te.add(z), a.updateQueue = Te;
                } else de.add(z);
                break e;
              } else {
                if (!(a & 1)) {
                  Dc(f, A, a), Wi();
                  break e;
                }
                z = Error(j(426));
              }
            } else if (Pe && g.mode & 1) {
              var Pa = Ve(m);
              if (Pa !== null) {
                !(Pa.flags & 65536) && (Pa.flags |= 256), Eu(Pa, m, g, f, a), Zo(tl(z, g));
                break e;
              }
            }
            f = z = tl(z, g), ft !== 4 && (ft = 2), Nu === null ? Nu = [f] : Nu.push(f), f = m;
            do {
              switch (f.tag) {
                case 3:
                  f.flags |= 65536, a &= -a, f.lanes |= a;
                  var R = yr(f, z, a);
                  Ec(f, R);
                  break e;
                case 1:
                  g = z;
                  var S = f.type, U = f.stateNode;
                  if (!(f.flags & 128) && (typeof S.getDerivedStateFromError == "function" || U !== null && typeof U.componentDidCatch == "function" && (xr === null || !xr.has(U)))) {
                    f.flags |= 65536, a &= -a, f.lanes |= a;
                    var w = sn(f, g, a);
                    Ec(f, w);
                    break e;
                  }
              }
              f = f.return;
            } while (f !== null);
          }
          wc(u);
        } catch (k) {
          a = k, ct === u && u !== null && (ct = u = u.return);
          continue;
        }
        break;
      } while (!0);
    }
    function Rr() {
      var n = gr.current;
      return gr.current = Ll, n === null ? Ll : n;
    }
    function Wi() {
      (ft === 0 || ft === 3 || ft === 2) && (ft = 4), Tt === null || !(ol & 268435455) && !(Ji & 268435455) || pn(Tt, Lt);
    }
    function ql(n, a) {
      var u = pe;
      pe |= 2;
      var o = Rr();
      (Tt !== n || Lt !== a) && (Da = null, cl(n, a));
      do
        try {
          bi();
          break;
        } catch (c) {
          Qc(n, c);
        }
      while (!0);
      if (fi(), pe = u, gr.current = o, ct !== null) throw Error(j(261));
      return Tt = null, Lt = 0, ft;
    }
    function bi() {
      for (; ct !== null; ) ki(ct);
    }
    function Od() {
      for (; ct !== null && !Td(); ) ki(ct);
    }
    function ki(n) {
      var a = Yc(n.alternate, n, _n);
      n.memoizedProps = n.pendingProps, a === null ? wc(n) : ct = a, Er.current = null;
    }
    function wc(n) {
      var a = n;
      do {
        var u = a.alternate;
        if (n = a.return, a.flags & 32768) {
          if (u = Hd(u, a), u !== null) {
            u.flags &= 32767, ct = u;
            return;
          }
          if (n !== null) n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null;
          else {
            ft = 6, ct = null;
            return;
          }
        } else if (u = is(u, a, _n), u !== null) {
          ct = u;
          return;
        }
        if (a = a.sibling, a !== null) {
          ct = a;
          return;
        }
        ct = a = n;
      } while (a !== null);
      ft === 0 && (ft = 5);
    }
    function fl(n, a, u) {
      var o = ze, c = nt.transition;
      try {
        nt.transition = null, ze = 1, dl(n, a, u, o);
      } finally {
        nt.transition = c, ze = o;
      }
      return null;
    }
    function dl(n, a, u, o) {
      do
        ke();
      while (Kt !== null);
      if (pe & 6) throw Error(j(327));
      u = n.finishedWork;
      var c = n.finishedLanes;
      if (u === null) return null;
      if (n.finishedWork = null, n.finishedLanes = 0, u === n.current) throw Error(j(177));
      n.callbackNode = null, n.callbackPriority = 0;
      var f = u.lanes | u.childLanes;
      if (Rd(n, f), n === Tt && (ct = Tt = null, Lt = 0), !(u.subtreeFlags & 2064) && !(u.flags & 2064) || Xt || (Xt = !0, Gc(wo, function() {
        return ke(), null;
      })), f = (u.flags & 15990) !== 0, u.subtreeFlags & 15990 || f) {
        f = nt.transition, nt.transition = null;
        var m = ze;
        ze = 1;
        var g = pe;
        pe |= 4, Er.current = null, Tu(n, u), ll(u, n), we(n.containerInfo), n.current = u, Ld(u), Cd(), pe = g, ze = m, nt.transition = f;
      } else n.current = u;
      if (Xt && (Xt = !1, Kt = n, Ql = c), f = n.pendingLanes, f === 0 && (xr = null), Nd(u.stateNode), yt(n, gt()), a !== null) for (o = n.onRecoverableError, u = 0; u < a.length; u++) c = a[u], o(c.value, { componentStack: c.stack, digest: c.digest });
      if (Ki) throw Ki = !1, n = Uu, Uu = null, n;
      return Ql & 1 && n.tag !== 0 && ke(), f = n.pendingLanes, f & 1 ? n === Zi ? sl++ : (sl = 0, Zi = n) : sl = 0, Sa(), null;
    }
    function ke() {
      if (Kt !== null) {
        var n = sc(Ql), a = nt.transition, u = ze;
        try {
          if (nt.transition = null, ze = 16 > n ? 16 : n, Kt === null) var o = !1;
          else {
            if (n = Kt, Kt = null, Ql = 0, pe & 6) throw Error(j(331));
            var c = pe;
            for (pe |= 4, q = n.current; q !== null; ) {
              var f = q, m = f.child;
              if (q.flags & 16) {
                var g = f.deletions;
                if (g !== null) {
                  for (var z = 0; z < g.length; z++) {
                    var A = g[z];
                    for (q = A; q !== null; ) {
                      var Q = q;
                      switch (Q.tag) {
                        case 0:
                        case 11:
                        case 15:
                          bt(8, Q, f);
                      }
                      var re = Q.child;
                      if (re !== null) re.return = Q, q = re;
                      else for (; q !== null; ) {
                        Q = q;
                        var J = Q.sibling, Ke = Q.return;
                        if (Fc(Q), Q === A) {
                          q = null;
                          break;
                        }
                        if (J !== null) {
                          J.return = Ke, q = J;
                          break;
                        }
                        q = Ke;
                      }
                    }
                  }
                  var de = f.alternate;
                  if (de !== null) {
                    var Te = de.child;
                    if (Te !== null) {
                      de.child = null;
                      do {
                        var Pa = Te.sibling;
                        Te.sibling = null, Te = Pa;
                      } while (Te !== null);
                    }
                  }
                  q = f;
                }
              }
              if (f.subtreeFlags & 2064 && m !== null) m.return = f, q = m;
              else e: for (; q !== null; ) {
                if (f = q, f.flags & 2048) switch (f.tag) {
                  case 0:
                  case 11:
                  case 15:
                    bt(9, f, f.return);
                }
                var R = f.sibling;
                if (R !== null) {
                  R.return = f.return, q = R;
                  break e;
                }
                q = f.return;
              }
            }
            var S = n.current;
            for (q = S; q !== null; ) {
              m = q;
              var U = m.child;
              if (m.subtreeFlags & 2064 && U !== null) U.return = m, q = U;
              else e: for (m = S; q !== null; ) {
                if (g = q, g.flags & 2048) try {
                  switch (g.tag) {
                    case 0:
                    case 11:
                    case 15:
                      tt(9, g);
                  }
                } catch (k) {
                  Re(g, g.return, k);
                }
                if (g === m) {
                  q = null;
                  break e;
                }
                var w = g.sibling;
                if (w !== null) {
                  w.return = g.return, q = w;
                  break e;
                }
                q = g.return;
              }
            }
            if (pe = c, Sa(), $n && typeof $n.onPostCommitFiberRoot == "function") try {
              $n.onPostCommitFiberRoot(ni, n);
            } catch {
            }
            o = !0;
          }
          return o;
        } finally {
          ze = u, nt.transition = a;
        }
      }
      return !1;
    }
    function Mn(n, a, u) {
      a = tl(u, a), a = yr(n, a, 1), n = vr(n, a, 1), a = Xe(), n !== null && (fu(n, 1, a), yt(n, a));
    }
    function Re(n, a, u) {
      if (n.tag === 3) Mn(n, n, u);
      else for (; a !== null; ) {
        if (a.tag === 3) {
          Mn(a, n, u);
          break;
        } else if (a.tag === 1) {
          var o = a.stateNode;
          if (typeof a.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (xr === null || !xr.has(o))) {
            n = tl(u, n), n = sn(a, n, 1), a = vr(a, n, 1), n = Xe(), a !== null && (fu(a, 1, n), yt(a, n));
            break;
          }
        }
        a = a.return;
      }
    }
    function Tr(n, a, u) {
      var o = n.pingCache;
      o !== null && o.delete(a), a = Xe(), n.pingedLanes |= n.suspendedLanes & u, Tt === n && (Lt & u) === u && (ft === 4 || ft === 3 && (Lt & 130023424) === Lt && 500 > gt() - Xi ? cl(n, 0) : vs |= u), yt(n, a);
    }
    function Xa(n, a) {
      a === 0 && (n.mode & 1 ? (a = ei, ei <<= 1, !(ei & 130023424) && (ei = 4194304)) : a = 1);
      var u = Xe();
      n = qn(n, a), n !== null && (fu(n, a, u), yt(n, u));
    }
    function Fd(n) {
      var a = n.memoizedState, u = 0;
      a !== null && (u = a.retryLane), Xa(n, u);
    }
    function qc(n, a) {
      var u = 0;
      switch (n.tag) {
        case 13:
          var o = n.stateNode, c = n.memoizedState;
          c !== null && (u = c.retryLane);
          break;
        case 19:
          o = n.stateNode;
          break;
        default:
          throw Error(j(314));
      }
      o !== null && o.delete(a), Xa(n, u);
    }
    var Yc;
    Yc = function(n, a, u) {
      if (n !== null) if (n.memoizedProps !== a.pendingProps || ln.current) xt = !0;
      else {
        if (!(n.lanes & u) && !(a.flags & 128)) return xt = !1, fe(n, a, u);
        xt = !!(n.flags & 131072);
      }
      else xt = !1, Pe && a.flags & 1048576 && vu(a, ri, a.index);
      switch (a.lanes = 0, a.tag) {
        case 2:
          var o = a.type;
          Gt(n, a), n = a.pendingProps;
          var c = Gr(a, wt.current);
          Pr(a, u), c = yi(null, a, o, n, c, u);
          var f = Ml();
          return a.flags |= 1, typeof c == "object" && c !== null && typeof c.render == "function" && c.$$typeof === void 0 ? (a.tag = 1, a.memoizedState = null, a.updateQueue = null, Pt(o) ? (f = !0, ku(a)) : f = !1, a.memoizedState = c.state !== null && c.state !== void 0 ? c.state : null, xa(a), c.updater = Ya, a.stateNode = c, c._reactInternals = a, Su(a, o, n, u), a = Oi(null, a, o, !0, f, u)) : (a.tag = 0, Pe && f && Go(a), Rt(null, a, c, u), a = a.child), a;
        case 16:
          o = a.elementType;
          e: {
            switch (Gt(n, a), n = a.pendingProps, c = o._init, o = c(o._payload), a.type = o, c = a.tag = hs(o), n = zn(o, n), c) {
              case 0:
                a = as(null, a, o, n, u);
                break e;
              case 1:
                a = Li(null, a, o, n, u);
                break e;
              case 11:
                a = zc(null, a, o, n, u);
                break e;
              case 14:
                a = Nc(null, a, o, zn(o.type, n), u);
                break e;
            }
            throw Error(j(
              306,
              o,
              ""
            ));
          }
          return a;
        case 0:
          return o = a.type, c = a.pendingProps, c = a.elementType === o ? c : zn(o, c), as(n, a, o, c, u);
        case 1:
          return o = a.type, c = a.pendingProps, c = a.elementType === o ? c : zn(o, c), Li(n, a, o, c, u);
        case 3:
          e: {
            if (Mc(a), n === null) throw Error(j(387));
            o = a.pendingProps, f = a.memoizedState, c = f.element, pi(n, a), Ul(a, o, null, u);
            var m = a.memoizedState;
            if (o = m.element, rn && f.isDehydrated) if (f = { element: o, isDehydrated: !1, cache: m.cache, pendingSuspenseBoundaries: m.pendingSuspenseBoundaries, transitions: m.transitions }, a.updateQueue.baseState = f, a.memoizedState = f, a.flags & 256) {
              c = tl(Error(j(423)), a), a = Hc(n, a, o, u, c);
              break e;
            } else if (o !== c) {
              c = tl(Error(j(424)), a), a = Hc(n, a, o, u, c);
              break e;
            } else for (rn && (wn = _o(a.stateNode.containerInfo), xn = a, Pe = !0, na = null, pu = !1), u = Sc(a, null, o, u), a.child = u; u; ) u.flags = u.flags & -3 | 4096, u = u.sibling;
            else {
              if (Dl(), o === c) {
                a = cn(n, a, u);
                break e;
              }
              Rt(n, a, o, u);
            }
            a = a.child;
          }
          return a;
        case 5:
          return hu(a), n === null && Ko(a), o = a.type, c = a.pendingProps, f = n !== null ? n.memoizedProps : null, m = c.children, rr(o, c) ? m = null : f !== null && rr(o, f) && (a.flags |= 32), Hi(n, a), Rt(n, a, m, u), a.child;
        case 6:
          return n === null && Ko(a), null;
        case 13:
          return ls(n, a, u);
        case 4:
          return Dn(a, a.stateNode.containerInfo), o = a.pendingProps, n === null ? a.child = zl(a, null, o, u) : Rt(n, a, o, u), a.child;
        case 11:
          return o = a.type, c = a.pendingProps, c = a.elementType === o ? c : zn(o, c), zc(n, a, o, c, u);
        case 7:
          return Rt(n, a, a.pendingProps, u), a.child;
        case 8:
          return Rt(n, a, a.pendingProps.children, u), a.child;
        case 12:
          return Rt(n, a, a.pendingProps.children, u), a.child;
        case 10:
          e: {
            if (o = a.type._context, c = a.pendingProps, f = a.memoizedProps, m = c.value, Po(a, o, m), f !== null) if (ea(f.value, m)) {
              if (f.children === c.children && !ln.current) {
                a = cn(n, a, u);
                break e;
              }
            } else for (f = a.child, f !== null && (f.return = a); f !== null; ) {
              var g = f.dependencies;
              if (g !== null) {
                m = f.child;
                for (var z = g.firstContext; z !== null; ) {
                  if (z.context === o) {
                    if (f.tag === 1) {
                      z = Yn(-1, u & -u), z.tag = 2;
                      var A = f.updateQueue;
                      if (A !== null) {
                        A = A.shared;
                        var Q = A.pending;
                        Q === null ? z.next = z : (z.next = Q.next, Q.next = z), A.pending = z;
                      }
                    }
                    f.lanes |= u, z = f.alternate, z !== null && (z.lanes |= u), vi(f.return, u, a), g.lanes |= u;
                    break;
                  }
                  z = z.next;
                }
              } else if (f.tag === 10) m = f.type === a.type ? null : f.child;
              else if (f.tag === 18) {
                if (m = f.return, m === null) throw Error(j(341));
                m.lanes |= u, g = m.alternate, g !== null && (g.lanes |= u), vi(m, u, a), m = f.sibling;
              } else m = f.child;
              if (m !== null) m.return = f;
              else for (m = f; m !== null; ) {
                if (m === a) {
                  m = null;
                  break;
                }
                if (f = m.sibling, f !== null) {
                  f.return = m.return, m = f;
                  break;
                }
                m = m.return;
              }
              f = m;
            }
            Rt(n, a, c.children, u), a = a.child;
          }
          return a;
        case 9:
          return c = a.type, o = a.pendingProps.children, Pr(a, u), c = Rn(c), o = o(c), a.flags |= 1, Rt(n, a, o, u), a.child;
        case 14:
          return o = a.type, c = zn(o, a.pendingProps), c = zn(o.type, c), Nc(n, a, o, c, u);
        case 15:
          return Uc(n, a, a.type, a.pendingProps, u);
        case 17:
          return o = a.type, c = a.pendingProps, c = a.elementType === o ? c : zn(o, c), Gt(n, a), a.tag = 1, Pt(o) ? (n = !0, ku(a)) : n = !1, Pr(a, u), Ni(a, o, c), Su(a, o, c, u), Oi(null, a, o, !0, n, u);
        case 19:
          return ji(n, a, u);
        case 22:
          return _c(n, a, u);
      }
      throw Error(j(156, a.tag));
    };
    function Gc(n, a) {
      return Bo(n, a);
    }
    function Ad(n, a, u, o) {
      this.tag = n, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = a, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
    }
    function Hn(n, a, u, o) {
      return new Ad(n, a, u, o);
    }
    function Ii(n) {
      return n = n.prototype, !(!n || !n.isReactComponent);
    }
    function hs(n) {
      if (typeof n == "function") return Ii(n) ? 1 : 0;
      if (n != null) {
        if (n = n.$$typeof, n === Gu) return 11;
        if (n === Xu) return 14;
      }
      return 2;
    }
    function Ka(n, a) {
      var u = n.alternate;
      return u === null ? (u = Hn(n.tag, a, n.key, n.mode), u.elementType = n.elementType, u.type = n.type, u.stateNode = n.stateNode, u.alternate = n, n.alternate = u) : (u.pendingProps = a, u.type = n.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = n.flags & 14680064, u.childLanes = n.childLanes, u.lanes = n.lanes, u.child = n.child, u.memoizedProps = n.memoizedProps, u.memoizedState = n.memoizedState, u.updateQueue = n.updateQueue, a = n.dependencies, u.dependencies = a === null ? null : { lanes: a.lanes, firstContext: a.firstContext }, u.sibling = n.sibling, u.index = n.index, u.ref = n.ref, u;
    }
    function Hu(n, a, u, o, c, f) {
      var m = 2;
      if (o = n, typeof n == "function") Ii(n) && (m = 1);
      else if (typeof n == "string") m = 5;
      else e: switch (n) {
        case Ar:
          return Za(u.children, c, f, a);
        case ut:
          m = 8, c |= 8;
          break;
        case La:
          return n = Hn(12, u, a, c | 2), n.elementType = La, n.lanes = f, n;
        case Ju:
          return n = Hn(13, u, a, c), n.elementType = Ju, n.lanes = f, n;
        case Ro:
          return n = Hn(19, u, a, c), n.elementType = Ro, n.lanes = f, n;
        case tc:
          return Yl(u, c, f, a);
        default:
          if (typeof n == "object" && n !== null) switch (n.$$typeof) {
            case ec:
              m = 10;
              break e;
            case Oa:
              m = 9;
              break e;
            case Gu:
              m = 11;
              break e;
            case Xu:
              m = 14;
              break e;
            case pa:
              m = 16, o = null;
              break e;
          }
          throw Error(j(130, n == null ? n : typeof n, ""));
      }
      return a = Hn(m, u, a, c), a.elementType = n, a.type = o, a.lanes = f, a;
    }
    function Za(n, a, u, o) {
      return n = Hn(7, n, o, a), n.lanes = u, n;
    }
    function Yl(n, a, u, o) {
      return n = Hn(22, n, o, a), n.elementType = tc, n.lanes = u, n.stateNode = { isHidden: !1 }, n;
    }
    function Lu(n, a, u) {
      return n = Hn(6, n, null, a), n.lanes = u, n;
    }
    function ys(n, a, u) {
      return a = Hn(4, n.children !== null ? n.children : [], n.key, a), a.lanes = u, a.stateNode = { containerInfo: n.containerInfo, pendingChildren: null, implementation: n.implementation }, a;
    }
    function jd(n, a, u, o, c) {
      this.tag = a, this.containerInfo = n, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = lu, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Vo(0), this.expirationTimes = Vo(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Vo(0), this.identifierPrefix = o, this.onRecoverableError = c, rn && (this.mutableSourceEagerHydrationData = null);
    }
    function Jc(n, a, u, o, c, f, m, g, z) {
      return n = new jd(n, a, u, g, z), a === 1 ? (a = 1, f === !0 && (a |= 8)) : a = 0, f = Hn(3, null, null, a), n.current = f, f.stateNode = n, f.memoizedState = { element: o, isDehydrated: u, cache: null, transitions: null, pendingSuspenseBoundaries: null }, xa(f), n;
    }
    function Xc(n) {
      if (!n) return sr;
      n = n._reactInternals;
      e: {
        if (je(n) !== n || n.tag !== 1) throw Error(j(170));
        var a = n;
        do {
          switch (a.tag) {
            case 3:
              a = a.stateNode.context;
              break e;
            case 1:
              if (Pt(a.type)) {
                a = a.stateNode.__reactInternalMemoizedMergedChildContext;
                break e;
              }
          }
          a = a.return;
        } while (a !== null);
        throw Error(j(171));
      }
      if (n.tag === 1) {
        var u = n.type;
        if (Pt(u)) return Ao(n, u, a);
      }
      return a;
    }
    function Ss(n) {
      var a = n._reactInternals;
      if (a === void 0)
        throw typeof n.render == "function" ? Error(j(188)) : (n = Object.keys(n).join(","), Error(j(268, n)));
      return n = jr(a), n === null ? null : n.stateNode;
    }
    function Ou(n, a) {
      if (n = n.memoizedState, n !== null && n.dehydrated !== null) {
        var u = n.retryLane;
        n.retryLane = u !== 0 && u < a ? u : a;
      }
    }
    function $i(n, a) {
      Ou(n, a), (n = n.alternate) && Ou(n, a);
    }
    function Kc(n) {
      return n = jr(n), n === null ? null : n.stateNode;
    }
    function Gl() {
      return null;
    }
    return G.attemptContinuousHydration = function(n) {
      if (n.tag === 13) {
        var a = qn(n, 134217728);
        if (a !== null) {
          var u = Xe();
          Ot(a, n, 134217728, u);
        }
        $i(n, 134217728);
      }
    }, G.attemptDiscreteHydration = function(n) {
      if (n.tag === 13) {
        var a = qn(n, 1);
        if (a !== null) {
          var u = Xe();
          Ot(a, n, 1, u);
        }
        $i(n, 1);
      }
    }, G.attemptHydrationAtCurrentPriority = function(n) {
      if (n.tag === 13) {
        var a = Ja(n), u = qn(n, a);
        if (u !== null) {
          var o = Xe();
          Ot(u, n, a, o);
        }
        $i(n, a);
      }
    }, G.attemptSynchronousHydration = function(n) {
      switch (n.tag) {
        case 3:
          var a = n.stateNode;
          if (a.current.memoizedState.isDehydrated) {
            var u = cu(a.pendingLanes);
            u !== 0 && (Xr(a, u | 1), yt(a, gt()), !(pe & 6) && (Bl(), Sa()));
          }
          break;
        case 13:
          Na(function() {
            var o = qn(n, 1);
            if (o !== null) {
              var c = Xe();
              Ot(o, n, 1, c);
            }
          }), $i(n, 1);
      }
    }, G.batchedUpdates = function(n, a) {
      var u = pe;
      pe |= 1;
      try {
        return n(a);
      } finally {
        pe = u, pe === 0 && (Bl(), ai && Sa());
      }
    }, G.createComponentSelector = function(n) {
      return { $$typeof: Un, value: n };
    }, G.createContainer = function(n, a, u, o, c, f, m) {
      return Jc(n, a, !1, null, u, o, c, f, m);
    }, G.createHasPseudoClassSelector = function(n) {
      return { $$typeof: fn, value: n };
    }, G.createHydrationContainer = function(n, a, u, o, c, f, m, g, z) {
      return n = Jc(u, o, !0, n, c, f, m, g, z), n.context = Xc(null), u = n.current, o = Xe(), c = Ja(u), f = Yn(o, c), f.callback = a ?? null, vr(u, f, c), n.current.lanes = c, fu(n, c, o), yt(n, o), n;
    }, G.createPortal = function(n, a, u) {
      var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return { $$typeof: D, key: o == null ? null : "" + o, children: n, containerInfo: a, implementation: u };
    }, G.createRoleSelector = function(n) {
      return { $$typeof: qi, value: n };
    }, G.createTestNameSelector = function(n) {
      return { $$typeof: Yi, value: n };
    }, G.createTextSelector = function(n) {
      return { $$typeof: Gi, value: n };
    }, G.deferredUpdates = function(n) {
      var a = ze, u = nt.transition;
      try {
        return nt.transition = null, ze = 16, n();
      } finally {
        ze = a, nt.transition = u;
      }
    }, G.discreteUpdates = function(n, a, u, o, c) {
      var f = ze, m = nt.transition;
      try {
        return nt.transition = null, ze = 1, n(a, u, o, c);
      } finally {
        ze = f, nt.transition = m, pe === 0 && Bl();
      }
    }, G.findAllNodes = ds, G.findBoundingRects = function(n, a) {
      if (!Aa) throw Error(j(363));
      a = ds(n, a), n = [];
      for (var u = 0; u < a.length; u++) n.push(id(a[u]));
      for (a = n.length - 1; 0 < a; a--) {
        u = n[a];
        for (var o = u.x, c = o + u.width, f = u.y, m = f + u.height, g = a - 1; 0 <= g; g--) if (a !== g) {
          var z = n[g], A = z.x, Q = A + z.width, re = z.y, J = re + z.height;
          if (o >= A && f >= re && c <= Q && m <= J) {
            n.splice(a, 1);
            break;
          } else if (o !== A || u.width !== z.width || J < f || re > m) {
            if (!(f !== re || u.height !== z.height || Q < o || A > c)) {
              A > o && (z.width += A - o, z.x = o), Q < c && (z.width = c - A), n.splice(a, 1);
              break;
            }
          } else {
            re > f && (z.height += re - f, z.y = f), J < m && (z.height = m - re), n.splice(a, 1);
            break;
          }
        }
      }
      return n;
    }, G.findHostInstance = Ss, G.findHostInstanceWithNoPortals = function(n) {
      return n = Ye(n), n = n !== null ? au(n) : null, n === null ? null : n.stateNode;
    }, G.findHostInstanceWithWarning = function(n) {
      return Ss(n);
    }, G.flushControlled = function(n) {
      var a = pe;
      pe |= 1;
      var u = nt.transition, o = ze;
      try {
        nt.transition = null, ze = 1, n();
      } finally {
        ze = o, nt.transition = u, pe = a, pe === 0 && (Bl(), Sa());
      }
    }, G.flushPassiveEffects = ke, G.flushSync = Na, G.focusWithin = function(n, a) {
      if (!Aa) throw Error(j(363));
      for (n = cs(n), a = Vc(n, a), a = Array.from(a), n = 0; n < a.length; ) {
        var u = a[n++];
        if (!El(u)) {
          if (u.tag === 5 && cd(u.stateNode)) return !0;
          for (u = u.child; u !== null; ) a.push(u), u = u.sibling;
        }
      }
      return !1;
    }, G.getCurrentUpdatePriority = function() {
      return ze;
    }, G.getFindAllNodesFailureDescription = function(n, a) {
      if (!Aa) throw Error(j(363));
      var u = 0, o = [];
      n = [cs(n), 0];
      for (var c = 0; c < n.length; ) {
        var f = n[c++], m = n[c++], g = a[m];
        if ((f.tag !== 5 || !El(f)) && (st(f, g) && (o.push(fs(g)), m++, m > u && (u = m)), m < a.length)) for (f = f.child; f !== null; ) n.push(f, m), f = f.sibling;
      }
      if (u < a.length) {
        for (n = []; u < a.length; u++) n.push(fs(a[u]));
        return `findAllNodes was able to match part of the selector:
  ` + (o.join(" > ") + `

No matching component was found for:
  `) + n.join(" > ");
      }
      return null;
    }, G.getPublicRootInstance = function(n) {
      if (n = n.current, !n.child) return null;
      switch (n.child.tag) {
        case 5:
          return _e(n.child.stateNode);
        default:
          return n.child.stateNode;
      }
    }, G.injectIntoDevTools = function(n) {
      if (n = { bundleType: n.bundleType, version: n.version, rendererPackageName: n.rendererPackageName, rendererConfig: n.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: va.ReactCurrentDispatcher, findHostInstanceByFiber: Kc, findFiberByHostInstance: n.findFiberByHostInstance || Gl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1" }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") n = !1;
      else {
        var a = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (a.isDisabled || !a.supportsFiber) n = !0;
        else {
          try {
            ni = a.inject(n), $n = a;
          } catch {
          }
          n = !!a.checkDCE;
        }
      }
      return n;
    }, G.isAlreadyRendering = function() {
      return !1;
    }, G.observeVisibleRects = function(n, a, u, o) {
      if (!Aa) throw Error(j(363));
      n = ds(n, a);
      var c = fd(n, u, o).disconnect;
      return { disconnect: function() {
        c();
      } };
    }, G.registerMutableSourceForHydration = function(n, a) {
      var u = a._getVersion;
      u = u(a._source), n.mutableSourceEagerHydrationData == null ? n.mutableSourceEagerHydrationData = [a, u] : n.mutableSourceEagerHydrationData.push(a, u);
    }, G.runWithPriority = function(n, a) {
      var u = ze;
      try {
        return ze = n, a();
      } finally {
        ze = u;
      }
    }, G.shouldError = function() {
      return null;
    }, G.shouldSuspend = function() {
      return !1;
    }, G.updateContainer = function(n, a, u, o) {
      var c = a.current, f = Xe(), m = Ja(c);
      return u = Xc(u), a.context === null ? a.context = u : a.pendingContext = u, a = Yn(f, m), a.payload = { element: n }, o = o === void 0 ? null : o, o !== null && (a.callback = o), n = vr(c, a, m), n !== null && (Ot(n, c, m, f), Nl(n, c, m)), m;
    }, G;
  }), Gp;
}
var Jp = { exports: {} };
/**
 * @license React
 * react-reconciler.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ly;
function g1() {
  return Ly || (Ly = 1, process.env.NODE_ENV !== "production" && (Jp.exports = function(E) {
    var G = {}, xo = Ay, Ie = jy(), lt = xo.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, j = !1;
    function va(e) {
      j = e;
    }
    function Wn(e) {
      if (!j) {
        for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          r[l - 1] = arguments[l];
        Ar("warn", e, r);
      }
    }
    function D(e) {
      if (!j) {
        for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), l = 1; l < t; l++)
          r[l - 1] = arguments[l];
        Ar("error", e, r);
      }
    }
    function Ar(e, t, r) {
      {
        var l = lt.ReactDebugCurrentFrame, i = l.getStackAddendum();
        i !== "" && (t += "%s", r = r.concat([i]));
        var s = r.map(function(d) {
          return String(d);
        });
        s.unshift("Warning: " + t), Function.prototype.apply.call(console[e], console, s);
      }
    }
    var ut = Object.assign;
    function La(e) {
      return e._reactInternals;
    }
    function ec(e, t) {
      e._reactInternals = t;
    }
    var Oa = !1, Gu = !1, Ju = !1, Ro = !0, Xu = !0, pa = !0, tc = !0, Le = 0, se = 1, Vn = 2, De = 3, je = 4, ne = 5, Ye = 6, jr = 7, nu = 8, au = 9, bn = 10, _e = 11, kn = 12, Qe = 13, In = 14, we = 15, ru = 16, ar = 17, Sl = 18, an = 19, rr = 21, Nt = 22, Vr = 23, To = 24, lu = 25, lr = Symbol.for("react.element"), vt = Symbol.for("react.portal"), Fa = Symbol.for("react.fragment"), rn = Symbol.for("react.strict_mode"), Co = Symbol.for("react.profiler"), Do = Symbol.for("react.provider"), zo = Symbol.for("react.context"), gl = Symbol.for("react.forward_ref"), Ku = Symbol.for("react.suspense"), Zu = Symbol.for("react.suspense_list"), Aa = Symbol.for("react.memo"), Zt = Symbol.for("react.lazy"), id = Symbol.for("react.scope"), od = Symbol.for("react.debug_trace_mode"), El = Symbol.for("react.offscreen"), sd = Symbol.for("react.legacy_hidden"), cd = Symbol.for("react.cache"), fd = Symbol.for("react.tracing_marker"), nc = Symbol.iterator, dd = "@@iterator";
    function Br(e) {
      if (e === null || typeof e != "object")
        return null;
      var t = nc && e[nc] || e[dd];
      return typeof t == "function" ? t : null;
    }
    function vd(e, t, r) {
      var l = e.displayName;
      if (l)
        return l;
      var i = t.displayName || t.name || "";
      return i !== "" ? r + "(" + i + ")" : r;
    }
    function ac(e) {
      return e.displayName || "Context";
    }
    function Oe(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && D("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case Fa:
          return "Fragment";
        case vt:
          return "Portal";
        case Co:
          return "Profiler";
        case rn:
          return "StrictMode";
        case Ku:
          return "Suspense";
        case Zu:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case zo:
            var t = e;
            return ac(t) + ".Consumer";
          case Do:
            var r = e;
            return ac(r._context) + ".Provider";
          case gl:
            return vd(e, e.render, "ForwardRef");
          case Aa:
            var l = e.displayName || null;
            return l !== null ? l : Oe(e.type) || "Memo";
          case Zt: {
            var i = e, s = i._payload, d = i._init;
            try {
              return Oe(d(s));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    function pd(e, t, r) {
      var l = t.displayName || t.name || "";
      return e.displayName || (l !== "" ? r + "(" + l + ")" : r);
    }
    function rc(e) {
      return e.displayName || "Context";
    }
    function ce(e) {
      var t = e.tag, r = e.type;
      switch (t) {
        case To:
          return "Cache";
        case au:
          var l = r;
          return rc(l) + ".Consumer";
        case bn:
          var i = r;
          return rc(i._context) + ".Provider";
        case Sl:
          return "DehydratedFragment";
        case _e:
          return pd(r, r.render, "ForwardRef");
        case jr:
          return "Fragment";
        case ne:
          return r;
        case je:
          return "Portal";
        case De:
          return "Root";
        case Ye:
          return "Text";
        case ru:
          return Oe(r);
        case nu:
          return r === rn ? "StrictMode" : "Mode";
        case Nt:
          return "Offscreen";
        case kn:
          return "Profiler";
        case rr:
          return "Scope";
        case Qe:
          return "Suspense";
        case an:
          return "SuspenseList";
        case lu:
          return "TracingMarker";
        case se:
        case Le:
        case ar:
        case Vn:
        case In:
        case we:
          if (typeof r == "function")
            return r.displayName || r.name || null;
          if (typeof r == "string")
            return r;
          break;
      }
      return null;
    }
    var b = (
      /*                      */
      0
    ), xl = (
      /*                */
      1
    ), it = (
      /*                    */
      2
    ), Ee = (
      /*                       */
      4
    ), ur = (
      /*                */
      16
    ), uu = (
      /*                 */
      32
    ), lc = (
      /*                     */
      64
    ), xe = (
      /*                   */
      128
    ), ma = (
      /*            */
      256
    ), Qr = (
      /*                          */
      512
    ), ir = (
      /*                     */
      1024
    ), ja = (
      /*                      */
      2048
    ), ha = (
      /*                    */
      4096
    ), wr = (
      /*                   */
      8192
    ), No = (
      /*             */
      16384
    ), md = (
      /*               */
      32767
    ), iu = (
      /*                   */
      32768
    ), Ut = (
      /*                */
      65536
    ), Uo = (
      /* */
      131072
    ), uc = (
      /*                       */
      1048576
    ), Rl = (
      /*                    */
      2097152
    ), qr = (
      /*                 */
      4194304
    ), _o = (
      /*                */
      8388608
    ), or = (
      /*               */
      16777216
    ), Mo = (
      /*              */
      33554432
    ), Ho = (
      // TODO: Remove Update flag from before mutation phase by re-landing Visibility
      // flag logic (see #20043)
      Ee | ir | 0
    ), ou = it | Ee | ur | uu | Qr | ha | wr, su = Ee | lc | Qr | wr, Tl = ja | ur, Va = qr | _o | Rl, hd = lt.ReactCurrentOwner;
    function Pu(e) {
      var t = e, r = e;
      if (e.alternate)
        for (; t.return; )
          t = t.return;
      else {
        var l = t;
        do
          t = l, (t.flags & (it | ha)) !== b && (r = t.return), l = t.return;
        while (l);
      }
      return t.tag === De ? r : null;
    }
    function yd(e) {
      return Pu(e) === e;
    }
    function Sd(e) {
      {
        var t = hd.current;
        if (t !== null && t.tag === se) {
          var r = t, l = r.stateNode;
          l._warnedAboutRefsInRender || D("%s is accessing isMounted inside its render() function. render() should be a pure function of props and state. It should never access something that requires stale data from the previous render, such as refs. Move this logic to componentDidMount and componentDidUpdate instead.", ce(r) || "A component"), l._warnedAboutRefsInRender = !0;
        }
      }
      var i = La(e);
      return i ? Pu(i) === i : !1;
    }
    function ic(e) {
      if (Pu(e) !== e)
        throw new Error("Unable to find node on an unmounted component.");
    }
    function Wu(e) {
      var t = e.alternate;
      if (!t) {
        var r = Pu(e);
        if (r === null)
          throw new Error("Unable to find node on an unmounted component.");
        return r !== e ? null : e;
      }
      for (var l = e, i = t; ; ) {
        var s = l.return;
        if (s === null)
          break;
        var d = s.alternate;
        if (d === null) {
          var v = s.return;
          if (v !== null) {
            l = i = v;
            continue;
          }
          break;
        }
        if (s.child === d.child) {
          for (var p = s.child; p; ) {
            if (p === l)
              return ic(s), e;
            if (p === i)
              return ic(s), t;
            p = p.sibling;
          }
          throw new Error("Unable to find node on an unmounted component.");
        }
        if (l.return !== i.return)
          l = s, i = d;
        else {
          for (var h = !1, y = s.child; y; ) {
            if (y === l) {
              h = !0, l = s, i = d;
              break;
            }
            if (y === i) {
              h = !0, i = s, l = d;
              break;
            }
            y = y.sibling;
          }
          if (!h) {
            for (y = d.child; y; ) {
              if (y === l) {
                h = !0, l = d, i = s;
                break;
              }
              if (y === i) {
                h = !0, i = d, l = s;
                break;
              }
              y = y.sibling;
            }
            if (!h)
              throw new Error("Child was not found in either parent set. This indicates a bug in React related to the return pointer. Please file an issue.");
          }
        }
        if (l.alternate !== i)
          throw new Error("Return fibers should always be each others' alternates. This error is likely caused by a bug in React. Please file an issue.");
      }
      if (l.tag !== De)
        throw new Error("Unable to find node on an unmounted component.");
      return l.stateNode.current === l ? e : t;
    }
    function Yr(e) {
      var t = Wu(e);
      return t !== null ? bu(t) : null;
    }
    function bu(e) {
      if (e.tag === ne || e.tag === Ye)
        return e;
      for (var t = e.child; t !== null; ) {
        var r = bu(t);
        if (r !== null)
          return r;
        t = t.sibling;
      }
      return null;
    }
    function Lo(e) {
      var t = Wu(e);
      return t !== null ? oc(t) : null;
    }
    function oc(e) {
      if (e.tag === ne || e.tag === Ye)
        return e;
      for (var t = e.child; t !== null; ) {
        if (t.tag !== je) {
          var r = oc(t);
          if (r !== null)
            return r;
        }
        t = t.sibling;
      }
      return null;
    }
    var Oo = Array.isArray;
    function St(e) {
      return Oo(e);
    }
    var ya = E.getPublicInstance, Ge = E.getRootHostContext, qe = E.getChildHostContext, sr = E.prepareForCommit, wt = E.resetAfterCommit, ln = E.createInstance, Ba = E.appendInitialChild, Gr = E.finalizeInitialChildren, Pt = E.prepareUpdate, Cl = E.shouldSetTextContent, Fo = E.createTextInstance, Ao = E.scheduleTimeout, ku = E.cancelTimeout, Iu = E.noTimeout, un = E.isPrimaryRenderer, gd = E.warnsIfNotActing, En = E.supportsMutation, $u = E.supportsPersistence, Wt = E.supportsHydration, ei = E.getInstanceFromNode;
    E.beforeActiveInstanceBlur, E.afterActiveInstanceBlur;
    var cu = E.preparePortalMount;
    E.prepareScopeUpdate, E.getInstanceFromScope;
    var ti = E.getCurrentEventPriority, Ed = E.detachDeletedInstance, xd = E.supportsMicrotasks, jo = E.scheduleMicrotask, Jr = E.supportsTestSelectors, Vo = E.findFiberRoot, fu = E.getBoundingRect, Rd = E.getTextContent, Xr = E.isHiddenSubtree, ze = E.matchAccessibilityRole, sc = E.setFocusIfFocusable, Bo = E.setupIntersectionObserver, cc = E.appendChild, Td = E.appendChildToContainer, Cd = E.commitTextUpdate, gt = E.commitMount, Qo = E.commitUpdate, Dd = E.insertBefore, wo = E.insertInContainerBefore, zd = E.removeChild, ni = E.removeChildFromContainer, $n = E.resetTextContent, Nd = E.hideInstance, Ud = E.hideTextInstance, ea = E.unhideInstance, Qa = E.unhideTextInstance, ai = E.clearContainer, qo = E.cloneInstance, Yo = E.createContainerChildSet, fc = E.appendChildToContainerChildSet, Sa = E.finalizeContainerChildren, cr = E.replaceContainerChildren, Kr = E.cloneHiddenInstance, du = E.cloneHiddenTextInstance, ri = E.canHydrateInstance, Bn = E.canHydrateTextInstance, Qn = E.canHydrateSuspenseInstance, fr = E.isSuspenseInstancePending, ta = E.isSuspenseInstanceFallback, wa = E.getSuspenseInstanceFallbackErrorDetails, Zr = E.registerSuspenseInstanceRetry, vu = E.getNextHydratableSibling, Go = E.getFirstHydratableChild, Jo = E.getFirstHydratableChildWithinContainer, xn = E.getFirstHydratableChildWithinSuspenseInstance, wn = E.hydrateInstance, Pe = E.hydrateTextInstance, pu = E.hydrateSuspenseInstance, na = E.getNextHydratableInstanceAfterSuspenseInstance, dc = E.commitHydratedContainer, vc = E.commitHydratedSuspenseInstance, Xo = E.clearSuspenseBoundary, Ko = E.clearSuspenseBoundaryFromContainer, pc = E.shouldDeleteUnhydratedTailInstances, li = E.didNotMatchHydratedContainerTextInstance, mc = E.didNotMatchHydratedTextInstance, Dl = E.didNotHydrateInstanceWithinContainer, Zo = E.didNotHydrateInstanceWithinSuspenseInstance, _d = E.didNotHydrateInstance, ui = E.didNotFindHydratableInstanceWithinContainer, Md = E.didNotFindHydratableTextInstanceWithinContainer, mu = E.didNotFindHydratableSuspenseInstanceWithinContainer, ii = E.didNotFindHydratableInstanceWithinSuspenseInstance, hc = E.didNotFindHydratableTextInstanceWithinSuspenseInstance, yc = E.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance, zl = E.didNotFindHydratableInstance, Sc = E.didNotFindHydratableTextInstance, oi = E.didNotFindHydratableSuspenseInstance, si = E.errorHydratingContainer, ga = 0, ci, fi, Po, di, vi, Pr, Rn;
    function dr() {
    }
    dr.__reactDisabledLog = !0;
    function Wo() {
      {
        if (ga === 0) {
          ci = console.log, fi = console.info, Po = console.warn, di = console.error, vi = console.group, Pr = console.groupCollapsed, Rn = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: dr,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        ga++;
      }
    }
    function gc() {
      {
        if (ga--, ga === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: ut({}, e, {
              value: ci
            }),
            info: ut({}, e, {
              value: fi
            }),
            warn: ut({}, e, {
              value: Po
            }),
            error: ut({}, e, {
              value: di
            }),
            group: ut({}, e, {
              value: vi
            }),
            groupCollapsed: ut({}, e, {
              value: Pr
            }),
            groupEnd: ut({}, e, {
              value: Rn
            })
          });
        }
        ga < 0 && D("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var qn = lt.ReactCurrentDispatcher, Ea;
    function xa(e, t, r) {
      {
        if (Ea === void 0)
          try {
            throw Error();
          } catch (i) {
            var l = i.stack.trim().match(/\n( *(at )?)/);
            Ea = l && l[1] || "";
          }
        return `
` + Ea + e;
      }
    }
    var pi = !1, Yn;
    {
      var vr = typeof WeakMap == "function" ? WeakMap : Map;
      Yn = new vr();
    }
    function Nl(e, t) {
      if (!e || pi)
        return "";
      {
        var r = Yn.get(e);
        if (r !== void 0)
          return r;
      }
      var l;
      pi = !0;
      var i = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var s;
      s = qn.current, qn.current = null, Wo();
      try {
        if (t) {
          var d = function() {
            throw Error();
          };
          if (Object.defineProperty(d.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(d, []);
            } catch (F) {
              l = F;
            }
            Reflect.construct(e, [], d);
          } else {
            try {
              d.call();
            } catch (F) {
              l = F;
            }
            e.call(d.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (F) {
            l = F;
          }
          e();
        }
      } catch (F) {
        if (F && l && typeof F.stack == "string") {
          for (var v = F.stack.split(`
`), p = l.stack.split(`
`), h = v.length - 1, y = p.length - 1; h >= 1 && y >= 0 && v[h] !== p[y]; )
            y--;
          for (; h >= 1 && y >= 0; h--, y--)
            if (v[h] !== p[y]) {
              if (h !== 1 || y !== 1)
                do
                  if (h--, y--, y < 0 || v[h] !== p[y]) {
                    var x = `
` + v[h].replace(" at new ", " at ");
                    return e.displayName && x.includes("<anonymous>") && (x = x.replace("<anonymous>", e.displayName)), typeof e == "function" && Yn.set(e, x), x;
                  }
                while (h >= 1 && y >= 0);
              break;
            }
        }
      } finally {
        pi = !1, qn.current = s, gc(), Error.prepareStackTrace = i;
      }
      var N = e ? e.displayName || e.name : "", H = N ? xa(N) : "";
      return typeof e == "function" && Yn.set(e, H), H;
    }
    function Ec(e, t, r) {
      return Nl(e, !0);
    }
    function Ul(e, t, r) {
      return Nl(e, !1);
    }
    function xc(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function Wr(e, t, r) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return Nl(e, xc(e));
      if (typeof e == "string")
        return xa(e);
      switch (e) {
        case Ku:
          return xa("Suspense");
        case Zu:
          return xa("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case gl:
            return Ul(e.render);
          case Aa:
            return Wr(e.type, t, r);
          case Zt: {
            var l = e, i = l._payload, s = l._init;
            try {
              return Wr(s(i), t, r);
            } catch {
            }
          }
        }
      return "";
    }
    var Tn = Object.prototype.hasOwnProperty, _l = {}, br = lt.ReactDebugCurrentFrame;
    function Cn(e) {
      if (e) {
        var t = e._owner, r = Wr(e.type, e._source, t ? t.type : null);
        br.setExtraStackFrame(r);
      } else
        br.setExtraStackFrame(null);
    }
    function Dn(e, t, r, l, i) {
      {
        var s = Function.call.bind(Tn);
        for (var d in e)
          if (s(e, d)) {
            var v = void 0;
            try {
              if (typeof e[d] != "function") {
                var p = Error((l || "React class") + ": " + r + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw p.name = "Invariant Violation", p;
              }
              v = e[d](t, d, l, r, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (h) {
              v = h;
            }
            v && !(v instanceof Error) && (Cn(i), D("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", l || "React class", r, d, typeof v), Cn(null)), v instanceof Error && !(v.message in _l) && (_l[v.message] = !0, Cn(i), D("Failed %s type: %s", r, v.message), Cn(null));
          }
      }
    }
    var pr = [], hu;
    hu = [];
    var aa = -1;
    function Me(e) {
      return {
        current: e
      };
    }
    function pt(e, t) {
      if (aa < 0) {
        D("Unexpected pop.");
        return;
      }
      t !== hu[aa] && D("Unexpected Fiber popped."), e.current = pr[aa], pr[aa] = null, hu[aa] = null, aa--;
    }
    function mt(e, t, r) {
      aa++, pr[aa] = e.current, hu[aa] = r, e.current = t;
    }
    var yu;
    yu = {};
    var qt = {};
    Object.freeze(qt);
    var ra = Me(qt), Yt = Me(!1), Je = qt;
    function We(e, t, r) {
      return r && on(t) ? Je : ra.current;
    }
    function ht(e, t, r) {
      {
        var l = e.stateNode;
        l.__reactInternalMemoizedUnmaskedChildContext = t, l.__reactInternalMemoizedMaskedChildContext = r;
      }
    }
    function qa(e, t) {
      {
        var r = e.type, l = r.contextTypes;
        if (!l)
          return qt;
        var i = e.stateNode;
        if (i && i.__reactInternalMemoizedUnmaskedChildContext === t)
          return i.__reactInternalMemoizedMaskedChildContext;
        var s = {};
        for (var d in l)
          s[d] = t[d];
        {
          var v = ce(e) || "Unknown";
          Dn(l, s, "context", v);
        }
        return i && ht(e, t, s), s;
      }
    }
    function mr() {
      return Yt.current;
    }
    function on(e) {
      {
        var t = e.childContextTypes;
        return t != null;
      }
    }
    function mi(e) {
      pt(Yt, e), pt(ra, e);
    }
    function Et(e) {
      pt(Yt, e), pt(ra, e);
    }
    function hi(e, t, r) {
      {
        if (ra.current !== qt)
          throw new Error("Unexpected context found on stack. This error is likely caused by a bug in React. Please file an issue.");
        mt(ra, t, e), mt(Yt, r, e);
      }
    }
    function yi(e, t, r) {
      {
        var l = e.stateNode, i = t.childContextTypes;
        if (typeof l.getChildContext != "function") {
          {
            var s = ce(e) || "Unknown";
            yu[s] || (yu[s] = !0, D("%s.childContextTypes is specified but there is no getChildContext() method on the instance. You can either define getChildContext() on %s or remove childContextTypes from it.", s, s));
          }
          return r;
        }
        var d = l.getChildContext();
        for (var v in d)
          if (!(v in i))
            throw new Error((ce(e) || "Unknown") + '.getChildContext(): key "' + v + '" is not defined in childContextTypes.');
        {
          var p = ce(e) || "Unknown";
          Dn(i, d, "child context", p);
        }
        return ut({}, r, d);
      }
    }
    function Ml(e) {
      {
        var t = e.stateNode, r = t && t.__reactInternalMemoizedMergedChildContext || qt;
        return Je = ra.current, mt(ra, r, e), mt(Yt, Yt.current, e), !0;
      }
    }
    function la(e, t, r) {
      {
        var l = e.stateNode;
        if (!l)
          throw new Error("Expected to have an instance by this point. This error is likely caused by a bug in React. Please file an issue.");
        if (r) {
          var i = yi(e, t, Je);
          l.__reactInternalMemoizedMergedChildContext = i, pt(Yt, e), pt(ra, e), mt(ra, i, e), mt(Yt, r, e);
        } else
          pt(Yt, e), mt(Yt, r, e);
      }
    }
    function Gn(e) {
      {
        if (!yd(e) || e.tag !== se)
          throw new Error("Expected subtree parent to be a mounted class component. This error is likely caused by a bug in React. Please file an issue.");
        var t = e;
        do {
          switch (t.tag) {
            case De:
              return t.stateNode.context;
            case se: {
              var r = t.type;
              if (on(r))
                return t.stateNode.__reactInternalMemoizedMergedChildContext;
              break;
            }
          }
          t = t.return;
        } while (t !== null);
        throw new Error("Found unexpected detached subtree parent. This error is likely caused by a bug in React. Please file an issue.");
      }
    }
    var Ra = 0, Si = 1, I = (
      /*                         */
      0
    ), he = (
      /*                 */
      1
    ), Ue = (
      /*                    */
      2
    ), be = (
      /*               */
      8
    ), ua = (
      /*              */
      16
    ), bo = Math.clz32 ? Math.clz32 : Cc, Rc = Math.log, Tc = Math.LN2;
    function Cc(e) {
      var t = e >>> 0;
      return t === 0 ? 32 : 31 - (Rc(t) / Tc | 0) | 0;
    }
    var kr = 31, O = (
      /*                        */
      0
    ), et = (
      /*                          */
      0
    ), ee = (
      /*                        */
      1
    ), Ir = (
      /*    */
      2
    ), ia = (
      /*             */
      4
    ), hr = (
      /*            */
      8
    ), oa = (
      /*                     */
      16
    ), Hl = (
      /*                */
      32
    ), $r = (
      /*                       */
      4194240
    ), el = (
      /*                        */
      64
    ), gi = (
      /*                        */
      128
    ), Ei = (
      /*                        */
      256
    ), xi = (
      /*                        */
      512
    ), ko = (
      /*                        */
      1024
    ), Ri = (
      /*                        */
      2048
    ), Io = (
      /*                        */
      4096
    ), $o = (
      /*                        */
      8192
    ), Ti = (
      /*                        */
      16384
    ), Ci = (
      /*                       */
      32768
    ), Di = (
      /*                       */
      65536
    ), Ll = (
      /*                       */
      131072
    ), es = (
      /*                       */
      262144
    ), ts = (
      /*                       */
      524288
    ), ns = (
      /*                       */
      1048576
    ), zn = (
      /*                       */
      2097152
    ), Ol = (
      /*                            */
      130023424
    ), Ya = (
      /*                             */
      4194304
    ), zi = (
      /*                             */
      8388608
    ), Ni = (
      /*                             */
      16777216
    ), Ui = (
      /*                             */
      33554432
    ), Su = (
      /*                             */
      67108864
    ), tl = Ya, nl = (
      /*          */
      134217728
    ), _i = (
      /*                          */
      268435455
    ), gu = (
      /*               */
      268435456
    ), yr = (
      /*                        */
      536870912
    ), sn = (
      /*                   */
      1073741824
    );
    function Dc(e) {
      {
        if (e & ee)
          return "Sync";
        if (e & Ir)
          return "InputContinuousHydration";
        if (e & ia)
          return "InputContinuous";
        if (e & hr)
          return "DefaultHydration";
        if (e & oa)
          return "Default";
        if (e & Hl)
          return "TransitionHydration";
        if (e & $r)
          return "Transition";
        if (e & Ol)
          return "Retry";
        if (e & nl)
          return "SelectiveHydration";
        if (e & gu)
          return "IdleHydration";
        if (e & yr)
          return "Idle";
        if (e & sn)
          return "Offscreen";
      }
    }
    var Ve = -1, Eu = el, Mi = Ya;
    function xt(e) {
      switch (al(e)) {
        case ee:
          return ee;
        case Ir:
          return Ir;
        case ia:
          return ia;
        case hr:
          return hr;
        case oa:
          return oa;
        case Hl:
          return Hl;
        case el:
        case gi:
        case Ei:
        case xi:
        case ko:
        case Ri:
        case Io:
        case $o:
        case Ti:
        case Ci:
        case Di:
        case Ll:
        case es:
        case ts:
        case ns:
        case zn:
          return e & $r;
        case Ya:
        case zi:
        case Ni:
        case Ui:
        case Su:
          return e & Ol;
        case nl:
          return nl;
        case gu:
          return gu;
        case yr:
          return yr;
        case sn:
          return sn;
        default:
          return D("Should have found matching lanes. This is a bug in React."), e;
      }
    }
    function Rt(e, t) {
      var r = e.pendingLanes;
      if (r === O)
        return O;
      var l = O, i = e.suspendedLanes, s = e.pingedLanes, d = r & _i;
      if (d !== O) {
        var v = d & ~i;
        if (v !== O)
          l = xt(v);
        else {
          var p = d & s;
          p !== O && (l = xt(p));
        }
      } else {
        var h = r & ~i;
        h !== O ? l = xt(h) : s !== O && (l = xt(s));
      }
      if (l === O)
        return O;
      if (t !== O && t !== l && // If we already suspended with a delay, then interrupting is fine. Don't
      // bother waiting until the root is complete.
      (t & i) === O) {
        var y = al(l), x = al(t);
        if (
          // Tests whether the next lane is equal or lower priority than the wip
          // one. This works because the bits decrease in priority as you go left.
          y >= x || // Default priority updates should not interrupt transition updates. The
          // only difference between default updates and transition updates is that
          // default updates do not support refresh transitions.
          y === oa && (x & $r) !== O
        )
          return t;
      }
      (l & ia) !== O && (l |= r & oa);
      var N = e.entangledLanes;
      if (N !== O)
        for (var H = e.entanglements, F = l & N; F > 0; ) {
          var L = Ga(F), P = 1 << L;
          l |= H[L], F &= ~P;
        }
      return l;
    }
    function zc(e, t) {
      for (var r = e.eventTimes, l = Ve; t > 0; ) {
        var i = Ga(t), s = 1 << i, d = r[i];
        d > l && (l = d), t &= ~s;
      }
      return l;
    }
    function Nc(e, t) {
      switch (e) {
        case ee:
        case Ir:
        case ia:
          return t + 250;
        case hr:
        case oa:
        case Hl:
        case el:
        case gi:
        case Ei:
        case xi:
        case ko:
        case Ri:
        case Io:
        case $o:
        case Ti:
        case Ci:
        case Di:
        case Ll:
        case es:
        case ts:
        case ns:
        case zn:
          return t + 5e3;
        case Ya:
        case zi:
        case Ni:
        case Ui:
        case Su:
          return Ve;
        case nl:
        case gu:
        case yr:
        case sn:
          return Ve;
        default:
          return D("Should have found matching lanes. This is a bug in React."), Ve;
      }
    }
    function Uc(e, t) {
      for (var r = e.pendingLanes, l = e.suspendedLanes, i = e.pingedLanes, s = e.expirationTimes, d = r; d > 0; ) {
        var v = Ga(d), p = 1 << v, h = s[v];
        h === Ve ? ((p & l) === O || (p & i) !== O) && (s[v] = Nc(p, t)) : h <= t && (e.expiredLanes |= p), d &= ~p;
      }
    }
    function _c(e) {
      return xt(e.pendingLanes);
    }
    function Hi(e) {
      var t = e.pendingLanes & ~sn;
      return t !== O ? t : t & sn ? sn : O;
    }
    function as(e) {
      return (e & ee) !== O;
    }
    function Li(e) {
      return (e & _i) !== O;
    }
    function Oi(e) {
      return (e & Ol) === e;
    }
    function Mc(e) {
      var t = ee | ia | oa;
      return (e & t) === O;
    }
    function Hc(e) {
      return (e & $r) === e;
    }
    function Fl(e, t) {
      var r = Ir | ia | hr | oa;
      return (t & r) !== O;
    }
    function rs(e, t) {
      return (t & e.expiredLanes) !== O;
    }
    function ls(e) {
      return (e & $r) !== O;
    }
    function Fi() {
      var e = Eu;
      return Eu <<= 1, (Eu & $r) === O && (Eu = el), e;
    }
    function Ai() {
      var e = Mi;
      return Mi <<= 1, (Mi & Ol) === O && (Mi = Ya), e;
    }
    function al(e) {
      return e & -e;
    }
    function Al(e) {
      return al(e);
    }
    function Ga(e) {
      return 31 - bo(e);
    }
    function ji(e) {
      return Ga(e);
    }
    function Gt(e, t) {
      return (e & t) !== O;
    }
    function cn(e, t) {
      return (e & t) === t;
    }
    function fe(e, t) {
      return e | t;
    }
    function Nn(e, t) {
      return e & ~t;
    }
    function us(e, t) {
      return e & t;
    }
    function Vi(e) {
      return e;
    }
    function xu(e, t) {
      return e !== et && e < t ? e : t;
    }
    function jl(e) {
      for (var t = [], r = 0; r < kr; r++)
        t.push(e);
      return t;
    }
    function Sr(e, t, r) {
      e.pendingLanes |= t, t !== yr && (e.suspendedLanes = O, e.pingedLanes = O);
      var l = e.eventTimes, i = ji(t);
      l[i] = r;
    }
    function Lc(e, t) {
      e.suspendedLanes |= t, e.pingedLanes &= ~t;
      for (var r = e.expirationTimes, l = t; l > 0; ) {
        var i = Ga(l), s = 1 << i;
        r[i] = Ve, l &= ~s;
      }
    }
    function Vl(e, t, r) {
      e.pingedLanes |= e.suspendedLanes & t;
    }
    function Jt(e, t) {
      var r = e.pendingLanes & ~t;
      e.pendingLanes = t, e.suspendedLanes = O, e.pingedLanes = O, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t;
      for (var l = e.entanglements, i = e.eventTimes, s = e.expirationTimes, d = r; d > 0; ) {
        var v = Ga(d), p = 1 << v;
        l[v] = O, i[v] = Ve, s[v] = Ve, d &= ~p;
      }
    }
    function is(e, t) {
      for (var r = e.entangledLanes |= t, l = e.entanglements, i = r; i; ) {
        var s = Ga(i), d = 1 << s;
        // Is this one of the newly entangled lanes?
        d & t | // Is this lane transitively entangled with the newly entangled lanes?
        l[s] & t && (l[s] |= t), i &= ~d;
      }
    }
    function Hd(e, t) {
      var r = al(t), l;
      switch (r) {
        case ia:
          l = Ir;
          break;
        case oa:
          l = hr;
          break;
        case el:
        case gi:
        case Ei:
        case xi:
        case ko:
        case Ri:
        case Io:
        case $o:
        case Ti:
        case Ci:
        case Di:
        case Ll:
        case es:
        case ts:
        case ns:
        case zn:
        case Ya:
        case zi:
        case Ni:
        case Ui:
        case Su:
          l = Hl;
          break;
        case yr:
          l = gu;
          break;
        default:
          l = et;
          break;
      }
      return (l & (e.suspendedLanes | t)) !== et ? et : l;
    }
    function Ru(e, t, r) {
      if (fn)
        for (var l = e.pendingUpdatersLaneMap; r > 0; ) {
          var i = ji(r), s = 1 << i, d = l[i];
          d.add(t), r &= ~s;
        }
    }
    function _t(e, t) {
      if (fn)
        for (var r = e.pendingUpdatersLaneMap, l = e.memoizedUpdaters; t > 0; ) {
          var i = ji(t), s = 1 << i, d = r[i];
          d.size > 0 && (d.forEach(function(v) {
            var p = v.alternate;
            (p === null || !l.has(p)) && l.add(v);
          }), d.clear()), t &= ~s;
        }
    }
    function Oc(e, t) {
      return null;
    }
    var q = ee, Ta = ia, rl = oa, Bi = yr, Tu = et;
    function bt() {
      return Tu;
    }
    function tt(e) {
      Tu = e;
    }
    function os(e, t) {
      var r = Tu;
      try {
        return Tu = e, t();
      } finally {
        Tu = r;
      }
    }
    function Fc(e, t) {
      return e !== 0 && e < t ? e : t;
    }
    function Ac(e, t) {
      return e > t ? e : t;
    }
    function ss(e, t) {
      return e !== 0 && e < t;
    }
    function Qi(e) {
      var t = al(e);
      return ss(q, t) ? ss(Ta, t) ? Li(t) ? rl : Bi : Ta : q;
    }
    var wi = Ie.unstable_scheduleCallback, Mt = Ie.unstable_cancelCallback, sa = Ie.unstable_shouldYield, Ca = Ie.unstable_requestPaint, ot = Ie.unstable_now, Cu = Ie.unstable_ImmediatePriority, Jn = Ie.unstable_UserBlockingPriority, ll = Ie.unstable_NormalPriority, ca = Ie.unstable_IdlePriority, Ld = Ie.unstable_yieldValue, jc = Ie.unstable_setDisableYieldValue, ul = null, Ht = null, Y = null, Un = !1, fn = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u";
    function qi(e) {
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u")
        return !1;
      var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (t.isDisabled)
        return !0;
      if (!t.supportsFiber)
        return D("The installed version of React DevTools is too old and will not work with the current version of React. Please update React DevTools. https://reactjs.org/link/react-devtools"), !0;
      try {
        Xu && (e = ut({}, e, {
          getLaneLabelMap: Vc,
          injectProfilingHooks: fs
        })), ul = t.inject(e), Ht = t;
      } catch (r) {
        D("React instrumentation encountered an error: %s.", r);
      }
      return !!t.checkDCE;
    }
    function Yi(e, t) {
      if (Ht && typeof Ht.onScheduleFiberRoot == "function")
        try {
          Ht.onScheduleFiberRoot(ul, e, t);
        } catch (r) {
          Un || (Un = !0, D("React instrumentation encountered an error: %s", r));
        }
    }
    function Gi(e, t) {
      if (Ht && typeof Ht.onCommitFiberRoot == "function")
        try {
          var r = (e.current.flags & xe) === xe;
          if (pa) {
            var l;
            switch (t) {
              case q:
                l = Cu;
                break;
              case Ta:
                l = Jn;
                break;
              case rl:
                l = ll;
                break;
              case Bi:
                l = ca;
                break;
              default:
                l = ll;
                break;
            }
            Ht.onCommitFiberRoot(ul, e, l, r);
          }
        } catch (i) {
          Un || (Un = !0, D("React instrumentation encountered an error: %s", i));
        }
    }
    function Du(e) {
      if (Ht && typeof Ht.onPostCommitFiberRoot == "function")
        try {
          Ht.onPostCommitFiberRoot(ul, e);
        } catch (t) {
          Un || (Un = !0, D("React instrumentation encountered an error: %s", t));
        }
    }
    function cs(e) {
      if (Ht && typeof Ht.onCommitFiberUnmount == "function")
        try {
          Ht.onCommitFiberUnmount(ul, e);
        } catch (t) {
          Un || (Un = !0, D("React instrumentation encountered an error: %s", t));
        }
    }
    function st(e) {
      if (typeof Ld == "function" && (jc(e), va(e)), Ht && typeof Ht.setStrictMode == "function")
        try {
          Ht.setStrictMode(ul, e);
        } catch (t) {
          Un || (Un = !0, D("React instrumentation encountered an error: %s", t));
        }
    }
    function fs(e) {
      Y = e;
    }
    function Vc() {
      {
        for (var e = /* @__PURE__ */ new Map(), t = 1, r = 0; r < kr; r++) {
          var l = Dc(t);
          e.set(t, l), t *= 2;
        }
        return e;
      }
    }
    function ds(e) {
      Y !== null && typeof Y.markCommitStarted == "function" && Y.markCommitStarted(e);
    }
    function Bc() {
      Y !== null && typeof Y.markCommitStopped == "function" && Y.markCommitStopped();
    }
    function gr(e) {
      Y !== null && typeof Y.markComponentRenderStarted == "function" && Y.markComponentRenderStarted(e);
    }
    function Er() {
      Y !== null && typeof Y.markComponentRenderStopped == "function" && Y.markComponentRenderStopped();
    }
    function nt(e) {
      Y !== null && typeof Y.markComponentPassiveEffectMountStarted == "function" && Y.markComponentPassiveEffectMountStarted(e);
    }
    function pe() {
      Y !== null && typeof Y.markComponentPassiveEffectMountStopped == "function" && Y.markComponentPassiveEffectMountStopped();
    }
    function Tt(e) {
      Y !== null && typeof Y.markComponentPassiveEffectUnmountStarted == "function" && Y.markComponentPassiveEffectUnmountStarted(e);
    }
    function ct() {
      Y !== null && typeof Y.markComponentPassiveEffectUnmountStopped == "function" && Y.markComponentPassiveEffectUnmountStopped();
    }
    function Lt(e) {
      Y !== null && typeof Y.markComponentLayoutEffectMountStarted == "function" && Y.markComponentLayoutEffectMountStarted(e);
    }
    function _n() {
      Y !== null && typeof Y.markComponentLayoutEffectMountStopped == "function" && Y.markComponentLayoutEffectMountStopped();
    }
    function il(e) {
      Y !== null && typeof Y.markComponentLayoutEffectUnmountStarted == "function" && Y.markComponentLayoutEffectUnmountStarted(e);
    }
    function ft() {
      Y !== null && typeof Y.markComponentLayoutEffectUnmountStopped == "function" && Y.markComponentLayoutEffectUnmountStopped();
    }
    function zu(e, t, r) {
      Y !== null && typeof Y.markComponentErrored == "function" && Y.markComponentErrored(e, t, r);
    }
    function ol(e, t, r) {
      Y !== null && typeof Y.markComponentSuspended == "function" && Y.markComponentSuspended(e, t, r);
    }
    function Ji(e) {
      Y !== null && typeof Y.markLayoutEffectsStarted == "function" && Y.markLayoutEffectsStarted(e);
    }
    function vs() {
      Y !== null && typeof Y.markLayoutEffectsStopped == "function" && Y.markLayoutEffectsStopped();
    }
    function Nu(e) {
      Y !== null && typeof Y.markPassiveEffectsStarted == "function" && Y.markPassiveEffectsStarted(e);
    }
    function dn() {
      Y !== null && typeof Y.markPassiveEffectsStopped == "function" && Y.markPassiveEffectsStopped();
    }
    function Xi(e) {
      Y !== null && typeof Y.markRenderStarted == "function" && Y.markRenderStarted(e);
    }
    function ps() {
      Y !== null && typeof Y.markRenderYielded == "function" && Y.markRenderYielded();
    }
    function Da() {
      Y !== null && typeof Y.markRenderStopped == "function" && Y.markRenderStopped();
    }
    function Bl(e) {
      Y !== null && typeof Y.markRenderScheduled == "function" && Y.markRenderScheduled(e);
    }
    function Ki(e, t) {
      Y !== null && typeof Y.markForceUpdateScheduled == "function" && Y.markForceUpdateScheduled(e, t);
    }
    function Uu(e, t) {
      Y !== null && typeof Y.markStateUpdateScheduled == "function" && Y.markStateUpdateScheduled(e, t);
    }
    function xr(e, t) {
      return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
    }
    var Xt = typeof Object.is == "function" ? Object.is : xr, Kt = null, Ql = !1, sl = !1;
    function Zi(e) {
      Kt === null ? Kt = [e] : Kt.push(e);
    }
    function Pi(e) {
      Ql = !0, Zi(e);
    }
    function _u() {
      Ql && Xe();
    }
    function Xe() {
      if (!sl && Kt !== null) {
        sl = !0;
        var e = 0, t = bt();
        try {
          var r = !0, l = Kt;
          for (tt(q); e < l.length; e++) {
            var i = l[e];
            do
              i = i(r);
            while (i !== null);
          }
          Kt = null, Ql = !1;
        } catch (s) {
          throw Kt !== null && (Kt = Kt.slice(e + 1)), wi(Cu, Xe), s;
        } finally {
          tt(t), sl = !1;
        }
      }
      return null;
    }
    function Ja(e) {
      var t = e.current.memoizedState;
      return t.isDehydrated;
    }
    var Ot = [], yt = 0, Mu = null, wl = 0, vn = [], Xn = 0, pn = null, za = 1, Na = "";
    function ms(e) {
      return dl(), (e.flags & uc) !== b;
    }
    function cl(e) {
      return dl(), wl;
    }
    function Qc() {
      var e = Na, t = za, r = t & ~Od(t);
      return r.toString(32) + e;
    }
    function Rr(e, t) {
      dl(), Ot[yt++] = wl, Ot[yt++] = Mu, Mu = e, wl = t;
    }
    function Wi(e, t, r) {
      dl(), vn[Xn++] = za, vn[Xn++] = Na, vn[Xn++] = pn, pn = e;
      var l = za, i = Na, s = bi(l) - 1, d = l & ~(1 << s), v = r + 1, p = bi(t) + s;
      if (p > 30) {
        var h = s - s % 5, y = (1 << h) - 1, x = (d & y).toString(32), N = d >> h, H = s - h, F = bi(t) + H, L = v << H, P = L | N, ae = x + i;
        za = 1 << F | P, Na = ae;
      } else {
        var $ = v << s, Ae = $ | d, Ce = i;
        za = 1 << p | Ae, Na = Ce;
      }
    }
    function ql(e) {
      dl();
      var t = e.return;
      if (t !== null) {
        var r = 1, l = 0;
        Rr(e, r), Wi(e, r, l);
      }
    }
    function bi(e) {
      return 32 - bo(e);
    }
    function Od(e) {
      return 1 << bi(e) - 1;
    }
    function ki(e) {
      for (; e === Mu; )
        Mu = Ot[--yt], Ot[yt] = null, wl = Ot[--yt], Ot[yt] = null;
      for (; e === pn; )
        pn = vn[--Xn], vn[Xn] = null, Na = vn[--Xn], vn[Xn] = null, za = vn[--Xn], vn[Xn] = null;
    }
    function wc() {
      return dl(), pn !== null ? {
        id: za,
        overflow: Na
      } : null;
    }
    function fl(e, t) {
      dl(), vn[Xn++] = za, vn[Xn++] = Na, vn[Xn++] = pn, za = t.id, Na = t.overflow, pn = e;
    }
    function dl() {
      a() || D("Expected to be hydrating. This is a bug in React. Please file an issue.");
    }
    var ke = null, Mn = null, Re = !1, Tr = !1, Xa = null;
    function Fd() {
      Re && D("We should not be hydrating here. This is a bug in React. Please file a bug.");
    }
    function qc() {
      Tr = !0;
    }
    function Yc() {
      return Tr;
    }
    function Gc(e) {
      if (!Wt)
        return !1;
      var t = e.stateNode.containerInfo;
      return Mn = Jo(t), ke = e, Re = !0, Xa = null, Tr = !1, !0;
    }
    function Ad(e, t, r) {
      return Wt ? (Mn = xn(t), ke = e, Re = !0, Xa = null, Tr = !1, r !== null && fl(e, r), !0) : !1;
    }
    function Hn(e, t) {
      switch (e.tag) {
        case De: {
          Dl(e.stateNode.containerInfo, t);
          break;
        }
        case ne: {
          var r = (e.mode & he) !== I;
          _d(
            e.type,
            e.memoizedProps,
            e.stateNode,
            t,
            // TODO: Delete this argument when we remove the legacy root API.
            r
          );
          break;
        }
        case Qe: {
          var l = e.memoizedState;
          l.dehydrated !== null && Zo(l.dehydrated, t);
          break;
        }
      }
    }
    function Ii(e, t) {
      Hn(e, t);
      var r = bE();
      r.stateNode = t, r.return = e;
      var l = e.deletions;
      l === null ? (e.deletions = [r], e.flags |= ur) : l.push(r);
    }
    function hs(e, t) {
      {
        if (Tr)
          return;
        switch (e.tag) {
          case De: {
            var r = e.stateNode.containerInfo;
            switch (t.tag) {
              case ne:
                var l = t.type, i = t.pendingProps;
                ui(r, l, i);
                break;
              case Ye:
                var s = t.pendingProps;
                Md(r, s);
                break;
              case Qe:
                mu(r);
                break;
            }
            break;
          }
          case ne: {
            var d = e.type, v = e.memoizedProps, p = e.stateNode;
            switch (t.tag) {
              case ne: {
                var h = t.type, y = t.pendingProps, x = (e.mode & he) !== I;
                zl(
                  d,
                  v,
                  p,
                  h,
                  y,
                  // TODO: Delete this argument when we remove the legacy root API.
                  x
                );
                break;
              }
              case Ye: {
                var N = t.pendingProps, H = (e.mode & he) !== I;
                Sc(
                  d,
                  v,
                  p,
                  N,
                  // TODO: Delete this argument when we remove the legacy root API.
                  H
                );
                break;
              }
              case Qe: {
                oi(d, v, p);
                break;
              }
            }
            break;
          }
          case Qe: {
            var F = e.memoizedState, L = F.dehydrated;
            if (L !== null) switch (t.tag) {
              case ne:
                var P = t.type, ae = t.pendingProps;
                ii(L, P, ae);
                break;
              case Ye:
                var $ = t.pendingProps;
                hc(L, $);
                break;
              case Qe:
                yc(L);
                break;
            }
            break;
          }
          default:
            return;
        }
      }
    }
    function Ka(e, t) {
      t.flags = t.flags & ~ha | it, hs(e, t);
    }
    function Hu(e, t) {
      switch (e.tag) {
        case ne: {
          var r = e.type, l = e.pendingProps, i = ri(t, r, l);
          return i !== null ? (e.stateNode = i, ke = e, Mn = Go(i), !0) : !1;
        }
        case Ye: {
          var s = e.pendingProps, d = Bn(t, s);
          return d !== null ? (e.stateNode = d, ke = e, Mn = null, !0) : !1;
        }
        case Qe: {
          var v = Qn(t);
          if (v !== null) {
            var p = {
              dehydrated: v,
              treeContext: wc(),
              retryLane: sn
            };
            e.memoizedState = p;
            var h = kE(v);
            return h.return = e, e.child = h, ke = e, Mn = null, !0;
          }
          return !1;
        }
        default:
          return !1;
      }
    }
    function Za(e) {
      return (e.mode & he) !== I && (e.flags & xe) === b;
    }
    function Yl(e) {
      throw new Error("Hydration failed because the initial UI does not match what was rendered on the server.");
    }
    function Lu(e) {
      if (Re) {
        var t = Mn;
        if (!t) {
          Za(e) && (hs(ke, e), Yl()), Ka(ke, e), Re = !1, ke = e;
          return;
        }
        var r = t;
        if (!Hu(e, t)) {
          Za(e) && (hs(ke, e), Yl()), t = vu(r);
          var l = ke;
          if (!t || !Hu(e, t)) {
            Ka(ke, e), Re = !1, ke = e;
            return;
          }
          Ii(l, r);
        }
      }
    }
    function ys(e, t, r) {
      if (!Wt)
        throw new Error("Expected prepareToHydrateHostInstance() to never be called. This error is likely caused by a bug in React. Please file an issue.");
      var l = e.stateNode, i = !Tr, s = wn(l, e.type, e.memoizedProps, t, r, e, i);
      return e.updateQueue = s, s !== null;
    }
    function jd(e) {
      if (!Wt)
        throw new Error("Expected prepareToHydrateHostTextInstance() to never be called. This error is likely caused by a bug in React. Please file an issue.");
      var t = e.stateNode, r = e.memoizedProps, l = !Tr, i = Pe(t, r, e, l);
      if (i) {
        var s = ke;
        if (s !== null)
          switch (s.tag) {
            case De: {
              var d = s.stateNode.containerInfo, v = (s.mode & he) !== I;
              li(
                d,
                t,
                r,
                // TODO: Delete this argument when we remove the legacy root API.
                v
              );
              break;
            }
            case ne: {
              var p = s.type, h = s.memoizedProps, y = s.stateNode, x = (s.mode & he) !== I;
              mc(
                p,
                h,
                y,
                t,
                r,
                // TODO: Delete this argument when we remove the legacy root API.
                x
              );
              break;
            }
          }
      }
      return i;
    }
    function Jc(e) {
      if (!Wt)
        throw new Error("Expected prepareToHydrateHostSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue.");
      var t = e.memoizedState, r = t !== null ? t.dehydrated : null;
      if (!r)
        throw new Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      pu(r, e);
    }
    function Xc(e) {
      if (!Wt)
        throw new Error("Expected skipPastDehydratedSuspenseInstance() to never be called. This error is likely caused by a bug in React. Please file an issue.");
      var t = e.memoizedState, r = t !== null ? t.dehydrated : null;
      if (!r)
        throw new Error("Expected to have a hydrated suspense instance. This error is likely caused by a bug in React. Please file an issue.");
      return na(r);
    }
    function Ss(e) {
      for (var t = e.return; t !== null && t.tag !== ne && t.tag !== De && t.tag !== Qe; )
        t = t.return;
      ke = t;
    }
    function Ou(e) {
      if (!Wt || e !== ke)
        return !1;
      if (!Re)
        return Ss(e), Re = !0, !1;
      if (e.tag !== De && (e.tag !== ne || pc(e.type) && !Cl(e.type, e.memoizedProps))) {
        var t = Mn;
        if (t)
          if (Za(e))
            Kc(e), Yl();
          else
            for (; t; )
              Ii(e, t), t = vu(t);
      }
      return Ss(e), e.tag === Qe ? Mn = Xc(e) : Mn = ke ? vu(e.stateNode) : null, !0;
    }
    function $i() {
      return Re && Mn !== null;
    }
    function Kc(e) {
      for (var t = Mn; t; )
        Hn(e, t), t = vu(t);
    }
    function Gl() {
      Wt && (ke = null, Mn = null, Re = !1, Tr = !1);
    }
    function n() {
      Xa !== null && (Yh(Xa), Xa = null);
    }
    function a() {
      return Re;
    }
    function u(e) {
      Xa === null ? Xa = [e] : Xa.push(e);
    }
    var o = lt.ReactCurrentBatchConfig, c = null;
    function f() {
      return o.transition;
    }
    function m(e, t) {
      if (Xt(e, t))
        return !0;
      if (typeof e != "object" || e === null || typeof t != "object" || t === null)
        return !1;
      var r = Object.keys(e), l = Object.keys(t);
      if (r.length !== l.length)
        return !1;
      for (var i = 0; i < r.length; i++) {
        var s = r[i];
        if (!Tn.call(t, s) || !Xt(e[s], t[s]))
          return !1;
      }
      return !0;
    }
    function g(e) {
      switch (e._debugOwner && e._debugOwner.type, e._debugSource, e.tag) {
        case ne:
          return xa(e.type);
        case ru:
          return xa("Lazy");
        case Qe:
          return xa("Suspense");
        case an:
          return xa("SuspenseList");
        case Le:
        case Vn:
        case we:
          return Ul(e.type);
        case _e:
          return Ul(e.type.render);
        case se:
          return Ec(e.type);
        default:
          return "";
      }
    }
    function z(e) {
      try {
        var t = "", r = e;
        do
          t += g(r), r = r.return;
        while (r);
        return t;
      } catch (l) {
        return `
Error generating stack: ` + l.message + `
` + l.stack;
      }
    }
    var A = lt.ReactDebugCurrentFrame, Q = null, re = !1;
    function J() {
      {
        if (Q === null)
          return null;
        var e = Q._debugOwner;
        if (e !== null && typeof e < "u")
          return ce(e);
      }
      return null;
    }
    function Ke() {
      return Q === null ? "" : z(Q);
    }
    function de() {
      A.getCurrentStack = null, Q = null, re = !1;
    }
    function Te(e) {
      A.getCurrentStack = e === null ? null : Ke, Q = e, re = !1;
    }
    function Pa() {
      return Q;
    }
    function R(e) {
      re = e;
    }
    var S = {
      recordUnsafeLifecycleWarnings: function(e, t) {
      },
      flushPendingUnsafeLifecycleWarnings: function() {
      },
      recordLegacyContextWarning: function(e, t) {
      },
      flushLegacyContextWarning: function() {
      },
      discardPendingWarnings: function() {
      }
    };
    {
      var U = function(e) {
        for (var t = null, r = e; r !== null; )
          r.mode & be && (t = r), r = r.return;
        return t;
      }, w = function(e) {
        var t = [];
        return e.forEach(function(r) {
          t.push(r);
        }), t.sort().join(", ");
      }, k = [], oe = [], le = [], ye = [], $e = [], Se = [], mn = /* @__PURE__ */ new Set();
      S.recordUnsafeLifecycleWarnings = function(e, t) {
        mn.has(e.type) || (typeof t.componentWillMount == "function" && // Don't warn about react-lifecycles-compat polyfilled components.
        t.componentWillMount.__suppressDeprecationWarning !== !0 && k.push(e), e.mode & be && typeof t.UNSAFE_componentWillMount == "function" && oe.push(e), typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps.__suppressDeprecationWarning !== !0 && le.push(e), e.mode & be && typeof t.UNSAFE_componentWillReceiveProps == "function" && ye.push(e), typeof t.componentWillUpdate == "function" && t.componentWillUpdate.__suppressDeprecationWarning !== !0 && $e.push(e), e.mode & be && typeof t.UNSAFE_componentWillUpdate == "function" && Se.push(e));
      }, S.flushPendingUnsafeLifecycleWarnings = function() {
        var e = /* @__PURE__ */ new Set();
        k.length > 0 && (k.forEach(function(N) {
          e.add(ce(N) || "Component"), mn.add(N.type);
        }), k = []);
        var t = /* @__PURE__ */ new Set();
        oe.length > 0 && (oe.forEach(function(N) {
          t.add(ce(N) || "Component"), mn.add(N.type);
        }), oe = []);
        var r = /* @__PURE__ */ new Set();
        le.length > 0 && (le.forEach(function(N) {
          r.add(ce(N) || "Component"), mn.add(N.type);
        }), le = []);
        var l = /* @__PURE__ */ new Set();
        ye.length > 0 && (ye.forEach(function(N) {
          l.add(ce(N) || "Component"), mn.add(N.type);
        }), ye = []);
        var i = /* @__PURE__ */ new Set();
        $e.length > 0 && ($e.forEach(function(N) {
          i.add(ce(N) || "Component"), mn.add(N.type);
        }), $e = []);
        var s = /* @__PURE__ */ new Set();
        if (Se.length > 0 && (Se.forEach(function(N) {
          s.add(ce(N) || "Component"), mn.add(N.type);
        }), Se = []), t.size > 0) {
          var d = w(t);
          D(`Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: %s`, d);
        }
        if (l.size > 0) {
          var v = w(l);
          D(`Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state

Please update the following components: %s`, v);
        }
        if (s.size > 0) {
          var p = w(s);
          D(`Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: %s`, p);
        }
        if (e.size > 0) {
          var h = w(e);
          Wn(`componentWillMount has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, h);
        }
        if (r.size > 0) {
          var y = w(r);
          Wn(`componentWillReceiveProps has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, y);
        }
        if (i.size > 0) {
          var x = w(i);
          Wn(`componentWillUpdate has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: %s`, x);
        }
      };
      var eo = /* @__PURE__ */ new Map(), Zp = /* @__PURE__ */ new Set();
      S.recordLegacyContextWarning = function(e, t) {
        var r = U(e);
        if (r === null) {
          D("Expected to find a StrictMode component in a strict mode tree. This error is likely caused by a bug in React. Please file an issue.");
          return;
        }
        if (!Zp.has(e.type)) {
          var l = eo.get(r);
          (e.type.contextTypes != null || e.type.childContextTypes != null || t !== null && typeof t.getChildContext == "function") && (l === void 0 && (l = [], eo.set(r, l)), l.push(e));
        }
      }, S.flushLegacyContextWarning = function() {
        eo.forEach(function(e, t) {
          if (e.length !== 0) {
            var r = e[0], l = /* @__PURE__ */ new Set();
            e.forEach(function(s) {
              l.add(ce(s) || "Component"), Zp.add(s.type);
            });
            var i = w(l);
            try {
              Te(r), D(`Legacy context API has been detected within a strict-mode tree.

The old API will be supported in all 16.x releases, but applications using it should migrate to the new version.

Please update the following components: %s

Learn more about this warning here: https://reactjs.org/link/legacy-context`, i);
            } finally {
              de();
            }
          }
        });
      }, S.discardPendingWarnings = function() {
        k = [], oe = [], le = [], ye = [], $e = [], Se = [], eo = /* @__PURE__ */ new Map();
      };
    }
    function Pp(e) {
      {
        var t = typeof Symbol == "function" && Symbol.toStringTag, r = t && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return r;
      }
    }
    function Wp(e) {
      try {
        return Vd(e), !1;
      } catch {
        return !0;
      }
    }
    function Vd(e) {
      return "" + e;
    }
    function Vy(e) {
      if (Wp(e))
        return D("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Pp(e)), Vd(e);
    }
    function By(e, t) {
      if (Wp(e))
        return D("The provided `%s` prop is an unsupported type %s. This value must be coerced to a string before before using it here.", t, Pp(e)), Vd(e);
    }
    var Bd, Qd, wd, qd, Yd, bp = function(e, t) {
    };
    Bd = !1, Qd = !1, wd = {}, qd = {}, Yd = {}, bp = function(e, t) {
      if (!(e === null || typeof e != "object") && !(!e._store || e._store.validated || e.key != null)) {
        if (typeof e._store != "object")
          throw new Error("React Component in warnForMissingKey should have a _store. This error is likely caused by a bug in React. Please file an issue.");
        e._store.validated = !0;
        var r = ce(t) || "Component";
        qd[r] || (qd[r] = !0, D('Each child in a list should have a unique "key" prop. See https://reactjs.org/link/warning-keys for more information.'));
      }
    };
    function Qy(e) {
      return e.prototype && e.prototype.isReactComponent;
    }
    function gs(e, t, r) {
      var l = r.ref;
      if (l !== null && typeof l != "function" && typeof l != "object") {
        if ((e.mode & be || Ro) && // We warn in ReactElement.js if owner and self are equal for string refs
        // because these cannot be automatically converted to an arrow function
        // using a codemod. Therefore, we don't have to warn about string refs again.
        !(r._owner && r._self && r._owner.stateNode !== r._self) && // Will already throw with "Function components cannot have string refs"
        !(r._owner && r._owner.tag !== se) && // Will already warn with "Function components cannot be given refs"
        !(typeof r.type == "function" && !Qy(r.type)) && // Will already throw with "Element ref was specified as a string (someStringRef) but no owner was set"
        r._owner) {
          var i = ce(e) || "Component";
          wd[i] || (D('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. We recommend using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', i, l), wd[i] = !0);
        }
        if (r._owner) {
          var s = r._owner, d;
          if (s) {
            var v = s;
            if (v.tag !== se)
              throw new Error("Function components cannot have string refs. We recommend using useRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref");
            d = v.stateNode;
          }
          if (!d)
            throw new Error("Missing owner for string ref " + l + ". This error is likely caused by a bug in React. Please file an issue.");
          var p = d;
          By(l, "ref");
          var h = "" + l;
          if (t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === h)
            return t.ref;
          var y = function(x) {
            var N = p.refs;
            x === null ? delete N[h] : N[h] = x;
          };
          return y._stringRef = h, y;
        } else {
          if (typeof l != "string")
            throw new Error("Expected ref to be a function, a string, an object returned by React.createRef(), or null.");
          if (!r._owner)
            throw new Error("Element ref was specified as a string (" + l + `) but no owner was set. This could happen for one of the following reasons:
1. You may be adding a ref to a function component
2. You may be adding a ref to a component that was not created inside a component's render method
3. You have multiple copies of React loaded
See https://reactjs.org/link/refs-must-have-owner for more information.`);
        }
      }
      return l;
    }
    function Zc(e, t) {
      var r = Object.prototype.toString.call(t);
      throw new Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
    }
    function Pc(e) {
      {
        var t = ce(e) || "Component";
        if (Yd[t])
          return;
        Yd[t] = !0, D("Functions are not valid as a React child. This may happen if you return a Component instead of <Component /> from render. Or maybe you meant to call this function rather than return it.");
      }
    }
    function kp(e) {
      var t = e._payload, r = e._init;
      return r(t);
    }
    function Ip(e) {
      function t(C, _) {
        if (e) {
          var T = C.deletions;
          T === null ? (C.deletions = [_], C.flags |= ur) : T.push(_);
        }
      }
      function r(C, _) {
        if (!e)
          return null;
        for (var T = _; T !== null; )
          t(C, T), T = T.sibling;
        return null;
      }
      function l(C, _) {
        for (var T = /* @__PURE__ */ new Map(), V = _; V !== null; )
          V.key !== null ? T.set(V.key, V) : T.set(V.index, V), V = V.sibling;
        return T;
      }
      function i(C, _) {
        var T = Yu(C, _);
        return T.index = 0, T.sibling = null, T;
      }
      function s(C, _, T) {
        if (C.index = T, !e)
          return C.flags |= uc, _;
        var V = C.alternate;
        if (V !== null) {
          var W = V.index;
          return W < _ ? (C.flags |= it, _) : W;
        } else
          return C.flags |= it, _;
      }
      function d(C) {
        return e && C.alternate === null && (C.flags |= it), C;
      }
      function v(C, _, T, V) {
        if (_ === null || _.tag !== Ye) {
          var W = Bp(T, C.mode, V);
          return W.return = C, W;
        } else {
          var K = i(_, T);
          return K.return = C, K;
        }
      }
      function p(C, _, T, V) {
        var W = T.type;
        if (W === Fa)
          return y(C, _, T.props.children, V, T.key);
        if (_ !== null && (_.elementType === W || // Keep this check inline so it only runs on the false path:
        ay(_, T) || // Lazy types should reconcile their resolved type.
        // We need to do this after the Hot Reloading check above,
        // because hot reloading has different semantics than prod because
        // it doesn't resuspend. So we can't let the call below suspend.
        typeof W == "object" && W !== null && W.$$typeof === Zt && kp(W) === _.type)) {
          var K = i(_, T.props);
          return K.ref = gs(C, _, T), K.return = C, K._debugSource = T._source, K._debugOwner = T._owner, K;
        }
        var ge = Vp(T, C.mode, V);
        return ge.ref = gs(C, _, T), ge.return = C, ge;
      }
      function h(C, _, T, V) {
        if (_ === null || _.tag !== je || _.stateNode.containerInfo !== T.containerInfo || _.stateNode.implementation !== T.implementation) {
          var W = Qp(T, C.mode, V);
          return W.return = C, W;
        } else {
          var K = i(_, T.children || []);
          return K.return = C, K;
        }
      }
      function y(C, _, T, V, W) {
        if (_ === null || _.tag !== jr) {
          var K = $l(T, C.mode, V, W);
          return K.return = C, K;
        } else {
          var ge = i(_, T);
          return ge.return = C, ge;
        }
      }
      function x(C, _, T) {
        if (typeof _ == "string" && _ !== "" || typeof _ == "number") {
          var V = Bp("" + _, C.mode, T);
          return V.return = C, V;
        }
        if (typeof _ == "object" && _ !== null) {
          switch (_.$$typeof) {
            case lr: {
              var W = Vp(_, C.mode, T);
              return W.ref = gs(C, null, _), W.return = C, W;
            }
            case vt: {
              var K = Qp(_, C.mode, T);
              return K.return = C, K;
            }
            case Zt: {
              var ge = _._payload, ue = _._init;
              return x(C, ue(ge), T);
            }
          }
          if (St(_) || Br(_)) {
            var Ne = $l(_, C.mode, T, null);
            return Ne.return = C, Ne;
          }
          Zc(C, _);
        }
        return typeof _ == "function" && Pc(C), null;
      }
      function N(C, _, T, V) {
        var W = _ !== null ? _.key : null;
        if (typeof T == "string" && T !== "" || typeof T == "number")
          return W !== null ? null : v(C, _, "" + T, V);
        if (typeof T == "object" && T !== null) {
          switch (T.$$typeof) {
            case lr:
              return T.key === W ? p(C, _, T, V) : null;
            case vt:
              return T.key === W ? h(C, _, T, V) : null;
            case Zt: {
              var K = T._payload, ge = T._init;
              return N(C, _, ge(K), V);
            }
          }
          if (St(T) || Br(T))
            return W !== null ? null : y(C, _, T, V, null);
          Zc(C, T);
        }
        return typeof T == "function" && Pc(C), null;
      }
      function H(C, _, T, V, W) {
        if (typeof V == "string" && V !== "" || typeof V == "number") {
          var K = C.get(T) || null;
          return v(_, K, "" + V, W);
        }
        if (typeof V == "object" && V !== null) {
          switch (V.$$typeof) {
            case lr: {
              var ge = C.get(V.key === null ? T : V.key) || null;
              return p(_, ge, V, W);
            }
            case vt: {
              var ue = C.get(V.key === null ? T : V.key) || null;
              return h(_, ue, V, W);
            }
            case Zt:
              var Ne = V._payload, me = V._init;
              return H(C, _, T, me(Ne), W);
          }
          if (St(V) || Br(V)) {
            var Ze = C.get(T) || null;
            return y(_, Ze, V, W, null);
          }
          Zc(_, V);
        }
        return typeof V == "function" && Pc(_), null;
      }
      function F(C, _, T) {
        {
          if (typeof C != "object" || C === null)
            return _;
          switch (C.$$typeof) {
            case lr:
            case vt:
              bp(C, T);
              var V = C.key;
              if (typeof V != "string")
                break;
              if (_ === null) {
                _ = /* @__PURE__ */ new Set(), _.add(V);
                break;
              }
              if (!_.has(V)) {
                _.add(V);
                break;
              }
              D("Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.", V);
              break;
            case Zt:
              var W = C._payload, K = C._init;
              F(K(W), _, T);
              break;
          }
        }
        return _;
      }
      function L(C, _, T, V) {
        for (var W = null, K = 0; K < T.length; K++) {
          var ge = T[K];
          W = F(ge, W, C);
        }
        for (var ue = null, Ne = null, me = _, Ze = 0, te = 0, dt = null; me !== null && te < T.length; te++) {
          me.index > te ? (dt = me, me = null) : dt = me.sibling;
          var Sn = N(C, me, T[te], V);
          if (Sn === null) {
            me === null && (me = dt);
            break;
          }
          e && me && Sn.alternate === null && t(C, me), Ze = s(Sn, Ze, te), Ne === null ? ue = Sn : Ne.sibling = Sn, Ne = Sn, me = dt;
        }
        if (te === T.length) {
          if (r(C, me), a()) {
            var nn = te;
            Rr(C, nn);
          }
          return ue;
        }
        if (me === null) {
          for (; te < T.length; te++) {
            var da = x(C, T[te], V);
            da !== null && (Ze = s(da, Ze, te), Ne === null ? ue = da : Ne.sibling = da, Ne = da);
          }
          if (a()) {
            var An = te;
            Rr(C, An);
          }
          return ue;
        }
        for (var jn = l(C, me); te < T.length; te++) {
          var gn = H(jn, C, te, T[te], V);
          gn !== null && (e && gn.alternate !== null && jn.delete(gn.key === null ? te : gn.key), Ze = s(gn, Ze, te), Ne === null ? ue = gn : Ne.sibling = gn, Ne = gn);
        }
        if (e && jn.forEach(function(Eo) {
          return t(C, Eo);
        }), a()) {
          var yl = te;
          Rr(C, yl);
        }
        return ue;
      }
      function P(C, _, T, V) {
        var W = Br(T);
        if (typeof W != "function")
          throw new Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue.");
        {
          typeof Symbol == "function" && // $FlowFixMe Flow doesn't know about toStringTag
          T[Symbol.toStringTag] === "Generator" && (Qd || D("Using Generators as children is unsupported and will likely yield unexpected results because enumerating a generator mutates it. You may convert it to an array with `Array.from()` or the `[...spread]` operator before rendering. Keep in mind you might need to polyfill these features for older browsers."), Qd = !0), T.entries === W && (Bd || D("Using Maps as children is not supported. Use an array of keyed ReactElements instead."), Bd = !0);
          var K = W.call(T);
          if (K)
            for (var ge = null, ue = K.next(); !ue.done; ue = K.next()) {
              var Ne = ue.value;
              ge = F(Ne, ge, C);
            }
        }
        var me = W.call(T);
        if (me == null)
          throw new Error("An iterable object provided no iterator.");
        for (var Ze = null, te = null, dt = _, Sn = 0, nn = 0, da = null, An = me.next(); dt !== null && !An.done; nn++, An = me.next()) {
          dt.index > nn ? (da = dt, dt = null) : da = dt.sibling;
          var jn = N(C, dt, An.value, V);
          if (jn === null) {
            dt === null && (dt = da);
            break;
          }
          e && dt && jn.alternate === null && t(C, dt), Sn = s(jn, Sn, nn), te === null ? Ze = jn : te.sibling = jn, te = jn, dt = da;
        }
        if (An.done) {
          if (r(C, dt), a()) {
            var gn = nn;
            Rr(C, gn);
          }
          return Ze;
        }
        if (dt === null) {
          for (; !An.done; nn++, An = me.next()) {
            var yl = x(C, An.value, V);
            yl !== null && (Sn = s(yl, Sn, nn), te === null ? Ze = yl : te.sibling = yl, te = yl);
          }
          if (a()) {
            var Eo = nn;
            Rr(C, Eo);
          }
          return Ze;
        }
        for (var $s = l(C, dt); !An.done; nn++, An = me.next()) {
          var Fr = H($s, C, nn, An.value, V);
          Fr !== null && (e && Fr.alternate !== null && $s.delete(Fr.key === null ? nn : Fr.key), Sn = s(Fr, Sn, nn), te === null ? Ze = Fr : te.sibling = Fr, te = Fr);
        }
        if (e && $s.forEach(function(h1) {
          return t(C, h1);
        }), a()) {
          var m1 = nn;
          Rr(C, m1);
        }
        return Ze;
      }
      function ae(C, _, T, V) {
        if (_ !== null && _.tag === Ye) {
          r(C, _.sibling);
          var W = i(_, T);
          return W.return = C, W;
        }
        r(C, _);
        var K = Bp(T, C.mode, V);
        return K.return = C, K;
      }
      function $(C, _, T, V) {
        for (var W = T.key, K = _; K !== null; ) {
          if (K.key === W) {
            var ge = T.type;
            if (ge === Fa) {
              if (K.tag === jr) {
                r(C, K.sibling);
                var ue = i(K, T.props.children);
                return ue.return = C, ue._debugSource = T._source, ue._debugOwner = T._owner, ue;
              }
            } else if (K.elementType === ge || // Keep this check inline so it only runs on the false path:
            ay(K, T) || // Lazy types should reconcile their resolved type.
            // We need to do this after the Hot Reloading check above,
            // because hot reloading has different semantics than prod because
            // it doesn't resuspend. So we can't let the call below suspend.
            typeof ge == "object" && ge !== null && ge.$$typeof === Zt && kp(ge) === K.type) {
              r(C, K.sibling);
              var Ne = i(K, T.props);
              return Ne.ref = gs(C, K, T), Ne.return = C, Ne._debugSource = T._source, Ne._debugOwner = T._owner, Ne;
            }
            r(C, K);
            break;
          } else
            t(C, K);
          K = K.sibling;
        }
        if (T.type === Fa) {
          var me = $l(T.props.children, C.mode, V, T.key);
          return me.return = C, me;
        } else {
          var Ze = Vp(T, C.mode, V);
          return Ze.ref = gs(C, _, T), Ze.return = C, Ze;
        }
      }
      function Ae(C, _, T, V) {
        for (var W = T.key, K = _; K !== null; ) {
          if (K.key === W)
            if (K.tag === je && K.stateNode.containerInfo === T.containerInfo && K.stateNode.implementation === T.implementation) {
              r(C, K.sibling);
              var ge = i(K, T.children || []);
              return ge.return = C, ge;
            } else {
              r(C, K);
              break;
            }
          else
            t(C, K);
          K = K.sibling;
        }
        var ue = Qp(T, C.mode, V);
        return ue.return = C, ue;
      }
      function Ce(C, _, T, V) {
        var W = typeof T == "object" && T !== null && T.type === Fa && T.key === null;
        if (W && (T = T.props.children), typeof T == "object" && T !== null) {
          switch (T.$$typeof) {
            case lr:
              return d($(C, _, T, V));
            case vt:
              return d(Ae(C, _, T, V));
            case Zt:
              var K = T._payload, ge = T._init;
              return Ce(C, _, ge(K), V);
          }
          if (St(T))
            return L(C, _, T, V);
          if (Br(T))
            return P(C, _, T, V);
          Zc(C, T);
        }
        return typeof T == "string" && T !== "" || typeof T == "number" ? d(ae(C, _, "" + T, V)) : (typeof T == "function" && Pc(C), r(C, _));
      }
      return Ce;
    }
    var to = Ip(!0), $p = Ip(!1);
    function wy(e, t) {
      if (e !== null && t.child !== e.child)
        throw new Error("Resuming work not yet implemented.");
      if (t.child !== null) {
        var r = t.child, l = Yu(r, r.pendingProps);
        for (t.child = l, l.return = t; r.sibling !== null; )
          r = r.sibling, l = l.sibling = Yu(r, r.pendingProps), l.return = t;
        l.sibling = null;
      }
    }
    function qy(e, t) {
      for (var r = e.child; r !== null; )
        XE(r, t), r = r.sibling;
    }
    var Wc = Me(null), Es;
    Es = {};
    var bc = null, no = null, Gd = null, kc = !1;
    function Ic() {
      bc = null, no = null, Gd = null, kc = !1;
    }
    function em() {
      kc = !0;
    }
    function tm() {
      kc = !1;
    }
    function nm(e, t, r) {
      un ? (mt(Wc, t._currentValue, e), t._currentValue = r, t._currentRenderer !== void 0 && t._currentRenderer !== null && t._currentRenderer !== Es && D("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), t._currentRenderer = Es) : (mt(Wc, t._currentValue2, e), t._currentValue2 = r, t._currentRenderer2 !== void 0 && t._currentRenderer2 !== null && t._currentRenderer2 !== Es && D("Detected multiple renderers concurrently rendering the same context provider. This is currently unsupported."), t._currentRenderer2 = Es);
    }
    function Jd(e, t) {
      var r = Wc.current;
      pt(Wc, t), un ? e._currentValue = r : e._currentValue2 = r;
    }
    function Xd(e, t, r) {
      for (var l = e; l !== null; ) {
        var i = l.alternate;
        if (cn(l.childLanes, t) ? i !== null && !cn(i.childLanes, t) && (i.childLanes = fe(i.childLanes, t)) : (l.childLanes = fe(l.childLanes, t), i !== null && (i.childLanes = fe(i.childLanes, t))), l === r)
          break;
        l = l.return;
      }
      l !== r && D("Expected to find the propagation root when scheduling context work. This error is likely caused by a bug in React. Please file an issue.");
    }
    function Yy(e, t, r) {
      Gy(e, t, r);
    }
    function Gy(e, t, r) {
      var l = e.child;
      for (l !== null && (l.return = e); l !== null; ) {
        var i = void 0, s = l.dependencies;
        if (s !== null) {
          i = l.child;
          for (var d = s.firstContext; d !== null; ) {
            if (d.context === t) {
              if (l.tag === se) {
                var v = Al(r), p = vl(Ve, v);
                p.tag = ef;
                var h = l.updateQueue;
                if (h !== null) {
                  var y = h.shared, x = y.pending;
                  x === null ? p.next = p : (p.next = x.next, x.next = p), y.pending = p;
                }
              }
              l.lanes = fe(l.lanes, r);
              var N = l.alternate;
              N !== null && (N.lanes = fe(N.lanes, r)), Xd(l.return, r, e), s.lanes = fe(s.lanes, r);
              break;
            }
            d = d.next;
          }
        } else if (l.tag === bn)
          i = l.type === e.type ? null : l.child;
        else if (l.tag === Sl) {
          var H = l.return;
          if (H === null)
            throw new Error("We just came from a parent so we must have had a parent. This is a bug in React.");
          H.lanes = fe(H.lanes, r);
          var F = H.alternate;
          F !== null && (F.lanes = fe(F.lanes, r)), Xd(H, r, e), i = l.sibling;
        } else
          i = l.child;
        if (i !== null)
          i.return = l;
        else
          for (i = l; i !== null; ) {
            if (i === e) {
              i = null;
              break;
            }
            var L = i.sibling;
            if (L !== null) {
              L.return = i.return, i = L;
              break;
            }
            i = i.return;
          }
        l = i;
      }
    }
    function ao(e, t) {
      bc = e, no = null, Gd = null;
      var r = e.dependencies;
      if (r !== null) {
        var l = r.firstContext;
        l !== null && (Gt(r.lanes, t) && js(), r.firstContext = null);
      }
    }
    function Ct(e) {
      kc && D("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      var t = un ? e._currentValue : e._currentValue2;
      if (Gd !== e) {
        var r = {
          context: e,
          memoizedValue: t,
          next: null
        };
        if (no === null) {
          if (bc === null)
            throw new Error("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
          no = r, bc.dependencies = {
            lanes: O,
            firstContext: r
          };
        } else
          no = no.next = r;
      }
      return t;
    }
    var Fu = null;
    function Kd(e) {
      Fu === null ? Fu = [e] : Fu.push(e);
    }
    function Jy() {
      if (Fu !== null) {
        for (var e = 0; e < Fu.length; e++) {
          var t = Fu[e], r = t.interleaved;
          if (r !== null) {
            t.interleaved = null;
            var l = r.next, i = t.pending;
            if (i !== null) {
              var s = i.next;
              i.next = l, r.next = s;
            }
            t.pending = r;
          }
        }
        Fu = null;
      }
    }
    function am(e, t, r, l) {
      var i = t.interleaved;
      return i === null ? (r.next = r, Kd(t)) : (r.next = i.next, i.next = r), t.interleaved = r, $c(e, l);
    }
    function Xy(e, t, r, l) {
      var i = t.interleaved;
      i === null ? (r.next = r, Kd(t)) : (r.next = i.next, i.next = r), t.interleaved = r;
    }
    function Ky(e, t, r, l) {
      var i = t.interleaved;
      return i === null ? (r.next = r, Kd(t)) : (r.next = i.next, i.next = r), t.interleaved = r, $c(e, l);
    }
    function Ln(e, t) {
      return $c(e, t);
    }
    var Zy = $c;
    function $c(e, t) {
      e.lanes = fe(e.lanes, t);
      var r = e.alternate;
      r !== null && (r.lanes = fe(r.lanes, t)), r === null && (e.flags & (it | ha)) !== b && $h(e);
      for (var l = e, i = e.return; i !== null; )
        i.childLanes = fe(i.childLanes, t), r = i.alternate, r !== null ? r.childLanes = fe(r.childLanes, t) : (i.flags & (it | ha)) !== b && $h(e), l = i, i = i.return;
      if (l.tag === De) {
        var s = l.stateNode;
        return s;
      } else
        return null;
    }
    var rm = 0, lm = 1, ef = 2, Zd = 3, tf = !1, Pd, nf;
    Pd = !1, nf = null;
    function Wd(e) {
      var t = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
          pending: null,
          interleaved: null,
          lanes: O
        },
        effects: null
      };
      e.updateQueue = t;
    }
    function um(e, t) {
      var r = t.updateQueue, l = e.updateQueue;
      if (r === l) {
        var i = {
          baseState: l.baseState,
          firstBaseUpdate: l.firstBaseUpdate,
          lastBaseUpdate: l.lastBaseUpdate,
          shared: l.shared,
          effects: l.effects
        };
        t.updateQueue = i;
      }
    }
    function vl(e, t) {
      var r = {
        eventTime: e,
        lane: t,
        tag: rm,
        payload: null,
        callback: null,
        next: null
      };
      return r;
    }
    function Jl(e, t, r) {
      var l = e.updateQueue;
      if (l === null)
        return null;
      var i = l.shared;
      if (nf === i && !Pd && (D("An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function. Update functions should be pure, with zero side-effects. Consider using componentDidUpdate or a callback."), Pd = !0), rE()) {
        var s = i.pending;
        return s === null ? t.next = t : (t.next = s.next, s.next = t), i.pending = t, Zy(e, r);
      } else
        return Ky(e, i, t, r);
    }
    function af(e, t, r) {
      var l = t.updateQueue;
      if (l !== null) {
        var i = l.shared;
        if (ls(r)) {
          var s = i.lanes;
          s = us(s, e.pendingLanes);
          var d = fe(s, r);
          i.lanes = d, is(e, d);
        }
      }
    }
    function bd(e, t) {
      var r = e.updateQueue, l = e.alternate;
      if (l !== null) {
        var i = l.updateQueue;
        if (r === i) {
          var s = null, d = null, v = r.firstBaseUpdate;
          if (v !== null) {
            var p = v;
            do {
              var h = {
                eventTime: p.eventTime,
                lane: p.lane,
                tag: p.tag,
                payload: p.payload,
                callback: p.callback,
                next: null
              };
              d === null ? s = d = h : (d.next = h, d = h), p = p.next;
            } while (p !== null);
            d === null ? s = d = t : (d.next = t, d = t);
          } else
            s = d = t;
          r = {
            baseState: i.baseState,
            firstBaseUpdate: s,
            lastBaseUpdate: d,
            shared: i.shared,
            effects: i.effects
          }, e.updateQueue = r;
          return;
        }
      }
      var y = r.lastBaseUpdate;
      y === null ? r.firstBaseUpdate = t : y.next = t, r.lastBaseUpdate = t;
    }
    function Py(e, t, r, l, i, s) {
      switch (r.tag) {
        case lm: {
          var d = r.payload;
          if (typeof d == "function") {
            em();
            var v = d.call(s, l, i);
            {
              if (e.mode & be) {
                st(!0);
                try {
                  d.call(s, l, i);
                } finally {
                  st(!1);
                }
              }
              tm();
            }
            return v;
          }
          return d;
        }
        case Zd:
          e.flags = e.flags & ~Ut | xe;
        case rm: {
          var p = r.payload, h;
          if (typeof p == "function") {
            em(), h = p.call(s, l, i);
            {
              if (e.mode & be) {
                st(!0);
                try {
                  p.call(s, l, i);
                } finally {
                  st(!1);
                }
              }
              tm();
            }
          } else
            h = p;
          return h == null ? l : ut({}, l, h);
        }
        case ef:
          return tf = !0, l;
      }
      return l;
    }
    function rf(e, t, r, l) {
      var i = e.updateQueue;
      tf = !1, nf = i.shared;
      var s = i.firstBaseUpdate, d = i.lastBaseUpdate, v = i.shared.pending;
      if (v !== null) {
        i.shared.pending = null;
        var p = v, h = p.next;
        p.next = null, d === null ? s = h : d.next = h, d = p;
        var y = e.alternate;
        if (y !== null) {
          var x = y.updateQueue, N = x.lastBaseUpdate;
          N !== d && (N === null ? x.firstBaseUpdate = h : N.next = h, x.lastBaseUpdate = p);
        }
      }
      if (s !== null) {
        var H = i.baseState, F = O, L = null, P = null, ae = null, $ = s;
        do {
          var Ae = $.lane, Ce = $.eventTime;
          if (cn(l, Ae)) {
            if (ae !== null) {
              var _ = {
                eventTime: Ce,
                // This update is going to be committed so we never want uncommit
                // it. Using NoLane works because 0 is a subset of all bitmasks, so
                // this will never be skipped by the check above.
                lane: et,
                tag: $.tag,
                payload: $.payload,
                callback: $.callback,
                next: null
              };
              ae = ae.next = _;
            }
            H = Py(e, i, $, H, t, r);
            var T = $.callback;
            if (T !== null && // If the update was already committed, we should not queue its
            // callback again.
            $.lane !== et) {
              e.flags |= lc;
              var V = i.effects;
              V === null ? i.effects = [$] : V.push($);
            }
          } else {
            var C = {
              eventTime: Ce,
              lane: Ae,
              tag: $.tag,
              payload: $.payload,
              callback: $.callback,
              next: null
            };
            ae === null ? (P = ae = C, L = H) : ae = ae.next = C, F = fe(F, Ae);
          }
          if ($ = $.next, $ === null) {
            if (v = i.shared.pending, v === null)
              break;
            var W = v, K = W.next;
            W.next = null, $ = K, i.lastBaseUpdate = W, i.shared.pending = null;
          }
        } while (!0);
        ae === null && (L = H), i.baseState = L, i.firstBaseUpdate = P, i.lastBaseUpdate = ae;
        var ge = i.shared.interleaved;
        if (ge !== null) {
          var ue = ge;
          do
            F = fe(F, ue.lane), ue = ue.next;
          while (ue !== ge);
        } else s === null && (i.shared.lanes = O);
        bs(F), e.lanes = F, e.memoizedState = H;
      }
      nf = null;
    }
    function Wy(e, t) {
      if (typeof e != "function")
        throw new Error("Invalid argument passed as callback. Expected a function. Instead " + ("received: " + e));
      e.call(t);
    }
    function im() {
      tf = !1;
    }
    function lf() {
      return tf;
    }
    function om(e, t, r) {
      var l = t.effects;
      if (t.effects = null, l !== null)
        for (var i = 0; i < l.length; i++) {
          var s = l[i], d = s.callback;
          d !== null && (s.callback = null, Wy(d, r));
        }
    }
    var xs = {}, Xl = Me(xs), Rs = Me(xs), uf = Me(xs);
    function of(e) {
      if (e === xs)
        throw new Error("Expected host context to exist. This error is likely caused by a bug in React. Please file an issue.");
      return e;
    }
    function kd() {
      var e = of(uf.current);
      return e;
    }
    function Id(e, t) {
      mt(uf, t, e), mt(Rs, e, e), mt(Xl, xs, e);
      var r = Ge(t);
      pt(Xl, e), mt(Xl, r, e);
    }
    function ro(e) {
      pt(Xl, e), pt(Rs, e), pt(uf, e);
    }
    function Ts() {
      var e = of(Xl.current);
      return e;
    }
    function sm(e) {
      var t = of(uf.current), r = of(Xl.current), l = qe(r, e.type, t);
      r !== l && (mt(Rs, e, e), mt(Xl, l, e));
    }
    function $d(e) {
      Rs.current === e && (pt(Xl, e), pt(Rs, e));
    }
    var by = 0, cm = 1, fm = 1, Cs = 2, Wa = Me(by);
    function ev(e, t) {
      return (e & t) !== 0;
    }
    function lo(e) {
      return e & cm;
    }
    function tv(e, t) {
      return e & cm | t;
    }
    function ky(e, t) {
      return e | t;
    }
    function Kl(e, t) {
      mt(Wa, t, e);
    }
    function uo(e) {
      pt(Wa, e);
    }
    function Iy(e, t) {
      var r = e.memoizedState;
      return r !== null ? r.dehydrated !== null : (e.memoizedProps, !0);
    }
    function sf(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === Qe) {
          var r = t.memoizedState;
          if (r !== null) {
            var l = r.dehydrated;
            if (l === null || fr(l) || ta(l))
              return t;
          }
        } else if (t.tag === an && // revealOrder undefined can't be trusted because it don't
        // keep track of whether it suspended or not.
        t.memoizedProps.revealOrder !== void 0) {
          var i = (t.flags & xe) !== b;
          if (i)
            return t;
        } else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === e)
          return null;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e)
            return null;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
      return null;
    }
    var Kn = (
      /*   */
      0
    ), Ft = (
      /* */
      1
    ), Cr = (
      /*  */
      2
    ), At = (
      /*    */
      4
    ), kt = (
      /*   */
      8
    ), nv = [];
    function av() {
      for (var e = 0; e < nv.length; e++) {
        var t = nv[e];
        un ? t._workInProgressVersionPrimary = null : t._workInProgressVersionSecondary = null;
      }
      nv.length = 0;
    }
    function $y(e, t) {
      var r = t._getVersion, l = r(t._source);
      e.mutableSourceEagerHydrationData == null ? e.mutableSourceEagerHydrationData = [t, l] : e.mutableSourceEagerHydrationData.push(t, l);
    }
    var X = lt.ReactCurrentDispatcher, Ds = lt.ReactCurrentBatchConfig, rv, io;
    rv = /* @__PURE__ */ new Set();
    var Au = O, Fe = null, jt = null, Vt = null, cf = !1, zs = !1, Ns = 0, eS = 0, tS = 25, M = null, Ua = null, Zl = -1, lv = !1;
    function He() {
      {
        var e = M;
        Ua === null ? Ua = [e] : Ua.push(e);
      }
    }
    function B() {
      {
        var e = M;
        Ua !== null && (Zl++, Ua[Zl] !== e && nS(e));
      }
    }
    function oo(e) {
      e != null && !St(e) && D("%s received a final argument that is not an array (instead, received `%s`). When specified, the final argument must be an array.", M, typeof e);
    }
    function nS(e) {
      {
        var t = ce(Fe);
        if (!rv.has(t) && (rv.add(t), Ua !== null)) {
          for (var r = "", l = 30, i = 0; i <= Zl; i++) {
            for (var s = Ua[i], d = i === Zl ? e : s, v = i + 1 + ". " + s; v.length < l; )
              v += " ";
            v += d + `
`, r += v;
          }
          D(`React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
`, t, r);
        }
      }
    }
    function hn() {
      throw new Error(`Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.`);
    }
    function uv(e, t) {
      if (lv)
        return !1;
      if (t === null)
        return D("%s received a final argument during this render, but not during the previous render. Even though the final argument is optional, its type cannot change between renders.", M), !1;
      e.length !== t.length && D(`The final argument passed to %s changed size between renders. The order and size of this array must remain constant.

Previous: %s
Incoming: %s`, M, "[" + t.join(", ") + "]", "[" + e.join(", ") + "]");
      for (var r = 0; r < t.length && r < e.length; r++)
        if (!Xt(e[r], t[r]))
          return !1;
      return !0;
    }
    function so(e, t, r, l, i, s) {
      Au = s, Fe = t, Ua = e !== null ? e._debugHookTypes : null, Zl = -1, lv = e !== null && e.type !== t.type, t.memoizedState = null, t.updateQueue = null, t.lanes = O, e !== null && e.memoizedState !== null ? X.current = Om : Ua !== null ? X.current = Lm : X.current = Hm;
      var d = r(l, i);
      if (zs) {
        var v = 0;
        do {
          if (zs = !1, Ns = 0, v >= tS)
            throw new Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
          v += 1, lv = !1, jt = null, Vt = null, t.updateQueue = null, Zl = -1, X.current = Fm, d = r(l, i);
        } while (zs);
      }
      X.current = Tf, t._debugHookTypes = Ua;
      var p = jt !== null && jt.next !== null;
      if (Au = O, Fe = null, jt = null, Vt = null, M = null, Ua = null, Zl = -1, e !== null && (e.flags & Va) !== (t.flags & Va) && // Disable this warning in legacy mode, because legacy Suspense is weird
      // and creates false positives. To make this work in legacy mode, we'd
      // need to mark fibers that commit in an incomplete state, somehow. For
      // now I'll disable the warning that most of the bugs that would trigger
      // it are either exclusive to concurrent mode or exist in both.
      (e.mode & he) !== I && D("Internal React error: Expected static flag was missing. Please notify the React team."), cf = !1, p)
        throw new Error("Rendered fewer hooks than expected. This may be caused by an accidental early return statement.");
      return d;
    }
    function co() {
      var e = Ns !== 0;
      return Ns = 0, e;
    }
    function dm(e, t, r) {
      t.updateQueue = e.updateQueue, (t.mode & ua) !== I ? t.flags &= -50333701 : t.flags &= -2053, e.lanes = Nn(e.lanes, r);
    }
    function vm() {
      if (X.current = Tf, cf) {
        for (var e = Fe.memoizedState; e !== null; ) {
          var t = e.queue;
          t !== null && (t.pending = null), e = e.next;
        }
        cf = !1;
      }
      Au = O, Fe = null, jt = null, Vt = null, Ua = null, Zl = -1, M = null, zm = !1, zs = !1, Ns = 0;
    }
    function Dr() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
      };
      return Vt === null ? Fe.memoizedState = Vt = e : Vt = Vt.next = e, Vt;
    }
    function _a() {
      var e;
      if (jt === null) {
        var t = Fe.alternate;
        t !== null ? e = t.memoizedState : e = null;
      } else
        e = jt.next;
      var r;
      if (Vt === null ? r = Fe.memoizedState : r = Vt.next, r !== null)
        Vt = r, r = Vt.next, jt = e;
      else {
        if (e === null)
          throw new Error("Rendered more hooks than during the previous render.");
        jt = e;
        var l = {
          memoizedState: jt.memoizedState,
          baseState: jt.baseState,
          baseQueue: jt.baseQueue,
          queue: jt.queue,
          next: null
        };
        Vt === null ? Fe.memoizedState = Vt = l : Vt = Vt.next = l;
      }
      return Vt;
    }
    function pm() {
      return {
        lastEffect: null,
        stores: null
      };
    }
    function iv(e, t) {
      return typeof t == "function" ? t(e) : t;
    }
    function ov(e, t, r) {
      var l = Dr(), i;
      r !== void 0 ? i = r(t) : i = t, l.memoizedState = l.baseState = i;
      var s = {
        pending: null,
        interleaved: null,
        lanes: O,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: i
      };
      l.queue = s;
      var d = s.dispatch = uS.bind(null, Fe, s);
      return [l.memoizedState, d];
    }
    function sv(e, t, r) {
      var l = _a(), i = l.queue;
      if (i === null)
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      i.lastRenderedReducer = e;
      var s = jt, d = s.baseQueue, v = i.pending;
      if (v !== null) {
        if (d !== null) {
          var p = d.next, h = v.next;
          d.next = h, v.next = p;
        }
        s.baseQueue !== d && D("Internal error: Expected work-in-progress queue to be a clone. This is a bug in React."), s.baseQueue = d = v, i.pending = null;
      }
      if (d !== null) {
        var y = d.next, x = s.baseState, N = null, H = null, F = null, L = y;
        do {
          var P = L.lane;
          if (cn(Au, P)) {
            if (F !== null) {
              var $ = {
                // This update is going to be committed so we never want uncommit
                // it. Using NoLane works because 0 is a subset of all bitmasks, so
                // this will never be skipped by the check above.
                lane: et,
                action: L.action,
                hasEagerState: L.hasEagerState,
                eagerState: L.eagerState,
                next: null
              };
              F = F.next = $;
            }
            if (L.hasEagerState)
              x = L.eagerState;
            else {
              var Ae = L.action;
              x = e(x, Ae);
            }
          } else {
            var ae = {
              lane: P,
              action: L.action,
              hasEagerState: L.hasEagerState,
              eagerState: L.eagerState,
              next: null
            };
            F === null ? (H = F = ae, N = x) : F = F.next = ae, Fe.lanes = fe(Fe.lanes, P), bs(P);
          }
          L = L.next;
        } while (L !== null && L !== y);
        F === null ? N = x : F.next = H, Xt(x, l.memoizedState) || js(), l.memoizedState = x, l.baseState = N, l.baseQueue = F, i.lastRenderedState = x;
      }
      var Ce = i.interleaved;
      if (Ce !== null) {
        var C = Ce;
        do {
          var _ = C.lane;
          Fe.lanes = fe(Fe.lanes, _), bs(_), C = C.next;
        } while (C !== Ce);
      } else d === null && (i.lanes = O);
      var T = i.dispatch;
      return [l.memoizedState, T];
    }
    function cv(e, t, r) {
      var l = _a(), i = l.queue;
      if (i === null)
        throw new Error("Should have a queue. This is likely a bug in React. Please file an issue.");
      i.lastRenderedReducer = e;
      var s = i.dispatch, d = i.pending, v = l.memoizedState;
      if (d !== null) {
        i.pending = null;
        var p = d.next, h = p;
        do {
          var y = h.action;
          v = e(v, y), h = h.next;
        } while (h !== p);
        Xt(v, l.memoizedState) || js(), l.memoizedState = v, l.baseQueue === null && (l.baseState = v), i.lastRenderedState = v;
      }
      return [v, s];
    }
    function T1(e, t, r) {
    }
    function C1(e, t, r) {
    }
    function fv(e, t, r) {
      var l = Fe, i = Dr(), s, d = a();
      if (d) {
        if (r === void 0)
          throw new Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
        s = r(), io || s !== r() && (D("The result of getServerSnapshot should be cached to avoid an infinite loop"), io = !0);
      } else {
        if (s = t(), !io) {
          var v = t();
          Xt(s, v) || (D("The result of getSnapshot should be cached to avoid an infinite loop"), io = !0);
        }
        var p = If();
        if (p === null)
          throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        Fl(p, Au) || mm(l, t, s);
      }
      i.memoizedState = s;
      var h = {
        value: s,
        getSnapshot: t
      };
      return i.queue = h, mf(ym.bind(null, l, h, e), [e]), l.flags |= ja, Us(Ft | kt, hm.bind(null, l, h, s, t), void 0, null), s;
    }
    function ff(e, t, r) {
      var l = Fe, i = _a(), s = t();
      if (!io) {
        var d = t();
        Xt(s, d) || (D("The result of getSnapshot should be cached to avoid an infinite loop"), io = !0);
      }
      var v = i.memoizedState, p = !Xt(v, s);
      p && (i.memoizedState = s, js());
      var h = i.queue;
      if (Ms(ym.bind(null, l, h, e), [e]), h.getSnapshot !== t || p || // Check if the susbcribe function changed. We can save some memory by
      // checking whether we scheduled a subscription effect above.
      Vt !== null && Vt.memoizedState.tag & Ft) {
        l.flags |= ja, Us(Ft | kt, hm.bind(null, l, h, s, t), void 0, null);
        var y = If();
        if (y === null)
          throw new Error("Expected a work-in-progress root. This is a bug in React. Please file an issue.");
        Fl(y, Au) || mm(l, t, s);
      }
      return s;
    }
    function mm(e, t, r) {
      e.flags |= No;
      var l = {
        getSnapshot: t,
        value: r
      }, i = Fe.updateQueue;
      if (i === null)
        i = pm(), Fe.updateQueue = i, i.stores = [l];
      else {
        var s = i.stores;
        s === null ? i.stores = [l] : s.push(l);
      }
    }
    function hm(e, t, r, l) {
      t.value = r, t.getSnapshot = l, Sm(t) && gm(e);
    }
    function ym(e, t, r) {
      var l = function() {
        Sm(t) && gm(e);
      };
      return r(l);
    }
    function Sm(e) {
      var t = e.getSnapshot, r = e.value;
      try {
        var l = t();
        return !Xt(r, l);
      } catch {
        return !0;
      }
    }
    function gm(e) {
      var t = Ln(e, ee);
      t !== null && zt(t, e, ee, Ve);
    }
    function df(e) {
      var t = Dr();
      typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e;
      var r = {
        pending: null,
        interleaved: null,
        lanes: O,
        dispatch: null,
        lastRenderedReducer: iv,
        lastRenderedState: e
      };
      t.queue = r;
      var l = r.dispatch = iS.bind(null, Fe, r);
      return [t.memoizedState, l];
    }
    function dv(e) {
      return sv(iv);
    }
    function vv(e) {
      return cv(iv);
    }
    function Us(e, t, r, l) {
      var i = {
        tag: e,
        create: t,
        destroy: r,
        deps: l,
        // Circular
        next: null
      }, s = Fe.updateQueue;
      if (s === null)
        s = pm(), Fe.updateQueue = s, s.lastEffect = i.next = i;
      else {
        var d = s.lastEffect;
        if (d === null)
          s.lastEffect = i.next = i;
        else {
          var v = d.next;
          d.next = i, i.next = v, s.lastEffect = i;
        }
      }
      return i;
    }
    function pv(e) {
      var t = Dr();
      {
        var r = {
          current: e
        };
        return t.memoizedState = r, r;
      }
    }
    function vf(e) {
      var t = _a();
      return t.memoizedState;
    }
    function _s(e, t, r, l) {
      var i = Dr(), s = l === void 0 ? null : l;
      Fe.flags |= e, i.memoizedState = Us(Ft | t, r, void 0, s);
    }
    function pf(e, t, r, l) {
      var i = _a(), s = l === void 0 ? null : l, d = void 0;
      if (jt !== null) {
        var v = jt.memoizedState;
        if (d = v.destroy, s !== null) {
          var p = v.deps;
          if (uv(s, p)) {
            i.memoizedState = Us(t, r, d, s);
            return;
          }
        }
      }
      Fe.flags |= e, i.memoizedState = Us(Ft | t, r, d, s);
    }
    function mf(e, t) {
      return (Fe.mode & ua) !== I ? _s(Mo | ja | _o, kt, e, t) : _s(ja | _o, kt, e, t);
    }
    function Ms(e, t) {
      return pf(ja, kt, e, t);
    }
    function mv(e, t) {
      return _s(Ee, Cr, e, t);
    }
    function hf(e, t) {
      return pf(Ee, Cr, e, t);
    }
    function hv(e, t) {
      var r = Ee;
      return r |= qr, (Fe.mode & ua) !== I && (r |= or), _s(r, At, e, t);
    }
    function yf(e, t) {
      return pf(Ee, At, e, t);
    }
    function Em(e, t) {
      if (typeof t == "function") {
        var r = t, l = e();
        return r(l), function() {
          r(null);
        };
      } else if (t != null) {
        var i = t;
        i.hasOwnProperty("current") || D("Expected useImperativeHandle() first argument to either be a ref callback or React.createRef() object. Instead received: %s.", "an object with keys {" + Object.keys(i).join(", ") + "}");
        var s = e();
        return i.current = s, function() {
          i.current = null;
        };
      }
    }
    function yv(e, t, r) {
      typeof t != "function" && D("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = r != null ? r.concat([e]) : null, i = Ee;
      return i |= qr, (Fe.mode & ua) !== I && (i |= or), _s(i, At, Em.bind(null, t, e), l);
    }
    function Sf(e, t, r) {
      typeof t != "function" && D("Expected useImperativeHandle() second argument to be a function that creates a handle. Instead received: %s.", t !== null ? typeof t : "null");
      var l = r != null ? r.concat([e]) : null;
      return pf(Ee, At, Em.bind(null, t, e), l);
    }
    function aS(e, t) {
    }
    var gf = aS;
    function Sv(e, t) {
      var r = Dr(), l = t === void 0 ? null : t;
      return r.memoizedState = [e, l], e;
    }
    function Ef(e, t) {
      var r = _a(), l = t === void 0 ? null : t, i = r.memoizedState;
      if (i !== null && l !== null) {
        var s = i[1];
        if (uv(l, s))
          return i[0];
      }
      return r.memoizedState = [e, l], e;
    }
    function gv(e, t) {
      var r = Dr(), l = t === void 0 ? null : t, i = e();
      return r.memoizedState = [i, l], i;
    }
    function xf(e, t) {
      var r = _a(), l = t === void 0 ? null : t, i = r.memoizedState;
      if (i !== null && l !== null) {
        var s = i[1];
        if (uv(l, s))
          return i[0];
      }
      var d = e();
      return r.memoizedState = [d, l], d;
    }
    function Ev(e) {
      var t = Dr();
      return t.memoizedState = e, e;
    }
    function xm(e) {
      var t = _a(), r = jt, l = r.memoizedState;
      return Tm(t, l, e);
    }
    function Rm(e) {
      var t = _a();
      if (jt === null)
        return t.memoizedState = e, e;
      var r = jt.memoizedState;
      return Tm(t, r, e);
    }
    function Tm(e, t, r) {
      var l = !Mc(Au);
      if (l) {
        if (!Xt(r, t)) {
          var i = Fi();
          Fe.lanes = fe(Fe.lanes, i), bs(i), e.baseState = !0;
        }
        return t;
      } else
        return e.baseState && (e.baseState = !1, js()), e.memoizedState = r, r;
    }
    function rS(e, t, r) {
      var l = bt();
      tt(Fc(l, Ta)), e(!0);
      var i = Ds.transition;
      Ds.transition = {};
      var s = Ds.transition;
      Ds.transition._updatedFibers = /* @__PURE__ */ new Set();
      try {
        e(!1), t();
      } finally {
        if (tt(l), Ds.transition = i, i === null && s._updatedFibers) {
          var d = s._updatedFibers.size;
          d > 10 && Wn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."), s._updatedFibers.clear();
        }
      }
    }
    function xv() {
      var e = df(!1), t = e[0], r = e[1], l = rS.bind(null, r), i = Dr();
      return i.memoizedState = l, [t, l];
    }
    function Cm() {
      var e = dv(), t = e[0], r = _a(), l = r.memoizedState;
      return [t, l];
    }
    function Dm() {
      var e = vv(), t = e[0], r = _a(), l = r.memoizedState;
      return [t, l];
    }
    var zm = !1;
    function lS() {
      return zm;
    }
    function Rv() {
      var e = Dr(), t = If(), r = t.identifierPrefix, l;
      if (a()) {
        var i = Qc();
        l = ":" + r + "R" + i;
        var s = Ns++;
        s > 0 && (l += "H" + s.toString(32)), l += ":";
      } else {
        var d = eS++;
        l = ":" + r + "r" + d.toString(32) + ":";
      }
      return e.memoizedState = l, l;
    }
    function Rf() {
      var e = _a(), t = e.memoizedState;
      return t;
    }
    function uS(e, t, r) {
      typeof arguments[3] == "function" && D("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var l = kl(e), i = {
        lane: l,
        action: r,
        hasEagerState: !1,
        eagerState: null,
        next: null
      };
      if (Nm(e))
        Um(t, i);
      else {
        var s = am(e, t, i, l);
        if (s !== null) {
          var d = yn();
          zt(s, e, l, d), _m(s, t, l);
        }
      }
      Mm(e, l);
    }
    function iS(e, t, r) {
      typeof arguments[3] == "function" && D("State updates from the useState() and useReducer() Hooks don't support the second callback argument. To execute a side effect after rendering, declare it in the component body with useEffect().");
      var l = kl(e), i = {
        lane: l,
        action: r,
        hasEagerState: !1,
        eagerState: null,
        next: null
      };
      if (Nm(e))
        Um(t, i);
      else {
        var s = e.alternate;
        if (e.lanes === O && (s === null || s.lanes === O)) {
          var d = t.lastRenderedReducer;
          if (d !== null) {
            var v;
            v = X.current, X.current = ba;
            try {
              var p = t.lastRenderedState, h = d(p, r);
              if (i.hasEagerState = !0, i.eagerState = h, Xt(h, p)) {
                Xy(e, t, i, l);
                return;
              }
            } catch {
            } finally {
              X.current = v;
            }
          }
        }
        var y = am(e, t, i, l);
        if (y !== null) {
          var x = yn();
          zt(y, e, l, x), _m(y, t, l);
        }
      }
      Mm(e, l);
    }
    function Nm(e) {
      var t = e.alternate;
      return e === Fe || t !== null && t === Fe;
    }
    function Um(e, t) {
      zs = cf = !0;
      var r = e.pending;
      r === null ? t.next = t : (t.next = r.next, r.next = t), e.pending = t;
    }
    function _m(e, t, r) {
      if (ls(r)) {
        var l = t.lanes;
        l = us(l, e.pendingLanes);
        var i = fe(l, r);
        t.lanes = i, is(e, i);
      }
    }
    function Mm(e, t, r) {
      Uu(e, t);
    }
    var Tf = {
      readContext: Ct,
      useCallback: hn,
      useContext: hn,
      useEffect: hn,
      useImperativeHandle: hn,
      useInsertionEffect: hn,
      useLayoutEffect: hn,
      useMemo: hn,
      useReducer: hn,
      useRef: hn,
      useState: hn,
      useDebugValue: hn,
      useDeferredValue: hn,
      useTransition: hn,
      useMutableSource: hn,
      useSyncExternalStore: hn,
      useId: hn,
      unstable_isNewReconciler: Oa
    }, Hm = null, Lm = null, Om = null, Fm = null, zr = null, ba = null, Cf = null;
    {
      var Tv = function() {
        D("Context can only be read while React is rendering. In classes, you can read it in the render method or getDerivedStateFromProps. In function components, you can read it directly in the function body, but not inside Hooks like useReducer() or useMemo().");
      }, ie = function() {
        D("Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://reactjs.org/link/rules-of-hooks");
      };
      Hm = {
        readContext: function(e) {
          return Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", He(), oo(t), Sv(e, t);
        },
        useContext: function(e) {
          return M = "useContext", He(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", He(), oo(t), mf(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", He(), oo(r), yv(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", He(), oo(t), mv(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", He(), oo(t), hv(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", He(), oo(t);
          var r = X.current;
          X.current = zr;
          try {
            return gv(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", He();
          var l = X.current;
          X.current = zr;
          try {
            return ov(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", He(), pv(e);
        },
        useState: function(e) {
          M = "useState", He();
          var t = X.current;
          X.current = zr;
          try {
            return df(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", He(), void 0;
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", He(), Ev(e);
        },
        useTransition: function() {
          return M = "useTransition", He(), xv();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", He(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", He(), fv(e, t, r);
        },
        useId: function() {
          return M = "useId", He(), Rv();
        },
        unstable_isNewReconciler: Oa
      }, Lm = {
        readContext: function(e) {
          return Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", B(), Sv(e, t);
        },
        useContext: function(e) {
          return M = "useContext", B(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", B(), mf(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", B(), yv(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", B(), mv(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", B(), hv(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", B();
          var r = X.current;
          X.current = zr;
          try {
            return gv(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", B();
          var l = X.current;
          X.current = zr;
          try {
            return ov(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", B(), pv(e);
        },
        useState: function(e) {
          M = "useState", B();
          var t = X.current;
          X.current = zr;
          try {
            return df(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", B(), void 0;
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", B(), Ev(e);
        },
        useTransition: function() {
          return M = "useTransition", B(), xv();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", B(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", B(), fv(e, t, r);
        },
        useId: function() {
          return M = "useId", B(), Rv();
        },
        unstable_isNewReconciler: Oa
      }, Om = {
        readContext: function(e) {
          return Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", B(), Ef(e, t);
        },
        useContext: function(e) {
          return M = "useContext", B(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", B(), Ms(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", B(), Sf(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", B(), hf(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", B(), yf(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", B();
          var r = X.current;
          X.current = ba;
          try {
            return xf(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", B();
          var l = X.current;
          X.current = ba;
          try {
            return sv(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", B(), vf();
        },
        useState: function(e) {
          M = "useState", B();
          var t = X.current;
          X.current = ba;
          try {
            return dv(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", B(), gf();
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", B(), xm(e);
        },
        useTransition: function() {
          return M = "useTransition", B(), Cm();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", B(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", B(), ff(e, t);
        },
        useId: function() {
          return M = "useId", B(), Rf();
        },
        unstable_isNewReconciler: Oa
      }, Fm = {
        readContext: function(e) {
          return Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", B(), Ef(e, t);
        },
        useContext: function(e) {
          return M = "useContext", B(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", B(), Ms(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", B(), Sf(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", B(), hf(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", B(), yf(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", B();
          var r = X.current;
          X.current = Cf;
          try {
            return xf(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", B();
          var l = X.current;
          X.current = Cf;
          try {
            return cv(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", B(), vf();
        },
        useState: function(e) {
          M = "useState", B();
          var t = X.current;
          X.current = Cf;
          try {
            return vv(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", B(), gf();
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", B(), Rm(e);
        },
        useTransition: function() {
          return M = "useTransition", B(), Dm();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", B(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", B(), ff(e, t);
        },
        useId: function() {
          return M = "useId", B(), Rf();
        },
        unstable_isNewReconciler: Oa
      }, zr = {
        readContext: function(e) {
          return Tv(), Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", ie(), He(), Sv(e, t);
        },
        useContext: function(e) {
          return M = "useContext", ie(), He(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", ie(), He(), mf(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", ie(), He(), yv(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", ie(), He(), mv(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", ie(), He(), hv(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", ie(), He();
          var r = X.current;
          X.current = zr;
          try {
            return gv(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", ie(), He();
          var l = X.current;
          X.current = zr;
          try {
            return ov(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", ie(), He(), pv(e);
        },
        useState: function(e) {
          M = "useState", ie(), He();
          var t = X.current;
          X.current = zr;
          try {
            return df(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", ie(), He(), void 0;
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", ie(), He(), Ev(e);
        },
        useTransition: function() {
          return M = "useTransition", ie(), He(), xv();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", ie(), He(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", ie(), He(), fv(e, t, r);
        },
        useId: function() {
          return M = "useId", ie(), He(), Rv();
        },
        unstable_isNewReconciler: Oa
      }, ba = {
        readContext: function(e) {
          return Tv(), Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", ie(), B(), Ef(e, t);
        },
        useContext: function(e) {
          return M = "useContext", ie(), B(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", ie(), B(), Ms(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", ie(), B(), Sf(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", ie(), B(), hf(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", ie(), B(), yf(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", ie(), B();
          var r = X.current;
          X.current = ba;
          try {
            return xf(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", ie(), B();
          var l = X.current;
          X.current = ba;
          try {
            return sv(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", ie(), B(), vf();
        },
        useState: function(e) {
          M = "useState", ie(), B();
          var t = X.current;
          X.current = ba;
          try {
            return dv(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", ie(), B(), gf();
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", ie(), B(), xm(e);
        },
        useTransition: function() {
          return M = "useTransition", ie(), B(), Cm();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", ie(), B(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", ie(), B(), ff(e, t);
        },
        useId: function() {
          return M = "useId", ie(), B(), Rf();
        },
        unstable_isNewReconciler: Oa
      }, Cf = {
        readContext: function(e) {
          return Tv(), Ct(e);
        },
        useCallback: function(e, t) {
          return M = "useCallback", ie(), B(), Ef(e, t);
        },
        useContext: function(e) {
          return M = "useContext", ie(), B(), Ct(e);
        },
        useEffect: function(e, t) {
          return M = "useEffect", ie(), B(), Ms(e, t);
        },
        useImperativeHandle: function(e, t, r) {
          return M = "useImperativeHandle", ie(), B(), Sf(e, t, r);
        },
        useInsertionEffect: function(e, t) {
          return M = "useInsertionEffect", ie(), B(), hf(e, t);
        },
        useLayoutEffect: function(e, t) {
          return M = "useLayoutEffect", ie(), B(), yf(e, t);
        },
        useMemo: function(e, t) {
          M = "useMemo", ie(), B();
          var r = X.current;
          X.current = ba;
          try {
            return xf(e, t);
          } finally {
            X.current = r;
          }
        },
        useReducer: function(e, t, r) {
          M = "useReducer", ie(), B();
          var l = X.current;
          X.current = ba;
          try {
            return cv(e, t, r);
          } finally {
            X.current = l;
          }
        },
        useRef: function(e) {
          return M = "useRef", ie(), B(), vf();
        },
        useState: function(e) {
          M = "useState", ie(), B();
          var t = X.current;
          X.current = ba;
          try {
            return vv(e);
          } finally {
            X.current = t;
          }
        },
        useDebugValue: function(e, t) {
          return M = "useDebugValue", ie(), B(), gf();
        },
        useDeferredValue: function(e) {
          return M = "useDeferredValue", ie(), B(), Rm(e);
        },
        useTransition: function() {
          return M = "useTransition", ie(), B(), Dm();
        },
        useMutableSource: function(e, t, r) {
          return M = "useMutableSource", ie(), B(), void 0;
        },
        useSyncExternalStore: function(e, t, r) {
          return M = "useSyncExternalStore", ie(), B(), ff(e, t);
        },
        useId: function() {
          return M = "useId", ie(), B(), Rf();
        },
        unstable_isNewReconciler: Oa
      };
    }
    var Pl = Ie.unstable_now, Am = 0, Df = -1, Hs = -1, zf = -1, Cv = !1, Nf = !1;
    function jm() {
      return Cv;
    }
    function oS() {
      Nf = !0;
    }
    function sS() {
      Cv = !1, Nf = !1;
    }
    function cS() {
      Cv = Nf, Nf = !1;
    }
    function Vm() {
      return Am;
    }
    function Bm() {
      Am = Pl();
    }
    function Dv(e) {
      Hs = Pl(), e.actualStartTime < 0 && (e.actualStartTime = Pl());
    }
    function Qm(e) {
      Hs = -1;
    }
    function Uf(e, t) {
      if (Hs >= 0) {
        var r = Pl() - Hs;
        e.actualDuration += r, t && (e.selfBaseDuration = r), Hs = -1;
      }
    }
    function Nr(e) {
      if (Df >= 0) {
        var t = Pl() - Df;
        Df = -1;
        for (var r = e.return; r !== null; ) {
          switch (r.tag) {
            case De:
              var l = r.stateNode;
              l.effectDuration += t;
              return;
            case kn:
              var i = r.stateNode;
              i.effectDuration += t;
              return;
          }
          r = r.return;
        }
      }
    }
    function zv(e) {
      if (zf >= 0) {
        var t = Pl() - zf;
        zf = -1;
        for (var r = e.return; r !== null; ) {
          switch (r.tag) {
            case De:
              var l = r.stateNode;
              l !== null && (l.passiveEffectDuration += t);
              return;
            case kn:
              var i = r.stateNode;
              i !== null && (i.passiveEffectDuration += t);
              return;
          }
          r = r.return;
        }
      }
    }
    function Ur() {
      Df = Pl();
    }
    function Nv() {
      zf = Pl();
    }
    function Uv(e) {
      for (var t = e.child; t; )
        e.actualDuration += t.actualDuration, t = t.sibling;
    }
    function ka(e, t) {
      if (e && e.defaultProps) {
        var r = ut({}, t), l = e.defaultProps;
        for (var i in l)
          r[i] === void 0 && (r[i] = l[i]);
        return r;
      }
      return t;
    }
    var _v = {}, Mv, Hv, Lv, Ov, Fv, wm, _f, Av, jv, Vv, Ls;
    {
      Mv = /* @__PURE__ */ new Set(), Hv = /* @__PURE__ */ new Set(), Lv = /* @__PURE__ */ new Set(), Ov = /* @__PURE__ */ new Set(), Av = /* @__PURE__ */ new Set(), Fv = /* @__PURE__ */ new Set(), jv = /* @__PURE__ */ new Set(), Vv = /* @__PURE__ */ new Set(), Ls = /* @__PURE__ */ new Set();
      var qm = /* @__PURE__ */ new Set();
      _f = function(e, t) {
        if (!(e === null || typeof e == "function")) {
          var r = t + "_" + e;
          qm.has(r) || (qm.add(r), D("%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", t, e));
        }
      }, wm = function(e, t) {
        if (t === void 0) {
          var r = Oe(e) || "Component";
          Fv.has(r) || (Fv.add(r), D("%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. You have returned undefined.", r));
        }
      }, Object.defineProperty(_v, "_processChildContext", {
        enumerable: !1,
        value: function() {
          throw new Error("_processChildContext is not available in React 16+. This likely means you have multiple copies of React and are attempting to nest a React 15 tree inside a React 16 tree using unstable_renderSubtreeIntoContainer, which isn't supported. Try to make sure you have only one copy of React (and ideally, switch to ReactDOM.createPortal).");
        }
      }), Object.freeze(_v);
    }
    function Bv(e, t, r, l) {
      var i = e.memoizedState, s = r(l, i);
      {
        if (e.mode & be) {
          st(!0);
          try {
            s = r(l, i);
          } finally {
            st(!1);
          }
        }
        wm(t, s);
      }
      var d = s == null ? i : ut({}, i, s);
      if (e.memoizedState = d, e.lanes === O) {
        var v = e.updateQueue;
        v.baseState = d;
      }
    }
    var Qv = {
      isMounted: Sd,
      enqueueSetState: function(e, t, r) {
        var l = La(e), i = yn(), s = kl(l), d = vl(i, s);
        d.payload = t, r != null && (_f(r, "setState"), d.callback = r);
        var v = Jl(l, d, s);
        v !== null && (zt(v, l, s, i), af(v, l, s)), Uu(l, s);
      },
      enqueueReplaceState: function(e, t, r) {
        var l = La(e), i = yn(), s = kl(l), d = vl(i, s);
        d.tag = lm, d.payload = t, r != null && (_f(r, "replaceState"), d.callback = r);
        var v = Jl(l, d, s);
        v !== null && (zt(v, l, s, i), af(v, l, s)), Uu(l, s);
      },
      enqueueForceUpdate: function(e, t) {
        var r = La(e), l = yn(), i = kl(r), s = vl(l, i);
        s.tag = ef, t != null && (_f(t, "forceUpdate"), s.callback = t);
        var d = Jl(r, s, i);
        d !== null && (zt(d, r, i, l), af(d, r, i)), Ki(r, i);
      }
    };
    function Ym(e, t, r, l, i, s, d) {
      var v = e.stateNode;
      if (typeof v.shouldComponentUpdate == "function") {
        var p = v.shouldComponentUpdate(l, s, d);
        {
          if (e.mode & be) {
            st(!0);
            try {
              p = v.shouldComponentUpdate(l, s, d);
            } finally {
              st(!1);
            }
          }
          p === void 0 && D("%s.shouldComponentUpdate(): Returned undefined instead of a boolean value. Make sure to return true or false.", Oe(t) || "Component");
        }
        return p;
      }
      return t.prototype && t.prototype.isPureReactComponent ? !m(r, l) || !m(i, s) : !0;
    }
    function fS(e, t, r) {
      var l = e.stateNode;
      {
        var i = Oe(t) || "Component", s = l.render;
        s || (t.prototype && typeof t.prototype.render == "function" ? D("%s(...): No `render` method found on the returned component instance: did you accidentally return an object from the constructor?", i) : D("%s(...): No `render` method found on the returned component instance: you may have forgotten to define `render`.", i)), l.getInitialState && !l.getInitialState.isReactClassApproved && !l.state && D("getInitialState was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Did you mean to define a state property instead?", i), l.getDefaultProps && !l.getDefaultProps.isReactClassApproved && D("getDefaultProps was defined on %s, a plain JavaScript class. This is only supported for classes created using React.createClass. Use a static property to define defaultProps instead.", i), l.propTypes && D("propTypes was defined as an instance property on %s. Use a static property to define propTypes instead.", i), l.contextType && D("contextType was defined as an instance property on %s. Use a static property to define contextType instead.", i), t.childContextTypes && !Ls.has(t) && // Strict Mode has its own warning for legacy context, so we can skip
        // this one.
        (e.mode & be) === I && (Ls.add(t), D(`%s uses the legacy childContextTypes API which is no longer supported and will be removed in the next major release. Use React.createContext() instead

.Learn more about this warning here: https://reactjs.org/link/legacy-context`, i)), t.contextTypes && !Ls.has(t) && // Strict Mode has its own warning for legacy context, so we can skip
        // this one.
        (e.mode & be) === I && (Ls.add(t), D(`%s uses the legacy contextTypes API which is no longer supported and will be removed in the next major release. Use React.createContext() with static contextType instead.

Learn more about this warning here: https://reactjs.org/link/legacy-context`, i)), l.contextTypes && D("contextTypes was defined as an instance property on %s. Use a static property to define contextTypes instead.", i), t.contextType && t.contextTypes && !jv.has(t) && (jv.add(t), D("%s declares both contextTypes and contextType static properties. The legacy contextTypes property will be ignored.", i)), typeof l.componentShouldUpdate == "function" && D("%s has a method called componentShouldUpdate(). Did you mean shouldComponentUpdate()? The name is phrased as a question because the function is expected to return a value.", i), t.prototype && t.prototype.isPureReactComponent && typeof l.shouldComponentUpdate < "u" && D("%s has a method called shouldComponentUpdate(). shouldComponentUpdate should not be used when extending React.PureComponent. Please extend React.Component if shouldComponentUpdate is used.", Oe(t) || "A pure component"), typeof l.componentDidUnmount == "function" && D("%s has a method called componentDidUnmount(). But there is no such lifecycle method. Did you mean componentWillUnmount()?", i), typeof l.componentDidReceiveProps == "function" && D("%s has a method called componentDidReceiveProps(). But there is no such lifecycle method. If you meant to update the state in response to changing props, use componentWillReceiveProps(). If you meant to fetch data or run side-effects or mutations after React has updated the UI, use componentDidUpdate().", i), typeof l.componentWillRecieveProps == "function" && D("%s has a method called componentWillRecieveProps(). Did you mean componentWillReceiveProps()?", i), typeof l.UNSAFE_componentWillRecieveProps == "function" && D("%s has a method called UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?", i);
        var d = l.props !== r;
        l.props !== void 0 && d && D("%s(...): When calling super() in `%s`, make sure to pass up the same props that your component's constructor was passed.", i, i), l.defaultProps && D("Setting defaultProps as an instance property on %s is not supported and will be ignored. Instead, define defaultProps as a static property on %s.", i, i), typeof l.getSnapshotBeforeUpdate == "function" && typeof l.componentDidUpdate != "function" && !Lv.has(t) && (Lv.add(t), D("%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). This component defines getSnapshotBeforeUpdate() only.", Oe(t))), typeof l.getDerivedStateFromProps == "function" && D("%s: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.", i), typeof l.getDerivedStateFromError == "function" && D("%s: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.", i), typeof t.getSnapshotBeforeUpdate == "function" && D("%s: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.", i);
        var v = l.state;
        v && (typeof v != "object" || St(v)) && D("%s.state: must be set to an object or null", i), typeof l.getChildContext == "function" && typeof t.childContextTypes != "object" && D("%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().", i);
      }
    }
    function Gm(e, t) {
      t.updater = Qv, e.stateNode = t, ec(t, e), t._reactInternalInstance = _v;
    }
    function Jm(e, t, r) {
      var l = !1, i = qt, s = qt, d = t.contextType;
      if ("contextType" in t) {
        var v = (
          // Allow null for conditional declaration
          d === null || d !== void 0 && d.$$typeof === zo && d._context === void 0
        );
        if (!v && !Vv.has(t)) {
          Vv.add(t);
          var p = "";
          d === void 0 ? p = " However, it is set to undefined. This can be caused by a typo or by mixing up named and default imports. This can also happen due to a circular dependency, so try moving the createContext() call to a separate file." : typeof d != "object" ? p = " However, it is set to a " + typeof d + "." : d.$$typeof === Do ? p = " Did you accidentally pass the Context.Provider instead?" : d._context !== void 0 ? p = " Did you accidentally pass the Context.Consumer instead?" : p = " However, it is set to an object with keys {" + Object.keys(d).join(", ") + "}.", D("%s defines an invalid contextType. contextType should point to the Context object returned by React.createContext().%s", Oe(t) || "Component", p);
        }
      }
      if (typeof d == "object" && d !== null)
        s = Ct(d);
      else {
        i = We(e, t, !0);
        var h = t.contextTypes;
        l = h != null, s = l ? qa(e, i) : qt;
      }
      var y = new t(r, s);
      if (e.mode & be) {
        st(!0);
        try {
          y = new t(r, s);
        } finally {
          st(!1);
        }
      }
      var x = e.memoizedState = y.state !== null && y.state !== void 0 ? y.state : null;
      Gm(e, y);
      {
        if (typeof t.getDerivedStateFromProps == "function" && x === null) {
          var N = Oe(t) || "Component";
          Hv.has(N) || (Hv.add(N), D("`%s` uses `getDerivedStateFromProps` but its initial state is %s. This is not recommended. Instead, define the initial state by assigning an object to `this.state` in the constructor of `%s`. This ensures that `getDerivedStateFromProps` arguments have a consistent shape.", N, y.state === null ? "null" : "undefined", N));
        }
        if (typeof t.getDerivedStateFromProps == "function" || typeof y.getSnapshotBeforeUpdate == "function") {
          var H = null, F = null, L = null;
          if (typeof y.componentWillMount == "function" && y.componentWillMount.__suppressDeprecationWarning !== !0 ? H = "componentWillMount" : typeof y.UNSAFE_componentWillMount == "function" && (H = "UNSAFE_componentWillMount"), typeof y.componentWillReceiveProps == "function" && y.componentWillReceiveProps.__suppressDeprecationWarning !== !0 ? F = "componentWillReceiveProps" : typeof y.UNSAFE_componentWillReceiveProps == "function" && (F = "UNSAFE_componentWillReceiveProps"), typeof y.componentWillUpdate == "function" && y.componentWillUpdate.__suppressDeprecationWarning !== !0 ? L = "componentWillUpdate" : typeof y.UNSAFE_componentWillUpdate == "function" && (L = "UNSAFE_componentWillUpdate"), H !== null || F !== null || L !== null) {
            var P = Oe(t) || "Component", ae = typeof t.getDerivedStateFromProps == "function" ? "getDerivedStateFromProps()" : "getSnapshotBeforeUpdate()";
            Ov.has(P) || (Ov.add(P), D(`Unsafe legacy lifecycles will not be called for components using new component APIs.

%s uses %s but also contains the following legacy lifecycles:%s%s%s

The above lifecycles should be removed. Learn more about this warning here:
https://reactjs.org/link/unsafe-component-lifecycles`, P, ae, H !== null ? `
  ` + H : "", F !== null ? `
  ` + F : "", L !== null ? `
  ` + L : ""));
          }
        }
      }
      return l && ht(e, i, s), y;
    }
    function dS(e, t) {
      var r = t.state;
      typeof t.componentWillMount == "function" && t.componentWillMount(), typeof t.UNSAFE_componentWillMount == "function" && t.UNSAFE_componentWillMount(), r !== t.state && (D("%s.componentWillMount(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", ce(e) || "Component"), Qv.enqueueReplaceState(t, t.state, null));
    }
    function Xm(e, t, r, l) {
      var i = t.state;
      if (typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(r, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(r, l), t.state !== i) {
        {
          var s = ce(e) || "Component";
          Mv.has(s) || (Mv.add(s), D("%s.componentWillReceiveProps(): Assigning directly to this.state is deprecated (except inside a component's constructor). Use setState instead.", s));
        }
        Qv.enqueueReplaceState(t, t.state, null);
      }
    }
    function wv(e, t, r, l) {
      fS(e, t, r);
      var i = e.stateNode;
      i.props = r, i.state = e.memoizedState, i.refs = {}, Wd(e);
      var s = t.contextType;
      if (typeof s == "object" && s !== null)
        i.context = Ct(s);
      else {
        var d = We(e, t, !0);
        i.context = qa(e, d);
      }
      {
        if (i.state === r) {
          var v = Oe(t) || "Component";
          Av.has(v) || (Av.add(v), D("%s: It is not recommended to assign props directly to state because updates to props won't be reflected in state. In most cases, it is better to use props directly.", v));
        }
        e.mode & be && S.recordLegacyContextWarning(e, i), S.recordUnsafeLifecycleWarnings(e, i);
      }
      i.state = e.memoizedState;
      var p = t.getDerivedStateFromProps;
      if (typeof p == "function" && (Bv(e, t, p, r), i.state = e.memoizedState), typeof t.getDerivedStateFromProps != "function" && typeof i.getSnapshotBeforeUpdate != "function" && (typeof i.UNSAFE_componentWillMount == "function" || typeof i.componentWillMount == "function") && (dS(e, i), rf(e, r, i, l), i.state = e.memoizedState), typeof i.componentDidMount == "function") {
        var h = Ee;
        h |= qr, (e.mode & ua) !== I && (h |= or), e.flags |= h;
      }
    }
    function vS(e, t, r, l) {
      var i = e.stateNode, s = e.memoizedProps;
      i.props = s;
      var d = i.context, v = t.contextType, p = qt;
      if (typeof v == "object" && v !== null)
        p = Ct(v);
      else {
        var h = We(e, t, !0);
        p = qa(e, h);
      }
      var y = t.getDerivedStateFromProps, x = typeof y == "function" || typeof i.getSnapshotBeforeUpdate == "function";
      !x && (typeof i.UNSAFE_componentWillReceiveProps == "function" || typeof i.componentWillReceiveProps == "function") && (s !== r || d !== p) && Xm(e, i, r, p), im();
      var N = e.memoizedState, H = i.state = N;
      if (rf(e, r, i, l), H = e.memoizedState, s === r && N === H && !mr() && !lf()) {
        if (typeof i.componentDidMount == "function") {
          var F = Ee;
          F |= qr, (e.mode & ua) !== I && (F |= or), e.flags |= F;
        }
        return !1;
      }
      typeof y == "function" && (Bv(e, t, y, r), H = e.memoizedState);
      var L = lf() || Ym(e, t, s, r, N, H, p);
      if (L) {
        if (!x && (typeof i.UNSAFE_componentWillMount == "function" || typeof i.componentWillMount == "function") && (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function") {
          var P = Ee;
          P |= qr, (e.mode & ua) !== I && (P |= or), e.flags |= P;
        }
      } else {
        if (typeof i.componentDidMount == "function") {
          var ae = Ee;
          ae |= qr, (e.mode & ua) !== I && (ae |= or), e.flags |= ae;
        }
        e.memoizedProps = r, e.memoizedState = H;
      }
      return i.props = r, i.state = H, i.context = p, L;
    }
    function pS(e, t, r, l, i) {
      var s = t.stateNode;
      um(e, t);
      var d = t.memoizedProps, v = t.type === t.elementType ? d : ka(t.type, d);
      s.props = v;
      var p = t.pendingProps, h = s.context, y = r.contextType, x = qt;
      if (typeof y == "object" && y !== null)
        x = Ct(y);
      else {
        var N = We(t, r, !0);
        x = qa(t, N);
      }
      var H = r.getDerivedStateFromProps, F = typeof H == "function" || typeof s.getSnapshotBeforeUpdate == "function";
      !F && (typeof s.UNSAFE_componentWillReceiveProps == "function" || typeof s.componentWillReceiveProps == "function") && (d !== p || h !== x) && Xm(t, s, l, x), im();
      var L = t.memoizedState, P = s.state = L;
      if (rf(t, l, s, i), P = t.memoizedState, d === p && L === P && !mr() && !lf() && !Gu)
        return typeof s.componentDidUpdate == "function" && (d !== e.memoizedProps || L !== e.memoizedState) && (t.flags |= Ee), typeof s.getSnapshotBeforeUpdate == "function" && (d !== e.memoizedProps || L !== e.memoizedState) && (t.flags |= ir), !1;
      typeof H == "function" && (Bv(t, r, H, l), P = t.memoizedState);
      var ae = lf() || Ym(t, r, v, l, L, P, x) || // TODO: In some cases, we'll end up checking if context has changed twice,
      // both before and after `shouldComponentUpdate` has been called. Not ideal,
      // but I'm loath to refactor this function. This only happens for memoized
      // components so it's not that common.
      Gu;
      return ae ? (!F && (typeof s.UNSAFE_componentWillUpdate == "function" || typeof s.componentWillUpdate == "function") && (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(l, P, x), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(l, P, x)), typeof s.componentDidUpdate == "function" && (t.flags |= Ee), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= ir)) : (typeof s.componentDidUpdate == "function" && (d !== e.memoizedProps || L !== e.memoizedState) && (t.flags |= Ee), typeof s.getSnapshotBeforeUpdate == "function" && (d !== e.memoizedProps || L !== e.memoizedState) && (t.flags |= ir), t.memoizedProps = l, t.memoizedState = P), s.props = l, s.state = P, s.context = x, ae;
    }
    function ju(e, t) {
      return {
        value: e,
        source: t,
        stack: z(t),
        digest: null
      };
    }
    function qv(e, t, r) {
      return {
        value: e,
        source: null,
        stack: r ?? null,
        digest: t ?? null
      };
    }
    function mS(e, t) {
      return !0;
    }
    function Yv(e, t) {
      try {
        var r = mS(e, t);
        if (r === !1)
          return;
        var l = t.value, i = t.source, s = t.stack, d = s !== null ? s : "";
        if (l != null && l._suppressLogging) {
          if (e.tag === se)
            return;
          console.error(l);
        }
        var v = i ? ce(i) : null, p = v ? "The above error occurred in the <" + v + "> component:" : "The above error occurred in one of your React components:", h;
        if (e.tag === De)
          h = `Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.`;
        else {
          var y = ce(e) || "Anonymous";
          h = "React will try to recreate this component tree from scratch " + ("using the error boundary you provided, " + y + ".");
        }
        var x = p + `
` + d + `

` + ("" + h);
        console.error(x);
      } catch (N) {
        setTimeout(function() {
          throw N;
        });
      }
    }
    var hS = typeof WeakMap == "function" ? WeakMap : Map;
    function Km(e, t, r) {
      var l = vl(Ve, r);
      l.tag = Zd, l.payload = {
        element: null
      };
      var i = t.value;
      return l.callback = function() {
        DE(i), Yv(e, t);
      }, l;
    }
    function Gv(e, t, r) {
      var l = vl(Ve, r);
      l.tag = Zd;
      var i = e.type.getDerivedStateFromError;
      if (typeof i == "function") {
        var s = t.value;
        l.payload = function() {
          return i(s);
        }, l.callback = function() {
          ry(e), Yv(e, t);
        };
      }
      var d = e.stateNode;
      return d !== null && typeof d.componentDidCatch == "function" && (l.callback = function() {
        ry(e), Yv(e, t), typeof i != "function" && TE(this);
        var p = t.value, h = t.stack;
        this.componentDidCatch(p, {
          componentStack: h !== null ? h : ""
        }), typeof i != "function" && (Gt(e.lanes, ee) || D("%s: Error boundaries should implement getDerivedStateFromError(). In that method, return a state update to display an error message or fallback UI.", ce(e) || "Unknown"));
      }), l;
    }
    function Zm(e, t, r) {
      var l = e.pingCache, i;
      if (l === null ? (l = e.pingCache = new hS(), i = /* @__PURE__ */ new Set(), l.set(t, i)) : (i = l.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), l.set(t, i))), !i.has(r)) {
        i.add(r);
        var s = zE.bind(null, e, t, r);
        fn && ks(e, r), t.then(s, s);
      }
    }
    function yS(e, t, r, l) {
      var i = e.updateQueue;
      if (i === null) {
        var s = /* @__PURE__ */ new Set();
        s.add(r), e.updateQueue = s;
      } else
        i.add(r);
    }
    function SS(e, t) {
      var r = e.tag;
      if ((e.mode & he) === I && (r === Le || r === _e || r === we)) {
        var l = e.alternate;
        l ? (e.updateQueue = l.updateQueue, e.memoizedState = l.memoizedState, e.lanes = l.lanes) : (e.updateQueue = null, e.memoizedState = null);
      }
    }
    function Pm(e) {
      var t = e;
      do {
        if (t.tag === Qe && Iy(t))
          return t;
        t = t.return;
      } while (t !== null);
      return null;
    }
    function Wm(e, t, r, l, i) {
      if ((e.mode & he) === I) {
        if (e === t)
          e.flags |= Ut;
        else {
          if (e.flags |= xe, r.flags |= Uo, r.flags &= -52805, r.tag === se) {
            var s = r.alternate;
            if (s === null)
              r.tag = ar;
            else {
              var d = vl(Ve, ee);
              d.tag = ef, Jl(r, d, ee);
            }
          }
          r.lanes = fe(r.lanes, ee);
        }
        return e;
      }
      return e.flags |= Ut, e.lanes = i, e;
    }
    function gS(e, t, r, l, i) {
      if (r.flags |= iu, fn && ks(e, i), l !== null && typeof l == "object" && typeof l.then == "function") {
        var s = l;
        SS(r), a() && r.mode & he && qc();
        var d = Pm(t);
        if (d !== null) {
          d.flags &= ~ma, Wm(d, t, r, e, i), d.mode & he && Zm(e, s, i), yS(d, e, s);
          return;
        } else {
          if (!as(i)) {
            Zm(e, s, i), zp();
            return;
          }
          var v = new Error("A component suspended while responding to synchronous input. This will cause the UI to be replaced with a loading indicator. To fix, updates that suspend should be wrapped with startTransition.");
          l = v;
        }
      } else if (a() && r.mode & he) {
        qc();
        var p = Pm(t);
        if (p !== null) {
          (p.flags & Ut) === b && (p.flags |= ma), Wm(p, t, r, e, i), u(ju(l, r));
          return;
        }
      }
      l = ju(l, r), mE(l);
      var h = t;
      do {
        switch (h.tag) {
          case De: {
            var y = l;
            h.flags |= Ut;
            var x = Al(i);
            h.lanes = fe(h.lanes, x);
            var N = Km(h, y, x);
            bd(h, N);
            return;
          }
          case se:
            var H = l, F = h.type, L = h.stateNode;
            if ((h.flags & xe) === b && (typeof F.getDerivedStateFromError == "function" || L !== null && typeof L.componentDidCatch == "function" && !Wh(L))) {
              h.flags |= Ut;
              var P = Al(i);
              h.lanes = fe(h.lanes, P);
              var ae = Gv(h, H, P);
              bd(h, ae);
              return;
            }
            break;
        }
        h = h.return;
      } while (h !== null);
    }
    function ES() {
      return null;
    }
    var Os = lt.ReactCurrentOwner, Ia = !1, Jv, Fs, Xv, Kv, Zv, Vu, Pv, Mf, As;
    Jv = {}, Fs = {}, Xv = {}, Kv = {}, Zv = {}, Vu = !1, Pv = {}, Mf = {}, As = {};
    function On(e, t, r, l) {
      e === null ? t.child = $p(t, null, r, l) : t.child = to(t, e.child, r, l);
    }
    function xS(e, t, r, l) {
      t.child = to(t, e.child, null, l), t.child = to(t, null, r, l);
    }
    function bm(e, t, r, l, i) {
      if (t.type !== t.elementType) {
        var s = r.propTypes;
        s && Dn(
          s,
          l,
          // Resolved props
          "prop",
          Oe(r)
        );
      }
      var d = r.render, v = t.ref, p, h;
      ao(t, i), gr(t);
      {
        if (Os.current = t, R(!0), p = so(e, t, d, l, v, i), h = co(), t.mode & be) {
          st(!0);
          try {
            p = so(e, t, d, l, v, i), h = co();
          } finally {
            st(!1);
          }
        }
        R(!1);
      }
      return Er(), e !== null && !Ia ? (dm(e, t, i), pl(e, t, i)) : (a() && h && ql(t), t.flags |= xl, On(e, t, p, i), t.child);
    }
    function km(e, t, r, l, i) {
      if (e === null) {
        var s = r.type;
        if (GE(s) && r.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
        r.defaultProps === void 0) {
          var d = s;
          return d = go(s), t.tag = we, t.type = d, kv(t, s), Im(e, t, d, l, i);
        }
        {
          var v = s.propTypes;
          if (v && Dn(
            v,
            l,
            // Resolved props
            "prop",
            Oe(s)
          ), r.defaultProps !== void 0) {
            var p = Oe(s) || "Unknown";
            As[p] || (D("%s: Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.", p), As[p] = !0);
          }
        }
        var h = jp(r.type, null, l, t, t.mode, i);
        return h.ref = t.ref, h.return = t, t.child = h, h;
      }
      {
        var y = r.type, x = y.propTypes;
        x && Dn(
          x,
          l,
          // Resolved props
          "prop",
          Oe(y)
        );
      }
      var N = e.child, H = ap(e, i);
      if (!H) {
        var F = N.memoizedProps, L = r.compare;
        if (L = L !== null ? L : m, L(F, l) && e.ref === t.ref)
          return pl(e, t, i);
      }
      t.flags |= xl;
      var P = Yu(N, l);
      return P.ref = t.ref, P.return = t, t.child = P, P;
    }
    function Im(e, t, r, l, i) {
      if (t.type !== t.elementType) {
        var s = t.elementType;
        if (s.$$typeof === Zt) {
          var d = s, v = d._payload, p = d._init;
          try {
            s = p(v);
          } catch {
            s = null;
          }
          var h = s && s.propTypes;
          h && Dn(
            h,
            l,
            // Resolved (SimpleMemoComponent has no defaultProps)
            "prop",
            Oe(s)
          );
        }
      }
      if (e !== null) {
        var y = e.memoizedProps;
        if (m(y, l) && e.ref === t.ref && // Prevent bailout if the implementation changed due to hot reload.
        t.type === e.type)
          if (Ia = !1, t.pendingProps = l = y, ap(e, i))
            (e.flags & Uo) !== b && (Ia = !0);
          else return t.lanes = e.lanes, pl(e, t, i);
      }
      return Wv(e, t, r, l, i);
    }
    function $m(e, t, r) {
      var l = t.pendingProps, i = l.children, s = e !== null ? e.memoizedState : null;
      if (l.mode === "hidden" || Ju)
        if ((t.mode & he) === I) {
          var d = {
            baseLanes: O,
            cachePool: null,
            transitions: null
          };
          t.memoizedState = d, ed(t, r);
        } else if (Gt(r, sn)) {
          var x = {
            baseLanes: O,
            cachePool: null,
            transitions: null
          };
          t.memoizedState = x;
          var N = s !== null ? s.baseLanes : r;
          ed(t, N);
        } else {
          var v = null, p;
          if (s !== null) {
            var h = s.baseLanes;
            p = fe(h, r);
          } else
            p = r;
          t.lanes = t.childLanes = sn;
          var y = {
            baseLanes: p,
            cachePool: v,
            transitions: null
          };
          return t.memoizedState = y, t.updateQueue = null, ed(t, p), null;
        }
      else {
        var H;
        s !== null ? (H = fe(s.baseLanes, r), t.memoizedState = null) : H = r, ed(t, H);
      }
      return On(e, t, i, r), t.child;
    }
    function RS(e, t, r) {
      var l = t.pendingProps;
      return On(e, t, l, r), t.child;
    }
    function TS(e, t, r) {
      var l = t.pendingProps.children;
      return On(e, t, l, r), t.child;
    }
    function CS(e, t, r) {
      {
        t.flags |= Ee;
        {
          var l = t.stateNode;
          l.effectDuration = 0, l.passiveEffectDuration = 0;
        }
      }
      var i = t.pendingProps, s = i.children;
      return On(e, t, s, r), t.child;
    }
    function eh(e, t) {
      var r = t.ref;
      (e === null && r !== null || e !== null && e.ref !== r) && (t.flags |= Qr, t.flags |= Rl);
    }
    function Wv(e, t, r, l, i) {
      if (t.type !== t.elementType) {
        var s = r.propTypes;
        s && Dn(
          s,
          l,
          // Resolved props
          "prop",
          Oe(r)
        );
      }
      var d;
      {
        var v = We(t, r, !0);
        d = qa(t, v);
      }
      var p, h;
      ao(t, i), gr(t);
      {
        if (Os.current = t, R(!0), p = so(e, t, r, l, d, i), h = co(), t.mode & be) {
          st(!0);
          try {
            p = so(e, t, r, l, d, i), h = co();
          } finally {
            st(!1);
          }
        }
        R(!1);
      }
      return Er(), e !== null && !Ia ? (dm(e, t, i), pl(e, t, i)) : (a() && h && ql(t), t.flags |= xl, On(e, t, p, i), t.child);
    }
    function th(e, t, r, l, i) {
      {
        switch (vy(t)) {
          case !1: {
            var s = t.stateNode, d = t.type, v = new d(t.memoizedProps, s.context), p = v.state;
            s.updater.enqueueSetState(s, p, null);
            break;
          }
          case !0: {
            t.flags |= xe, t.flags |= Ut;
            var h = new Error("Simulated error coming from DevTools"), y = Al(i);
            t.lanes = fe(t.lanes, y);
            var x = Gv(t, ju(h, t), y);
            bd(t, x);
            break;
          }
        }
        if (t.type !== t.elementType) {
          var N = r.propTypes;
          N && Dn(
            N,
            l,
            // Resolved props
            "prop",
            Oe(r)
          );
        }
      }
      var H;
      on(r) ? (H = !0, Ml(t)) : H = !1, ao(t, i);
      var F = t.stateNode, L;
      F === null ? (Lf(e, t), Jm(t, r, l), wv(t, r, l, i), L = !0) : e === null ? L = vS(t, r, l, i) : L = pS(e, t, r, l, i);
      var P = bv(e, t, r, L, H, i);
      {
        var ae = t.stateNode;
        L && ae.props !== l && (Vu || D("It looks like %s is reassigning its own `this.props` while rendering. This is not supported and can lead to confusing bugs.", ce(t) || "a component"), Vu = !0);
      }
      return P;
    }
    function bv(e, t, r, l, i, s) {
      eh(e, t);
      var d = (t.flags & xe) !== b;
      if (!l && !d)
        return i && la(t, r, !1), pl(e, t, s);
      var v = t.stateNode;
      Os.current = t;
      var p;
      if (d && typeof r.getDerivedStateFromError != "function")
        p = null, Qm();
      else {
        gr(t);
        {
          if (R(!0), p = v.render(), t.mode & be) {
            st(!0);
            try {
              v.render();
            } finally {
              st(!1);
            }
          }
          R(!1);
        }
        Er();
      }
      return t.flags |= xl, e !== null && d ? xS(e, t, p, s) : On(e, t, p, s), t.memoizedState = v.state, i && la(t, r, !0), t.child;
    }
    function nh(e) {
      var t = e.stateNode;
      t.pendingContext ? hi(e, t.pendingContext, t.pendingContext !== t.context) : t.context && hi(e, t.context, !1), Id(e, t.containerInfo);
    }
    function DS(e, t, r) {
      if (nh(t), e === null)
        throw new Error("Should have a current fiber. This is a bug in React.");
      var l = t.pendingProps, i = t.memoizedState, s = i.element;
      um(e, t), rf(t, l, null, r);
      var d = t.memoizedState;
      t.stateNode;
      var v = d.element;
      if (Wt && i.isDehydrated) {
        var p = {
          element: v,
          isDehydrated: !1,
          cache: d.cache,
          pendingSuspenseBoundaries: d.pendingSuspenseBoundaries,
          transitions: d.transitions
        }, h = t.updateQueue;
        if (h.baseState = p, t.memoizedState = p, t.flags & ma) {
          var y = ju(new Error("There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering."), t);
          return ah(e, t, v, r, y);
        } else if (v !== s) {
          var x = ju(new Error("This root received an early update, before anything was able hydrate. Switched the entire root to client rendering."), t);
          return ah(e, t, v, r, x);
        } else {
          Gc(t);
          var N = $p(t, null, v, r);
          t.child = N;
          for (var H = N; H; )
            H.flags = H.flags & ~it | ha, H = H.sibling;
        }
      } else {
        if (Gl(), v === s)
          return pl(e, t, r);
        On(e, t, v, r);
      }
      return t.child;
    }
    function ah(e, t, r, l, i) {
      return Gl(), u(i), t.flags |= ma, On(e, t, r, l), t.child;
    }
    function zS(e, t, r) {
      sm(t), e === null && Lu(t);
      var l = t.type, i = t.pendingProps, s = e !== null ? e.memoizedProps : null, d = i.children, v = Cl(l, i);
      return v ? d = null : s !== null && Cl(l, s) && (t.flags |= uu), eh(e, t), On(e, t, d, r), t.child;
    }
    function NS(e, t) {
      return e === null && Lu(t), null;
    }
    function US(e, t, r, l) {
      Lf(e, t);
      var i = t.pendingProps, s = r, d = s._payload, v = s._init, p = v(d);
      t.type = p;
      var h = t.tag = JE(p), y = ka(p, i), x;
      switch (h) {
        case Le:
          return kv(t, p), t.type = p = go(p), x = Wv(null, t, p, y, l), x;
        case se:
          return t.type = p = Mp(p), x = th(null, t, p, y, l), x;
        case _e:
          return t.type = p = Hp(p), x = bm(null, t, p, y, l), x;
        case In: {
          if (t.type !== t.elementType) {
            var N = p.propTypes;
            N && Dn(
              N,
              y,
              // Resolved for outer only
              "prop",
              Oe(p)
            );
          }
          return x = km(
            null,
            t,
            p,
            ka(p.type, y),
            // The inner type can have defaults too
            l
          ), x;
        }
      }
      var H = "";
      throw p !== null && typeof p == "object" && p.$$typeof === Zt && (H = " Did you wrap a component in React.lazy() more than once?"), new Error("Element type is invalid. Received a promise that resolves to: " + p + ". " + ("Lazy element type must resolve to a class or function." + H));
    }
    function _S(e, t, r, l, i) {
      Lf(e, t), t.tag = se;
      var s;
      return on(r) ? (s = !0, Ml(t)) : s = !1, ao(t, i), Jm(t, r, l), wv(t, r, l, i), bv(null, t, r, !0, s, i);
    }
    function MS(e, t, r, l) {
      Lf(e, t);
      var i = t.pendingProps, s;
      {
        var d = We(t, r, !1);
        s = qa(t, d);
      }
      ao(t, l);
      var v, p;
      gr(t);
      {
        if (r.prototype && typeof r.prototype.render == "function") {
          var h = Oe(r) || "Unknown";
          Jv[h] || (D("The <%s /> component appears to have a render method, but doesn't extend React.Component. This is likely to cause errors. Change %s to extend React.Component instead.", h, h), Jv[h] = !0);
        }
        t.mode & be && S.recordLegacyContextWarning(t, null), R(!0), Os.current = t, v = so(null, t, r, i, s, l), p = co(), R(!1);
      }
      if (Er(), t.flags |= xl, typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0) {
        var y = Oe(r) || "Unknown";
        Fs[y] || (D("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", y, y, y), Fs[y] = !0);
      }
      if (
        // Run these checks in production only if the flag is off.
        // Eventually we'll delete this branch altogether.
        typeof v == "object" && v !== null && typeof v.render == "function" && v.$$typeof === void 0
      ) {
        {
          var x = Oe(r) || "Unknown";
          Fs[x] || (D("The <%s /> component appears to be a function component that returns a class instance. Change %s to a class that extends React.Component instead. If you can't use a class try assigning the prototype on the function as a workaround. `%s.prototype = React.Component.prototype`. Don't use an arrow function since it cannot be called with `new` by React.", x, x, x), Fs[x] = !0);
        }
        t.tag = se, t.memoizedState = null, t.updateQueue = null;
        var N = !1;
        return on(r) ? (N = !0, Ml(t)) : N = !1, t.memoizedState = v.state !== null && v.state !== void 0 ? v.state : null, Wd(t), Gm(t, v), wv(t, r, i, l), bv(null, t, r, !0, N, l);
      } else {
        if (t.tag = Le, t.mode & be) {
          st(!0);
          try {
            v = so(null, t, r, i, s, l), p = co();
          } finally {
            st(!1);
          }
        }
        return a() && p && ql(t), On(null, t, v, l), kv(t, r), t.child;
      }
    }
    function kv(e, t) {
      {
        if (t && t.childContextTypes && D("%s(...): childContextTypes cannot be defined on a function component.", t.displayName || t.name || "Component"), e.ref !== null) {
          var r = "", l = J();
          l && (r += `

Check the render method of \`` + l + "`.");
          var i = l || "", s = e._debugSource;
          s && (i = s.fileName + ":" + s.lineNumber), Zv[i] || (Zv[i] = !0, D("Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?%s", r));
        }
        if (t.defaultProps !== void 0) {
          var d = Oe(t) || "Unknown";
          As[d] || (D("%s: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.", d), As[d] = !0);
        }
        if (typeof t.getDerivedStateFromProps == "function") {
          var v = Oe(t) || "Unknown";
          Kv[v] || (D("%s: Function components do not support getDerivedStateFromProps.", v), Kv[v] = !0);
        }
        if (typeof t.contextType == "object" && t.contextType !== null) {
          var p = Oe(t) || "Unknown";
          Xv[p] || (D("%s: Function components do not support contextType.", p), Xv[p] = !0);
        }
      }
    }
    var Iv = {
      dehydrated: null,
      treeContext: null,
      retryLane: et
    };
    function $v(e) {
      return {
        baseLanes: e,
        cachePool: ES(),
        transitions: null
      };
    }
    function HS(e, t) {
      var r = null;
      return {
        baseLanes: fe(e.baseLanes, t),
        cachePool: r,
        transitions: e.transitions
      };
    }
    function LS(e, t, r, l) {
      if (t !== null) {
        var i = t.memoizedState;
        if (i === null)
          return !1;
      }
      return ev(e, Cs);
    }
    function OS(e, t) {
      return Nn(e.childLanes, t);
    }
    function rh(e, t, r) {
      var l = t.pendingProps;
      my(t) && (t.flags |= xe);
      var i = Wa.current, s = !1, d = (t.flags & xe) !== b;
      if (d || LS(i, e) ? (s = !0, t.flags &= ~xe) : (e === null || e.memoizedState !== null) && (i = ky(i, fm)), i = lo(i), Kl(t, i), e === null) {
        Lu(t);
        var v = t.memoizedState;
        if (v !== null) {
          var p = v.dehydrated;
          if (p !== null)
            return BS(t, p);
        }
        var h = l.children, y = l.fallback;
        if (s) {
          var x = FS(t, h, y, r), N = t.child;
          return N.memoizedState = $v(r), t.memoizedState = Iv, x;
        } else
          return ep(t, h);
      } else {
        var H = e.memoizedState;
        if (H !== null) {
          var F = H.dehydrated;
          if (F !== null)
            return QS(e, t, d, l, F, H, r);
        }
        if (s) {
          var L = l.fallback, P = l.children, ae = jS(e, t, P, L, r), $ = t.child, Ae = e.child.memoizedState;
          return $.memoizedState = Ae === null ? $v(r) : HS(Ae, r), $.childLanes = OS(e, r), t.memoizedState = Iv, ae;
        } else {
          var Ce = l.children, C = AS(e, t, Ce, r);
          return t.memoizedState = null, C;
        }
      }
    }
    function ep(e, t, r) {
      var l = e.mode, i = {
        mode: "visible",
        children: t
      }, s = tp(i, l);
      return s.return = e, e.child = s, s;
    }
    function FS(e, t, r, l) {
      var i = e.mode, s = e.child, d = {
        mode: "hidden",
        children: t
      }, v, p;
      return (i & he) === I && s !== null ? (v = s, v.childLanes = O, v.pendingProps = d, e.mode & Ue && (v.actualDuration = 0, v.actualStartTime = -1, v.selfBaseDuration = 0, v.treeBaseDuration = 0), p = $l(r, i, l, null)) : (v = tp(d, i), p = $l(r, i, l, null)), v.return = e, p.return = e, v.sibling = p, e.child = v, p;
    }
    function tp(e, t, r) {
      return uy(e, t, O, null);
    }
    function lh(e, t) {
      return Yu(e, t);
    }
    function AS(e, t, r, l) {
      var i = e.child, s = i.sibling, d = lh(i, {
        mode: "visible",
        children: r
      });
      if ((t.mode & he) === I && (d.lanes = l), d.return = t, d.sibling = null, s !== null) {
        var v = t.deletions;
        v === null ? (t.deletions = [s], t.flags |= ur) : v.push(s);
      }
      return t.child = d, d;
    }
    function jS(e, t, r, l, i) {
      var s = t.mode, d = e.child, v = d.sibling, p = {
        mode: "hidden",
        children: r
      }, h;
      if (
        // In legacy mode, we commit the primary tree as if it successfully
        // completed, even though it's in an inconsistent state.
        (s & he) === I && // Make sure we're on the second pass, i.e. the primary child fragment was
        // already cloned. In legacy mode, the only case where this isn't true is
        // when DevTools forces us to display a fallback; we skip the first render
        // pass entirely and go straight to rendering the fallback. (In Concurrent
        // Mode, SuspenseList can also trigger this scenario, but this is a legacy-
        // only codepath.)
        t.child !== d
      ) {
        var y = t.child;
        h = y, h.childLanes = O, h.pendingProps = p, t.mode & Ue && (h.actualDuration = 0, h.actualStartTime = -1, h.selfBaseDuration = d.selfBaseDuration, h.treeBaseDuration = d.treeBaseDuration), t.deletions = null;
      } else
        h = lh(d, p), h.subtreeFlags = d.subtreeFlags & Va;
      var x;
      return v !== null ? x = Yu(v, l) : (x = $l(l, s, i, null), x.flags |= it), x.return = t, h.return = t, h.sibling = x, t.child = h, x;
    }
    function Hf(e, t, r, l) {
      l !== null && u(l), to(t, e.child, null, r);
      var i = t.pendingProps, s = i.children, d = ep(t, s);
      return d.flags |= it, t.memoizedState = null, d;
    }
    function VS(e, t, r, l, i) {
      var s = t.mode, d = {
        mode: "visible",
        children: r
      }, v = tp(d, s), p = $l(l, s, i, null);
      return p.flags |= it, v.return = t, p.return = t, v.sibling = p, t.child = v, (t.mode & he) !== I && to(t, e.child, null, i), p;
    }
    function BS(e, t, r) {
      return (e.mode & he) === I ? (D("Cannot hydrate Suspense in legacy mode. Switch from ReactDOM.hydrate(element, container) to ReactDOMClient.hydrateRoot(container, <App />).render(element) or remove the Suspense components from the server rendered components."), e.lanes = ee) : ta(t) ? e.lanes = hr : e.lanes = sn, null;
    }
    function QS(e, t, r, l, i, s, d) {
      if (r)
        if (t.flags & ma) {
          t.flags &= ~ma;
          var C = qv(new Error("There was an error while hydrating this Suspense boundary. Switched to client rendering."));
          return Hf(e, t, d, C);
        } else {
          if (t.memoizedState !== null)
            return t.child = e.child, t.flags |= xe, null;
          var _ = l.children, T = l.fallback, V = VS(e, t, _, T, d), W = t.child;
          return W.memoizedState = $v(d), t.memoizedState = Iv, V;
        }
      else {
        if (Fd(), (t.mode & he) === I)
          return Hf(
            e,
            t,
            d,
            // TODO: When we delete legacy mode, we should make this error argument
            // required — every concurrent mode path that causes hydration to
            // de-opt to client rendering should have an error message.
            null
          );
        if (ta(i)) {
          var v, p, h;
          {
            var y = wa(i);
            v = y.digest, p = y.message, h = y.stack;
          }
          var x;
          p ? x = new Error(p) : x = new Error("The server could not finish this Suspense boundary, likely due to an error during server rendering. Switched to client rendering.");
          var N = qv(x, v, h);
          return Hf(e, t, d, N);
        }
        var H = Gt(d, e.childLanes);
        if (Ia || H) {
          var F = If();
          if (F !== null) {
            var L = Hd(F, d);
            if (L !== et && L !== s.retryLane) {
              s.retryLane = L;
              var P = Ve;
              Ln(e, L), zt(F, e, L, P);
            }
          }
          zp();
          var ae = qv(new Error("This Suspense boundary received an update before it finished hydrating. This caused the boundary to switch to client rendering. The usual way to fix this is to wrap the original update in startTransition."));
          return Hf(e, t, d, ae);
        } else if (fr(i)) {
          t.flags |= xe, t.child = e.child;
          var $ = NE.bind(null, e);
          return Zr(i, $), null;
        } else {
          Ad(t, i, s.treeContext);
          var Ae = l.children, Ce = ep(t, Ae);
          return Ce.flags |= ha, Ce;
        }
      }
    }
    function uh(e, t, r) {
      e.lanes = fe(e.lanes, t);
      var l = e.alternate;
      l !== null && (l.lanes = fe(l.lanes, t)), Xd(e.return, t, r);
    }
    function wS(e, t, r) {
      for (var l = t; l !== null; ) {
        if (l.tag === Qe) {
          var i = l.memoizedState;
          i !== null && uh(l, r, e);
        } else if (l.tag === an)
          uh(l, r, e);
        else if (l.child !== null) {
          l.child.return = l, l = l.child;
          continue;
        }
        if (l === e)
          return;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === e)
            return;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    }
    function qS(e) {
      for (var t = e, r = null; t !== null; ) {
        var l = t.alternate;
        l !== null && sf(l) === null && (r = t), t = t.sibling;
      }
      return r;
    }
    function YS(e) {
      if (e !== void 0 && e !== "forwards" && e !== "backwards" && e !== "together" && !Pv[e])
        if (Pv[e] = !0, typeof e == "string")
          switch (e.toLowerCase()) {
            case "together":
            case "forwards":
            case "backwards": {
              D('"%s" is not a valid value for revealOrder on <SuspenseList />. Use lowercase "%s" instead.', e, e.toLowerCase());
              break;
            }
            case "forward":
            case "backward": {
              D('"%s" is not a valid value for revealOrder on <SuspenseList />. React uses the -s suffix in the spelling. Use "%ss" instead.', e, e.toLowerCase());
              break;
            }
            default:
              D('"%s" is not a supported revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?', e);
              break;
          }
        else
          D('%s is not a supported value for revealOrder on <SuspenseList />. Did you mean "together", "forwards" or "backwards"?', e);
    }
    function GS(e, t) {
      e !== void 0 && !Mf[e] && (e !== "collapsed" && e !== "hidden" ? (Mf[e] = !0, D('"%s" is not a supported value for tail on <SuspenseList />. Did you mean "collapsed" or "hidden"?', e)) : t !== "forwards" && t !== "backwards" && (Mf[e] = !0, D('<SuspenseList tail="%s" /> is only valid if revealOrder is "forwards" or "backwards". Did you mean to specify revealOrder="forwards"?', e)));
    }
    function ih(e, t) {
      {
        var r = St(e), l = !r && typeof Br(e) == "function";
        if (r || l) {
          var i = r ? "array" : "iterable";
          return D("A nested %s was passed to row #%s in <SuspenseList />. Wrap it in an additional SuspenseList to configure its revealOrder: <SuspenseList revealOrder=...> ... <SuspenseList revealOrder=...>{%s}</SuspenseList> ... </SuspenseList>", i, t, i), !1;
        }
      }
      return !0;
    }
    function JS(e, t) {
      if ((t === "forwards" || t === "backwards") && e !== void 0 && e !== null && e !== !1)
        if (St(e)) {
          for (var r = 0; r < e.length; r++)
            if (!ih(e[r], r))
              return;
        } else {
          var l = Br(e);
          if (typeof l == "function") {
            var i = l.call(e);
            if (i)
              for (var s = i.next(), d = 0; !s.done; s = i.next()) {
                if (!ih(s.value, d))
                  return;
                d++;
              }
          } else
            D('A single row was passed to a <SuspenseList revealOrder="%s" />. This is not useful since it needs multiple rows. Did you mean to pass multiple children or an array?', t);
        }
    }
    function np(e, t, r, l, i) {
      var s = e.memoizedState;
      s === null ? e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: l,
        tail: r,
        tailMode: i
      } : (s.isBackwards = t, s.rendering = null, s.renderingStartTime = 0, s.last = l, s.tail = r, s.tailMode = i);
    }
    function oh(e, t, r) {
      var l = t.pendingProps, i = l.revealOrder, s = l.tail, d = l.children;
      YS(i), GS(s, i), JS(d, i), On(e, t, d, r);
      var v = Wa.current, p = ev(v, Cs);
      if (p)
        v = tv(v, Cs), t.flags |= xe;
      else {
        var h = e !== null && (e.flags & xe) !== b;
        h && wS(t, t.child, r), v = lo(v);
      }
      if (Kl(t, v), (t.mode & he) === I)
        t.memoizedState = null;
      else
        switch (i) {
          case "forwards": {
            var y = qS(t.child), x;
            y === null ? (x = t.child, t.child = null) : (x = y.sibling, y.sibling = null), np(
              t,
              !1,
              // isBackwards
              x,
              y,
              s
            );
            break;
          }
          case "backwards": {
            var N = null, H = t.child;
            for (t.child = null; H !== null; ) {
              var F = H.alternate;
              if (F !== null && sf(F) === null) {
                t.child = H;
                break;
              }
              var L = H.sibling;
              H.sibling = N, N = H, H = L;
            }
            np(
              t,
              !0,
              // isBackwards
              N,
              null,
              // last
              s
            );
            break;
          }
          case "together": {
            np(
              t,
              !1,
              // isBackwards
              null,
              // tail
              null,
              // last
              void 0
            );
            break;
          }
          default:
            t.memoizedState = null;
        }
      return t.child;
    }
    function XS(e, t, r) {
      Id(t, t.stateNode.containerInfo);
      var l = t.pendingProps;
      return e === null ? t.child = to(t, null, l, r) : On(e, t, l, r), t.child;
    }
    var sh = !1;
    function KS(e, t, r) {
      var l = t.type, i = l._context, s = t.pendingProps, d = t.memoizedProps, v = s.value;
      {
        "value" in s || sh || (sh = !0, D("The `value` prop is required for the `<Context.Provider>`. Did you misspell it or forget to pass it?"));
        var p = t.type.propTypes;
        p && Dn(p, s, "prop", "Context.Provider");
      }
      if (nm(t, i, v), d !== null) {
        var h = d.value;
        if (Xt(h, v)) {
          if (d.children === s.children && !mr())
            return pl(e, t, r);
        } else
          Yy(t, i, r);
      }
      var y = s.children;
      return On(e, t, y, r), t.child;
    }
    var ch = !1;
    function ZS(e, t, r) {
      var l = t.type;
      l._context === void 0 ? l !== l.Consumer && (ch || (ch = !0, D("Rendering <Context> directly is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?"))) : l = l._context;
      var i = t.pendingProps, s = i.children;
      typeof s != "function" && D("A context consumer was rendered with multiple children, or a child that isn't a function. A context consumer expects a single child that is a function. If you did pass a function, make sure there is no trailing or leading whitespace around it."), ao(t, r);
      var d = Ct(l);
      gr(t);
      var v;
      return Os.current = t, R(!0), v = s(d), R(!1), Er(), t.flags |= xl, On(e, t, v, r), t.child;
    }
    function js() {
      Ia = !0;
    }
    function Lf(e, t) {
      (t.mode & he) === I && e !== null && (e.alternate = null, t.alternate = null, t.flags |= it);
    }
    function pl(e, t, r) {
      return e !== null && (t.dependencies = e.dependencies), Qm(), bs(t.lanes), Gt(r, t.childLanes) ? (wy(e, t), t.child) : null;
    }
    function PS(e, t, r) {
      {
        var l = t.return;
        if (l === null)
          throw new Error("Cannot swap the root fiber.");
        if (e.alternate = null, t.alternate = null, r.index = t.index, r.sibling = t.sibling, r.return = t.return, r.ref = t.ref, t === l.child)
          l.child = r;
        else {
          var i = l.child;
          if (i === null)
            throw new Error("Expected parent to have a child.");
          for (; i.sibling !== t; )
            if (i = i.sibling, i === null)
              throw new Error("Expected to find the previous sibling.");
          i.sibling = r;
        }
        var s = l.deletions;
        return s === null ? (l.deletions = [e], l.flags |= ur) : s.push(e), r.flags |= it, r;
      }
    }
    function ap(e, t) {
      var r = e.lanes;
      return !!Gt(r, t);
    }
    function WS(e, t, r) {
      switch (t.tag) {
        case De:
          nh(t), t.stateNode, Gl();
          break;
        case ne:
          sm(t);
          break;
        case se: {
          var l = t.type;
          on(l) && Ml(t);
          break;
        }
        case je:
          Id(t, t.stateNode.containerInfo);
          break;
        case bn: {
          var i = t.memoizedProps.value, s = t.type._context;
          nm(t, s, i);
          break;
        }
        case kn:
          {
            var d = Gt(r, t.childLanes);
            d && (t.flags |= Ee);
            {
              var v = t.stateNode;
              v.effectDuration = 0, v.passiveEffectDuration = 0;
            }
          }
          break;
        case Qe: {
          var p = t.memoizedState;
          if (p !== null) {
            if (p.dehydrated !== null)
              return Kl(t, lo(Wa.current)), t.flags |= xe, null;
            var h = t.child, y = h.childLanes;
            if (Gt(r, y))
              return rh(e, t, r);
            Kl(t, lo(Wa.current));
            var x = pl(e, t, r);
            return x !== null ? x.sibling : null;
          } else
            Kl(t, lo(Wa.current));
          break;
        }
        case an: {
          var N = (e.flags & xe) !== b, H = Gt(r, t.childLanes);
          if (N) {
            if (H)
              return oh(e, t, r);
            t.flags |= xe;
          }
          var F = t.memoizedState;
          if (F !== null && (F.rendering = null, F.tail = null, F.lastEffect = null), Kl(t, Wa.current), H)
            break;
          return null;
        }
        case Nt:
        case Vr:
          return t.lanes = O, $m(e, t, r);
      }
      return pl(e, t, r);
    }
    function fh(e, t, r) {
      if (t._debugNeedsRemount && e !== null)
        return PS(e, t, jp(t.type, t.key, t.pendingProps, t._debugOwner || null, t.mode, t.lanes));
      if (e !== null) {
        var l = e.memoizedProps, i = t.pendingProps;
        if (l !== i || mr() || // Force a re-render if the implementation changed due to hot reload:
        t.type !== e.type)
          Ia = !0;
        else {
          var s = ap(e, r);
          if (!s && // If this is the second pass of an error or suspense boundary, there
          // may not be work scheduled on `current`, so we check for this flag.
          (t.flags & xe) === b)
            return Ia = !1, WS(e, t, r);
          (e.flags & Uo) !== b ? Ia = !0 : Ia = !1;
        }
      } else if (Ia = !1, a() && ms(t)) {
        var d = t.index, v = cl();
        Wi(t, v, d);
      }
      switch (t.lanes = O, t.tag) {
        case Vn:
          return MS(e, t, t.type, r);
        case ru: {
          var p = t.elementType;
          return US(e, t, p, r);
        }
        case Le: {
          var h = t.type, y = t.pendingProps, x = t.elementType === h ? y : ka(h, y);
          return Wv(e, t, h, x, r);
        }
        case se: {
          var N = t.type, H = t.pendingProps, F = t.elementType === N ? H : ka(N, H);
          return th(e, t, N, F, r);
        }
        case De:
          return DS(e, t, r);
        case ne:
          return zS(e, t, r);
        case Ye:
          return NS(e, t);
        case Qe:
          return rh(e, t, r);
        case je:
          return XS(e, t, r);
        case _e: {
          var L = t.type, P = t.pendingProps, ae = t.elementType === L ? P : ka(L, P);
          return bm(e, t, L, ae, r);
        }
        case jr:
          return RS(e, t, r);
        case nu:
          return TS(e, t, r);
        case kn:
          return CS(e, t, r);
        case bn:
          return KS(e, t, r);
        case au:
          return ZS(e, t, r);
        case In: {
          var $ = t.type, Ae = t.pendingProps, Ce = ka($, Ae);
          if (t.type !== t.elementType) {
            var C = $.propTypes;
            C && Dn(
              C,
              Ce,
              // Resolved for outer only
              "prop",
              Oe($)
            );
          }
          return Ce = ka($.type, Ce), km(e, t, $, Ce, r);
        }
        case we:
          return Im(e, t, t.type, t.pendingProps, r);
        case ar: {
          var _ = t.type, T = t.pendingProps, V = t.elementType === _ ? T : ka(_, T);
          return _S(e, t, _, V, r);
        }
        case an:
          return oh(e, t, r);
        case rr:
          break;
        case Nt:
          return $m(e, t, r);
      }
      throw new Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function _r(e) {
      e.flags |= Ee;
    }
    function dh(e) {
      e.flags |= Qr, e.flags |= Rl;
    }
    function vh(e, t) {
      var r = e !== null && e.child === t.child;
      if (r)
        return !0;
      if ((t.flags & ur) !== b)
        return !1;
      for (var l = t.child; l !== null; ) {
        if ((l.flags & ou) !== b || (l.subtreeFlags & ou) !== b)
          return !1;
        l = l.sibling;
      }
      return !0;
    }
    var Vs, Bs, Of, Ff;
    if (En)
      Vs = function(e, t, r, l) {
        for (var i = t.child; i !== null; ) {
          if (i.tag === ne || i.tag === Ye)
            Ba(e, i.stateNode);
          else if (i.tag !== je) {
            if (i.child !== null) {
              i.child.return = i, i = i.child;
              continue;
            }
          }
          if (i === t)
            return;
          for (; i.sibling === null; ) {
            if (i.return === null || i.return === t)
              return;
            i = i.return;
          }
          i.sibling.return = i.return, i = i.sibling;
        }
      }, Bs = function(e, t) {
      }, Of = function(e, t, r, l, i) {
        var s = e.memoizedProps;
        if (s !== l) {
          var d = t.stateNode, v = Ts(), p = Pt(d, r, s, l, i, v);
          t.updateQueue = p, p && _r(t);
        }
      }, Ff = function(e, t, r, l) {
        r !== l && _r(t);
      };
    else if ($u) {
      Vs = function(e, t, r, l) {
        for (var i = t.child; i !== null; ) {
          if (i.tag === ne) {
            var s = i.stateNode;
            if (r && l) {
              var d = i.memoizedProps, v = i.type;
              s = Kr(s, v, d, i);
            }
            Ba(e, s);
          } else if (i.tag === Ye) {
            var p = i.stateNode;
            if (r && l) {
              var h = i.memoizedProps;
              p = du(p, h, i);
            }
            Ba(e, p);
          } else if (i.tag !== je) {
            if (i.tag === Nt && i.memoizedState !== null) {
              var y = i.child;
              y !== null && (y.return = i), Vs(e, i, !0, !0);
            } else if (i.child !== null) {
              i.child.return = i, i = i.child;
              continue;
            }
          }
          if (i = i, i === t)
            return;
          for (; i.sibling === null; ) {
            if (i.return === null || i.return === t)
              return;
            i = i.return;
          }
          i.sibling.return = i.return, i = i.sibling;
        }
      };
      var ph = function(e, t, r, l) {
        for (var i = t.child; i !== null; ) {
          if (i.tag === ne) {
            var s = i.stateNode;
            if (r && l) {
              var d = i.memoizedProps, v = i.type;
              s = Kr(s, v, d, i);
            }
            fc(e, s);
          } else if (i.tag === Ye) {
            var p = i.stateNode;
            if (r && l) {
              var h = i.memoizedProps;
              p = du(p, h, i);
            }
            fc(e, p);
          } else if (i.tag !== je) {
            if (i.tag === Nt && i.memoizedState !== null) {
              var y = i.child;
              y !== null && (y.return = i), ph(e, i, !0, !0);
            } else if (i.child !== null) {
              i.child.return = i, i = i.child;
              continue;
            }
          }
          if (i = i, i === t)
            return;
          for (; i.sibling === null; ) {
            if (i.return === null || i.return === t)
              return;
            i = i.return;
          }
          i.sibling.return = i.return, i = i.sibling;
        }
      };
      Bs = function(e, t) {
        var r = t.stateNode, l = vh(e, t);
        if (!l) {
          var i = r.containerInfo, s = Yo(i);
          ph(s, t, !1, !1), r.pendingChildren = s, _r(t), Sa(i, s);
        }
      }, Of = function(e, t, r, l, i) {
        var s = e.stateNode, d = e.memoizedProps, v = vh(e, t);
        if (v && d === l) {
          t.stateNode = s;
          return;
        }
        var p = t.stateNode, h = Ts(), y = null;
        if (d !== l && (y = Pt(p, r, d, l, i, h)), v && y === null) {
          t.stateNode = s;
          return;
        }
        var x = qo(s, y, r, d, l, t, v, p);
        Gr(x, r, l, i, h) && _r(t), t.stateNode = x, v ? _r(t) : Vs(x, t, !1, !1);
      }, Ff = function(e, t, r, l) {
        if (r !== l) {
          var i = kd(), s = Ts();
          t.stateNode = Fo(l, i, s, t), _r(t);
        } else
          t.stateNode = e.stateNode;
      };
    } else
      Bs = function(e, t) {
      }, Of = function(e, t, r, l, i) {
      }, Ff = function(e, t, r, l) {
      };
    function Qs(e, t) {
      if (!a())
        switch (e.tailMode) {
          case "hidden": {
            for (var r = e.tail, l = null; r !== null; )
              r.alternate !== null && (l = r), r = r.sibling;
            l === null ? e.tail = null : l.sibling = null;
            break;
          }
          case "collapsed": {
            for (var i = e.tail, s = null; i !== null; )
              i.alternate !== null && (s = i), i = i.sibling;
            s === null ? !t && e.tail !== null ? e.tail.sibling = null : e.tail = null : s.sibling = null;
            break;
          }
        }
    }
    function It(e) {
      var t = e.alternate !== null && e.alternate.child === e.child, r = O, l = b;
      if (t) {
        if ((e.mode & Ue) !== I) {
          for (var p = e.selfBaseDuration, h = e.child; h !== null; )
            r = fe(r, fe(h.lanes, h.childLanes)), l |= h.subtreeFlags & Va, l |= h.flags & Va, p += h.treeBaseDuration, h = h.sibling;
          e.treeBaseDuration = p;
        } else
          for (var y = e.child; y !== null; )
            r = fe(r, fe(y.lanes, y.childLanes)), l |= y.subtreeFlags & Va, l |= y.flags & Va, y.return = e, y = y.sibling;
        e.subtreeFlags |= l;
      } else {
        if ((e.mode & Ue) !== I) {
          for (var i = e.actualDuration, s = e.selfBaseDuration, d = e.child; d !== null; )
            r = fe(r, fe(d.lanes, d.childLanes)), l |= d.subtreeFlags, l |= d.flags, i += d.actualDuration, s += d.treeBaseDuration, d = d.sibling;
          e.actualDuration = i, e.treeBaseDuration = s;
        } else
          for (var v = e.child; v !== null; )
            r = fe(r, fe(v.lanes, v.childLanes)), l |= v.subtreeFlags, l |= v.flags, v.return = e, v = v.sibling;
        e.subtreeFlags |= l;
      }
      return e.childLanes = r, t;
    }
    function bS(e, t, r) {
      if ($i() && (t.mode & he) !== I && (t.flags & xe) === b)
        return Kc(t), Gl(), t.flags |= ma | iu | Ut, !1;
      var l = Ou(t);
      if (r !== null && r.dehydrated !== null)
        if (e === null) {
          if (!l)
            throw new Error("A dehydrated suspense component was completed without a hydrated node. This is probably a bug in React.");
          if (Jc(t), It(t), (t.mode & Ue) !== I) {
            var i = r !== null;
            if (i) {
              var s = t.child;
              s !== null && (t.treeBaseDuration -= s.treeBaseDuration);
            }
          }
          return !1;
        } else {
          if (Gl(), (t.flags & xe) === b && (t.memoizedState = null), t.flags |= Ee, It(t), (t.mode & Ue) !== I) {
            var d = r !== null;
            if (d) {
              var v = t.child;
              v !== null && (t.treeBaseDuration -= v.treeBaseDuration);
            }
          }
          return !1;
        }
      else
        return n(), !0;
    }
    function mh(e, t, r) {
      var l = t.pendingProps;
      switch (ki(t), t.tag) {
        case Vn:
        case ru:
        case we:
        case Le:
        case _e:
        case jr:
        case nu:
        case kn:
        case au:
        case In:
          return It(t), null;
        case se: {
          var i = t.type;
          return on(i) && mi(t), It(t), null;
        }
        case De: {
          var s = t.stateNode;
          if (ro(t), Et(t), av(), s.pendingContext && (s.context = s.pendingContext, s.pendingContext = null), e === null || e.child === null) {
            var d = Ou(t);
            if (d)
              _r(t);
            else if (e !== null) {
              var v = e.memoizedState;
              // Check if this is a client root
              (!v.isDehydrated || // Check if we reverted to client rendering (e.g. due to an error)
              (t.flags & ma) !== b) && (t.flags |= ir, n());
            }
          }
          return Bs(e, t), It(t), null;
        }
        case ne: {
          $d(t);
          var p = kd(), h = t.type;
          if (e !== null && t.stateNode != null)
            Of(e, t, h, l, p), e.ref !== t.ref && dh(t);
          else {
            if (!l) {
              if (t.stateNode === null)
                throw new Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
              return It(t), null;
            }
            var y = Ts(), x = Ou(t);
            if (x)
              ys(t, p, y) && _r(t);
            else {
              var N = ln(h, l, p, y, t);
              Vs(N, t, !1, !1), t.stateNode = N, Gr(N, h, l, p, y) && _r(t);
            }
            t.ref !== null && dh(t);
          }
          return It(t), null;
        }
        case Ye: {
          var H = l;
          if (e && t.stateNode != null) {
            var F = e.memoizedProps;
            Ff(e, t, F, H);
          } else {
            if (typeof H != "string" && t.stateNode === null)
              throw new Error("We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.");
            var L = kd(), P = Ts(), ae = Ou(t);
            ae ? jd(t) && _r(t) : t.stateNode = Fo(H, L, P, t);
          }
          return It(t), null;
        }
        case Qe: {
          uo(t);
          var $ = t.memoizedState;
          if (e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
            var Ae = bS(e, t, $);
            if (!Ae)
              return t.flags & Ut ? t : null;
          }
          if ((t.flags & xe) !== b)
            return t.lanes = r, (t.mode & Ue) !== I && Uv(t), t;
          var Ce = $ !== null, C = e !== null && e.memoizedState !== null;
          if (Ce !== C && Ce) {
            var _ = t.child;
            if (_.flags |= wr, (t.mode & he) !== I) {
              var T = e === null && (t.memoizedProps.unstable_avoidThisFallback !== !0 || !0);
              T || ev(Wa.current, fm) ? pE() : zp();
            }
          }
          var V = t.updateQueue;
          if (V !== null && (t.flags |= Ee), It(t), (t.mode & Ue) !== I && Ce) {
            var W = t.child;
            W !== null && (t.treeBaseDuration -= W.treeBaseDuration);
          }
          return null;
        }
        case je:
          return ro(t), Bs(e, t), e === null && cu(t.stateNode.containerInfo), It(t), null;
        case bn:
          var K = t.type._context;
          return Jd(K, t), It(t), null;
        case ar: {
          var ge = t.type;
          return on(ge) && mi(t), It(t), null;
        }
        case an: {
          uo(t);
          var ue = t.memoizedState;
          if (ue === null)
            return It(t), null;
          var Ne = (t.flags & xe) !== b, me = ue.rendering;
          if (me === null)
            if (Ne)
              Qs(ue, !1);
            else {
              var Ze = hE() && (e === null || (e.flags & xe) === b);
              if (!Ze)
                for (var te = t.child; te !== null; ) {
                  var dt = sf(te);
                  if (dt !== null) {
                    Ne = !0, t.flags |= xe, Qs(ue, !1);
                    var Sn = dt.updateQueue;
                    return Sn !== null && (t.updateQueue = Sn, t.flags |= Ee), t.subtreeFlags = b, qy(t, r), Kl(t, tv(Wa.current, Cs)), t.child;
                  }
                  te = te.sibling;
                }
              ue.tail !== null && ot() > Qh() && (t.flags |= xe, Ne = !0, Qs(ue, !1), t.lanes = tl);
            }
          else {
            if (!Ne) {
              var nn = sf(me);
              if (nn !== null) {
                t.flags |= xe, Ne = !0;
                var da = nn.updateQueue;
                if (da !== null && (t.updateQueue = da, t.flags |= Ee), Qs(ue, !0), ue.tail === null && ue.tailMode === "hidden" && !me.alternate && !a())
                  return It(t), null;
              } else // The time it took to render last row is greater than the remaining
              // time we have to render. So rendering one more row would likely
              // exceed it.
              ot() * 2 - ue.renderingStartTime > Qh() && r !== sn && (t.flags |= xe, Ne = !0, Qs(ue, !1), t.lanes = tl);
            }
            if (ue.isBackwards)
              me.sibling = t.child, t.child = me;
            else {
              var An = ue.last;
              An !== null ? An.sibling = me : t.child = me, ue.last = me;
            }
          }
          if (ue.tail !== null) {
            var jn = ue.tail;
            ue.rendering = jn, ue.tail = jn.sibling, ue.renderingStartTime = ot(), jn.sibling = null;
            var gn = Wa.current;
            return Ne ? gn = tv(gn, Cs) : gn = lo(gn), Kl(t, gn), jn;
          }
          return It(t), null;
        }
        case rr:
          break;
        case Nt:
        case Vr: {
          Dp(t);
          var yl = t.memoizedState, Eo = yl !== null;
          if (e !== null) {
            var $s = e.memoizedState, Fr = $s !== null;
            Fr !== Eo && // LegacyHidden doesn't do any hiding — it only pre-renders.
            !Ju && (t.flags |= wr);
          }
          return !Eo || (t.mode & he) === I ? It(t) : Gt(Lr, sn) && (It(t), En && t.subtreeFlags & (it | Ee) && (t.flags |= wr)), null;
        }
        case To:
          return null;
        case lu:
          return null;
      }
      throw new Error("Unknown unit of work tag (" + t.tag + "). This error is likely caused by a bug in React. Please file an issue.");
    }
    function kS(e, t, r) {
      switch (ki(t), t.tag) {
        case se: {
          var l = t.type;
          on(l) && mi(t);
          var i = t.flags;
          return i & Ut ? (t.flags = i & ~Ut | xe, (t.mode & Ue) !== I && Uv(t), t) : null;
        }
        case De: {
          t.stateNode, ro(t), Et(t), av();
          var s = t.flags;
          return (s & Ut) !== b && (s & xe) === b ? (t.flags = s & ~Ut | xe, t) : null;
        }
        case ne:
          return $d(t), null;
        case Qe: {
          uo(t);
          var d = t.memoizedState;
          if (d !== null && d.dehydrated !== null) {
            if (t.alternate === null)
              throw new Error("Threw in newly mounted dehydrated component. This is likely a bug in React. Please file an issue.");
            Gl();
          }
          var v = t.flags;
          return v & Ut ? (t.flags = v & ~Ut | xe, (t.mode & Ue) !== I && Uv(t), t) : null;
        }
        case an:
          return uo(t), null;
        case je:
          return ro(t), null;
        case bn:
          var p = t.type._context;
          return Jd(p, t), null;
        case Nt:
        case Vr:
          return Dp(t), null;
        case To:
          return null;
        default:
          return null;
      }
    }
    function hh(e, t, r) {
      switch (ki(t), t.tag) {
        case se: {
          var l = t.type.childContextTypes;
          l != null && mi(t);
          break;
        }
        case De: {
          t.stateNode, ro(t), Et(t), av();
          break;
        }
        case ne: {
          $d(t);
          break;
        }
        case je:
          ro(t);
          break;
        case Qe:
          uo(t);
          break;
        case an:
          uo(t);
          break;
        case bn:
          var i = t.type._context;
          Jd(i, t);
          break;
        case Nt:
        case Vr:
          Dp(t);
          break;
      }
    }
    function yh(e, t, r, l, i, s, d, v, p) {
      var h = Array.prototype.slice.call(arguments, 3);
      try {
        t.apply(r, h);
      } catch (y) {
        this.onError(y);
      }
    }
    var Sh = yh;
    if (typeof window < "u" && typeof window.dispatchEvent == "function" && typeof document < "u" && typeof document.createEvent == "function") {
      var rp = document.createElement("react");
      Sh = function(t, r, l, i, s, d, v, p, h) {
        if (typeof document > "u" || document === null)
          throw new Error("The `document` global was defined when React was initialized, but is not defined anymore. This can happen in a test environment if a component schedules an update from an asynchronous callback, but the test has already finished running. To solve this, you can either unmount the component at the end of your test (and ensure that any asynchronous operations get canceled in `componentWillUnmount`), or you can change the test itself to be asynchronous.");
        var y = document.createEvent("Event"), x = !1, N = !0, H = window.event, F = Object.getOwnPropertyDescriptor(window, "event");
        function L() {
          rp.removeEventListener(_, ae, !1), typeof window.event < "u" && window.hasOwnProperty("event") && (window.event = H);
        }
        var P = Array.prototype.slice.call(arguments, 3);
        function ae() {
          x = !0, L(), r.apply(l, P), N = !1;
        }
        var $, Ae = !1, Ce = !1;
        function C(T) {
          if ($ = T.error, Ae = !0, $ === null && T.colno === 0 && T.lineno === 0 && (Ce = !0), T.defaultPrevented && $ != null && typeof $ == "object")
            try {
              $._suppressLogging = !0;
            } catch {
            }
        }
        var _ = "react-" + (t || "invokeguardedcallback");
        if (window.addEventListener("error", C), rp.addEventListener(_, ae, !1), y.initEvent(_, !1, !1), rp.dispatchEvent(y), F && Object.defineProperty(window, "event", F), x && N && (Ae ? Ce && ($ = new Error("A cross-origin error was thrown. React doesn't have access to the actual error object in development. See https://reactjs.org/link/crossorigin-error for more information.")) : $ = new Error(`An error was thrown inside one of your components, but React doesn't know what it was. This is likely due to browser flakiness. React does its best to preserve the "Pause on exceptions" behavior of the DevTools, which requires some DEV-mode only tricks. It's possible that these don't work in your browser. Try triggering the error in production mode, or switching to a modern browser. If you suspect that this is actually an issue with React, please file an issue.`), this.onError($)), window.removeEventListener("error", C), !x)
          return L(), yh.apply(this, arguments);
      };
    }
    var IS = Sh, ws = !1, Af = null, $S = {
      onError: function(e) {
        ws = !0, Af = e;
      }
    };
    function gh(e, t, r, l, i, s, d, v, p) {
      ws = !1, Af = null, IS.apply($S, arguments);
    }
    function eg() {
      return ws;
    }
    function Eh() {
      if (ws) {
        var e = Af;
        return ws = !1, Af = null, e;
      } else
        throw new Error("clearCaughtError was called but no error was captured. This error is likely caused by a bug in React. Please file an issue.");
    }
    var xh = null;
    xh = /* @__PURE__ */ new Set();
    var jf = !1, $t = !1, tg = typeof WeakSet == "function" ? WeakSet : Set, Z = null, fo = null, vo = null;
    function ng(e) {
      gh(null, function() {
        throw e;
      }), Eh();
    }
    var ag = function(e, t) {
      if (t.props = e.memoizedProps, t.state = e.memoizedState, e.mode & Ue)
        try {
          Ur(), t.componentWillUnmount();
        } finally {
          Nr(e);
        }
      else
        t.componentWillUnmount();
    };
    function Rh(e, t) {
      try {
        Wl(At, e);
      } catch (r) {
        Be(e, t, r);
      }
    }
    function lp(e, t, r) {
      try {
        ag(e, r);
      } catch (l) {
        Be(e, t, l);
      }
    }
    function rg(e, t, r) {
      try {
        r.componentDidMount();
      } catch (l) {
        Be(e, t, l);
      }
    }
    function Th(e, t) {
      try {
        Dh(e);
      } catch (r) {
        Be(e, t, r);
      }
    }
    function po(e, t) {
      var r = e.ref;
      if (r !== null)
        if (typeof r == "function") {
          var l;
          try {
            if (pa && tc && e.mode & Ue)
              try {
                Ur(), l = r(null);
              } finally {
                Nr(e);
              }
            else
              l = r(null);
          } catch (i) {
            Be(e, t, i);
          }
          typeof l == "function" && D("Unexpected return value from a callback ref in %s. A callback ref should not return a function.", ce(e));
        } else
          r.current = null;
    }
    function Vf(e, t, r) {
      try {
        r();
      } catch (l) {
        Be(e, t, l);
      }
    }
    var Ch = !1;
    function lg(e, t) {
      sr(e.containerInfo), Z = t, ug();
      var r = Ch;
      return Ch = !1, r;
    }
    function ug() {
      for (; Z !== null; ) {
        var e = Z, t = e.child;
        (e.subtreeFlags & Ho) !== b && t !== null ? (t.return = e, Z = t) : ig();
      }
    }
    function ig() {
      for (; Z !== null; ) {
        var e = Z;
        Te(e);
        try {
          og(e);
        } catch (r) {
          Be(e, e.return, r);
        }
        de();
        var t = e.sibling;
        if (t !== null) {
          t.return = e.return, Z = t;
          return;
        }
        Z = e.return;
      }
    }
    function og(e) {
      var t = e.alternate, r = e.flags;
      if ((r & ir) !== b) {
        switch (Te(e), e.tag) {
          case Le:
          case _e:
          case we:
            break;
          case se: {
            if (t !== null) {
              var l = t.memoizedProps, i = t.memoizedState, s = e.stateNode;
              e.type === e.elementType && !Vu && (s.props !== e.memoizedProps && D("Expected %s props to match memoized props before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", ce(e) || "instance"), s.state !== e.memoizedState && D("Expected %s state to match memoized state before getSnapshotBeforeUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.", ce(e) || "instance"));
              var d = s.getSnapshotBeforeUpdate(e.elementType === e.type ? l : ka(e.type, l), i);
              {
                var v = xh;
                d === void 0 && !v.has(e.type) && (v.add(e.type), D("%s.getSnapshotBeforeUpdate(): A snapshot value (or null) must be returned. You have returned undefined.", ce(e)));
              }
              s.__reactInternalSnapshotBeforeUpdate = d;
            }
            break;
          }
          case De: {
            if (En) {
              var p = e.stateNode;
              ai(p.containerInfo);
            }
            break;
          }
          case ne:
          case Ye:
          case je:
          case ar:
            break;
          default:
            throw new Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
        }
        de();
      }
    }
    function $a(e, t, r) {
      var l = t.updateQueue, i = l !== null ? l.lastEffect : null;
      if (i !== null) {
        var s = i.next, d = s;
        do {
          if ((d.tag & e) === e) {
            var v = d.destroy;
            d.destroy = void 0, v !== void 0 && ((e & kt) !== Kn ? Tt(t) : (e & At) !== Kn && il(t), (e & Cr) !== Kn && Is(!0), Vf(t, r, v), (e & Cr) !== Kn && Is(!1), (e & kt) !== Kn ? ct() : (e & At) !== Kn && ft());
          }
          d = d.next;
        } while (d !== s);
      }
    }
    function Wl(e, t) {
      var r = t.updateQueue, l = r !== null ? r.lastEffect : null;
      if (l !== null) {
        var i = l.next, s = i;
        do {
          if ((s.tag & e) === e) {
            (e & kt) !== Kn ? nt(t) : (e & At) !== Kn && Lt(t);
            var d = s.create;
            (e & Cr) !== Kn && Is(!0), s.destroy = d(), (e & Cr) !== Kn && Is(!1), (e & kt) !== Kn ? pe() : (e & At) !== Kn && _n();
            {
              var v = s.destroy;
              if (v !== void 0 && typeof v != "function") {
                var p = void 0;
                (s.tag & At) !== b ? p = "useLayoutEffect" : (s.tag & Cr) !== b ? p = "useInsertionEffect" : p = "useEffect";
                var h = void 0;
                v === null ? h = " You returned null. If your effect does not require clean up, return undefined (or nothing)." : typeof v.then == "function" ? h = `

It looks like you wrote ` + p + `(async () => ...) or returned a Promise. Instead, write the async function inside your effect and call it immediately:

` + p + `(() => {
  async function fetchData() {
    // You can await here
    const response = await MyAPI.getData(someId);
    // ...
  }
  fetchData();
}, [someId]); // Or [] if effect doesn't need props or state

Learn more about data fetching with Hooks: https://reactjs.org/link/hooks-data-fetching` : h = " You returned: " + v, D("%s must not return anything besides a function, which is used for clean-up.%s", p, h);
              }
            }
          }
          s = s.next;
        } while (s !== i);
      }
    }
    function sg(e, t) {
      if ((t.flags & Ee) !== b)
        switch (t.tag) {
          case kn: {
            var r = t.stateNode.passiveEffectDuration, l = t.memoizedProps, i = l.id, s = l.onPostCommit, d = Vm(), v = t.alternate === null ? "mount" : "update";
            jm() && (v = "nested-update"), typeof s == "function" && s(i, v, r, d);
            var p = t.return;
            e: for (; p !== null; ) {
              switch (p.tag) {
                case De:
                  var h = p.stateNode;
                  h.passiveEffectDuration += r;
                  break e;
                case kn:
                  var y = p.stateNode;
                  y.passiveEffectDuration += r;
                  break e;
              }
              p = p.return;
            }
            break;
          }
        }
    }
    function cg(e, t, r, l) {
      if ((r.flags & su) !== b)
        switch (r.tag) {
          case Le:
          case _e:
          case we: {
            if (!$t)
              if (r.mode & Ue)
                try {
                  Ur(), Wl(At | Ft, r);
                } finally {
                  Nr(r);
                }
              else
                Wl(At | Ft, r);
            break;
          }
          case se: {
            var i = r.stateNode;
            if (r.flags & Ee && !$t)
              if (t === null)
                if (r.type === r.elementType && !Vu && (i.props !== r.memoizedProps && D("Expected %s props to match memoized props before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", ce(r) || "instance"), i.state !== r.memoizedState && D("Expected %s state to match memoized state before componentDidMount. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.", ce(r) || "instance")), r.mode & Ue)
                  try {
                    Ur(), i.componentDidMount();
                  } finally {
                    Nr(r);
                  }
                else
                  i.componentDidMount();
              else {
                var s = r.elementType === r.type ? t.memoizedProps : ka(r.type, t.memoizedProps), d = t.memoizedState;
                if (r.type === r.elementType && !Vu && (i.props !== r.memoizedProps && D("Expected %s props to match memoized props before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", ce(r) || "instance"), i.state !== r.memoizedState && D("Expected %s state to match memoized state before componentDidUpdate. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.", ce(r) || "instance")), r.mode & Ue)
                  try {
                    Ur(), i.componentDidUpdate(s, d, i.__reactInternalSnapshotBeforeUpdate);
                  } finally {
                    Nr(r);
                  }
                else
                  i.componentDidUpdate(s, d, i.__reactInternalSnapshotBeforeUpdate);
              }
            var v = r.updateQueue;
            v !== null && (r.type === r.elementType && !Vu && (i.props !== r.memoizedProps && D("Expected %s props to match memoized props before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.props`. Please file an issue.", ce(r) || "instance"), i.state !== r.memoizedState && D("Expected %s state to match memoized state before processing the update queue. This might either be because of a bug in React, or because a component reassigns its own `this.state`. Please file an issue.", ce(r) || "instance")), om(r, v, i));
            break;
          }
          case De: {
            var p = r.updateQueue;
            if (p !== null) {
              var h = null;
              if (r.child !== null)
                switch (r.child.tag) {
                  case ne:
                    h = ya(r.child.stateNode);
                    break;
                  case se:
                    h = r.child.stateNode;
                    break;
                }
              om(r, p, h);
            }
            break;
          }
          case ne: {
            var y = r.stateNode;
            if (t === null && r.flags & Ee) {
              var x = r.type, N = r.memoizedProps;
              gt(y, x, N, r);
            }
            break;
          }
          case Ye:
            break;
          case je:
            break;
          case kn: {
            {
              var H = r.memoizedProps, F = H.onCommit, L = H.onRender, P = r.stateNode.effectDuration, ae = Vm(), $ = t === null ? "mount" : "update";
              jm() && ($ = "nested-update"), typeof L == "function" && L(r.memoizedProps.id, $, r.actualDuration, r.treeBaseDuration, r.actualStartTime, ae);
              {
                typeof F == "function" && F(r.memoizedProps.id, $, P, ae), xE(r);
                var Ae = r.return;
                e: for (; Ae !== null; ) {
                  switch (Ae.tag) {
                    case De:
                      var Ce = Ae.stateNode;
                      Ce.effectDuration += P;
                      break e;
                    case kn:
                      var C = Ae.stateNode;
                      C.effectDuration += P;
                      break e;
                  }
                  Ae = Ae.return;
                }
              }
            }
            break;
          }
          case Qe: {
            gg(e, r);
            break;
          }
          case an:
          case ar:
          case rr:
          case Nt:
          case Vr:
          case lu:
            break;
          default:
            throw new Error("This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.");
        }
      $t || r.flags & Qr && Dh(r);
    }
    function fg(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          if (e.mode & Ue)
            try {
              Ur(), Rh(e, e.return);
            } finally {
              Nr(e);
            }
          else
            Rh(e, e.return);
          break;
        }
        case se: {
          var t = e.stateNode;
          typeof t.componentDidMount == "function" && rg(e, e.return, t), Th(e, e.return);
          break;
        }
        case ne: {
          Th(e, e.return);
          break;
        }
      }
    }
    function dg(e, t) {
      var r = null;
      if (En)
        for (var l = e; ; ) {
          if (l.tag === ne) {
            if (r === null) {
              r = l;
              try {
                var i = l.stateNode;
                t ? Nd(i) : ea(l.stateNode, l.memoizedProps);
              } catch (d) {
                Be(e, e.return, d);
              }
            }
          } else if (l.tag === Ye) {
            if (r === null)
              try {
                var s = l.stateNode;
                t ? Ud(s) : Qa(s, l.memoizedProps);
              } catch (d) {
                Be(e, e.return, d);
              }
          } else if (!((l.tag === Nt || l.tag === Vr) && l.memoizedState !== null && l !== e)) {
            if (l.child !== null) {
              l.child.return = l, l = l.child;
              continue;
            }
          }
          if (l === e)
            return;
          for (; l.sibling === null; ) {
            if (l.return === null || l.return === e)
              return;
            r === l && (r = null), l = l.return;
          }
          r === l && (r = null), l.sibling.return = l.return, l = l.sibling;
        }
    }
    function Dh(e) {
      var t = e.ref;
      if (t !== null) {
        var r = e.stateNode, l;
        switch (e.tag) {
          case ne:
            l = ya(r);
            break;
          default:
            l = r;
        }
        if (typeof t == "function") {
          var i;
          if (e.mode & Ue)
            try {
              Ur(), i = t(l);
            } finally {
              Nr(e);
            }
          else
            i = t(l);
          typeof i == "function" && D("Unexpected return value from a callback ref in %s. A callback ref should not return a function.", ce(e));
        } else
          t.hasOwnProperty("current") || D("Unexpected ref object provided for %s. Use either a ref-setter function or React.createRef().", ce(e)), t.current = l;
      }
    }
    function vg(e) {
      var t = e.alternate;
      t !== null && (t.return = null), e.return = null;
    }
    function zh(e) {
      var t = e.alternate;
      t !== null && (e.alternate = null, zh(t));
      {
        if (e.child = null, e.deletions = null, e.sibling = null, e.tag === ne) {
          var r = e.stateNode;
          r !== null && Ed(r);
        }
        e.stateNode = null, e._debugOwner = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
      }
    }
    function pg(e) {
      if ($u) {
        var t = e.stateNode, r = t.containerInfo, l = Yo(r);
        cr(r, l);
      }
    }
    function mg(e) {
      for (var t = e.return; t !== null; ) {
        if (Nh(t))
          return t;
        t = t.return;
      }
      throw new Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
    }
    function Nh(e) {
      return e.tag === ne || e.tag === De || e.tag === je;
    }
    function Uh(e) {
      var t = e;
      e: for (; ; ) {
        for (; t.sibling === null; ) {
          if (t.return === null || Nh(t.return))
            return null;
          t = t.return;
        }
        for (t.sibling.return = t.return, t = t.sibling; t.tag !== ne && t.tag !== Ye && t.tag !== Sl; ) {
          if (t.flags & it || t.child === null || t.tag === je)
            continue e;
          t.child.return = t, t = t.child;
        }
        if (!(t.flags & it))
          return t.stateNode;
      }
    }
    function hg(e) {
      if (En) {
        var t = mg(e);
        switch (t.tag) {
          case ne: {
            var r = t.stateNode;
            t.flags & uu && ($n(r), t.flags &= ~uu);
            var l = Uh(e);
            ip(e, l, r);
            break;
          }
          case De:
          case je: {
            var i = t.stateNode.containerInfo, s = Uh(e);
            up(e, s, i);
            break;
          }
          default:
            throw new Error("Invalid host parent fiber. This error is likely caused by a bug in React. Please file an issue.");
        }
      }
    }
    function up(e, t, r) {
      var l = e.tag, i = l === ne || l === Ye;
      if (i) {
        var s = e.stateNode;
        t ? wo(r, s, t) : Td(r, s);
      } else if (l !== je) {
        var d = e.child;
        if (d !== null) {
          up(d, t, r);
          for (var v = d.sibling; v !== null; )
            up(v, t, r), v = v.sibling;
        }
      }
    }
    function ip(e, t, r) {
      var l = e.tag, i = l === ne || l === Ye;
      if (i) {
        var s = e.stateNode;
        t ? Dd(r, s, t) : cc(r, s);
      } else if (l !== je) {
        var d = e.child;
        if (d !== null) {
          ip(d, t, r);
          for (var v = d.sibling; v !== null; )
            ip(v, t, r), v = v.sibling;
        }
      }
    }
    var en = null, er = !1;
    function yg(e, t, r) {
      if (En) {
        var l = t;
        e: for (; l !== null; ) {
          switch (l.tag) {
            case ne: {
              en = l.stateNode, er = !1;
              break e;
            }
            case De: {
              en = l.stateNode.containerInfo, er = !0;
              break e;
            }
            case je: {
              en = l.stateNode.containerInfo, er = !0;
              break e;
            }
          }
          l = l.return;
        }
        if (en === null)
          throw new Error("Expected to find a host parent. This error is likely caused by a bug in React. Please file an issue.");
        op(e, t, r), en = null, er = !1;
      } else
        op(e, t, r);
      vg(r);
    }
    function Mr(e, t, r) {
      for (var l = r.child; l !== null; )
        op(e, t, l), l = l.sibling;
    }
    function op(e, t, r) {
      switch (cs(r), r.tag) {
        case ne:
          $t || po(r, t);
        case Ye: {
          if (En) {
            var l = en, i = er;
            en = null, Mr(e, t, r), en = l, er = i, en !== null && (er ? ni(en, r.stateNode) : zd(en, r.stateNode));
          } else
            Mr(e, t, r);
          return;
        }
        case Sl: {
          En && en !== null && (er ? Ko(en, r.stateNode) : Xo(en, r.stateNode));
          return;
        }
        case je: {
          if (En) {
            var s = en, d = er;
            en = r.stateNode.containerInfo, er = !0, Mr(e, t, r), en = s, er = d;
          } else
            pg(r), Mr(e, t, r);
          return;
        }
        case Le:
        case _e:
        case In:
        case we: {
          if (!$t) {
            var v = r.updateQueue;
            if (v !== null) {
              var p = v.lastEffect;
              if (p !== null) {
                var h = p.next, y = h;
                do {
                  var x = y, N = x.destroy, H = x.tag;
                  N !== void 0 && ((H & Cr) !== Kn ? Vf(r, t, N) : (H & At) !== Kn && (il(r), r.mode & Ue ? (Ur(), Vf(r, t, N), Nr(r)) : Vf(r, t, N), ft())), y = y.next;
                } while (y !== h);
              }
            }
          }
          Mr(e, t, r);
          return;
        }
        case se: {
          if (!$t) {
            po(r, t);
            var F = r.stateNode;
            typeof F.componentWillUnmount == "function" && lp(r, t, F);
          }
          Mr(e, t, r);
          return;
        }
        case rr: {
          Mr(e, t, r);
          return;
        }
        case Nt: {
          if (
            // TODO: Remove this dead flag
            r.mode & he
          ) {
            var L = $t;
            $t = L || r.memoizedState !== null, Mr(e, t, r), $t = L;
          } else
            Mr(e, t, r);
          break;
        }
        default: {
          Mr(e, t, r);
          return;
        }
      }
    }
    function Sg(e) {
      e.memoizedState;
    }
    function gg(e, t) {
      if (Wt) {
        var r = t.memoizedState;
        if (r === null) {
          var l = t.alternate;
          if (l !== null) {
            var i = l.memoizedState;
            if (i !== null) {
              var s = i.dehydrated;
              s !== null && vc(s);
            }
          }
        }
      }
    }
    function _h(e) {
      var t = e.updateQueue;
      if (t !== null) {
        e.updateQueue = null;
        var r = e.stateNode;
        r === null && (r = e.stateNode = new tg()), t.forEach(function(l) {
          var i = UE.bind(null, e, l);
          if (!r.has(l)) {
            if (r.add(l), fn)
              if (fo !== null && vo !== null)
                ks(vo, fo);
              else
                throw Error("Expected finished root and lanes to be set. This is a bug in React.");
            l.then(i, i);
          }
        });
      }
    }
    function Eg(e, t, r) {
      fo = r, vo = e, Te(t), Mh(t, e), Te(t), fo = null, vo = null;
    }
    function tr(e, t, r) {
      var l = t.deletions;
      if (l !== null)
        for (var i = 0; i < l.length; i++) {
          var s = l[i];
          try {
            yg(e, t, s);
          } catch (p) {
            Be(s, t, p);
          }
        }
      var d = Pa();
      if (t.subtreeFlags & ou)
        for (var v = t.child; v !== null; )
          Te(v), Mh(v, e), v = v.sibling;
      Te(d);
    }
    function Mh(e, t, r) {
      var l = e.alternate, i = e.flags;
      switch (e.tag) {
        case Le:
        case _e:
        case In:
        case we: {
          if (tr(t, e), Hr(e), i & Ee) {
            try {
              $a(Cr | Ft, e, e.return), Wl(Cr | Ft, e);
            } catch (te) {
              Be(e, e.return, te);
            }
            if (e.mode & Ue) {
              try {
                Ur(), $a(At | Ft, e, e.return);
              } catch (te) {
                Be(e, e.return, te);
              }
              Nr(e);
            } else
              try {
                $a(At | Ft, e, e.return);
              } catch (te) {
                Be(e, e.return, te);
              }
          }
          return;
        }
        case se: {
          tr(t, e), Hr(e), i & Qr && l !== null && po(l, l.return);
          return;
        }
        case ne: {
          if (tr(t, e), Hr(e), i & Qr && l !== null && po(l, l.return), En) {
            if (e.flags & uu) {
              var s = e.stateNode;
              try {
                $n(s);
              } catch (te) {
                Be(e, e.return, te);
              }
            }
            if (i & Ee) {
              var d = e.stateNode;
              if (d != null) {
                var v = e.memoizedProps, p = l !== null ? l.memoizedProps : v, h = e.type, y = e.updateQueue;
                if (e.updateQueue = null, y !== null)
                  try {
                    Qo(d, y, h, p, v, e);
                  } catch (te) {
                    Be(e, e.return, te);
                  }
              }
            }
          }
          return;
        }
        case Ye: {
          if (tr(t, e), Hr(e), i & Ee && En) {
            if (e.stateNode === null)
              throw new Error("This should have a text node initialized. This error is likely caused by a bug in React. Please file an issue.");
            var x = e.stateNode, N = e.memoizedProps, H = l !== null ? l.memoizedProps : N;
            try {
              Cd(x, H, N);
            } catch (te) {
              Be(e, e.return, te);
            }
          }
          return;
        }
        case De: {
          if (tr(t, e), Hr(e), i & Ee) {
            if (En && Wt && l !== null) {
              var F = l.memoizedState;
              if (F.isDehydrated)
                try {
                  dc(t.containerInfo);
                } catch (te) {
                  Be(e, e.return, te);
                }
            }
            if ($u) {
              var L = t.containerInfo, P = t.pendingChildren;
              try {
                cr(L, P);
              } catch (te) {
                Be(e, e.return, te);
              }
            }
          }
          return;
        }
        case je: {
          if (tr(t, e), Hr(e), i & Ee && $u) {
            var ae = e.stateNode, $ = ae.containerInfo, Ae = ae.pendingChildren;
            try {
              cr($, Ae);
            } catch (te) {
              Be(e, e.return, te);
            }
          }
          return;
        }
        case Qe: {
          tr(t, e), Hr(e);
          var Ce = e.child;
          if (Ce.flags & wr) {
            var C = Ce.stateNode, _ = Ce.memoizedState, T = _ !== null;
            if (C.isHidden = T, T) {
              var V = Ce.alternate !== null && Ce.alternate.memoizedState !== null;
              V || vE();
            }
          }
          if (i & Ee) {
            try {
              Sg(e);
            } catch (te) {
              Be(e, e.return, te);
            }
            _h(e);
          }
          return;
        }
        case Nt: {
          var W = l !== null && l.memoizedState !== null;
          if (
            // TODO: Remove this dead flag
            e.mode & he
          ) {
            var K = $t;
            $t = K || W, tr(t, e), $t = K;
          } else
            tr(t, e);
          if (Hr(e), i & wr) {
            var ge = e.stateNode, ue = e.memoizedState, Ne = ue !== null, me = e;
            if (ge.isHidden = Ne, Ne && !W && (me.mode & he) !== I) {
              Z = me;
              for (var Ze = me.child; Ze !== null; )
                Z = Ze, Rg(Ze), Ze = Ze.sibling;
            }
            En && dg(me, Ne);
          }
          return;
        }
        case an: {
          tr(t, e), Hr(e), i & Ee && _h(e);
          return;
        }
        case rr:
          return;
        default: {
          tr(t, e), Hr(e);
          return;
        }
      }
    }
    function Hr(e) {
      var t = e.flags;
      if (t & it) {
        try {
          hg(e);
        } catch (r) {
          Be(e, e.return, r);
        }
        e.flags &= ~it;
      }
      t & ha && (e.flags &= ~ha);
    }
    function xg(e, t, r) {
      fo = r, vo = t, Z = e, Hh(e, t, r), fo = null, vo = null;
    }
    function Hh(e, t, r) {
      for (var l = (e.mode & he) !== I; Z !== null; ) {
        var i = Z, s = i.child;
        if (i.tag === Nt && l) {
          var d = i.memoizedState !== null, v = d || jf;
          if (v) {
            sp(e, t, r);
            continue;
          } else {
            var p = i.alternate, h = p !== null && p.memoizedState !== null, y = h || $t, x = jf, N = $t;
            jf = v, $t = y, $t && !N && (Z = i, Tg(i));
            for (var H = s; H !== null; )
              Z = H, Hh(
                H,
                // New root; bubble back up to here and stop.
                t,
                r
              ), H = H.sibling;
            Z = i, jf = x, $t = N, sp(e, t, r);
            continue;
          }
        }
        (i.subtreeFlags & su) !== b && s !== null ? (s.return = i, Z = s) : sp(e, t, r);
      }
    }
    function sp(e, t, r) {
      for (; Z !== null; ) {
        var l = Z;
        if ((l.flags & su) !== b) {
          var i = l.alternate;
          Te(l);
          try {
            cg(t, i, l, r);
          } catch (d) {
            Be(l, l.return, d);
          }
          de();
        }
        if (l === e) {
          Z = null;
          return;
        }
        var s = l.sibling;
        if (s !== null) {
          s.return = l.return, Z = s;
          return;
        }
        Z = l.return;
      }
    }
    function Rg(e) {
      for (; Z !== null; ) {
        var t = Z, r = t.child;
        switch (t.tag) {
          case Le:
          case _e:
          case In:
          case we: {
            if (t.mode & Ue)
              try {
                Ur(), $a(At, t, t.return);
              } finally {
                Nr(t);
              }
            else
              $a(At, t, t.return);
            break;
          }
          case se: {
            po(t, t.return);
            var l = t.stateNode;
            typeof l.componentWillUnmount == "function" && lp(t, t.return, l);
            break;
          }
          case ne: {
            po(t, t.return);
            break;
          }
          case Nt: {
            var i = t.memoizedState !== null;
            if (i) {
              Lh(e);
              continue;
            }
            break;
          }
        }
        r !== null ? (r.return = t, Z = r) : Lh(e);
      }
    }
    function Lh(e) {
      for (; Z !== null; ) {
        var t = Z;
        if (t === e) {
          Z = null;
          return;
        }
        var r = t.sibling;
        if (r !== null) {
          r.return = t.return, Z = r;
          return;
        }
        Z = t.return;
      }
    }
    function Tg(e) {
      for (; Z !== null; ) {
        var t = Z, r = t.child;
        if (t.tag === Nt) {
          var l = t.memoizedState !== null;
          if (l) {
            Oh(e);
            continue;
          }
        }
        r !== null ? (r.return = t, Z = r) : Oh(e);
      }
    }
    function Oh(e) {
      for (; Z !== null; ) {
        var t = Z;
        Te(t);
        try {
          fg(t);
        } catch (l) {
          Be(t, t.return, l);
        }
        if (de(), t === e) {
          Z = null;
          return;
        }
        var r = t.sibling;
        if (r !== null) {
          r.return = t.return, Z = r;
          return;
        }
        Z = t.return;
      }
    }
    function Cg(e, t, r, l) {
      Z = t, Dg(t, e, r, l);
    }
    function Dg(e, t, r, l) {
      for (; Z !== null; ) {
        var i = Z, s = i.child;
        (i.subtreeFlags & Tl) !== b && s !== null ? (s.return = i, Z = s) : zg(e, t, r, l);
      }
    }
    function zg(e, t, r, l) {
      for (; Z !== null; ) {
        var i = Z;
        if ((i.flags & ja) !== b) {
          Te(i);
          try {
            Ng(t, i, r, l);
          } catch (d) {
            Be(i, i.return, d);
          }
          de();
        }
        if (i === e) {
          Z = null;
          return;
        }
        var s = i.sibling;
        if (s !== null) {
          s.return = i.return, Z = s;
          return;
        }
        Z = i.return;
      }
    }
    function Ng(e, t, r, l) {
      switch (t.tag) {
        case Le:
        case _e:
        case we: {
          if (t.mode & Ue) {
            Nv();
            try {
              Wl(kt | Ft, t);
            } finally {
              zv(t);
            }
          } else
            Wl(kt | Ft, t);
          break;
        }
      }
    }
    function Ug(e) {
      Z = e, _g();
    }
    function _g() {
      for (; Z !== null; ) {
        var e = Z, t = e.child;
        if ((Z.flags & ur) !== b) {
          var r = e.deletions;
          if (r !== null) {
            for (var l = 0; l < r.length; l++) {
              var i = r[l];
              Z = i, Lg(i, e);
            }
            {
              var s = e.alternate;
              if (s !== null) {
                var d = s.child;
                if (d !== null) {
                  s.child = null;
                  do {
                    var v = d.sibling;
                    d.sibling = null, d = v;
                  } while (d !== null);
                }
              }
            }
            Z = e;
          }
        }
        (e.subtreeFlags & Tl) !== b && t !== null ? (t.return = e, Z = t) : Mg();
      }
    }
    function Mg() {
      for (; Z !== null; ) {
        var e = Z;
        (e.flags & ja) !== b && (Te(e), Hg(e), de());
        var t = e.sibling;
        if (t !== null) {
          t.return = e.return, Z = t;
          return;
        }
        Z = e.return;
      }
    }
    function Hg(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          e.mode & Ue ? (Nv(), $a(kt | Ft, e, e.return), zv(e)) : $a(kt | Ft, e, e.return);
          break;
        }
      }
    }
    function Lg(e, t) {
      for (; Z !== null; ) {
        var r = Z;
        Te(r), Fg(r, t), de();
        var l = r.child;
        l !== null ? (l.return = r, Z = l) : Og(e);
      }
    }
    function Og(e) {
      for (; Z !== null; ) {
        var t = Z, r = t.sibling, l = t.return;
        if (zh(t), t === e) {
          Z = null;
          return;
        }
        if (r !== null) {
          r.return = l, Z = r;
          return;
        }
        Z = l;
      }
    }
    function Fg(e, t) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          e.mode & Ue ? (Nv(), $a(kt, e, t), zv(e)) : $a(kt, e, t);
          break;
        }
      }
    }
    function Ag(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          try {
            Wl(At | Ft, e);
          } catch (r) {
            Be(e, e.return, r);
          }
          break;
        }
        case se: {
          var t = e.stateNode;
          try {
            t.componentDidMount();
          } catch (r) {
            Be(e, e.return, r);
          }
          break;
        }
      }
    }
    function jg(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          try {
            Wl(kt | Ft, e);
          } catch (t) {
            Be(e, e.return, t);
          }
          break;
        }
      }
    }
    function Vg(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we: {
          try {
            $a(At | Ft, e, e.return);
          } catch (r) {
            Be(e, e.return, r);
          }
          break;
        }
        case se: {
          var t = e.stateNode;
          typeof t.componentWillUnmount == "function" && lp(e, e.return, t);
          break;
        }
      }
    }
    function Bg(e) {
      switch (e.tag) {
        case Le:
        case _e:
        case we:
          try {
            $a(kt | Ft, e, e.return);
          } catch (t) {
            Be(e, e.return, t);
          }
      }
    }
    var Bf = 0, Qf = 1, wf = 2, qf = 3, Yf = 4;
    if (typeof Symbol == "function" && Symbol.for) {
      var qs = Symbol.for;
      Bf = qs("selector.component"), Qf = qs("selector.has_pseudo_class"), wf = qs("selector.role"), qf = qs("selector.test_id"), Yf = qs("selector.text");
    }
    function Qg(e) {
      return {
        $$typeof: Bf,
        value: e
      };
    }
    function wg(e) {
      return {
        $$typeof: Qf,
        value: e
      };
    }
    function qg(e) {
      return {
        $$typeof: wf,
        value: e
      };
    }
    function Yg(e) {
      return {
        $$typeof: Yf,
        value: e
      };
    }
    function Gg(e) {
      return {
        $$typeof: qf,
        value: e
      };
    }
    function cp(e) {
      var t = ei(e);
      if (t != null) {
        if (typeof t.memoizedProps["data-testname"] != "string")
          throw new Error("Invalid host root specified. Should be either a React container or a node with a testname attribute.");
        return t;
      } else {
        var r = Vo(e);
        if (r === null)
          throw new Error("Could not find React container within specified host subtree.");
        return r.stateNode.current;
      }
    }
    function fp(e, t) {
      switch (t.$$typeof) {
        case Bf:
          if (e.type === t.value)
            return !0;
          break;
        case Qf:
          return Jg(e, t.value);
        case wf:
          if (e.tag === ne) {
            var r = e.stateNode;
            if (ze(r, t.value))
              return !0;
          }
          break;
        case Yf:
          if (e.tag === ne || e.tag === Ye) {
            var l = Rd(e);
            if (l !== null && l.indexOf(t.value) >= 0)
              return !0;
          }
          break;
        case qf:
          if (e.tag === ne) {
            var i = e.memoizedProps["data-testname"];
            if (typeof i == "string" && i.toLowerCase() === t.value.toLowerCase())
              return !0;
          }
          break;
        default:
          throw new Error("Invalid selector type specified.");
      }
      return !1;
    }
    function dp(e) {
      switch (e.$$typeof) {
        case Bf:
          var t = Oe(e.value) || "Unknown";
          return "<" + t + ">";
        case Qf:
          return ":has(" + (dp(e) || "") + ")";
        case wf:
          return '[role="' + e.value + '"]';
        case Yf:
          return '"' + e.value + '"';
        case qf:
          return '[data-testname="' + e.value + '"]';
        default:
          throw new Error("Invalid selector type specified.");
      }
    }
    function Fh(e, t) {
      for (var r = [], l = [e, 0], i = 0; i < l.length; ) {
        var s = l[i++], d = l[i++], v = t[d];
        if (!(s.tag === ne && Xr(s))) {
          for (; v != null && fp(s, v); )
            d++, v = t[d];
          if (d === t.length)
            r.push(s);
          else
            for (var p = s.child; p !== null; )
              l.push(p, d), p = p.sibling;
        }
      }
      return r;
    }
    function Jg(e, t) {
      for (var r = [e, 0], l = 0; l < r.length; ) {
        var i = r[l++], s = r[l++], d = t[s];
        if (!(i.tag === ne && Xr(i))) {
          for (; d != null && fp(i, d); )
            s++, d = t[s];
          if (s === t.length)
            return !0;
          for (var v = i.child; v !== null; )
            r.push(v, s), v = v.sibling;
        }
      }
      return !1;
    }
    function Gf(e, t) {
      if (!Jr)
        throw new Error("Test selector API is not supported by this renderer.");
      for (var r = cp(e), l = Fh(r, t), i = [], s = Array.from(l), d = 0; d < s.length; ) {
        var v = s[d++];
        if (v.tag === ne) {
          if (Xr(v))
            continue;
          i.push(v.stateNode);
        } else
          for (var p = v.child; p !== null; )
            s.push(p), p = p.sibling;
      }
      return i;
    }
    function Xg(e, t) {
      if (!Jr)
        throw new Error("Test selector API is not supported by this renderer.");
      for (var r = cp(e), l = 0, i = [], s = [r, 0], d = 0; d < s.length; ) {
        var v = s[d++], p = s[d++], h = t[p];
        if (!(v.tag === ne && Xr(v)) && (fp(v, h) && (i.push(dp(h)), p++, p > l && (l = p)), p < t.length))
          for (var y = v.child; y !== null; )
            s.push(y, p), y = y.sibling;
      }
      if (l < t.length) {
        for (var x = [], N = l; N < t.length; N++)
          x.push(dp(t[N]));
        return `findAllNodes was able to match part of the selector:
` + ("  " + i.join(" > ") + `

`) + `No matching component was found for:
` + ("  " + x.join(" > "));
      }
      return null;
    }
    function Kg(e, t) {
      if (!Jr)
        throw new Error("Test selector API is not supported by this renderer.");
      for (var r = Gf(e, t), l = [], i = 0; i < r.length; i++)
        l.push(fu(r[i]));
      for (var s = l.length - 1; s > 0; s--)
        for (var d = l[s], v = d.x, p = v + d.width, h = d.y, y = h + d.height, x = s - 1; x >= 0; x--)
          if (s !== x) {
            var N = l[x], H = N.x, F = H + N.width, L = N.y, P = L + N.height;
            if (v >= H && h >= L && p <= F && y <= P) {
              l.splice(s, 1);
              break;
            } else if (v === H && d.width === N.width && !(P < h) && !(L > y)) {
              L > h && (N.height += L - h, N.y = h), P < y && (N.height = y - L), l.splice(s, 1);
              break;
            } else if (h === L && d.height === N.height && !(F < v) && !(H > p)) {
              H > v && (N.width += H - v, N.x = v), F < p && (N.width = p - H), l.splice(s, 1);
              break;
            }
          }
      return l;
    }
    function Zg(e, t) {
      if (!Jr)
        throw new Error("Test selector API is not supported by this renderer.");
      for (var r = cp(e), l = Fh(r, t), i = Array.from(l), s = 0; s < i.length; ) {
        var d = i[s++];
        if (!Xr(d)) {
          if (d.tag === ne) {
            var v = d.stateNode;
            if (sc(v))
              return !0;
          }
          for (var p = d.child; p !== null; )
            i.push(p), p = p.sibling;
        }
      }
      return !1;
    }
    var Jf = [];
    function Pg() {
      Jr && Jf.forEach(function(e) {
        return e();
      });
    }
    function Wg(e, t, r, l) {
      if (!Jr)
        throw new Error("Test selector API is not supported by this renderer.");
      var i = Gf(e, t), s = Bo(i, r, l), d = s.disconnect, v = s.observe, p = s.unobserve, h = function() {
        var y = Gf(e, t);
        i.forEach(function(x) {
          y.indexOf(x) < 0 && p(x);
        }), y.forEach(function(x) {
          i.indexOf(x) < 0 && v(x);
        });
      };
      return Jf.push(h), {
        disconnect: function() {
          var y = Jf.indexOf(h);
          y >= 0 && Jf.splice(y, 1), d();
        }
      };
    }
    var bg = lt.ReactCurrentActQueue;
    function kg(e) {
      {
        var t = (
          // $FlowExpectedError – Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
          typeof IS_REACT_ACT_ENVIRONMENT < "u" ? IS_REACT_ACT_ENVIRONMENT : void 0
        ), r = typeof jest < "u";
        return gd && r && t !== !1;
      }
    }
    function Ah() {
      {
        var e = (
          // $FlowExpectedError – Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
          typeof IS_REACT_ACT_ENVIRONMENT < "u" ? IS_REACT_ACT_ENVIRONMENT : void 0
        );
        return !e && bg.current !== null && D("The current testing environment is not configured to support act(...)"), e;
      }
    }
    var Ig = Math.ceil, vp = lt.ReactCurrentDispatcher, pp = lt.ReactCurrentOwner, at = lt.ReactCurrentBatchConfig, nr = lt.ReactCurrentActQueue, Dt = (
      /*             */
      0
    ), mp = (
      /*               */
      1
    ), tn = (
      /*                */
      2
    ), Ma = (
      /*                */
      4
    ), ml = 0, Ys = 1, Bu = 2, Xf = 3, Gs = 4, jh = 5, hp = 6, ve = Dt, Fn = null, rt = null, Bt = O, Lr = O, yp = Me(O), Qt = ml, Js = null, Kf = O, Xs = O, Zf = O, Ks = null, Zn = null, Sp = 0, Vh = 500, Bh = 1 / 0, $g = 500, hl = null;
    function mo() {
      Bh = ot() + $g;
    }
    function Qh() {
      return Bh;
    }
    var Pf = !1, gp = null, ho = null, Qu = !1, bl = null, Zs = O, Ep = [], xp = null, eE = 50, Ps = 0, Rp = null, Tp = !1, Wf = !1, tE = 50, yo = 0, bf = null, Ws = Ve, kf = O, wh = !1;
    function If() {
      return Fn;
    }
    function yn() {
      return (ve & (tn | Ma)) !== Dt ? ot() : (Ws !== Ve || (Ws = ot()), Ws);
    }
    function kl(e) {
      var t = e.mode;
      if ((t & he) === I)
        return ee;
      if ((ve & tn) !== Dt && Bt !== O)
        return Al(Bt);
      var r = f() !== c;
      if (r) {
        if (at.transition !== null) {
          var l = at.transition;
          l._updatedFibers || (l._updatedFibers = /* @__PURE__ */ new Set()), l._updatedFibers.add(e);
        }
        return kf === et && (kf = Fi()), kf;
      }
      var i = bt();
      if (i !== et)
        return i;
      var s = ti();
      return s;
    }
    function nE(e) {
      var t = e.mode;
      return (t & he) === I ? ee : Ai();
    }
    function zt(e, t, r, l) {
      ME(), wh && D("useInsertionEffect must not schedule updates."), Tp && (Wf = !0), Sr(e, r, l), (ve & tn) !== O && e === Fn ? OE(t) : (fn && Ru(e, t, r), FE(t), e === Fn && ((ve & tn) === Dt && (Xs = fe(Xs, r)), Qt === Gs && Il(e, Bt)), Pn(e, l), r === ee && ve === Dt && (t.mode & he) === I && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
      !nr.isBatchingLegacy && (mo(), _u()));
    }
    function aE(e, t, r) {
      var l = e.current;
      l.lanes = t, Sr(e, t, r), Pn(e, r);
    }
    function rE(e) {
      return (
        // TODO: Remove outdated deferRenderPhaseUpdateToNextBatch experiment. We
        // decided not to enable it.
        (ve & tn) !== Dt
      );
    }
    function Pn(e, t) {
      var r = e.callbackNode;
      Uc(e, t);
      var l = Rt(e, e === Fn ? Bt : O);
      if (l === O) {
        r !== null && ty(r), e.callbackNode = null, e.callbackPriority = et;
        return;
      }
      var i = al(l), s = e.callbackPriority;
      if (s === i && // Special case related to `act`. If the currently scheduled task is a
      // Scheduler task, rather than an `act` task, cancel it and re-scheduled
      // on the `act` queue.
      !(nr.current !== null && r !== _p)) {
        r == null && s !== ee && D("Expected scheduled callback to exist. This error is likely caused by a bug in React. Please file an issue.");
        return;
      }
      r != null && ty(r);
      var d;
      if (i === ee)
        e.tag === Ra ? (nr.isBatchingLegacy !== null && (nr.didScheduleLegacyUpdate = !0), Pi(Gh.bind(null, e))) : Zi(Gh.bind(null, e)), xd ? nr.current !== null ? nr.current.push(Xe) : jo(function() {
          (ve & (tn | Ma)) === Dt && Xe();
        }) : rd(Cu, Xe), d = null;
      else {
        var v;
        switch (Qi(l)) {
          case q:
            v = Cu;
            break;
          case Ta:
            v = Jn;
            break;
          case rl:
            v = ll;
            break;
          case Bi:
            v = ca;
            break;
          default:
            v = ll;
            break;
        }
        d = rd(v, qh.bind(null, e));
      }
      e.callbackPriority = i, e.callbackNode = d;
    }
    function qh(e, t) {
      if (sS(), Ws = Ve, kf = O, (ve & (tn | Ma)) !== Dt)
        throw new Error("Should not already be working.");
      var r = e.callbackNode, l = Or();
      if (l && e.callbackNode !== r)
        return null;
      var i = Rt(e, e === Fn ? Bt : O);
      if (i === O)
        return null;
      var s = !Fl(e, i) && !rs(e, i) && !t, d = s ? SE(e, i) : td(e, i);
      if (d !== ml) {
        if (d === Bu) {
          var v = Hi(e);
          v !== O && (i = v, d = Cp(e, v));
        }
        if (d === Ys) {
          var p = Js;
          throw wu(e, O), Il(e, i), Pn(e, ot()), p;
        }
        if (d === hp)
          Il(e, i);
        else {
          var h = !Fl(e, i), y = e.current.alternate;
          if (h && !uE(y)) {
            if (d = td(e, i), d === Bu) {
              var x = Hi(e);
              x !== O && (i = x, d = Cp(e, x));
            }
            if (d === Ys) {
              var N = Js;
              throw wu(e, O), Il(e, i), Pn(e, ot()), N;
            }
          }
          e.finishedWork = y, e.finishedLanes = i, lE(e, d, i);
        }
      }
      return Pn(e, ot()), e.callbackNode === r ? qh.bind(null, e) : null;
    }
    function Cp(e, t) {
      var r = Ks;
      if (Ja(e)) {
        var l = wu(e, t);
        l.flags |= ma, si(e.containerInfo);
      }
      var i = td(e, t);
      if (i !== Bu) {
        var s = Zn;
        Zn = r, s !== null && Yh(s);
      }
      return i;
    }
    function Yh(e) {
      Zn === null ? Zn = e : Zn.push.apply(Zn, e);
    }
    function lE(e, t, r) {
      switch (t) {
        case ml:
        case Ys:
          throw new Error("Root did not complete. This is a bug in React.");
        case Bu: {
          qu(e, Zn, hl);
          break;
        }
        case Xf: {
          if (Il(e, r), Oi(r) && // do not delay if we're inside an act() scope
          !ny()) {
            var l = Sp + Vh - ot();
            if (l > 10) {
              var i = Rt(e, O);
              if (i !== O)
                break;
              var s = e.suspendedLanes;
              if (!cn(s, r)) {
                yn(), Vl(e, s);
                break;
              }
              e.timeoutHandle = Ao(qu.bind(null, e, Zn, hl), l);
              break;
            }
          }
          qu(e, Zn, hl);
          break;
        }
        case Gs: {
          if (Il(e, r), Hc(r))
            break;
          if (!ny()) {
            var d = zc(e, r), v = d, p = ot() - v, h = _E(p) - p;
            if (h > 10) {
              e.timeoutHandle = Ao(qu.bind(null, e, Zn, hl), h);
              break;
            }
          }
          qu(e, Zn, hl);
          break;
        }
        case jh: {
          qu(e, Zn, hl);
          break;
        }
        default:
          throw new Error("Unknown root exit status.");
      }
    }
    function uE(e) {
      for (var t = e; ; ) {
        if (t.flags & No) {
          var r = t.updateQueue;
          if (r !== null) {
            var l = r.stores;
            if (l !== null)
              for (var i = 0; i < l.length; i++) {
                var s = l[i], d = s.getSnapshot, v = s.value;
                try {
                  if (!Xt(d(), v))
                    return !1;
                } catch {
                  return !1;
                }
              }
          }
        }
        var p = t.child;
        if (t.subtreeFlags & No && p !== null) {
          p.return = t, t = p;
          continue;
        }
        if (t === e)
          return !0;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e)
            return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
      return !0;
    }
    function Il(e, t) {
      t = Nn(t, Zf), t = Nn(t, Xs), Lc(e, t);
    }
    function Gh(e) {
      if (cS(), (ve & (tn | Ma)) !== Dt)
        throw new Error("Should not already be working.");
      Or();
      var t = Rt(e, O);
      if (!Gt(t, ee))
        return Pn(e, ot()), null;
      var r = td(e, t);
      if (e.tag !== Ra && r === Bu) {
        var l = Hi(e);
        l !== O && (t = l, r = Cp(e, l));
      }
      if (r === Ys) {
        var i = Js;
        throw wu(e, O), Il(e, t), Pn(e, ot()), i;
      }
      if (r === hp)
        throw new Error("Root did not complete. This is a bug in React.");
      var s = e.current.alternate;
      return e.finishedWork = s, e.finishedLanes = t, qu(e, Zn, hl), Pn(e, ot()), null;
    }
    function iE(e, t) {
      t !== O && (is(e, fe(t, ee)), Pn(e, ot()), (ve & (tn | Ma)) === Dt && (mo(), Xe()));
    }
    function oE(e) {
      var t = bt(), r = at.transition;
      try {
        return at.transition = null, tt(rl), e();
      } finally {
        tt(t), at.transition = r;
      }
    }
    function sE(e, t) {
      var r = ve;
      ve |= mp;
      try {
        return e(t);
      } finally {
        ve = r, ve === Dt && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
        !nr.isBatchingLegacy && (mo(), _u());
      }
    }
    function cE(e, t, r, l, i) {
      var s = bt(), d = at.transition;
      try {
        return at.transition = null, tt(q), e(t, r, l, i);
      } finally {
        tt(s), at.transition = d, ve === Dt && mo();
      }
    }
    function $f(e) {
      bl !== null && bl.tag === Ra && (ve & (tn | Ma)) === Dt && Or();
      var t = ve;
      ve |= mp;
      var r = at.transition, l = bt();
      try {
        return at.transition = null, tt(q), e ? e() : void 0;
      } finally {
        tt(l), at.transition = r, ve = t, (ve & (tn | Ma)) === Dt && Xe();
      }
    }
    function fE() {
      return (ve & (tn | Ma)) !== Dt;
    }
    function dE(e) {
      var t = ve;
      ve |= mp;
      var r = at.transition, l = bt();
      try {
        at.transition = null, tt(q), e();
      } finally {
        tt(l), at.transition = r, ve = t, ve === Dt && (mo(), Xe());
      }
    }
    function ed(e, t) {
      mt(yp, Lr, e), Lr = fe(Lr, t);
    }
    function Dp(e) {
      Lr = yp.current, pt(yp, e);
    }
    function wu(e, t) {
      e.finishedWork = null, e.finishedLanes = O;
      var r = e.timeoutHandle;
      if (r !== Iu && (e.timeoutHandle = Iu, ku(r)), rt !== null)
        for (var l = rt.return; l !== null; ) {
          var i = l.alternate;
          hh(i, l), l = l.return;
        }
      Fn = e;
      var s = Yu(e.current, null);
      return rt = s, Bt = Lr = t, Qt = ml, Js = null, Kf = O, Xs = O, Zf = O, Ks = null, Zn = null, Jy(), S.discardPendingWarnings(), s;
    }
    function Jh(e, t) {
      do {
        var r = rt;
        try {
          if (Ic(), vm(), de(), pp.current = null, r === null || r.return === null) {
            Qt = Ys, Js = t, rt = null;
            return;
          }
          if (pa && r.mode & Ue && Uf(r, !0), Xu)
            if (Er(), t !== null && typeof t == "object" && typeof t.then == "function") {
              var l = t;
              ol(r, l, Bt);
            } else
              zu(r, t, Bt);
          gS(e, r.return, r, t, Bt), Ph(r);
        } catch (i) {
          t = i, rt === r && r !== null ? (r = r.return, rt = r) : r = rt;
          continue;
        }
        return;
      } while (!0);
    }
    function Xh() {
      var e = vp.current;
      return vp.current = Tf, e === null ? Tf : e;
    }
    function Kh(e) {
      vp.current = e;
    }
    function vE() {
      Sp = ot();
    }
    function bs(e) {
      Kf = fe(e, Kf);
    }
    function pE() {
      Qt === ml && (Qt = Xf);
    }
    function zp() {
      (Qt === ml || Qt === Xf || Qt === Bu) && (Qt = Gs), Fn !== null && (Li(Kf) || Li(Xs)) && Il(Fn, Bt);
    }
    function mE(e) {
      Qt !== Gs && (Qt = Bu), Ks === null ? Ks = [e] : Ks.push(e);
    }
    function hE() {
      return Qt === ml;
    }
    function td(e, t) {
      var r = ve;
      ve |= tn;
      var l = Xh();
      if (Fn !== e || Bt !== t) {
        if (fn) {
          var i = e.memoizedUpdaters;
          i.size > 0 && (ks(e, Bt), i.clear()), _t(e, t);
        }
        hl = Oc(), wu(e, t);
      }
      Xi(t);
      do
        try {
          yE();
          break;
        } catch (s) {
          Jh(e, s);
        }
      while (!0);
      if (Ic(), ve = r, Kh(l), rt !== null)
        throw new Error("Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.");
      return Da(), Fn = null, Bt = O, Qt;
    }
    function yE() {
      for (; rt !== null; )
        Zh(rt);
    }
    function SE(e, t) {
      var r = ve;
      ve |= tn;
      var l = Xh();
      if (Fn !== e || Bt !== t) {
        if (fn) {
          var i = e.memoizedUpdaters;
          i.size > 0 && (ks(e, Bt), i.clear()), _t(e, t);
        }
        hl = Oc(), mo(), wu(e, t);
      }
      Xi(t);
      do
        try {
          gE();
          break;
        } catch (s) {
          Jh(e, s);
        }
      while (!0);
      return Ic(), Kh(l), ve = r, rt !== null ? (ps(), ml) : (Da(), Fn = null, Bt = O, Qt);
    }
    function gE() {
      for (; rt !== null && !sa(); )
        Zh(rt);
    }
    function Zh(e) {
      var t = e.alternate;
      Te(e);
      var r;
      (e.mode & Ue) !== I ? (Dv(e), r = Np(t, e, Lr), Uf(e, !0)) : r = Np(t, e, Lr), de(), e.memoizedProps = e.pendingProps, r === null ? Ph(e) : rt = r, pp.current = null;
    }
    function Ph(e) {
      var t = e;
      do {
        var r = t.alternate, l = t.return;
        if ((t.flags & iu) === b) {
          Te(t);
          var i = void 0;
          if ((t.mode & Ue) === I ? i = mh(r, t, Lr) : (Dv(t), i = mh(r, t, Lr), Uf(t, !1)), de(), i !== null) {
            rt = i;
            return;
          }
        } else {
          var s = kS(r, t);
          if (s !== null) {
            s.flags &= md, rt = s;
            return;
          }
          if ((t.mode & Ue) !== I) {
            Uf(t, !1);
            for (var d = t.actualDuration, v = t.child; v !== null; )
              d += v.actualDuration, v = v.sibling;
            t.actualDuration = d;
          }
          if (l !== null)
            l.flags |= iu, l.subtreeFlags = b, l.deletions = null;
          else {
            Qt = hp, rt = null;
            return;
          }
        }
        var p = t.sibling;
        if (p !== null) {
          rt = p;
          return;
        }
        t = l, rt = t;
      } while (t !== null);
      Qt === ml && (Qt = jh);
    }
    function qu(e, t, r) {
      var l = bt(), i = at.transition;
      try {
        at.transition = null, tt(q), EE(e, t, r, l);
      } finally {
        at.transition = i, tt(l);
      }
      return null;
    }
    function EE(e, t, r, l) {
      do
        Or();
      while (bl !== null);
      if (HE(), (ve & (tn | Ma)) !== Dt)
        throw new Error("Should not already be working.");
      var i = e.finishedWork, s = e.finishedLanes;
      if (ds(s), i === null)
        return Bc(), null;
      if (s === O && D("root.finishedLanes should not be empty during a commit. This is a bug in React."), e.finishedWork = null, e.finishedLanes = O, i === e.current)
        throw new Error("Cannot commit the same tree as before. This error is likely caused by a bug in React. Please file an issue.");
      e.callbackNode = null, e.callbackPriority = et;
      var d = fe(i.lanes, i.childLanes);
      Jt(e, d), e === Fn && (Fn = null, rt = null, Bt = O), ((i.subtreeFlags & Tl) !== b || (i.flags & Tl) !== b) && (Qu || (Qu = !0, xp = r, rd(ll, function() {
        return Or(), null;
      })));
      var v = (i.subtreeFlags & (Ho | ou | su | Tl)) !== b, p = (i.flags & (Ho | ou | su | Tl)) !== b;
      if (v || p) {
        var h = at.transition;
        at.transition = null;
        var y = bt();
        tt(q);
        var x = ve;
        ve |= Ma, pp.current = null, lg(e, i), Bm(), Eg(e, i, s), wt(e.containerInfo), e.current = i, Ji(s), xg(i, e, s), vs(), Ca(), ve = x, tt(y), at.transition = h;
      } else
        e.current = i, Bm();
      var N = Qu;
      if (Qu ? (Qu = !1, bl = e, Zs = s) : (yo = 0, bf = null), d = e.pendingLanes, d === O && (ho = null), N || Ih(e.current, !1), Gi(i.stateNode, l), fn && e.memoizedUpdaters.clear(), Pg(), Pn(e, ot()), t !== null)
        for (var H = e.onRecoverableError, F = 0; F < t.length; F++) {
          var L = t[F], P = L.stack, ae = L.digest;
          H(L.value, {
            componentStack: P,
            digest: ae
          });
        }
      if (Pf) {
        Pf = !1;
        var $ = gp;
        throw gp = null, $;
      }
      return Gt(Zs, ee) && e.tag !== Ra && Or(), d = e.pendingLanes, Gt(d, ee) ? (oS(), e === Rp ? Ps++ : (Ps = 0, Rp = e)) : Ps = 0, Xe(), Bc(), null;
    }
    function Or() {
      if (bl !== null) {
        var e = Qi(Zs), t = Ac(rl, e), r = at.transition, l = bt();
        try {
          return at.transition = null, tt(t), RE();
        } finally {
          tt(l), at.transition = r;
        }
      }
      return !1;
    }
    function xE(e) {
      Ep.push(e), Qu || (Qu = !0, rd(ll, function() {
        return Or(), null;
      }));
    }
    function RE() {
      if (bl === null)
        return !1;
      var e = xp;
      xp = null;
      var t = bl, r = Zs;
      if (bl = null, Zs = O, (ve & (tn | Ma)) !== Dt)
        throw new Error("Cannot flush passive effects while already rendering.");
      Tp = !0, Wf = !1, Nu(r);
      var l = ve;
      ve |= Ma, Ug(t.current), Cg(t, t.current, r, e);
      {
        var i = Ep;
        Ep = [];
        for (var s = 0; s < i.length; s++) {
          var d = i[s];
          sg(t, d);
        }
      }
      dn(), Ih(t.current, !0), ve = l, Xe(), Wf ? t === bf ? yo++ : (yo = 0, bf = t) : yo = 0, Tp = !1, Wf = !1, Du(t);
      {
        var v = t.current.stateNode;
        v.effectDuration = 0, v.passiveEffectDuration = 0;
      }
      return !0;
    }
    function Wh(e) {
      return ho !== null && ho.has(e);
    }
    function TE(e) {
      ho === null ? ho = /* @__PURE__ */ new Set([e]) : ho.add(e);
    }
    function CE(e) {
      Pf || (Pf = !0, gp = e);
    }
    var DE = CE;
    function bh(e, t, r) {
      var l = ju(r, t), i = Km(e, l, ee), s = Jl(e, i, ee), d = yn();
      s !== null && (Sr(s, ee, d), Pn(s, d));
    }
    function Be(e, t, r) {
      if (ng(r), Is(!1), e.tag === De) {
        bh(e, e, r);
        return;
      }
      var l = null;
      for (l = t; l !== null; ) {
        if (l.tag === De) {
          bh(l, e, r);
          return;
        } else if (l.tag === se) {
          var i = l.type, s = l.stateNode;
          if (typeof i.getDerivedStateFromError == "function" || typeof s.componentDidCatch == "function" && !Wh(s)) {
            var d = ju(r, e), v = Gv(l, d, ee), p = Jl(l, v, ee), h = yn();
            p !== null && (Sr(p, ee, h), Pn(p, h));
            return;
          }
        }
        l = l.return;
      }
      D(`Internal React error: Attempted to capture a commit phase error inside a detached tree. This indicates a bug in React. Likely causes include deleting the same fiber more than once, committing an already-finished tree, or an inconsistent return pointer.

Error message:

%s`, r);
    }
    function zE(e, t, r) {
      var l = e.pingCache;
      l !== null && l.delete(t);
      var i = yn();
      Vl(e, r), AE(e), Fn === e && cn(Bt, r) && (Qt === Gs || Qt === Xf && Oi(Bt) && ot() - Sp < Vh ? wu(e, O) : Zf = fe(Zf, r)), Pn(e, i);
    }
    function kh(e, t) {
      t === et && (t = nE(e));
      var r = yn(), l = Ln(e, t);
      l !== null && (Sr(l, t, r), Pn(l, r));
    }
    function NE(e) {
      var t = e.memoizedState, r = et;
      t !== null && (r = t.retryLane), kh(e, r);
    }
    function UE(e, t) {
      var r = et, l;
      switch (e.tag) {
        case Qe:
          l = e.stateNode;
          var i = e.memoizedState;
          i !== null && (r = i.retryLane);
          break;
        case an:
          l = e.stateNode;
          break;
        default:
          throw new Error("Pinged unknown suspense boundary type. This is probably a bug in React.");
      }
      l !== null && l.delete(t), kh(e, r);
    }
    function _E(e) {
      return e < 120 ? 120 : e < 480 ? 480 : e < 1080 ? 1080 : e < 1920 ? 1920 : e < 3e3 ? 3e3 : e < 4320 ? 4320 : Ig(e / 1960) * 1960;
    }
    function ME() {
      if (Ps > eE)
        throw Ps = 0, Rp = null, new Error("Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.");
      yo > tE && (yo = 0, bf = null, D("Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."));
    }
    function HE() {
      S.flushLegacyContextWarning(), S.flushPendingUnsafeLifecycleWarnings();
    }
    function Ih(e, t) {
      Te(e), nd(e, or, Vg), t && nd(e, Mo, Bg), nd(e, or, Ag), t && nd(e, Mo, jg), de();
    }
    function nd(e, t, r) {
      for (var l = e, i = null; l !== null; ) {
        var s = l.subtreeFlags & t;
        l !== i && l.child !== null && s !== b ? l = l.child : ((l.flags & t) !== b && r(l), l.sibling !== null ? l = l.sibling : l = i = l.return);
      }
    }
    var ad = null;
    function $h(e) {
      {
        if ((ve & tn) !== Dt || !(e.mode & he))
          return;
        var t = e.tag;
        if (t !== Vn && t !== De && t !== se && t !== Le && t !== _e && t !== In && t !== we)
          return;
        var r = ce(e) || "ReactComponent";
        if (ad !== null) {
          if (ad.has(r))
            return;
          ad.add(r);
        } else
          ad = /* @__PURE__ */ new Set([r]);
        var l = Q;
        try {
          Te(e), D("Can't perform a React state update on a component that hasn't mounted yet. This indicates that you have a side-effect in your render function that asynchronously later calls tries to update the component. Move this work to useEffect instead.");
        } finally {
          l ? Te(e) : de();
        }
      }
    }
    var Np;
    {
      var LE = null;
      Np = function(e, t, r) {
        var l = iy(LE, t);
        try {
          return fh(e, t, r);
        } catch (s) {
          if (Yc() || s !== null && typeof s == "object" && typeof s.then == "function")
            throw s;
          if (Ic(), vm(), hh(e, t), iy(t, l), t.mode & Ue && Dv(t), gh(null, fh, null, e, t, r), eg()) {
            var i = Eh();
            typeof i == "object" && i !== null && i._suppressLogging && typeof s == "object" && s !== null && !s._suppressLogging && (s._suppressLogging = !0);
          }
          throw s;
        }
      };
    }
    var ey = !1, Up;
    Up = /* @__PURE__ */ new Set();
    function OE(e) {
      if (re && !lS())
        switch (e.tag) {
          case Le:
          case _e:
          case we: {
            var t = rt && ce(rt) || "Unknown", r = t;
            if (!Up.has(r)) {
              Up.add(r);
              var l = ce(e) || "Unknown";
              D("Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render", l, t, t);
            }
            break;
          }
          case se: {
            ey || (D("Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state."), ey = !0);
            break;
          }
        }
    }
    function ks(e, t) {
      if (fn) {
        var r = e.memoizedUpdaters;
        r.forEach(function(l) {
          Ru(e, l, t);
        });
      }
    }
    var _p = {};
    function rd(e, t) {
      {
        var r = nr.current;
        return r !== null ? (r.push(t), _p) : wi(e, t);
      }
    }
    function ty(e) {
      if (e !== _p)
        return Mt(e);
    }
    function ny() {
      return nr.current !== null;
    }
    function FE(e) {
      {
        if (e.mode & he) {
          if (!Ah())
            return;
        } else if (!kg() || ve !== Dt || e.tag !== Le && e.tag !== _e && e.tag !== we)
          return;
        if (nr.current === null) {
          var t = Q;
          try {
            Te(e), D(`An update to %s inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act`, ce(e));
          } finally {
            t ? Te(e) : de();
          }
        }
      }
    }
    function AE(e) {
      e.tag !== Ra && Ah() && nr.current === null && D(`A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act`);
    }
    function Is(e) {
      wh = e;
    }
    var Ha = null, So = null, jE = function(e) {
      Ha = e;
    };
    function go(e) {
      {
        if (Ha === null)
          return e;
        var t = Ha(e);
        return t === void 0 ? e : t.current;
      }
    }
    function Mp(e) {
      return go(e);
    }
    function Hp(e) {
      {
        if (Ha === null)
          return e;
        var t = Ha(e);
        if (t === void 0) {
          if (e != null && typeof e.render == "function") {
            var r = go(e.render);
            if (e.render !== r) {
              var l = {
                $$typeof: gl,
                render: r
              };
              return e.displayName !== void 0 && (l.displayName = e.displayName), l;
            }
          }
          return e;
        }
        return t.current;
      }
    }
    function ay(e, t) {
      {
        if (Ha === null)
          return !1;
        var r = e.elementType, l = t.type, i = !1, s = typeof l == "object" && l !== null ? l.$$typeof : null;
        switch (e.tag) {
          case se: {
            typeof l == "function" && (i = !0);
            break;
          }
          case Le: {
            (typeof l == "function" || s === Zt) && (i = !0);
            break;
          }
          case _e: {
            (s === gl || s === Zt) && (i = !0);
            break;
          }
          case In:
          case we: {
            (s === Aa || s === Zt) && (i = !0);
            break;
          }
          default:
            return !1;
        }
        if (i) {
          var d = Ha(r);
          if (d !== void 0 && d === Ha(l))
            return !0;
        }
        return !1;
      }
    }
    function ry(e) {
      {
        if (Ha === null || typeof WeakSet != "function")
          return;
        So === null && (So = /* @__PURE__ */ new WeakSet()), So.add(e);
      }
    }
    var VE = function(e, t) {
      {
        if (Ha === null)
          return;
        var r = t.staleFamilies, l = t.updatedFamilies;
        Or(), $f(function() {
          Lp(e.current, l, r);
        });
      }
    }, BE = function(e, t) {
      {
        if (e.context !== qt)
          return;
        Or(), $f(function() {
          cy(t, e, null, null);
        });
      }
    };
    function Lp(e, t, r) {
      {
        var l = e.alternate, i = e.child, s = e.sibling, d = e.tag, v = e.type, p = null;
        switch (d) {
          case Le:
          case we:
          case se:
            p = v;
            break;
          case _e:
            p = v.render;
            break;
        }
        if (Ha === null)
          throw new Error("Expected resolveFamily to be set during hot reload.");
        var h = !1, y = !1;
        if (p !== null) {
          var x = Ha(p);
          x !== void 0 && (r.has(x) ? y = !0 : t.has(x) && (d === se ? y = !0 : h = !0));
        }
        if (So !== null && (So.has(e) || l !== null && So.has(l)) && (y = !0), y && (e._debugNeedsRemount = !0), y || h) {
          var N = Ln(e, ee);
          N !== null && zt(N, e, ee, Ve);
        }
        i !== null && !y && Lp(i, t, r), s !== null && Lp(s, t, r);
      }
    }
    var QE = function(e, t) {
      {
        var r = /* @__PURE__ */ new Set(), l = new Set(t.map(function(i) {
          return i.current;
        }));
        return Op(e.current, l, r), r;
      }
    };
    function Op(e, t, r) {
      {
        var l = e.child, i = e.sibling, s = e.tag, d = e.type, v = null;
        switch (s) {
          case Le:
          case we:
          case se:
            v = d;
            break;
          case _e:
            v = d.render;
            break;
        }
        var p = !1;
        v !== null && t.has(v) && (p = !0), p ? wE(e, r) : l !== null && Op(l, t, r), i !== null && Op(i, t, r);
      }
    }
    function wE(e, t) {
      {
        var r = qE(e, t);
        if (r)
          return;
        for (var l = e; ; ) {
          switch (l.tag) {
            case ne:
              t.add(l.stateNode);
              return;
            case je:
              t.add(l.stateNode.containerInfo);
              return;
            case De:
              t.add(l.stateNode.containerInfo);
              return;
          }
          if (l.return === null)
            throw new Error("Expected to reach root first.");
          l = l.return;
        }
      }
    }
    function qE(e, t) {
      for (var r = e, l = !1; ; ) {
        if (r.tag === ne)
          l = !0, t.add(r.stateNode);
        else if (r.child !== null) {
          r.child.return = r, r = r.child;
          continue;
        }
        if (r === e)
          return l;
        for (; r.sibling === null; ) {
          if (r.return === null || r.return === e)
            return l;
          r = r.return;
        }
        r.sibling.return = r.return, r = r.sibling;
      }
      return !1;
    }
    var Fp;
    {
      Fp = !1;
      try {
        var ly = Object.preventExtensions({});
      } catch {
        Fp = !0;
      }
    }
    function YE(e, t, r, l) {
      this.tag = e, this.key = r, this.elementType = null, this.type = null, this.stateNode = null, this.return = null, this.child = null, this.sibling = null, this.index = 0, this.ref = null, this.pendingProps = t, this.memoizedProps = null, this.updateQueue = null, this.memoizedState = null, this.dependencies = null, this.mode = l, this.flags = b, this.subtreeFlags = b, this.deletions = null, this.lanes = O, this.childLanes = O, this.alternate = null, this.actualDuration = Number.NaN, this.actualStartTime = Number.NaN, this.selfBaseDuration = Number.NaN, this.treeBaseDuration = Number.NaN, this.actualDuration = 0, this.actualStartTime = -1, this.selfBaseDuration = 0, this.treeBaseDuration = 0, this._debugSource = null, this._debugOwner = null, this._debugNeedsRemount = !1, this._debugHookTypes = null, !Fp && typeof Object.preventExtensions == "function" && Object.preventExtensions(this);
    }
    var fa = function(e, t, r, l) {
      return new YE(e, t, r, l);
    };
    function Ap(e) {
      var t = e.prototype;
      return !!(t && t.isReactComponent);
    }
    function GE(e) {
      return typeof e == "function" && !Ap(e) && e.defaultProps === void 0;
    }
    function JE(e) {
      if (typeof e == "function")
        return Ap(e) ? se : Le;
      if (e != null) {
        var t = e.$$typeof;
        if (t === gl)
          return _e;
        if (t === Aa)
          return In;
      }
      return Vn;
    }
    function Yu(e, t) {
      var r = e.alternate;
      r === null ? (r = fa(e.tag, t, e.key, e.mode), r.elementType = e.elementType, r.type = e.type, r.stateNode = e.stateNode, r._debugSource = e._debugSource, r._debugOwner = e._debugOwner, r._debugHookTypes = e._debugHookTypes, r.alternate = e, e.alternate = r) : (r.pendingProps = t, r.type = e.type, r.flags = b, r.subtreeFlags = b, r.deletions = null, r.actualDuration = 0, r.actualStartTime = -1), r.flags = e.flags & Va, r.childLanes = e.childLanes, r.lanes = e.lanes, r.child = e.child, r.memoizedProps = e.memoizedProps, r.memoizedState = e.memoizedState, r.updateQueue = e.updateQueue;
      var l = e.dependencies;
      switch (r.dependencies = l === null ? null : {
        lanes: l.lanes,
        firstContext: l.firstContext
      }, r.sibling = e.sibling, r.index = e.index, r.ref = e.ref, r.selfBaseDuration = e.selfBaseDuration, r.treeBaseDuration = e.treeBaseDuration, r._debugNeedsRemount = e._debugNeedsRemount, r.tag) {
        case Vn:
        case Le:
        case we:
          r.type = go(e.type);
          break;
        case se:
          r.type = Mp(e.type);
          break;
        case _e:
          r.type = Hp(e.type);
          break;
      }
      return r;
    }
    function XE(e, t) {
      e.flags &= Va | it;
      var r = e.alternate;
      if (r === null)
        e.childLanes = O, e.lanes = t, e.child = null, e.subtreeFlags = b, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null, e.selfBaseDuration = 0, e.treeBaseDuration = 0;
      else {
        e.childLanes = r.childLanes, e.lanes = r.lanes, e.child = r.child, e.subtreeFlags = b, e.deletions = null, e.memoizedProps = r.memoizedProps, e.memoizedState = r.memoizedState, e.updateQueue = r.updateQueue, e.type = r.type;
        var l = r.dependencies;
        e.dependencies = l === null ? null : {
          lanes: l.lanes,
          firstContext: l.firstContext
        }, e.selfBaseDuration = r.selfBaseDuration, e.treeBaseDuration = r.treeBaseDuration;
      }
      return e;
    }
    function KE(e, t, r) {
      var l;
      return e === Si ? (l = he, t === !0 && (l |= be, l |= ua)) : l = I, fn && (l |= Ue), fa(De, null, null, l);
    }
    function jp(e, t, r, l, i, s) {
      var d = Vn, v = e;
      if (typeof e == "function")
        Ap(e) ? (d = se, v = Mp(v)) : v = go(v);
      else if (typeof e == "string")
        d = ne;
      else
        e: switch (e) {
          case Fa:
            return $l(r.children, i, s, t);
          case rn:
            d = nu, i |= be, (i & he) !== I && (i |= ua);
            break;
          case Co:
            return ZE(r, i, s, t);
          case Ku:
            return PE(r, i, s, t);
          case Zu:
            return WE(r, i, s, t);
          case El:
            return uy(r, i, s, t);
          case sd:
          case id:
          case cd:
          case fd:
          case od:
          default: {
            if (typeof e == "object" && e !== null)
              switch (e.$$typeof) {
                case Do:
                  d = bn;
                  break e;
                case zo:
                  d = au;
                  break e;
                case gl:
                  d = _e, v = Hp(v);
                  break e;
                case Aa:
                  d = In;
                  break e;
                case Zt:
                  d = ru, v = null;
                  break e;
              }
            var p = "";
            {
              (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (p += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
              var h = l ? ce(l) : null;
              h && (p += `

Check the render method of \`` + h + "`.");
            }
            throw new Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) " + ("but got: " + (e == null ? e : typeof e) + "." + p));
          }
        }
      var y = fa(d, r, t, i);
      return y.elementType = e, y.type = v, y.lanes = s, y._debugOwner = l, y;
    }
    function Vp(e, t, r) {
      var l = null;
      l = e._owner;
      var i = e.type, s = e.key, d = e.props, v = jp(i, s, d, l, t, r);
      return v._debugSource = e._source, v._debugOwner = e._owner, v;
    }
    function $l(e, t, r, l) {
      var i = fa(jr, e, l, t);
      return i.lanes = r, i;
    }
    function ZE(e, t, r, l) {
      typeof e.id != "string" && D('Profiler must specify an "id" of type `string` as a prop. Received the type `%s` instead.', typeof e.id);
      var i = fa(kn, e, l, t | Ue);
      return i.elementType = Co, i.lanes = r, i.stateNode = {
        effectDuration: 0,
        passiveEffectDuration: 0
      }, i;
    }
    function PE(e, t, r, l) {
      var i = fa(Qe, e, l, t);
      return i.elementType = Ku, i.lanes = r, i;
    }
    function WE(e, t, r, l) {
      var i = fa(an, e, l, t);
      return i.elementType = Zu, i.lanes = r, i;
    }
    function uy(e, t, r, l) {
      var i = fa(Nt, e, l, t);
      i.elementType = El, i.lanes = r;
      var s = {
        isHidden: !1
      };
      return i.stateNode = s, i;
    }
    function Bp(e, t, r) {
      var l = fa(Ye, e, null, t);
      return l.lanes = r, l;
    }
    function bE() {
      var e = fa(ne, null, null, I);
      return e.elementType = "DELETED", e;
    }
    function kE(e) {
      var t = fa(Sl, null, null, I);
      return t.stateNode = e, t;
    }
    function Qp(e, t, r) {
      var l = e.children !== null ? e.children : [], i = fa(je, l, e.key, t);
      return i.lanes = r, i.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        // Used by persistent updates
        implementation: e.implementation
      }, i;
    }
    function iy(e, t) {
      return e === null && (e = fa(Vn, null, null, I)), e.tag = t.tag, e.key = t.key, e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.return = t.return, e.child = t.child, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.pendingProps = t.pendingProps, e.memoizedProps = t.memoizedProps, e.updateQueue = t.updateQueue, e.memoizedState = t.memoizedState, e.dependencies = t.dependencies, e.mode = t.mode, e.flags = t.flags, e.subtreeFlags = t.subtreeFlags, e.deletions = t.deletions, e.lanes = t.lanes, e.childLanes = t.childLanes, e.alternate = t.alternate, e.actualDuration = t.actualDuration, e.actualStartTime = t.actualStartTime, e.selfBaseDuration = t.selfBaseDuration, e.treeBaseDuration = t.treeBaseDuration, e._debugSource = t._debugSource, e._debugOwner = t._debugOwner, e._debugNeedsRemount = t._debugNeedsRemount, e._debugHookTypes = t._debugHookTypes, e;
    }
    function IE(e, t, r, l, i) {
      this.tag = t, this.containerInfo = e, this.pendingChildren = null, this.current = null, this.pingCache = null, this.finishedWork = null, this.timeoutHandle = Iu, this.context = null, this.pendingContext = null, this.callbackNode = null, this.callbackPriority = et, this.eventTimes = jl(O), this.expirationTimes = jl(Ve), this.pendingLanes = O, this.suspendedLanes = O, this.pingedLanes = O, this.expiredLanes = O, this.mutableReadLanes = O, this.finishedLanes = O, this.entangledLanes = O, this.entanglements = jl(O), this.identifierPrefix = l, this.onRecoverableError = i, Wt && (this.mutableSourceEagerHydrationData = null), this.effectDuration = 0, this.passiveEffectDuration = 0;
      {
        this.memoizedUpdaters = /* @__PURE__ */ new Set();
        for (var s = this.pendingUpdatersLaneMap = [], d = 0; d < kr; d++)
          s.push(/* @__PURE__ */ new Set());
      }
      switch (t) {
        case Si:
          this._debugRootType = r ? "hydrateRoot()" : "createRoot()";
          break;
        case Ra:
          this._debugRootType = r ? "hydrate()" : "render()";
          break;
      }
    }
    function oy(e, t, r, l, i, s, d, v, p, h) {
      var y = new IE(e, t, r, v, p), x = KE(t, s);
      y.current = x, x.stateNode = y;
      {
        var N = {
          element: l,
          isDehydrated: r,
          cache: null,
          // not enabled yet
          transitions: null,
          pendingSuspenseBoundaries: null
        };
        x.memoizedState = N;
      }
      return Wd(x), y;
    }
    var $E = "18.3.1";
    function e1(e, t, r) {
      var l = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
      return Vy(l), {
        // This tag allow us to uniquely identify this as a React Portal
        $$typeof: vt,
        key: l == null ? null : "" + l,
        children: e,
        containerInfo: t,
        implementation: r
      };
    }
    var wp, qp;
    wp = !1, qp = {};
    function sy(e) {
      if (!e)
        return qt;
      var t = La(e), r = Gn(t);
      if (t.tag === se) {
        var l = t.type;
        if (on(l))
          return yi(t, l, r);
      }
      return r;
    }
    function t1(e) {
      var t = La(e);
      if (t === void 0) {
        if (typeof e.render == "function")
          throw new Error("Unable to find node on an unmounted component.");
        var r = Object.keys(e).join(",");
        throw new Error("Argument appears to not be a ReactComponent. Keys: " + r);
      }
      var l = Yr(t);
      return l === null ? null : l.stateNode;
    }
    function n1(e, t) {
      {
        var r = La(e);
        if (r === void 0) {
          if (typeof e.render == "function")
            throw new Error("Unable to find node on an unmounted component.");
          var l = Object.keys(e).join(",");
          throw new Error("Argument appears to not be a ReactComponent. Keys: " + l);
        }
        var i = Yr(r);
        if (i === null)
          return null;
        if (i.mode & be) {
          var s = ce(r) || "Component";
          if (!qp[s]) {
            qp[s] = !0;
            var d = Q;
            try {
              Te(i), r.mode & be ? D("%s is deprecated in StrictMode. %s was passed an instance of %s which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-find-node", t, t, s) : D("%s is deprecated in StrictMode. %s was passed an instance of %s which renders StrictMode children. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-find-node", t, t, s);
            } finally {
              d ? Te(d) : de();
            }
          }
        }
        return i.stateNode;
      }
    }
    function a1(e, t, r, l, i, s, d, v) {
      var p = !1, h = null;
      return oy(e, t, p, h, r, l, i, s, d);
    }
    function r1(e, t, r, l, i, s, d, v, p, h) {
      var y = !0, x = oy(r, l, y, e, i, s, d, v, p);
      x.context = sy(null);
      var N = x.current, H = yn(), F = kl(N), L = vl(H, F);
      return L.callback = t ?? null, Jl(N, L, F), aE(x, F, H), x;
    }
    function cy(e, t, r, l) {
      Yi(t, e);
      var i = t.current, s = yn(), d = kl(i);
      Bl(d);
      var v = sy(r);
      t.context === null ? t.context = v : t.pendingContext = v, re && Q !== null && !wp && (wp = !0, D(`Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.

Check the render method of %s.`, ce(Q) || "Unknown"));
      var p = vl(s, d);
      p.payload = {
        element: e
      }, l = l === void 0 ? null : l, l !== null && (typeof l != "function" && D("render(...): Expected the last optional `callback` argument to be a function. Instead received: %s.", l), p.callback = l);
      var h = Jl(i, p, d);
      return h !== null && (zt(h, i, d, s), af(h, i, d)), d;
    }
    function l1(e) {
      var t = e.current;
      if (!t.child)
        return null;
      switch (t.child.tag) {
        case ne:
          return ya(t.child.stateNode);
        default:
          return t.child.stateNode;
      }
    }
    function u1(e) {
      switch (e.tag) {
        case De: {
          var t = e.stateNode;
          if (Ja(t)) {
            var r = _c(t);
            iE(t, r);
          }
          break;
        }
        case Qe: {
          $f(function() {
            var i = Ln(e, ee);
            if (i !== null) {
              var s = yn();
              zt(i, e, ee, s);
            }
          });
          var l = ee;
          ld(e, l);
          break;
        }
      }
    }
    function fy(e, t) {
      var r = e.memoizedState;
      r !== null && r.dehydrated !== null && (r.retryLane = xu(r.retryLane, t));
    }
    function ld(e, t) {
      fy(e, t);
      var r = e.alternate;
      r && fy(r, t);
    }
    function i1(e) {
      if (e.tag === Qe) {
        var t = ee, r = Ln(e, t);
        if (r !== null) {
          var l = yn();
          zt(r, e, t, l);
        }
        ld(e, t);
      }
    }
    function o1(e) {
      if (e.tag === Qe) {
        var t = nl, r = Ln(e, t);
        if (r !== null) {
          var l = yn();
          zt(r, e, t, l);
        }
        ld(e, t);
      }
    }
    function s1(e) {
      if (e.tag === Qe) {
        var t = kl(e), r = Ln(e, t);
        if (r !== null) {
          var l = yn();
          zt(r, e, t, l);
        }
        ld(e, t);
      }
    }
    function c1(e) {
      var t = Lo(e);
      return t === null ? null : t.stateNode;
    }
    var dy = function(e) {
      return null;
    };
    function vy(e) {
      return dy(e);
    }
    var py = function(e) {
      return !1;
    };
    function my(e) {
      return py(e);
    }
    var hy = null, yy = null, Sy = null, gy = null, Ey = null, xy = null, Ry = null, Ty = null, Cy = null;
    {
      var Dy = function(e, t, r) {
        var l = t[r], i = St(e) ? e.slice() : ut({}, e);
        return r + 1 === t.length ? (St(i) ? i.splice(l, 1) : delete i[l], i) : (i[l] = Dy(e[l], t, r + 1), i);
      }, zy = function(e, t) {
        return Dy(e, t, 0);
      }, Ny = function(e, t, r, l) {
        var i = t[l], s = St(e) ? e.slice() : ut({}, e);
        if (l + 1 === t.length) {
          var d = r[l];
          s[d] = s[i], St(s) ? s.splice(i, 1) : delete s[i];
        } else
          s[i] = Ny(
            // $FlowFixMe number or string is fine here
            e[i],
            t,
            r,
            l + 1
          );
        return s;
      }, Uy = function(e, t, r) {
        if (t.length !== r.length) {
          Wn("copyWithRename() expects paths of the same length");
          return;
        } else
          for (var l = 0; l < r.length - 1; l++)
            if (t[l] !== r[l]) {
              Wn("copyWithRename() expects paths to be the same except for the deepest key");
              return;
            }
        return Ny(e, t, r, 0);
      }, _y = function(e, t, r, l) {
        if (r >= t.length)
          return l;
        var i = t[r], s = St(e) ? e.slice() : ut({}, e);
        return s[i] = _y(e[i], t, r + 1, l), s;
      }, My = function(e, t, r) {
        return _y(e, t, 0, r);
      }, Yp = function(e, t) {
        for (var r = e.memoizedState; r !== null && t > 0; )
          r = r.next, t--;
        return r;
      };
      hy = function(e, t, r, l) {
        var i = Yp(e, t);
        if (i !== null) {
          var s = My(i.memoizedState, r, l);
          i.memoizedState = s, i.baseState = s, e.memoizedProps = ut({}, e.memoizedProps);
          var d = Ln(e, ee);
          d !== null && zt(d, e, ee, Ve);
        }
      }, yy = function(e, t, r) {
        var l = Yp(e, t);
        if (l !== null) {
          var i = zy(l.memoizedState, r);
          l.memoizedState = i, l.baseState = i, e.memoizedProps = ut({}, e.memoizedProps);
          var s = Ln(e, ee);
          s !== null && zt(s, e, ee, Ve);
        }
      }, Sy = function(e, t, r, l) {
        var i = Yp(e, t);
        if (i !== null) {
          var s = Uy(i.memoizedState, r, l);
          i.memoizedState = s, i.baseState = s, e.memoizedProps = ut({}, e.memoizedProps);
          var d = Ln(e, ee);
          d !== null && zt(d, e, ee, Ve);
        }
      }, gy = function(e, t, r) {
        e.pendingProps = My(e.memoizedProps, t, r), e.alternate && (e.alternate.pendingProps = e.pendingProps);
        var l = Ln(e, ee);
        l !== null && zt(l, e, ee, Ve);
      }, Ey = function(e, t) {
        e.pendingProps = zy(e.memoizedProps, t), e.alternate && (e.alternate.pendingProps = e.pendingProps);
        var r = Ln(e, ee);
        r !== null && zt(r, e, ee, Ve);
      }, xy = function(e, t, r) {
        e.pendingProps = Uy(e.memoizedProps, t, r), e.alternate && (e.alternate.pendingProps = e.pendingProps);
        var l = Ln(e, ee);
        l !== null && zt(l, e, ee, Ve);
      }, Ry = function(e) {
        var t = Ln(e, ee);
        t !== null && zt(t, e, ee, Ve);
      }, Ty = function(e) {
        dy = e;
      }, Cy = function(e) {
        py = e;
      };
    }
    function f1(e) {
      var t = Yr(e);
      return t === null ? null : t.stateNode;
    }
    function d1(e) {
      return null;
    }
    function v1() {
      return Q;
    }
    function p1(e) {
      var t = e.findFiberByHostInstance, r = lt.ReactCurrentDispatcher;
      return qi({
        bundleType: e.bundleType,
        version: e.version,
        rendererPackageName: e.rendererPackageName,
        rendererConfig: e.rendererConfig,
        overrideHookState: hy,
        overrideHookStateDeletePath: yy,
        overrideHookStateRenamePath: Sy,
        overrideProps: gy,
        overridePropsDeletePath: Ey,
        overridePropsRenamePath: xy,
        setErrorHandler: Ty,
        setSuspenseHandler: Cy,
        scheduleUpdate: Ry,
        currentDispatcherRef: r,
        findHostInstanceByFiber: f1,
        findFiberByHostInstance: t || d1,
        // React Refresh
        findHostInstancesForRefresh: QE,
        scheduleRefresh: VE,
        scheduleRoot: BE,
        setRefreshHandler: jE,
        // Enables DevTools to append owner stacks to error messages in DEV mode.
        getCurrentFiber: v1,
        // Enables DevTools to detect reconciler version rather than renderer version
        // which may not match for third party renderers.
        reconcilerVersion: $E
      });
    }
    return G.attemptContinuousHydration = o1, G.attemptDiscreteHydration = i1, G.attemptHydrationAtCurrentPriority = s1, G.attemptSynchronousHydration = u1, G.batchedUpdates = sE, G.createComponentSelector = Qg, G.createContainer = a1, G.createHasPseudoClassSelector = wg, G.createHydrationContainer = r1, G.createPortal = e1, G.createRoleSelector = qg, G.createTestNameSelector = Gg, G.createTextSelector = Yg, G.deferredUpdates = oE, G.discreteUpdates = cE, G.findAllNodes = Gf, G.findBoundingRects = Kg, G.findHostInstance = t1, G.findHostInstanceWithNoPortals = c1, G.findHostInstanceWithWarning = n1, G.flushControlled = dE, G.flushPassiveEffects = Or, G.flushSync = $f, G.focusWithin = Zg, G.getCurrentUpdatePriority = bt, G.getFindAllNodesFailureDescription = Xg, G.getPublicRootInstance = l1, G.injectIntoDevTools = p1, G.isAlreadyRendering = fE, G.observeVisibleRects = Wg, G.registerMutableSourceForHydration = $y, G.runWithPriority = os, G.shouldError = vy, G.shouldSuspend = my, G.updateContainer = cy, G;
  })), Jp.exports;
}
process.env.NODE_ENV === "production" ? Xp.exports = S1() : Xp.exports = g1();
var E1 = Xp.exports;
const N1 = /* @__PURE__ */ y1(E1);
var Kp = { exports: {} }, eu = {};
/**
 * @license React
 * react-reconciler-constants.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Oy;
function x1() {
  return Oy || (Oy = 1, eu.ConcurrentRoot = 1, eu.ContinuousEventPriority = 4, eu.DefaultEventPriority = 16, eu.DiscreteEventPriority = 1, eu.IdleEventPriority = 536870912, eu.LegacyRoot = 0), eu;
}
var tu = {};
/**
 * @license React
 * react-reconciler-constants.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Fy;
function R1() {
  return Fy || (Fy = 1, process.env.NODE_ENV !== "production" && function() {
    var ud = (
      /*                        */
      1
    ), E = (
      /*             */
      4
    ), G = (
      /*                     */
      16
    ), xo = (
      /*                        */
      536870912
    ), Ie = ud, lt = E, j = G, va = xo, Wn = 0, D = 1;
    tu.ConcurrentRoot = D, tu.ContinuousEventPriority = lt, tu.DefaultEventPriority = j, tu.DiscreteEventPriority = Ie, tu.IdleEventPriority = va, tu.LegacyRoot = Wn;
  }()), tu;
}
process.env.NODE_ENV === "production" ? Kp.exports = x1() : Kp.exports = R1();
var U1 = Kp.exports;
export {
  N1 as R,
  U1 as c
};
