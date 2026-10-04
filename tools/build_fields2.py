"""Build the hero's water fields from real data.

For each place this writes:
  fields/<key>.png        1024 px RGBA. R/G = signed distance in metres (sqrt-compressed, 16 bit):
                          positive where the waterlines are drawn, negative elsewhere.
  fields/<key>-water.png  2048 px greyscale (optional). Inland water that is too narrow for
                          waterlines: polder ditches and drains, creeks, river surfaces.

Sources
  mumbai        GSHHG full-resolution shoreline
  coast         GSHHG shoreline + OpenStreetMap (HOT export, Aug 2026): harbour basins, canals,
                ponds as water; ditches, drains and streams as hairlines
  philadelphia  Philadelphia Water Department, Hydrographic Features (polygons).
                Lines spread across the land from the Delaware and the Schuylkill (the valleys);
                every open (not culverted) river and creek is drawn as water.
"""
import json, math, sys, os, warnings
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, gaussian_filter
warnings.filterwarnings('ignore')

N = 1024          # sd texture size
NW = 2048         # water texture size
DMAX = 40000.0
M = 2.0           # compute distances on a 2x larger area so the edges are honest
SS = 2            # supersampling
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'fields')
GEO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'geodata')   # bel_coast_waterways.geojson, philly_hydro.geojson

SITES = {
  'mumbai':       {'center': (72.885, 19.020), 'side': 40000, 'src': 'gshhs'},
  'coast':        {'center': (2.925, 51.212),  'side': 24000, 'src': 'osm-be'},
  'philadelphia': {'center': (-75.165, 39.945), 'side': 14000, 'src': 'pwd'},
}

def frame(cfg, scale):
    lon0, lat0 = cfg['center']
    kx = math.cos(math.radians(lat0)) * 111320.0; ky = 110540.0
    def to_px(lon, lat, span, npx):
        mpp = span / npx
        return ((lon - lon0) * kx + span / 2) / mpp, (span / 2 - (lat - lat0) * ky) / mpp
    return kx, ky, to_px

def rings(geom):
    t = geom['type']; c = geom['coordinates']
    if t == 'Polygon': yield c
    elif t == 'MultiPolygon':
        for p in c: yield p

def draw_poly(d, poly, fn, fill, hole):
    ext = [fn(x, y) for x, y, *_ in poly[0]]
    if len(ext) >= 3: d.polygon(ext, fill=fill)
    for h in poly[1:]:
        pts = [fn(x, y) for x, y, *_ in h]
        if len(pts) >= 3: d.polygon(pts, fill=hole)

def gshhs_land(cfg, big, NB, to_px):
    from mpl_toolkits.basemap import Basemap
    lon0, lat0 = cfg['center']; kx = math.cos(math.radians(lat0)) * 111320.0
    hx = big / 2 / kx; hy = big / 2 / 110540.0
    m = Basemap(projection='cyl', llcrnrlon=lon0 - hx, llcrnrlat=lat0 - hy, urcrnrlon=lon0 + hx, urcrnrlat=lat0 + hy, resolution='f')
    img = Image.new('L', (NB, NB), 0); d = ImageDraw.Draw(img)
    for (xs, ys), t in sorted(zip(m.coastpolygons, m.coastpolygontypes), key=lambda q: q[1]):
        pts = [to_px(a, b, big, NB) for a, b in zip(xs, ys)]
        if len(pts) >= 3: d.polygon(pts, fill=1 if t in (1, 3) else 0)
    return img

def signed(mask_lines_region, mpp):
    """mask True where lines are drawn (water, or land for valleys). Returns signed distance in metres."""
    inside = distance_transform_edt(mask_lines_region) * mpp
    outside = distance_transform_edt(~mask_lines_region) * mpp
    return np.where(mask_lines_region, inside, -outside)

def encode(sd):
    v = 0.5 + 0.5 * np.sign(sd) * np.sqrt(np.clip(np.abs(sd), 0, DMAX) / DMAX)
    q = np.clip(np.round(v * 65535), 0, 65535).astype(np.uint32)
    rgba = np.zeros(sd.shape + (4,), np.uint8)
    rgba[..., 0] = q >> 8; rgba[..., 1] = q & 255; rgba[..., 3] = 255
    return Image.fromarray(rgba, 'RGBA')

