# Gautami Kasat, portfolio site

Static site, no build step. Plain HTML, CSS and JS. Hosted target: GitHub Pages.
Owner: Gautami Kasat, landscape urbanist and urban spatial analyst (MSc KU Leuven, MUSA at Penn Weitzman).

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home. Live waterline hero (WebGL) drawn from real shorelines, cycling Mumbai, the Belgian coast and Philadelphia. Small globe with the current place above it. Then the statement and Selected Projects. |
| `about.html` | Statement, CV bar, City journey (lens globe left, experience scroll box right), Skills & tools with a collapsible Urban design skills section. |
| `work.html` | Heading "Drawn, mapped & built", word filters, then a wall (3 columns, 2 on tablet and phone). Tiles are images only; the name, place and year appear on hover. Clicking (or tapping) a tile opens it in place across two columns and two rows with its summary, meta, an image counter and the link; the rest of the wall glides round it (FLIP animation, `grid-auto-flow: dense`). Escape or Close shuts it. A few in-between cells keep it playful. Reads `projects.json`. |
| `project.html` | Simple image-led project page, built from one `projects.json` entry: `project.html#<id>`. |
| `contact.html` | Email, LinkedIn. Still a stand-in. |

## Design system

- Colours (CSS tokens on `:root`): paper `#F3F1EB`, paper-2 `#E7E4DC`, ink `#151515`, ink-soft `#5B5953`, water blue `#2F45C6`, now orange `#EF5A2A`, rust `#B9400F` (orange as text), land `#FBFAF6`.
- Meaning: blue is water and education; orange is now (ongoing, learning at Penn, the current place). Nothing else gets colour.
- Type: Instrument Sans (body, name), Instrument Sans condensed via `font-stretch` (labels, big headings), Instrument Serif (statements). All type flows through `--sans`, `--cond`, `--cond-stretch`, `--serif` and the scale tokens `--disp`, `--body`, `--ser`.
- No drop shadows, no gradients, no rounded cards, no emoji, no stock icons. Hairlines (`--hair`) and ink rules instead of boxes.
- Every page shares the header (hides on scroll down, returns on scroll up) and the footer (email left, LinkedIn | GitHub right). The Work page footer has no rule above it; Gautami asked for no long lines there.
- Home: the place name ("Mumbai, IN") sits centred above the small globe and only slides sideways if it would run off a narrow screen (`keepLabelIn`).

## Adding work

All Work cards come from `projects.json`. One entry per project:

```json
{
  "id": "floodable-park",
  "title": "Living in a Floodable Park",
  "summary": "One sentence.",
  "place": "Middelkerke, BE",
  "year": "2024–25",
  "status": "ongoing",
  "categories": ["urban-design", "research"],
  "tools": ["ArcGIS"],
  "image": "projects/floodable-park/cover.jpg",
  "link": "project.html#floodable-park",
  "linkType": "page",
  "images": ["projects/floodable-park/01.jpg", "projects/floodable-park/02.jpg"],
  "featured": true
}
```

- `link` decides where the card goes:
  - a project's own HTML, e.g. a Quarto render committed at `projects/<id>/index.html` (use `linkType: "quarto"`);
  - `project.html#<id>` for a design project shown as images (`linkType: "page"`, fill `images`);
  - a PDF (`"pdf"`), slides (`"slides"`), a repo (`"github"`) or any outside URL (`"site"`).
  - Empty `link` shows the card as "Coming soon".
- `status: "ongoing"` adds the orange Ongoing tag. `categories` use the ids in the `categories` list; the visible filter names are the `name` fields (Places & landscapes, Research, Maps, Data stories, AI experiments, Climate) and "Everything" for all.
- A filter only shows once at least one project uses it, so Data stories appears with the first notebook.
- Tiles never show category tags or text under the image. `summary` appears only when a tile is opened, and on `project.html`.
- `image` plus `images` form the little gallery inside an opened tile (click the image or the counter to step through). Empty strings show as grey placeholders until real images exist.
- `fillers` (top level) are the in-between cells on the Everything view: `blank`, `places` (coordinates that tick through a list), `water` (moving waterlines round an island), `line` (one serif sentence) and `now` (orange dot plus a short note). `after` is the project id they follow. They hide when a filter is picked.
- Covers: 4:3, roughly 1600 × 1200, JPG or WebP under ~300 KB. Put assets in `projects/<id>/`.

Planned: a small script (`tools/build_projects.py`) that scans `projects/*/meta.json` and merges them with hand-written entries into `projects.json`, so a new Quarto project only needs its folder plus a `meta.json`. `featured: true` should also drive the home page Selected Projects grid, which is still hard-coded.

## Water fields (home hero)

- `fields/<key>.png` encode a signed distance field (metres to the shoreline, sqrt-compressed, 16-bit in R/G). Lines are drawn only where the value is positive (water).
- Built by `tools/build_fields2.py` (Python: numpy, scipy, Pillow, basemap + basemap-data-hires for GSHHG shorelines).
  - mumbai: GSHHG full resolution.
  - coast: GSHHG plus OpenStreetMap harbour basins connected to the sea at Oostende (HOT export `hotosm_bel_waterways_osm_geojson`).
  - philadelphia: Philadelphia Water Department "Hydrographic Features (Poly)", Delaware and Schuylkill only.
- The source GeoJSONs are large and not in the repo. Update the `GEO` path at the top of the script before rebuilding.
- Per-place framing (`focus`, `zoom`) and line spacing (`density`) live in the `SITES` array in `index.html`.

## Development tuners (remove before launch)

- Home page **Tune** box: name size, hello/role size, globe position and size, time on each place, transition length, line drift. Values live in localStorage keys `gk-*`.
- **Fonts** box on every page (`tools/fontpanel.html`, injected by `tools/inject_fonts.py`): main face, condensed face, serif, and size scales. Keys `gk-ft-*`.
- When Gautami settles on values, copy them into the CSS/JS defaults and delete both boxes.

## Local folder

Gautami's working copy lives at `D:\00_MUSA_EVERTHING\Gautami_Portfolio\gautamikasat01`. Its `References/` folder is her moodboard of other sites and images; it is not part of the site and `.gitignore` keeps it out of the repo.

GitHub: user `gautamik01`. The site is meant to publish from the repo `gautamik01.github.io` (GitHub Pages, branch `main`, root), live at https://gautamik01.github.io. Gautami uses GitHub Desktop to commit and push.

## Open items

- CV PDF: set `CV_URL` near the top of the script in `about.html`.
- Real cover images and project images for every card.
- Real title and year for "Godavari River Edge" (working title), year for Campus Forest, end month for AIGA Philadelphia.
- Links for Raasta's project site, The Overlap and That Sinking Feeling.
- Contact page design.
- Fonts: Adobe Fonts (e.g. Neue Haas Grotesk) can replace Instrument Sans once the site has its own domain and an Adobe web project.
- Home page Selected Projects should read `projects.json` (`featured`).
- Optional: carry the new coast and Philadelphia fields into the bead-hero alternative (`dots/`).

## Writing rules for site copy

Short, plain, specific. No em dashes. No marketing phrases. One sentence per project or role detail. Do not invent project titles, dates or claims; leave a field empty instead.
