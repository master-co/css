"""Check bounded VS Code corpus evidence; never edits original fixtures."""
import json
import math
from pathlib import Path

audit = Path(__file__).resolve().parents[1]
repo = audit.parents[2]
records = json.loads((audit / 'evidence/0083-vscode-corpus.json').read_text())['records']
cases = [r for r in records if 'hoverPass' in r]
assert len(cases) == 16 and records[-1]['complete']
completions = []
for case in cases:
    assert case['hoverPass'] and case['language'] == case['expectedLanguage']
    assert case['semanticData'] and len(case['semanticData']) % 5 == 0
    token = case['token']
    expected = 'blue' if ':' in token else token
    assert expected in [x['label'] for x in case['completions']], case['file']
    completions.append({'file': case['file'], 'expectedLabel': expected, 'pass': True})
expected_themes = {'a': '--custom: red', 'b': '--custom: #ff0', 'c': '--global: #f0f', 'd': '--global: #f0f'}
for package, declaration in expected_themes.items():
    case = next(r for r in cases if r['file'] == f'packages/{package}/index.html')
    assert declaration in case['hover']
color_case = next(r for r in cases if r['file'] == 'edit-syntax-colors.html')
colors = {c['text']: c for c in color_case['colors']}
assert len(colors) == 13
literal_values = {
    'black': [0, 0, 0, 1],
    '#bdff2263': [189/255, 1, 34/255, 99/255],
    'rgb(0|255|145)': [0, 1, 145/255, 1],
    'rgba(255|0|0/.5)': [1, 0, 0, 0.5]
}
for token, values in literal_values.items():
    assert all(math.isclose(colors[token]['color'][channel], value, abs_tol=1e-9)
               for channel, value in zip(['red', 'green', 'blue', 'alpha'], values))
for color in colors.values():
    assert all(math.isfinite(v) and 0 <= v <= 1 for v in color['color'].values())
    start, end = color['range']
    line = (repo / 'packages/language-service/playground/edit-syntax-colors.html').read_text().splitlines()[start['line']]
    assert start['line'] == end['line']
    assert line[start['character']:end['character']] == color['text']
presentations = next(r for r in records if 'presentations' in r)['presentations']
assert len(presentations) == 13
for item in presentations:
    assert item['rangePass'] and item['edits']
    labels = [e['label'] for e in item['edits']]
    assert len(labels) == len(set(labels))
    assert '#33669980' in labels and 'rgb(20%|40%|60%/0.5)' in labels
    assert 'hsl(210|50%|40%/0.5)' in labels and any(v.startswith('oklch(') for v in labels)
    for edit in item['edits']:
        assert edit['textEdit']['range'] == colors[item['original']]['range']
        assert edit['textEdit']['newText'] == edit['label']
formats = [r for r in records if 'formatted' in r]
assert len(formats) == 4
assert all(r['original'] == r['formatted'] and not r['documentDirty'] for r in formats)
diagnostics = [d for r in records for d in r.get('diagnostics', [])]
assert all(d.get('source') == 'ts' for d in diagnostics)
result = {'hover': '16/16 PASS', 'languageIds': '16/16 PASS', 'completionControls': completions,
          'semanticResponses': '16 nonempty responses; token ranges not exhaustively checked',
          'workspaceThemes': expected_themes, 'colors': '13 range/channel checks; 4 exact RGBA checks PASS',
          'presentations': '13 sets; range/unique labels/common target-color values PASS',
          'format': '4 already formatted original CSS documents remain identical and clean',
          'diagnostics': {'count': len(diagnostics), 'sources': sorted(set(d['source'] for d in diagnostics)),
                          'limit': 'Point-in-time observations; no negative diagnostic convergence claim'},
          'limitations': ['blue has mode-specific values without one unconditional color',
                         'unnamespaced custom/global theme values hover correctly; no color/completion claim',
                         'one selected hover/completion point per source; other expressions remain unclaimed',
                         'bundled preset/server fallback in dependency-free disposable corpus']}
(audit / 'evidence/0083-corpus-checks.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
