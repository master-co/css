"""Run an audit command with one package's fixtures copied into a disposable tree.

Usage: python3 isolated-package.py packages/next <command...>
Sources outside that package are shared read-only by convention. Only use inspected
commands whose writes are package-local or ignored dependency build artifacts.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

repo = Path(__file__).resolve().parents[4]
unit = Path(sys.argv[1])
command = sys.argv[2:]
assert (len(unit.parts) == 2 and unit.parts[0] in ('packages', 'examples')) or (len(unit.parts) == 1 and unit.name in ('site', 'internal', 'benchmarks'))
(repo / 'tmp').mkdir(exist_ok=True)
root = Path(tempfile.mkdtemp(prefix='master-css-bh-isolated-', dir=repo / 'tmp'))
try:
    for entry in repo.iterdir():
        if entry.name in ('.git', '.ai', 'tmp', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'):
            continue
        if entry.name != unit.parts[0]:
            (root / entry.name).symlink_to(entry, target_is_directory=entry.is_dir())
    if len(unit.parts) == 2:
        group = root / unit.parts[0]
        group.mkdir()
        for entry in (repo / unit.parts[0]).iterdir():
            if entry.name != unit.name:
                (group / entry.name).symlink_to(entry, target_is_directory=entry.is_dir())
    (root / '.ai').mkdir()
    (root / '.ai/contracts').symlink_to(repo / '.ai/contracts', target_is_directory=True)
    ignore_outputs = shutil.ignore_patterns('node_modules', 'dist', '.next', '.nuxt', '.output', '.results',
                                    '.svelte-kit', '.vercel', '.astro', 'out', 'tmp', 'test-results',
                                    '.git', '.env', '.env.*', '.dev.vars*', '.wrangler', 'database.sqlite')
    def ignored(directory, names):
        if 'vendor' in Path(directory).relative_to(repo / unit).parts:
            return set()
        return ignore_outputs(directory, names)
    shutil.copytree(repo / unit, root / unit, symlinks=True, ignore=ignored)
    # Preserve pnpm resolution without copying dependencies or touching the lockfile.
    for directory in (repo / unit).rglob('node_modules'):
        if any(p in ('node_modules', 'tmp', '.next', '.nuxt', '.output')
               for p in directory.relative_to(repo / unit).parts[:-1]):
            continue
        target = root / directory.relative_to(repo)
        if target.parent.exists() and not target.exists():
            target.symlink_to(directory, target_is_directory=True)
    print(json.dumps({'cwd': str(root / unit), 'command': command}), flush=True)
    result = subprocess.run(command, cwd=root / unit)
    print(json.dumps({'exit_code': result.returncode, 'cleanup': str(root)}), flush=True)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(root)
