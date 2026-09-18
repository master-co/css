"""Build disposable package copies and check exported types without workspace aliases.

Usage: python3 package-declaration-builds.py NEW_OUTPUT_DIR [CONFIG_FILE]
No install, root build, artifact promotion, or server startup is performed.
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

repo = Path(__file__).resolve().parents[4]
output = Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=False)
config = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else repo / 'shared/tsdown-package.config.ts'
root = Path(tempfile.mkdtemp(prefix='master-package-declarations-'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
results = {'root': str(root), 'config': str(config), 'configSha256': sha(config), 'packages': {}}

def run(name, command, cwd):
    with (output / (name + '.log')).open('w') as log:
        result = subprocess.run(command, cwd=cwd, stdout=log, stderr=subprocess.STDOUT)
    return result.returncode

try:
    for name in ['tooling', 'language-server', 'mcp']:
        original = repo / 'packages' / name
        work = root / name
        package = work / 'packages' / name
        package.mkdir(parents=True)
        shutil.copytree(original / 'src', package / 'src')
        for file in original.glob('*.json'):
            shutil.copy2(file, package / file.name)
        shutil.copy2(repo / 'tsconfig.json', work / 'tsconfig.json')
        (work / 'node_modules').symlink_to(repo / 'node_modules', target_is_directory=True)
        (package / 'node_modules').symlink_to(original / 'node_modules', target_is_directory=True)
        (work / 'shared').mkdir()
        shutil.copy2(config, work / 'shared/tsdown-package.config.ts')
        record = results['packages'][name] = {}
        record['build'] = run(name + '-build', ['node', str(repo / 'scripts/with-typescript-tooling-compat.mjs'),
            'node', str(repo / 'node_modules/tsdown/dist/run.mjs'), '--config', '../../shared/tsdown-package.config.ts'], package)
        if record['build']:
            continue
        manifest = json.loads((package / 'package.json').read_text())
        consumer = work / 'consumer'
        modules = consumer / 'node_modules'
        modules.mkdir(parents=True)
        # Direct dependencies use the installed versions; only the tested package is copied.
        for dependency in (original / 'node_modules').iterdir():
            if dependency.name.startswith('@'):
                scope = modules / dependency.name
                scope.mkdir(exist_ok=True)
                for item in dependency.iterdir():
                    if dependency.name + '/' + item.name != manifest['name']:
                        (scope / item.name).symlink_to(item.resolve(), target_is_directory=True)
            elif not dependency.name.startswith('.'):
                (modules / dependency.name).symlink_to(dependency.resolve(), target_is_directory=True)
        if not (modules / '@types').exists():
            (modules / '@types').symlink_to(repo / 'node_modules/@types', target_is_directory=True)
        elif not (modules / '@types/node').exists():
            (modules / '@types/node').symlink_to((repo / 'node_modules/@types/node').resolve(), target_is_directory=True)
        destination = modules / manifest['name']
        destination.mkdir(parents=True)
        shutil.copy2(package / 'package.json', destination / 'package.json')
        shutil.copytree(package / 'dist', destination / 'dist')
        imports = [manifest['name'] + (key[1:] if key != '.' else '')
            for key, value in manifest['exports'].items() if isinstance(value, dict) and 'types' in value]
        (consumer / 'package.json').write_text('{"type":"module"}\n')
        (consumer / 'consumer.ts').write_text('\n'.join(
            f'import * as surface{i} from "{entry}"; void surface{i};' for i, entry in enumerate(imports)) + '\n')
        (consumer / 'tsconfig.json').write_text(json.dumps({'compilerOptions': {
            'module': 'NodeNext', 'moduleResolution': 'NodeNext', 'target': 'ES2024',
            'strict': True, 'skipLibCheck': False, 'noEmit': True, 'types': ['node']}, 'files': ['consumer.ts']}))
        record['types'] = run(name + '-types', ['node', str(repo / 'node_modules/typescript6/lib/tsc.js'),
            '-p', 'tsconfig.json'], consumer)
        record['entrypoints'] = imports
        record['files'] = {str(f.relative_to(package / 'dist')): sha(f)
            for f in (package / 'dist').rglob('*') if f.is_file()}
finally:
    (output / 'results.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps({k: {a: b for a, b in v.items() if a != 'files'}
    for k, v in results['packages'].items()}, indent=2))
