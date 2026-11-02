"""Import approved Master artwork; --check verifies the committed copies offline."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
import zipfile


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'site/public'
DEST = PUBLIC / 'brand/v2'
KIT = 'master-css-brand-kit-v2.zip'
SHARED = Path(subprocess.check_output([
    'node', '--input-type=module', '-e',
    'import { fileURLToPath } from "node:url"; console.log(fileURLToPath(import.meta.resolve("@master/internal-site/package.json")))'
], cwd=ROOT, text=True).strip()).parent / 'src/public/brand/v2'


def asset(name):
    """Match the shared public-assets integration's consumer-first resolution."""
    local = DEST / name
    return local if local.is_file() else SHARED / name


def digest(data):
    return hashlib.sha256(data).hexdigest()


def archive(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as output:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(f'master-css-brand-v2/{name}', (2026, 10, 30, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            output.writestr(entry, data)
    return stream.getvalue()


def aliases():
    result = {
        'site/public/images/css-logotype@dark.svg': 'logo/master-css/master-css-horizontal-on-dark.svg',
        'site/public/images/css-logotype@light.svg': 'logo/master-css/master-css-horizontal-on-light.svg',
        'site/public/images/css-logotype@light.png': 'logo/png/master-css-horizontal-on-light@2x.png',
        'site/public/images/logo.svg': 'logo/mark/master-mark-on-dark.svg',
        'site/public/favicon.svg': 'icon/favicon.svg',
        'site/public/favicon.ico': 'icon/favicon.ico',
        'packages/vscode/icon.png': 'icon/png/avatar-460.png',
        'packages/figma/master.svg': 'icon/favicon.svg',
        'examples/svelte/static/master-css.logotype@light.svg': 'logo/master-css/master-css-horizontal-on-light.svg',
    }
    for mode in ['dark', 'light']:
        result[f'examples/next.js/public/css-logotype@{mode}.svg'] = f'logo/master-css/master-css-horizontal-on-{mode}.svg'
    for name, folder in [('blank', 'public'), ('lit', 'src/assets'), ('react', 'src/assets'),
                         ('nuxt.js', 'public'), ('svelte', 'static'), ('vite', 'public'), ('webpack', 'assets')]:
        result[f'examples/{name}/{folder}/master.svg'] = 'icon/favicon.svg'
    return result


def sync(source):
    brand = source / 'brand'
    revision = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain', '--', 'brand'], text=True):
        raise SystemExit('Commit the approved brand source before importing it.')
    paths = sorted({p for pattern in [
        'logo/mark/*.svg', 'logo/master-css/**/*.svg', 'logo/png/master-css-*.png',
        'logo/png/master-mark-*.png', 'icon/*.svg', 'icon/*.ico', 'icon/png/*.png',
        'social/master-css-*.svg', 'social/png/master-css-*.png',
    ] for p in brand.glob(pattern)})
    files = {str(p.relative_to(brand)): p.read_bytes() for p in paths}
    entries = []
    for name, data in files.items():
        entry = {'src': f'/brand/v2/{name}', 'source': f'brand/{name}', 'sha256': digest(data)}
        if name.endswith('.svg'):
            entry['viewBox'] = ET.fromstring(data).attrib['viewBox']
        entries.append(entry)
    manifest = {'sourceRepository': 'https://github.com/master-co/master', 'sourceRevision': revision,
                'assets': entries, 'aliases': aliases()}
    files['manifest.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
    files['README.md'] = (source / 'site/content/brand/master-css/assets.md').read_bytes()
    for name, data in files.items():
        target = DEST / name
        if not target.exists() and (SHARED / name).is_file():
            if (SHARED / name).read_bytes() != data:
                raise SystemExit(f'Upgrade @master/internal-site before importing changed shared artwork: {name}')
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
    (DEST / KIT).write_bytes(archive(files))
    for name, original in aliases().items():
        (ROOT / name).write_bytes(files[original])
    print(f'Imported {len(entries)} assets from {revision}.')


def check(source=None):
    manifest = json.loads((DEST / 'manifest.json').read_text())
    for entry in manifest['assets']:
        data = asset(entry['src'].removeprefix('/brand/v2/')).read_bytes()
        assert digest(data) == entry['sha256'], entry['src']
        if source:
            assert data == (source / entry['source']).read_bytes(), entry['source']
    for name, original in manifest['aliases'].items():
        assert (ROOT / name).read_bytes() == asset(original).read_bytes(), name
    if source:
        assert (DEST / 'README.md').read_bytes() == (source / 'site/content/brand/master-css/assets.md').read_bytes()
    files = {str(p.relative_to(DEST)): p.read_bytes() for p in DEST.rglob('*') if p.is_file() and p.name != KIT}
    for entry in manifest['assets']:
        name = entry['src'].removeprefix('/brand/v2/')
        files[name] = asset(name).read_bytes()
    assert (DEST / KIT).read_bytes() == archive(files), 'Download kit differs from the published assets'
    print(f'Verified {len(manifest["assets"])} assets, {len(manifest["aliases"])} aliases and the complete ZIP.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='Checkout of the Master brand source repository')
    parser.add_argument('--check', action='store_true', help='Verify without changing files; source is optional')
    args = parser.parse_args()
    if not args.check:
        if not args.source:
            parser.error('--source is required when importing artwork')
        sync(args.source.resolve())
    check(args.source.resolve() if args.source else None)
