# Gautami Kasat, portfolio site

Static site, no build step. Plain HTML, CSS and JS. Hosted target: GitHub Pages.
Owner: Gautami Kasat, landscape urbanist and urban spatial analyst (MSc KU Leuven, MUSA at Penn Weitzman).

## Working with Gautami

- She's an architect and landscape urbanist, very strong visually, learning Python and R at Penn, newer to git. Explain in plain, short steps; casual and warm, no jargon dumps.
- She works on Windows. She commits and pushes with **GitHub Desktop**; after a change, tell her the one-line commit summary to use. Don't push for her unless she asks.
- Show before you change the look of anything: describe it or preview it, then build. One change at a time, then check desktop (1440 px) and phone (390 px).
- She cares about details and will notice a misplaced line. Match the reference sites she likes: thelupoconcept.com, maximiliankaspar.com, jenniferluu6.github.io, lifeisanillusion.com.
- Never invent facts about her work (titles, dates, clients, awards). Leave fields empty and ask.
- Copy: warm, human, precise. No em dashes, no clichés or marketing phrases. Statements can be a little poetic; everything else plain.
- To add a project, use `/add-project`.
- Python (the tools scripts) runs in her conda environment `geospatial`. Each command is a fresh shell, so don't rely on `conda activate`: call that environment's `python.exe` directly (`conda env list` shows where it lives) or use `conda run -n geospatial`. Ask before installing anything into it.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home. Live waterline hero (WebGL) drawn from real shorelines, cycling Mumbai, the Belgian coast and Philadelphia. Small globe with the current place above it. Then the statement and Selected Projects. |
| `about.html` | Statement, CV bar, City journey (lens globe left, experience scroll box right), Skills & tools with a collapsible Urban design skills section. |
| `work.html` | Heading "Drawn, mapped & built", word filters, then a wall (3 columns, 2 on tablet and phone). Tiles are images only; the name, place and year appear on hover. Clicking (or tapping) a tile opens it in place across two columns and two rows with its summary, meta, an image counter and the link; the rest of the wall glides round it (FLIP animation, `grid-auto-flow: dense`). Escape or Close shuts it. A few in-between cells keep it playful. Reads `projects.json`. |
| `project.html` | Simple image-led project page, built from one `projects.json` entry: `project.html#<id>`. |
| `contact.html` | Email, LinkedIn. Still a stand-in. |
| `404.html` | Shown by GitHub Pages for any missing address. Root-relative links (`/work.html`) so it works at any depth. |
| `og.jpg`, `favicon.svg`, `apple-touch-icon.png` | Share preview image (1200 × 630, the Mumbai hero) and icons. Every page links them in its `<head>` with Open Graph and Twitter tags pointing at https://gautamik01.github.io/. |
| `robots.txt`, `sitemap.xml` | For search engines. Add new top-level pages to the sitemap. |
| `tools/prep_images.py` | Turns a folder of originals into `projects/<id>/cover.jpg` (4:3, 1600 × 1200) and a gallery (`01.jpg…`, long edge 2000 px). Needs Pillow. |
| `.claude/skills/add-project/` | The `/add-project` command: the step-by-step way to add a project. |

## Design system

- Colours (CSS tokens on `:root`): paper `#F3F1EB`, paper-2 `#E7E4DC`, ink `#151515`, ink-soft `#5B5953`, water blue `#2F45C6`, now orange `#EF5A2A`, rust `#B9400F` (orange as text), land `#FBFAF6`.
- Meaning: blue is water and education; orange is now (ongoing, learning at Penn, the current place). Nothing else gets colour.
- Type: Instrument Sans (body, name), Instrument Sans condensed via `font-stretch` (labels, big headings), Instrument Serif (statements). All type flows through `--sans`, `--cond`, `--cond-stretch`, `--serif` and the scale tokens `--disp`, `--body`, `--ser`.
- No drop shadows, no gradients, no rounded cards, no emoji, no stock icons. Hairlines (`--hair`) and ink rules instead of boxes.
- Every page shares the header (hides on scroll down, returns on scroll up) and the footer (email left, LinkedIn | GitHub right). The Work page footer has no rule above it; Gautami asked for no long lines there.
- Home: the place name ("Mumbai, IN") sits centred above the small globe and only slides sideways if it would run off a narrow screen (`keepLabelIn`).

## Adding work

Use `/add-project` (`.claude/skills/add-project/SKILL.md`), which walks through facts, images, notebooks, the JSON entry and the browser check. All Work cards come from `projects.json`. One entry per project:

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

`featured: true` will drive the home page Selected Projects once item 1 in the list below is done.

## Water fields (home hero)

