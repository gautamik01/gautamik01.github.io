/* hero.js : the home page.
 *
 * Two screens. The first (#hero) is the headline alone. The second
 * (#selected) holds one thumbnail per published project in a row, with a
 * counter: hovering (or focusing) a thumbnail turns it into the tilted oval
 * the work tiles use, an SVG clipPath whose ellipse is tweened from a circle
 * that covers the whole rectangle into an ellipse leaning OVAL_TILT degrees
 * clockwise, brightens it and sets the counter to its number. Every
 * thumbnail is a plain link to project.html?p=<slug>: app.js rolls the
 * project page in and falls back to a normal navigation after ROLL.SAFETY_MS.
 *
 * On desktop (a fine pointer, SNAP_MIN_PX and up, motion allowed) the wheel
 * snaps between the two screens through Lenis: one tick down from the hero
 * lands on the selected projects, one tick up from there returns to the
 * hero; below the second screen the page scrolls normally. Phones, touch
 * screens and reduced motion scroll plainly. The scale bar stays hidden while
 * the hero is in view, since its note sits in that corner.
 */

export const BROWSER = {
  OVAL_S: 0.6,            // rectangle to tilted oval on hover (power3.out)
  OVAL_OUT_S: 0.45,       // and back
  OVAL_TILT: 20,          // degrees clockwise from vertical, top leaning right
  OVAL_RX: 0.47,          // the oval's radii as fractions of the thumbnail's width and height
  OVAL_RY: 0.48,
  SNAP_S: 1.0,            // seconds, the wheel snap between the two screens
  SNAP_COOLDOWN_MS: 450,  // wheel ticks are ignored this long after a snap (trackpad inertia)
  SNAP_MIN_PX: 768,       // viewport width from which the snap is on
  SNAP_ZONE: 0.9,         // a tick up within the top this fraction of the second screen first settles on its top
  HERO_IN_VIEW: 0.4,      // the hero counts as in view (scale bar hidden) above this visible fraction
};

const pad2 = (n) => String(n).padStart(2, "0");

