#!/usr/bin/env python3
"""Inline key allowlists from keys/*.txt into a pipeline script and print the result for use_figma.

    python3 scripts/build.py scripts/pipeline/03-census.js [CONFIG overrides as NAME=JSON ...]

Tokens replaced in the script:
    /*@LC*/     -> Set of 🫟 ДС Платформа set keys (8 chars)
    /*@GR*/     -> Set of 🦄 Графика set keys (10 chars)
    /*@ORG*/    -> Set of 🦄 Органайзер set keys (8 chars)
    /*@LKEYS*/  -> array of ДС Платформа text styles {k, f, z, w}
    /*@NAMES*/  -> array of DS component names (keys/component-names.txt) for detached-copy search
    /*@GUARD*/  -> scripts/lib/geo-guard.js: parent-geometry guard for scripts that insert or unwrap nodes
    /*@SNAP*/   -> scripts/lib/snap-unit.js: what the in-file snapshot stores per screen (shared by 00c and 01b)
Overrides replace the value of `const NAME = ...;` on the first line that declares it, e.g. PAGE='"Mobile"'.
The output is checked for U+2028/U+2029 (they break use_figma) and wrapped-syntax errors via node, if available.
"""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_keys(name):
    with open(os.path.join(ROOT, 'keys', name)) as f:
        return [l.strip() for l in f if l.strip() and not l.startswith('#')]


def js_set(items):
    return 'new Set("%s".split(\',\'))' % ','.join(items)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = open(sys.argv[1]).read()
    lkeys = []
    for line in read_keys('library-text-styles.txt'):
        k, f, z, w = line.split(',')
        lkeys.append({'k': k, 'f': f, 'z': int(z), 'w': w})
    src = (src.replace('/*@LC*/', js_set(read_keys('library-sets.txt')))
              .replace('/*@GR*/', js_set(read_keys('grafika-sets.txt')))
              .replace('/*@ORG*/', js_set(read_keys('organizer-sets.txt')))
              .replace('/*@LKEYS*/', json.dumps(lkeys, separators=(',', ':')))
              .replace('/*@NAMES*/', json.dumps(read_keys('component-names.txt'), ensure_ascii=False))
              .replace('/*@GUARD*/', open(os.path.join(ROOT, 'scripts', 'lib', 'geo-guard.js')).read())
              .replace('/*@SNAP*/', open(os.path.join(ROOT, 'scripts', 'lib', 'snap-unit.js')).read()))
    for arg in sys.argv[2:]:
        name, val = arg.split('=', 1)
        src, n = re.subn(r'const %s = [^;]*;' % re.escape(name), lambda m: 'const %s = %s;' % (name, val), src, count=1)
        if not n:
            sys.exit('override target not found: ' + name)
    if '\u2028' in src or '\u2029' in src:
        sys.exit('U+2028/2029 in script — use String.fromCharCode(0x2028) instead')
    try:
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as t:
            t.write('(async()=>{\n' + src + '\n})')
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        if r.returncode:
            sys.exit('syntax error:\n' + r.stderr)
    except FileNotFoundError:
        pass
    sys.stdout.write(src)


if __name__ == '__main__':
    main()
