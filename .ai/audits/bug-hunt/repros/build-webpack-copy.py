"""Build an owned disposable Webpack package with normal private-source topology.

Usage: python3 build-webpack-copy.py NEW_STATE_FILE
Uses installed dependencies; never installs, builds live output, or promotes files.
The recorded copy can run serial tests. Do not rebuild it after an artifact swap.
"""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile

repo = Path(__file__).resolve().parents[4]
state_file = Path(sys.argv[1]).resolve()
if state_file.exists():
    raise FileExistsError(state_file)
root = Path(tempfile.mkdtemp(prefix='master-webpack-copy-')).resolve()
package = root / 'packages/webpack'
package_names = ['webpack', 'internal', 'schema', 'preset'] + (['compiler'] if os.environ.get('BH_COPY_COMPILER') else [])
for name in package_names:
    source, destination = repo / 'packages' / name, root / 'packages' / name
    destination.mkdir(parents=True)
    shutil.copytree(source / 'src', destination / 'src')
    for file in source.iterdir():
        if file.is_file():
            shutil.copy2(file, destination / file.name)
    if name in ['webpack', 'compiler']:
        for folder in ['tests', 'playground']:
            if not (source / folder).exists():
                continue
            shutil.copytree(source / folder, destination / folder,
                            ignore=shutil.ignore_patterns('node_modules', 'dist', '.tsbuild'))
    else:
        shutil.copytree(source / 'dist', destination / 'dist')
        (destination / 'node_modules').symlink_to(source / 'node_modules', target_is_directory=True)


def modules(source, destination):
    destination.mkdir()
    for entry in source.iterdir():
        if entry.name.startswith('.') and entry.name not in ['.bin', '.pnpm']:
            continue
        target = destination / entry.name
        if entry.name.startswith('@') and entry.is_dir():
            modules(entry, target)
        elif entry.exists():
            actual = entry.resolve()
            linked = next((root / 'packages' / name for name in package_names
                           if actual == repo / 'packages' / name), actual)
            target.symlink_to(linked, target_is_directory=entry.is_dir())


modules(repo / 'node_modules', root / 'node_modules')
modules(repo / 'packages/webpack/node_modules', package / 'node_modules')
if 'compiler' in package_names:
    modules(repo / 'packages/compiler/node_modules', root / 'packages/compiler/node_modules')
shutil.copytree(repo / 'shared', root / 'shared', ignore=shutil.ignore_patterns('node_modules', '.tsbuild'))
(root / 'shared/node_modules').symlink_to(repo / 'shared/node_modules', target_is_directory=True)
for file in repo.glob('tsconfig*.json'):
    shutil.copy2(file, root / file.name)
for name in ['package.json', 'pnpm-workspace.yaml', 'eslint.config.js']:
    shutil.copy2(repo / name, root / name)
state = {'root': str(root), 'package': str(package), 'scope': 'Owned disposable package; no shared build or promotion'}
state_file.write_text(json.dumps(state, indent=2) + '\n')
log_file = state_file.with_name(state_file.stem + '-build.log')
if 'compiler' in package_names:
    compiler_log = state_file.with_name(state_file.stem + '-compiler-build.log')
    with compiler_log.open('w') as log:
        compiler_result = subprocess.run(['node', str(repo / 'scripts/with-typescript-tooling-compat.mjs'), 'node', str(repo / 'node_modules/tsdown/dist/run.mjs'), '--config', '../../shared/tsdown-package.config.ts'], cwd=root / 'packages/compiler', stdout=log, stderr=subprocess.STDOUT)
    state['compilerBuildExitCode'] = compiler_result.returncode
    state['compilerBuildLog'] = str(compiler_log)
    if compiler_result.returncode:
        state_file.write_text(json.dumps(state, indent=2) + '\n')
        sys.exit(compiler_result.returncode)
with log_file.open('w') as log:
    result = subprocess.run(['node', str(repo / 'scripts/with-typescript-tooling-compat.mjs'),
                             'node', str(repo / 'node_modules/tsdown/dist/run.mjs'),
                             '--config', '../../shared/tsdown-package.config.ts'],
                            cwd=package, stdout=log, stderr=subprocess.STDOUT)
state['buildExitCode'] = result.returncode
state['buildLog'] = str(log_file)
state_file.write_text(json.dumps(state, indent=2) + '\n')
print(json.dumps(state))
sys.exit(result.returncode)
