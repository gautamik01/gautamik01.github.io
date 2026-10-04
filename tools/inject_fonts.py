import re, sys
panel = open('tools/fontpanel.html').read().strip()
VARS = '--cond: var(--sans); --cond-stretch: 75%; --disp: 1; --body: 1; --ser: 1;'
def inject(fn):
    s = open(fn).read()
    s = re.sub(r'<!-- fonts:start -->.*?<!-- fonts:end -->\n?', '', s, flags=re.S)
    # condensed type follows the controller
    s = re.sub(r'font-stretch:\s?75%', 'font-family: var(--cond); font-stretch: var(--cond-stretch)', s)
    s = s.replace('font-family: var(--cond); font-family: var(--cond);', 'font-family: var(--cond);')
    if '--cond-stretch: 75%' not in s:
        s = re.sub(r'(:root \{[^}]*?)(color-scheme: light;)', lambda m: m.group(1) + VARS + '\n  ' + m.group(2), s, count=1)
    if '</body>' in s: s = s.replace('</body>', panel + '\n</body>', 1)
    else: s = s.rstrip() + '\n' + panel + '\n'
    open(fn, 'w').write(s)
    print(fn, 'cond vars' , s.count('var(--cond-stretch)'), 'root ok', '--cond-stretch: 75%' in s)
for fn in sys.argv[1:]: inject(fn)
