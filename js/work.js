/* work.js : the work page.
 *
 * Under the headline: five filter tabs with counts, then a grid of the tiles
 * in data/work.json, three to a row (two under 1000px), every tile a plain
 * link to its project page: app.js rolls the page in and falls back to a
 * normal navigation after ROLL.SAFETY_MS. Hovering a tile raises its project's
 * name and place over the image. The tabs filter by each tile's "categories";
 * the counts come from the data, an empty tab shows 00 and a one-line note,
 * and the chosen tab goes into the URL hash (#fun-maps). On the Everything
 * view a cell among the tiles ticks through the projects' coordinates, every
 * PLACES_EVERY_MS while it is in view, or on a click. When the filter changes,
 * cells that stay glide to their new place and cells that appear rise in.
 */

export const WORK = {
  CATEGORIES: [
    { id: "data-visualisation", name: "Data Visualisation" },
    { id: "spatial-analysis-gis", name: "Spatial Analysis & GIS" },
    { id: "ai-prototyping", name: "AI & Prototyping" },
    { id: "fun-maps", name: "Fun Maps" },
  ],
  PLACES_AFTER: 2,         // the coordinates cell follows this many tiles
  PLACES_EVERY_MS: 3600,   // next place while the cell is in view
  EAGER: 6,                // tiles that load at once; the rest load lazily
  MOVE_MS: 640,            // a cell gliding to its new place
  ENTER_MS: 480,           // a cell appearing (opacity and a 16px rise)
  ENTER_DELAY_MS: 90,
  STAGGER_MS: 40,          // between cells on the page's first reveal
  EASE: "cubic-bezier(.2,.75,.15,1)",
};

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const notTodo = (s) => (s && !/^TODO/i.test(s) ? s : "");