export function initBrowser(main, projects) {
  const html = document.documentElement;
  const hero = main.querySelector("#hero");
  const root = main.querySelector("#selected");
  if (!root) return null;
  const thumbs = root.querySelector(".selected__thumbs");
  const counter = root.querySelector(".selected__counter");
  const thumbEls = [...thumbs.querySelectorAll(".thumb")];
  const ellipses = [...root.querySelectorAll(".selected__clips ellipse")];
  const hasGsap = typeof window.gsap !== "undefined";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = hasGsap && !reduced;
  const touch = !matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------------------------------------------------------------- the tilted oval: one SVG ellipse per thumbnail
  // Each clip starts as a circle big enough to show the whole rectangle and is tweened into the leaning ellipse;
  // the clip-path is only attached while the oval is on.
  const ovals = new Map();   // thumb -> { k, el, state, tween }
  const setEllipse = (el, w, h, rxf, ryf, rot) => {
    el.setAttribute("cx", (w / 2).toFixed(2));
    el.setAttribute("cy", (h / 2).toFixed(2));
    el.setAttribute("rx", (rxf * w).toFixed(2));
    el.setAttribute("ry", (ryf * h).toFixed(2));
    el.setAttribute("transform", `rotate(${rot.toFixed(2)} ${(w / 2).toFixed(2)} ${(h / 2).toFixed(2)})`);
  };
  const coverFractions = (w, h) => {
    const r = Math.hypot(w, h) / 2 * 1.02;      // a circle through the corners
    return { rxf: r / w, ryf: r / h };
  };
  function ovalOf(thumb) {
    let o = ovals.get(thumb);
    if (!o) {
      const k = Number(thumb.dataset.k);
      const c = coverFractions(thumb.offsetWidth, thumb.offsetHeight);
      o = { k, el: ellipses[k], state: { rxf: c.rxf, ryf: c.ryf, rot: 0 }, tween: null };
      ovals.set(thumb, o);
    }
    return o;
  }
  function ovalOn(thumb) {
    if (!motion) { thumb.classList.add("is-oval"); return; }
    const o = ovalOf(thumb);
    if (!o.el) return;
    const w = thumb.offsetWidth, h = thumb.offsetHeight;
    thumb.style.clipPath = `url(#hero-oval-${o.k})`;
    o.tween?.kill();
    setEllipse(o.el, w, h, o.state.rxf, o.state.ryf, o.state.rot);
    o.tween = gsap.to(o.state, {
      rxf: BROWSER.OVAL_RX, ryf: BROWSER.OVAL_RY, rot: BROWSER.OVAL_TILT, duration: BROWSER.OVAL_S, ease: "power3.out",
      onUpdate: () => setEllipse(o.el, w, h, o.state.rxf, o.state.ryf, o.state.rot),
    });
  }
  function ovalOff(thumb) {
    thumb.classList.remove("is-oval");
    if (!motion) return;
    const o = ovals.get(thumb);
    if (!o || !o.el) return;
    const w = thumb.offsetWidth, h = thumb.offsetHeight;
    const c = coverFractions(w, h);
    o.tween?.kill();
    o.tween = gsap.to(o.state, {
      rxf: c.rxf, ryf: c.ryf, rot: 0, duration: BROWSER.OVAL_OUT_S, ease: "power3.out",
      onUpdate: () => setEllipse(o.el, w, h, o.state.rxf, o.state.ryf, o.state.rot),
      onComplete: () => { thumb.style.clipPath = ""; },
    });
  }

  // ---------------------------------------------------------------- hover and focus
  let hot = null;
  function highlight(thumb) {
    if (hot && hot !== thumb) ovalOff(hot);
    hot = thumb;
    const k = Number(thumb.dataset.k);
    thumbEls.forEach((t, i) => t.classList.toggle("is-active", i === k));
    counter.textContent = `( ${pad2(k + 1)} / ${pad2(projects.length)} )`;
    ovalOn(thumb);
  }
  function unhighlight() {
    if (hot) ovalOff(hot);
    hot = null;
    thumbEls.forEach((t) => t.classList.remove("is-active"));
  }
  const thumbOf = (e) => e.target.closest?.(".thumb");
  const leaves = (e) => !e.relatedTarget?.closest?.(".thumb");   // the pointer or focus went somewhere that is not a thumbnail
  const onOver = (e) => { if (touch) return; const t = thumbOf(e); if (t && t !== hot) highlight(t); };
  const onOut = (e) => { if (touch) return; const t = thumbOf(e); if (t && !t.contains(e.relatedTarget) && leaves(e)) unhighlight(); };
  const onFocusIn = (e) => { const t = thumbOf(e); if (t && t !== hot) highlight(t); };
  const onFocusOut = (e) => { const t = thumbOf(e); if (t && leaves(e)) unhighlight(); };
  thumbs.addEventListener("mouseover", onOver);
  thumbs.addEventListener("mouseout", onOut);
  thumbs.addEventListener("focusin", onFocusIn);
  thumbs.addEventListener("focusout", onFocusOut);

  // ---------------------------------------------------------------- the scale bar: off while the hero is in view
  let heroSeen = null;
  if (hero) {
    heroSeen = new IntersectionObserver(([e]) => html.classList.toggle("hero-in-view", e.isIntersecting), { threshold: BROWSER.HERO_IN_VIEW });
    heroSeen.observe(hero);
  }

  // ---------------------------------------------------------------- the snap between the two screens (desktop, wheel)
  // The wheel event is caught before Lenis sees it. Down from the hero: Lenis scrolls to the second screen's top and
  // locks until it arrives. Up from that top (or from anywhere between the two screens): back to the hero. Up from
  // within the upper part of the second screen: to its top first, so a scroll back from the footer settles there.
  // Everything else is Lenis as usual.
  const lenis = window.__shell?.lenis;
  const snapping = Boolean(lenis) && motion && !touch && matchMedia(`(min-width: ${BROWSER.SNAP_MIN_PX}px)`).matches;
  let busy = false, cooldownUntil = 0, safety = 0;
  const selectedTop = () => Math.round(root.getBoundingClientRect().top + window.scrollY);
  function snapTo(target) {
    busy = true;
    const done = () => {
      clearTimeout(safety);
      busy = false;
      cooldownUntil = performance.now() + BROWSER.SNAP_COOLDOWN_MS;
    };
    safety = setTimeout(done, BROWSER.SNAP_S * 1000 + 400);   // in case Lenis never reports completion
    lenis.scrollTo(target, { duration: BROWSER.SNAP_S, lock: true, force: true, onComplete: done });
  }
  const onWheel = (e) => {
    if (e.ctrlKey) return;                                   // a pinch zoom
    if (busy || performance.now() < cooldownUntil) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    const dy = e.deltaY;
    if (Math.abs(dy) < 1) return;
    const top = selectedTop();
    const y = window.scrollY;
    const zone = root.offsetHeight * BROWSER.SNAP_ZONE;
    let target = null;
    if (dy > 0 && y < top - 1) target = top;                             // down, from the hero or between the screens
    else if (dy < 0 && y > 0 && y <= top + 1) target = 0;                // up, from the second screen's top or between
    else if (dy < 0 && y > top + 1 && y < top + zone) target = top;     // up, from inside the second screen: settle on its top
    if (target === null || Math.abs(target - y) < 1) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    snapTo(target);
  };
  if (snapping) window.addEventListener("wheel", onWheel, { capture: true, passive: false });

  return function cleanup() {
    ovals.forEach((o) => o.tween?.kill());
    thumbs.removeEventListener("mouseover", onOver);
    thumbs.removeEventListener("mouseout", onOut);
    thumbs.removeEventListener("focusin", onFocusIn);
    thumbs.removeEventListener("focusout", onFocusOut);
    heroSeen?.disconnect();
    html.classList.remove("hero-in-view");
    if (snapping) window.removeEventListener("wheel", onWheel, { capture: true });
    clearTimeout(safety);
  };
}
