"""
Get a project's images ready for the site.

    python tools/prep_images.py "<folder with the original images>" <project-id> [--cover <file name>] [--keep-cover]

What it does
- Makes projects/<project-id>/cover.jpg: the cover, cropped to 4:3 around the centre, 1600 x 1200.
- Makes projects/<project-id>/01.jpg, 02.jpg ... from every image in the folder (name order),
  with the long edge at most 2000 px. The image used for the cover is left out of this list
  unless --keep-cover is given, so the gallery doesn't show it twice.
- Phone photos are turned the right way up, colour is kept in sRGB, transparent PNGs sit on paper colour,
  and location data in the files is dropped.
- Prints the "image" and "images" lines to paste into projects.json.

Needs Pillow:  python -m pip install pillow
"""
import argparse, json, os, sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit('Pillow is missing. Run:  python -m pip install pillow')

PAPER = (243, 241, 235)
EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp')
COVER = (1600, 1200)
LONG_EDGE = 2000
QUALITY = 82


def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, PAPER)
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def save(im, path):
    im.save(path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
    return os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser(description='Prepare cover and gallery images for one project.')
    ap.add_argument('source', help='folder with the original images')
    ap.add_argument('id', help='project id, e.g. floodable-park')
    ap.add_argument('--cover', help='file name in the source folder to use as the cover (default: the first one)')
    ap.add_argument('--keep-cover', action='store_true', help='also keep the cover image in the gallery')
    a = ap.parse_args()

    files = sorted(f for f in os.listdir(a.source) if f.lower().endswith(EXTS) and not f.startswith('.'))
    if not files:
        sys.exit('No images found in ' + a.source)
    cover_name = a.cover or files[0]
    if cover_name not in files:
        sys.exit('Cover "%s" is not in the folder. Images found: %s' % (cover_name, ', '.join(files)))

    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, '..', 'projects', a.id)
    os.makedirs(out, exist_ok=True)

    cover = ImageOps.fit(load(os.path.join(a.source, cover_name)), COVER, Image.LANCZOS, centering=(0.5, 0.5))
    kb = save(cover, os.path.join(out, 'cover.jpg')) // 1024
    print('cover.jpg  from %s  (%d KB)' % (cover_name, kb))

    gallery, n = [], 0
    for f in files:
        if f == cover_name and not a.keep_cover:
            continue
        n += 1
        im = load(os.path.join(a.source, f))
        im.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)
        name = '%02d.jpg' % n
        kb = save(im, os.path.join(out, name)) // 1024
        gallery.append('projects/%s/%s' % (a.id, name))
        print('%s     from %s  %dx%d  (%d KB)' % (name, f, im.width, im.height, kb))

    print('\nPaste into the project entry in projects.json:')
    print('  "image": %s,' % json.dumps('projects/%s/cover.jpg' % a.id))
    print('  "images": %s,' % json.dumps(gallery))


if __name__ == '__main__':
    main()
