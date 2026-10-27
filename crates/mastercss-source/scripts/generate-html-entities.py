"""Generate the HTML named-reference lookup from the WHATWG data table.

Pass a downloaded entities.json path to reproduce offline; default fetches the
canonical URL. Writes only html_entities.rs beside the owning decoder.
"""
import hashlib
import json
from pathlib import Path
import sys
import unicodedata
import urllib.request

URL = 'https://html.spec.whatwg.org/entities.json'
PINNED_SHA256 = 'd741d877ac77c4194c4ad526b5b4a19aef8dfe411ab840a466891cdbb9f362e6'
raw = Path(sys.argv[1]).read_bytes() if len(sys.argv) > 1 else urllib.request.urlopen(URL).read()
assert hashlib.sha256(raw).hexdigest() == PINNED_SHA256, 'Review upstream data changes before regenerating'
data = json.loads(raw)

def rust_string(value):
    result = '"'
    for char in value:
        if char in ('"', '\\'):
            result += '\\' + char
        elif unicodedata.category(char).startswith('C') or char.isspace():
            result += '\\u{' + format(ord(char), 'x') + '}'
        else:
            result += char
    return result + '"'

entries = []
for name, value in sorted(data.items()):
    assert name.startswith('&')
    assert [ord(c) for c in value['characters']] == value['codepoints']
    entries.append('(' + rust_string(name[1:]) + ', ' + rust_string(value['characters']) + '),')
lines = [
    '// Named character references from ' + URL,
    '// SHA-256: ' + PINNED_SHA256,
    '// Regenerate with scripts/generate-html-entities.py in this crate.',
    '// Three entries per line keep the static table within source budgets.',
    '#[rustfmt::skip]',
    'pub(super) static NAMED: &[(&str, &str)] = &['
]
lines += ['    ' + ' '.join(entries[i:i + 3]) for i in range(0, len(entries), 3)]
lines += ['];', '']
result = '\n'.join(lines)
assert len(result.encode()) <= 65536 and len(lines) <= 800
Path(__file__).resolve().parents[1].joinpath('src/html_entities.rs').write_text(result)
print(f'Generated {len(entries)} named references; {len(result.encode())} bytes, {len(lines)} lines')
