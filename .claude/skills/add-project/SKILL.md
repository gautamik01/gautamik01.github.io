---
name: add-project
description: Add a new project to Gautami's portfolio (projects.json, the Work wall, project images) from a folder of images, a Quarto or R/Python notebook render, a PDF or a link. Use when she says add a project, new project, put this on the site, or drops project files in.
---

# Add a project to the portfolio

Read `CLAUDE.md` first if you haven't this session. The goal: one new entry in `projects.json`, its files in `projects/<id>/`, checked in the browser, ready for Gautami to commit and push in GitHub Desktop.

What she said when starting this: $ARGUMENTS

## 1. Get the facts (ask only for what's missing, in one short message)

- Title. If she only has a working title, use it and say so in the summary only if she wants.
- Place ("City, CC", e.g. "Philadelphia, US") and year ("2026" or "2024–25").
- One-sentence summary in her voice: plain, specific, no em dashes, no marketing words.
- Categories, using only the ids in `projects.json` → `categories`: urban-design (Places & landscapes), research, cartography (Maps), data (Data stories), ai (AI experiments), climate.
- Tools (e.g. ArcGIS, R, Python, Quarto, Rhino).
- Ongoing or finished (`"status": "ongoing"` adds the orange dot).
- Where the tile should lead: an image page, a notebook, a PDF, slides, a repo or an outside link.
- Featured on the home page or not.

Never invent a title, date, client, award or claim. If something is unknown, leave the field as `""` and list it at the end as an open item.

## 2. Make the id and folder

`id` is the title in lowercase kebab-case, e.g. "Living in a Floodable Park" becomes `floodable-park` (shorten sensibly). Files go in `projects/<id>/`.

## 3. Bring in the files

**Images (design projects, maps, drawings)**

```
python tools/prep_images.py "<folder with her originals>" <id>
```

(On Windows `py` may work where `python` doesn't. If Pillow is missing: `python -m pip install pillow`.)
This writes `cover.jpg` (4:3, 1600 × 1200) and `01.jpg, 02.jpg …` (long edge 2000 px) and prints the `image` and `images` lines. Open `cover.jpg` and look at it: if the crop cuts the drawing badly, rerun with `--cover "<better file>"`. Order the gallery the way she wants by renaming originals or by editing the `images` list. Use `"link": "project.html#<id>"` and `"linkType": "page"`.

**Quarto / R Markdown / Jupyter (Data stories)**

Best is one self-contained file. In the `.qmd` front matter:

```yaml
format:
  html:
    embed-resources: true
```

Render, then copy the HTML to `projects/<id>/index.html`. If it can't be self-contained, copy the HTML and its `<name>_files/` folder together and keep their names. Use `"link": "projects/<id>/index.html"` (or the real file name), `"linkType": "quarto"`, category `data`. Make a cover from a strong chart or map screenshot with `prep_images.py`.

**PDF**: copy to `projects/<id>/<id>.pdf` (keep it under about 15 MB), `"linkType": "pdf"`.
**Outside link or repo**: `"link": "https://…"`, `"linkType": "site"` or `"github"`.

## 4. Add the entry to projects.json

Copy the shape of an existing entry. Keep the order: ongoing work first, then newest to oldest. If it's featured, set `"featured": true`. If there's a filler cell in `fillers` whose `after` points at a neighbour, leave it alone unless the wall looks crowded.

## 5. Check it in the browser

From the site folder run `python -m http.server 8000` and open http://localhost:8000/work.html (use the desktop app's browser pane if available):

- the tile shows the cover, hover shows the name with place and year, nothing else;
- clicking opens it in place with the summary, meta, image counter and the right link;
- the filter counts went up for its categories (a new category filter appears once it has a project);
- the link works (image page, notebook, PDF);
- at phone width (about 390 px) tapping opens it and the page doesn't scroll sideways.

## 6. Hand back

Tell Gautami in two or three lines what was added and anything still missing, then: "In GitHub Desktop, commit with the summary `Add <title>` and click Push origin. The live site updates in a few minutes."