def build(key, cfg):
    side = cfg['side']; big = side * M; NB = int(N * M * SS); mpp = big / NB
    kx, ky, to_px = frame(cfg, 1)
    big_px = lambda lon, lat: to_px(lon, lat, big, NB)
    WS = NW * 2                                         # water layer, 2x supersampled over the window only
    win_px = lambda lon, lat: to_px(lon, lat, side, WS)
    water = None
    invert = False

    if cfg['src'] == 'gshhs':
        land = np.array(gshhs_land(cfg, big, NB, to_px), bool)
        region = ~land

    elif cfg['src'] == 'osm-be':
        # the sea, plus the port basins that open onto it; everything inland stays paper
        from scipy.ndimage import label as cc_label
        land = np.array(gshhs_land(cfg, big, NB, to_px), bool)
        cand = Image.new('L', (NB, NB), 0); d = ImageDraw.Draw(cand)
        PORT = (2.895, 51.200, 2.975, 51.250)                 # Oostende harbour
        feats = json.load(open(os.path.join(GEO, 'bel_coast_waterways.geojson')))['features']
        n = 0
        for f in feats:
            p = f['properties']; g = f['geometry']
            if not g or p.get('tunnel') or g['type'] not in ('Polygon', 'MultiPolygon'): continue
            if p.get('natural_class') != 'water' and not p.get('water'): continue
            for poly in rings(g):
                xs = [c[0] for c in poly[0]]; ys = [c[1] for c in poly[0]]
                if max(xs) < PORT[0] or min(xs) > PORT[2] or max(ys) < PORT[1] or min(ys) > PORT[3]: continue
                draw_poly(d, poly, big_px, 1, 0); n += 1
        water = (~land) | np.array(cand, bool)
        lab, _ = cc_label(water)
        sea_ids = np.unique(lab[~land & (lab > 0)])
        # keep only water connected to the sea, and only inside the port area
        x0, y1 = big_px(PORT[0], PORT[1]); x1, y0 = big_px(PORT[2], PORT[3])
        inport = np.zeros_like(water); inport[int(max(0, y0)):int(y1), int(max(0, x0)):int(x1)] = True
        region = (~land) | (np.isin(lab, sea_ids) & inport)
        print(f'  {key}: {n} port polygons considered, {int((region & land).sum())} px of port water kept')
        water = None

    elif cfg['src'] == 'pwd':
        # the two rivers only: lines inside the water, like soundings
        from scipy.ndimage import binary_closing
        rimg = Image.new('L', (NB, NB), 0); d = ImageDraw.Draw(rimg)
        feats = json.load(open(os.path.join(GEO, 'philly_hydro.geojson')))['features']
        n_main = 0
        for f in feats:
            p = f['properties']; g = f['geometry']
            if not g or p.get('creek_name') not in ('Delaware River', 'Schuylkill River'): continue
            for poly in rings(g): draw_poly(d, poly, big_px, 1, 0); n_main += 1
        river = binary_closing(np.array(rimg, bool), iterations=2)   # close the seams between river segments
        print(f'  {key}: {n_main} river polygons')
        region = river
        water = None

    sd = signed(region, mpp)
    sd = gaussian_filter(sd, 2.2)
    o = (NB - N * SS) // 2
    sd = sd[o:o + N * SS, o:o + N * SS].reshape(N, SS, N, SS).mean(axis=(1, 3))
    encode(sd).save(os.path.join(OUT, key + '.png'), optimize=True)
    has_water = water is not None
    if has_water:
        water.resize((NW, NW), Image.BOX).save(os.path.join(OUT, key + '-water.png'), optimize=True)
    lon0, lat0 = cfg['center']
    meta = {'lon0': lon0, 'lat0': lat0, 'side': side, 'n': N, 'dmax': DMAX, 'invert': invert, 'water': has_water,
            'west': lon0 - side / 2 / kx, 'east': lon0 + side / 2 / kx, 'south': lat0 - side / 2 / ky, 'north': lat0 + side / 2 / ky,
            'linesShare': round(float((sd > 0).mean()), 3)}
    print(' ', key, {k: meta[k] for k in ('side', 'invert', 'water', 'linesShare')})
    return meta

if __name__ == '__main__':
    only = sys.argv[1:]
    path = os.path.join(OUT, 'fields.json')
    meta = json.load(open(path)) if os.path.exists(path) else {}
    meta = {k: v for k, v in meta.items() if k in SITES}
    for k, v in SITES.items():
        if not only or k in only: meta[k] = build(k, v)
    json.dump(meta, open(path, 'w'), indent=1)