- `fields/<key>.png` encode a signed distance field (metres to the shoreline, sqrt-compressed, 16-bit in R/G). Lines are drawn only where the value is positive (water).
- Built by `tools/build_fields2.py` (Python: numpy, scipy, Pillow, basemap + basemap-data-hires for GSHHG shorelines).
  - mumbai: GSHHG full resolution, 48 km square centred on 72.885 E, 18.99 N (wide enough that Colaba's tip sits clear of the bottom edge).
  - coast: GSHHG plus OpenStreetMap harbour basins connected to the sea at Oostende (HOT export `hotosm_bel_waterways_osm_geojson`).
  - philadelphia: Philadelphia Water Department "Hydrographic Features (Poly)", Delaware and Schuylkill only.
- The source GeoJSONs are large and not in the repo. Update the `GEO` path at the top of the script before rebuilding.
- Per-place framing (`focus`, `zoom`) and line spacing (`density`) live in the `SITES` array in `index.html`.

## Settled settings (from Gautami's tuning, Oct 2026)

The Tune and Fonts panels are gone; their values are now the defaults.
- Home, laptop and up: name one line about 34% of the screen wide (65px at 1440px), "Hello, I am" and role at 21px, globe 97px centred at 93% across and 84% down. Phones keep their own layout (name on two lines, 60px globe top right, low enough that the place name clears the menu). See `LAPTOP` in `index.html`.
- Motion: 6 s on each place, 3.6 s transition, line drift 1x (`DWELL`, `MORPH`, `DRIFT`).
- Type scale on every page: `--disp: 0.6` (big headings), `--body: 0.85` (body text, back to 1 on phones), `--ser: 1`. Faces: Instrument Sans, Instrument Sans condensed, Instrument Serif.
- `tools/fontpanel.html` and `tools/inject_fonts.py` are retired and can be deleted if they're still in the folder.
- Every page must keep its own `<!doctype html>` and `<meta name="viewport">`; without the viewport tag phones render the page at desktop width.

## Local folder

The `References/` folder in Gautami's working copy is her moodboard of other sites and images; it is not part of the site and `.gitignore` keeps it out of the repo. This file is public, so no personal file paths or machine details go in it.

GitHub: user `gautamik01`. The site is meant to publish from the repo `gautamik01.github.io` (GitHub Pages, branch `main`, root), live at https://gautamik01.github.io. Gautami uses GitHub Desktop to commit and push.

## Next: make it more professional (work through in this order, one at a time, showing Gautami each)

1. **Home Selected Projects from `projects.json`.** The tiles on `index.html` are still hand-written placeholders. Read the `featured` projects (up to 6), keep the staggered Lupo-style layout and hover thumbnails, and make each tile open that project on the Work page.
2. **Direct links to a project.** Support `work.html#p=<id>` (keep `#<category>` for filters): on load, open that tile in place and scroll to it; update the hash when a tile opens and clear it on close. She'll paste these links into applications.
3. **Notebooks that look like the site.** A small Quarto theme in `tools/quarto/` (an `.scss` with the paper, ink, blue and orange tokens and the Instrument fonts, plus a header include with GK, a "Back to work" link and the footer) so Data stories feel like part of the portfolio. Document the front matter to use in `/add-project`.
4. **Images done properly** once real covers exist: `width`/`height` on every `<img>` to stop layout jumps, `decoding="async"`, a smaller 800 px version via `srcset` for the wall, and an `alt` field per project in `projects.json` used as alt text.
5. **Contact page.** Still a stand-in. Design it in the same language (big condensed heading, email with copy, LinkedIn, GitHub, CV); ask Gautami what else she wants on it.
6. **CV button** on About: put the PDF in the root and set `CV_URL`.
7. **Quality pass.** Run Lighthouse on all pages (performance, accessibility, best practices, SEO, aim for 90+), tab through the Work wall and About box with the keyboard, check contrast of `--ink-soft` text at its small sizes, and fix what comes up.
8. **Speed.** Self-host the two Google fonts as woff2 in `fonts/` (drops a third-party request), load d3/topojson with `defer` where possible, keep total page weight for Home under ~2 MB.
9. **Later, only if she wants:** her own domain (then Adobe Fonts), privacy-friendly visit counts (e.g. GoatCounter), and per-project share previews (static stubs in `projects/<id>/`).

Ground rules: static files only, no frameworks or build step unless she agrees; keep the design system above; no shadows, gradients or rounded cards; test at 1440 and 390 px before saying it's done.

## Open items

- CV PDF: set `CV_URL` near the top of the script in `about.html`.
- Real cover images and project images for every card.
- Real title and year for "Godavari River Edge" (working title), year for Campus Forest, end month for AIGA Philadelphia.
- Links for Raasta's project site, The Overlap and That Sinking Feeling.
- Contact page design.
- Fonts: Adobe Fonts (e.g. Neue Haas Grotesk) can replace Instrument Sans once the site has its own domain and an Adobe web project.
- Optional: carry the new coast and Philadelphia fields into the bead-hero alternative (`dots/`).

## Writing rules for site copy

Short, plain, specific. No em dashes. No marketing phrases. One sentence per project or role detail. Do not invent project titles, dates or claims; leave a field empty instead.
