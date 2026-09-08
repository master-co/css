"""Run the two remaining original static children and preserve their outputs."""
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import tarfile

assert 'master-css-bh-isolated-' in str(Path.cwd())
audit = Path(__file__).resolve().parents[1]
evidence = audit / 'evidence'
suite = Path('.results/runtime-style-invalidation-diagnostics')
results = []
for mode in ['master-static', 'tailwind-static']:
    variant = f'stress-dom-{mode}-style-invalidation-static-baseline'
    env = {**os.environ, 'RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_VARIANT': variant,
           'RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_ROUNDS': '1',
           'RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_WARMUP_ROUNDS': '0'}
    run = subprocess.run(['node', '--import', 'tsx', 'runtime-style-invalidation-diagnostics/run-report.ts'], env=env, timeout=180)
    assert run.returncode == 0, (variant, run.returncode)
    report = json.loads((suite / 'report.json').read_text())
    (evidence / f'0084-{mode}-report.json').write_text(json.dumps(report, indent=2) + '\n')
    with tarfile.open(evidence / f'0084-{mode}-artifacts.tar.gz', 'w:gz') as archive:
        for path in [suite / 'report.json', suite / 'report.md', suite / 'pages' / variant, suite / 'artifacts' / variant]:
            archive.add(path, arcname=str(path))
    diagnostics = json.loads((suite / 'artifacts' / variant / 'round-0/diagnostics.json').read_text())
    trace = json.loads((suite / 'artifacts' / variant / 'round-0/trace.json').read_text())['traceEvents']
    assert [v['id'] for v in report['variants']] == [variant]
    samples = {s['metricId']: s['value'] for s in report['samples']}
    assert len(samples) == len(report['metrics']) == len(report['samples']) == 36
    assert all(s['variantId'] == variant and s['round'] == 0 and math.isfinite(s['value']) for s in report['samples'])
    assert samples['cleanup-valid'] == 1 and samples['computed-style-valid'] == 1
    interaction = diagnostics['interaction']
    assert interaction['affectedElementCount'] == 480
    assert interaction['details']['mutationCycleCount'] == 3
    assert diagnostics['beforeState']['domNodeCount'] == diagnostics['afterForcedCleanupState']['domNodeCount']
    assert not diagnostics['beforeState']['runtimeAvailable']
    sums = {}
    for metric, names in [('style-recalculation-ms', ['UpdateLayoutTree', 'RecalculateStyles', 'Document::updateStyle']),
                          ('layout-ms', ['Layout']), ('paint-ms', ['PrePaint', 'Paint'])]:
        value = sum(t.get('dur', 0)/1000 for t in trace if t.get('ph') == 'X' and t.get('name') in names)
        assert math.isclose(samples[metric], value, abs_tol=1e-9), metric
        sums[metric] = value
    hashes = {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in (suite / 'pages' / variant).rglob('*') if p.is_file()}
    results.append({'variant': variant, 'exit': run.returncode, 'browser': report.get('browser'),
                    'samples': len(samples), 'diagnostics': diagnostics, 'traceEvents': len(trace),
                    'traceRecomputed': sums, 'pageHashes': hashes})
    (evidence / '0084-static-checks.json').write_text(json.dumps(results, indent=2) + '\n')
    print(json.dumps({'variant': variant, 'validation': 'PASS', 'samples': len(samples), 'traceEvents': len(trace)}), flush=True)

# Additional diagnostic control uses the generated page only, after both original reports.
subprocess.run(['node', str(audit / 'repros/style-invalidation-style-control.mjs')], check=True, timeout=90)