export function initWork(main, { projects, tiles, url, entered }) {
  const root = main.querySelector("#work");
  if (!root) return null;
  const filters = root.querySelector(".work__filters");
  const grid = root.querySelector(".work__grid");
  if (!filters || !grid) return null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bySlug = Object.fromEntries(projects.map((p, i) => [p.slug, { p, i }]));
  const cats = [{ id: "all", name: "Everything" }, ...WORK.CATEGORIES];
  const inCat = (t, id) => id === "all" || (t.categories || []).includes(id);
  const count = (id) => tiles.filter((t) => inCat(t, id)).length;

  // ---------------------------------------------------------------- the tiles
  const cardMarkup = (t, k) => {
    const { p } = bySlug[t.project];
    const where = [notTodo(p.location), notTodo(p.year)].filter(Boolean).join(" · ");
    return `
      <a class="cell card" href="project.html?p=${esc(p.slug)}" data-cursor="open" data-cats="${esc((t.categories || []).join(" "))}"
         aria-label="${esc(p.title)}${where ? `, ${esc(where)}` : ""}${t.label ? `. ${esc(t.label)}` : ""}">
        <img src="${esc(t.src)}" alt="${esc(t.alt || "")}" loading="${k < WORK.EAGER ? "eager" : "lazy"}" decoding="async">
        <span class="card__over" aria-hidden="true">
          <span class="card__name">${esc(p.title)}</span>
          ${where ? `<span class="label card__where">${esc(where)}</span>` : ""}
        </span>
      </a>`;
  };

  // the coordinates cell: every published project with coordinates, in order; "( 39.95° N, 75.16° W )" becomes two lines
  const places = projects
    .map((p) => ({ name: notTodo(p.location) || p.title, lines: String(p.coords || "").replace(/^\(\s*|\s*\)$/g, "").split(/,\s*/) }))
    .filter((q) => q.lines.length === 2 && q.lines.every(Boolean));
  const placesMarkup = places.length ? `
      <button class="cell cell--places" type="button" data-places aria-label="Places in this work: ${esc(places.map((q) => q.name).join(", "))}">
        <span class="label places__name"></span>
        <span class="places__coords" aria-hidden="true"></span>
        <span class="label muted places__count"></span>
      </button>` : "";

  const cells = tiles.map(cardMarkup);
  cells.splice(Math.min(WORK.PLACES_AFTER, cells.length), 0, placesMarkup);
  grid.innerHTML = cells.join("") + `<p class="work__empty label muted" hidden>( NOTHING IN THIS CATEGORY YET )</p>`;
  const cellEls = [...grid.querySelectorAll(".cell")];
  const placesEl = grid.querySelector("[data-places]");
  const empty = grid.querySelector(".work__empty");

  // ---------------------------------------------------------------- the coordinates cell
  let placeK = -1, placeTimer = 0, seen = null;
  function showPlace(animate = true) {
    if (!placesEl) return;
    placeK = (placeK + 1) % places.length;
    const q = places[placeK];
    placesEl.querySelector(".places__name").textContent = `( ${q.name} )`;
    placesEl.querySelector(".places__coords").innerHTML = `${esc(q.lines[0])}<br>${esc(q.lines[1])}`;
    placesEl.querySelector(".places__count").textContent = `( ${pad2(placeK + 1)} / ${pad2(places.length)} )`;
    if (animate && !reduced) placesEl.querySelectorAll(".places__name, .places__coords").forEach((s) =>
      s.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: WORK.EASE }));
  }
  const startPlaces = () => { if (!placeTimer && !reduced) placeTimer = setInterval(showPlace, WORK.PLACES_EVERY_MS); };
  const stopPlaces = () => { clearInterval(placeTimer); placeTimer = 0; };
  const onPlacesClick = () => { showPlace(); if (placeTimer) { stopPlaces(); startPlaces(); } };
  if (placesEl) {
    showPlace(false);
    placesEl.addEventListener("click", onPlacesClick);
    seen = new IntersectionObserver(([e]) => (e.isIntersecting && !placesEl.hidden ? startPlaces() : stopPlaces()));
    seen.observe(placesEl);
  }

  // ---------------------------------------------------------------- motion: everything that moves glides from where it was
  function layout(change) {
    const before = new Map();
    cellEls.forEach((e) => { if (!e.hidden) before.set(e, e.getBoundingClientRect()); });
    grid.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    change();
    if (reduced) return;
    cellEls.forEach((e) => {
      if (e.hidden) return;
      const a = e.getBoundingClientRect();
      const b = before.get(e);
      if (!b) {
        e.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
          { duration: WORK.ENTER_MS, delay: WORK.ENTER_DELAY_MS, easing: WORK.EASE, fill: "backwards" });
        return;
      }
      const dx = b.left - a.left, dy = b.top - a.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: WORK.MOVE_MS, easing: WORK.EASE });
      }
    });
  }

  // ---------------------------------------------------------------- the filters
  let current = "all";
  const buttons = new Map();
  filters.innerHTML = cats.map((c) =>
    `<button class="work__filter label" type="button" data-cat="${esc(c.id)}" aria-pressed="false">` +
      `<span class="work__filter-name">( ${esc(c.name.toUpperCase())} )</span><span class="work__filter-count">${pad2(count(c.id))}</span>` +
    `</button>`).join("");
  filters.querySelectorAll(".work__filter").forEach((b) => buttons.set(b.dataset.cat, b));

  function apply(cat) {
    cellEls.forEach((e) => {
      e.hidden = e.hasAttribute("data-places") ? cat !== "all" : !(cat === "all" || e.dataset.cats.split(" ").includes(cat));
    });
    empty.hidden = count(cat) > 0;
    if (placesEl && placesEl.hidden) stopPlaces();
  }
  function setFilter(cat, animate) {
    current = cat;
    animate ? layout(() => apply(cat)) : apply(cat);
    buttons.forEach((b, id) => b.setAttribute("aria-pressed", String(id === cat)));
  }
  const onFilterClick = (e) => {
    const b = e.target.closest(".work__filter");
    if (!b || b.dataset.cat === current) return;
    setFilter(b.dataset.cat, true);
    history.replaceState(history.state, "", current === "all" ? location.pathname + location.search : `#${current}`);
  };
  filters.addEventListener("click", onFilterClick);

  const hash = (url?.hash || "").slice(1);
  setFilter(WORK.CATEGORIES.some((c) => c.id === hash) ? hash : "all", false);

  // ---------------------------------------------------------------- entering: the visible cells rise in, one after another
  function enter() {
    if (reduced) return;
    cellEls.filter((e) => !e.hidden).forEach((e, i) => {
      e.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
        { duration: WORK.ENTER_MS, delay: i * WORK.STAGGER_MS, easing: WORK.EASE, fill: "backwards" });
    });
  }
  const onEnter = () => enter();
  if (entered) enter(); else main.addEventListener("page:enter", onEnter, { once: true });

  return function cleanup() {
    stopPlaces();
    seen?.disconnect();
    placesEl?.removeEventListener("click", onPlacesClick);
    filters.removeEventListener("click", onFilterClick);
    main.removeEventListener("page:enter", onEnter);
  };
}
