"""Read-only provider binding. No credential is sent to blob storage."""
from datetime import datetime
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from hashlib import sha256
from http.client import HTTPException
import argparse
import json
import os
import re
import shutil
import stat
import zipfile

REPO = 'master-co/css'
REPO_ID = 434642460
WORKFLOW = '.github/workflows/release.yml'
WORKFLOW_ID = 40529352
RESTORE_STEP = 'Verify and restore the original release evidence'
RECOVERY_STEP = 'Resume verified npm uploads and promotion only'
RECOVERY_UPLOAD = 'Preserve recovery evidence even after partial failure'
DELIVERY = 'c10-editor-delivery.yml'
if not __debug__:
    raise RuntimeError('Run the evidence guard without optimization')

POLICY = json.loads(Path(__file__).with_name('c10-editor-inputs.json').read_bytes())
REV = POLICY['revision']
TARGETS = ('win32-x64', 'win32-arm64', 'linux-x64', 'linux-arm64', 'alpine-x64', 'alpine-arm64', 'darwin-x64', 'darwin-arm64')
PUBLISHERS = ('master', 'masterco')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *_):
        return None


def request(url, headers):
    try:
        return build_opener(NoRedirect()).open(Request(url, headers=headers), timeout=45)
    except HTTPError as error:
        return error
    except (URLError, OSError, HTTPException, ValueError):
        raise ValueError('Read-only provider transport failed') from None


def api(route, download=False):
    assert route.startswith('/') and not route.startswith('//')
    token = os.environ['GH_TOKEN']
    headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': 'Bearer ' + token}
    response = request('https://api.github.com/repos/' + REPO + route, headers)
    if not download:
        with response:
            assert response.status == 200, f'GitHub metadata HTTP {response.status}'
            return json.loads(response.read(8 * 1024 ** 2))
    with response:
        assert response.status == 302, f'GitHub download redirect HTTP {response.status}'
        location = response.headers.get('Location')
        try:
            parsed = urlsplit(location)
            assert parsed.scheme == 'https' and parsed.hostname and parsed.port in (None, 443)
            assert not parsed.username and not parsed.password and not parsed.fragment
        except (TypeError, ValueError, AssertionError):
            raise ValueError('Unsafe GitHub artifact redirect') from None
    return request(location, {'Accept': 'application/octet-stream'})


def retrieve(route, file, size_limit):
    count = 0
    digest = sha256()
    with api(route, download=True) as response, file.open('xb') as target:
        assert response.status == 200, f'GitHub evidence HTTP {response.status}'
        try:
            while chunk := response.read(1024 ** 2):
                count += len(chunk)
                assert count <= size_limit
                digest.update(chunk)
                target.write(chunk)
        except OSError:
            raise ValueError('GitHub artifact stream failed') from None
    return count, digest.hexdigest()


def exact(run, attempt, expected_event, expected_conclusion, workflow_id):
    row = api(f'/actions/runs/{run}/attempts/{attempt}')
    expected = {'id': run, 'run_attempt': attempt, 'head_sha': REV, 'head_branch': 'main', 'path': WORKFLOW, 'workflow_id': workflow_id,
                'event': expected_event, 'status': 'completed', 'conclusion': expected_conclusion}
    conclusion = expected.pop('conclusion')
    assert all(row.get(k) == v for k, v in expected.items()) and row['conclusion'] in conclusion, 'Owning Release attempt identity differs'
    assert all(row[key]['id'] == REPO_ID and row[key]['full_name'] == REPO for key in ('repository', 'head_repository'))
    jobs = api(f'/actions/runs/{run}/attempts/{attempt}/jobs?per_page=100')
    assert jobs['total_count'] == len(jobs['jobs']) <= 100
    assert all(job['run_id'] == run and job['run_attempt'] == attempt and job['head_sha'] == REV for job in jobs['jobs'])
    return row, jobs['jobs']


def successful_step(job, step):
    [match] = [item for item in job['steps'] if item['name'] == step]
    assert match['status'] == 'completed' and match['conclusion'] == 'success'
    return match


def stamp(time):
    time = re.sub(r'(\.\d{6})\d+Z$', r'\1Z', time)
    return datetime.fromisoformat(time.replace('Z', '+00:00'))


def job_log(root, job):
    log = root / f"job-{job['id']}.log"
    if not log.exists():
        retrieve(f"/actions/jobs/{job['id']}/logs", log, 5 * 1024 ** 2)
    return log.read_bytes()


def predecessor(log, restore):
    lines = re.findall(rb'^(\S+Z)\s+(RECOVERY_(?:RUN_ID|ATTEMPT|VERSION|CONFIRM)): ([^\r\n]*)\r?$', log, re.M)
    assert len(lines) == 4 and len({line[1] for line in lines}) == 4, 'Owning job log has ambiguous recovery inputs'
    start, end = map(stamp, (restore['started_at'], restore['completed_at']))
    assert all(start <= stamp(at.decode()) <= end for at, _, _ in lines), 'Recovery inputs are outside the restore step'
    values = {key: value for _, key, value in lines}
    assert values[b'RECOVERY_VERSION'] == b'2.0.0' and values[b'RECOVERY_CONFIRM'] == b'RECOVER NPM ONLY'
    numbers = [values[key] for key in (b'RECOVERY_RUN_ID', b'RECOVERY_ATTEMPT')]
    assert all(re.fullmatch(rb'[1-9][0-9]{0,14}', number) for number in numbers), 'Invalid predecessor identity'
    return tuple(map(int, numbers))


def recovery_chain(root, run, attempt, original, original_job):
    # Follow each restore dispatch backward to the pinned original push.
    origin = original['id'], original['run_attempt']
    chain = []
    newest_job = None
    while (run, attempt) != origin:
        assert run > origin[0] and 0 < attempt < 100 and len(chain) < 20, 'Unbounded or off-chain recovery predecessor'
        expected = ('success',) if not chain else ('failure', 'cancelled', 'timed_out', 'success')
        row, jobs = exact(run, attempt, 'workflow_dispatch', expected, WORKFLOW_ID)
        [job] = [job for job in jobs if job['name'] == 'Recover the explicitly selected npm cohort']
        assert job['status'] == 'completed' and job['conclusion'] in expected
        if newest_job:
            assert stamp(job['completed_at']) <= stamp(newest_job['started_at']), 'Recovery chronology differs'
        restore = successful_step(job, RESTORE_STEP)
        successful_step(job, RECOVERY_UPLOAD)
        if not chain:
            successful_step(job, RECOVERY_STEP)
        log = job_log(root, job)
        previous = predecessor(log, restore)
        assert previous[0] < run, 'Recovery predecessors must be earlier distinct runs'
        chain.append({'run':run,'attempt':attempt,'event':row['event'],'conclusion':row['conclusion'],'job':job['id'],
                      'logSHA256':sha256(log).hexdigest(),'predecessorRun':previous[0],'predecessorAttempt':previous[1]})
        if len(chain) == 1:
            final_job = job
        newest_job = job
        run, attempt = previous
    assert chain and stamp(original_job['completed_at']) <= stamp(newest_job['started_at']), 'Missing or out-of-order original push'
    return list(reversed(chain)), final_job


def artifact(root, run, expected, job, step_name):
    row = api(f"/actions/artifacts/{expected['id']}")
    assert row['name'] == expected['name'] and row['digest'] == expected['digest'] and row['expired'] is False
    assert row['workflow_run'] == {'id':run, 'repository_id':REPO_ID, 'head_repository_id':REPO_ID, 'head_branch':'main','head_sha':REV}
    assert 0 < row['size_in_bytes'] <= 250 * 1024 ** 2
    if 'size' in expected:
        assert row['size_in_bytes'] == expected['size']
    [step] = [item for item in job['steps'] if item['name'] == step_name]
    assert step['status'] == 'completed' and step['conclusion'] == 'success'
    assert stamp(step['started_at']) <= stamp(row['created_at']) <= stamp(job['completed_at'])
    archive = root / (row['name'] + '.zip')
    raw = job_log(root, job)
    log_digest = sha256(raw).hexdigest()
    if 'logSHA256' in expected:
        assert log_digest == expected['logSHA256'], 'Original owning log bytes differ'
    final = re.search(rb'^([^ ]+) Artifact ' + row['name'].encode() + rb' successfully finalized\. Artifact ID ' +
                      str(row['id']).encode() + rb'(?![0-9])', raw, re.M)
    assert final, 'Original upload is missing from owning job log'
    digests = re.findall(rb'SHA256 digest of uploaded artifact is ([a-f0-9]{64})', raw[:final.start()])
    assert digests and row['digest'] == 'sha256:' + digests[-1].decode()
    finished = re.sub(r'\.\d+Z$', 'Z', final.group(1).decode())
    assert stamp(step['started_at']) <= stamp(finished) <= stamp(step['completed_at'])
    count, digest = retrieve(f"/actions/artifacts/{row['id']}/zip", archive, row['size_in_bytes'])
    assert count == row['size_in_bytes'] and 'sha256:' + digest == row['digest']
    return archive, {'artifact':row['id'],'name':row['name'],'sha256':digest,'job':job['id'],'logSHA256':log_digest,'ownerVerified':True}


def zip_inventory(archive, names, folders):
    entries = archive.infolist()
    assert len(entries) <= len(names) + len(folders)
    assert len(entries) == len({entry.filename.casefold() for entry in entries})
    regular = {entry.filename for entry in entries if not entry.is_dir()}
    assert regular == names and sum(entry.file_size for entry in entries) <= 400 * 1024 ** 2
    for entry in entries:
        mode = stat.S_IFMT(entry.external_attr >> 16)
        if entry.is_dir():
            assert entry.filename in folders and mode in (0, stat.S_IFDIR)
        else:
            assert mode in (0, stat.S_IFREG) and not entry.flag_bits & 1 and 0 < entry.file_size <= 128 * 1024 ** 2


def unpack(archive, output, names, folders=()):
    with zipfile.ZipFile(archive) as source:
        zip_inventory(source, names, folders)
        for name in sorted(names):
            dest = output.joinpath(*PurePosixPath(name).parts)
            dest.parent.mkdir(parents=True, exist_ok=True)
            with source.open(name) as inf, dest.open('xb') as outf:
                shutil.copyfileobj(inf, outf)


def npm_names(archive):
    with zipfile.ZipFile(archive) as source:
        info = source.getinfo('promotion-state.json')
        assert info.file_size <= 2 * 1024 ** 2
        state = json.loads(source.read(info))
        names = [item['archive'] for item in state['packages']]
        assert len(names) == len(set(names)) == 34
        assert all(re.fullmatch(r'packages/[a-z0-9-]+-2\.0\.0\.tgz', name) for name in names)
        return {*names, 'promotion-state.json', 'checksums.json'}


def previous_publication(current_run):
    value = api(f'/actions/workflows/{DELIVERY}/runs?branch=rc&event=workflow_dispatch&per_page=100')
    assert value['total_count'] == len(value['workflow_runs']) <= 100
    for row in value['workflow_runs']:
        if row['id'] >= current_run:
            continue
        jobs = api(f"/actions/runs/{row['id']}/jobs?filter=all&per_page=100")
        assert jobs['total_count'] == len(jobs['jobs']) <= 100
        assert not any(job['name'] == 'Publish exact C10 editor bytes once' and job['conclusion'] != 'skipped' for job in jobs['jobs']), \
            'An earlier write-capable attempt exists; reconcile it separately'


def bind(args):
    args.output.mkdir(mode=0o700)
    if args.execute:
        previous_publication(args.current_run)
    workflow = api('/actions/workflows/release.yml')
    assert workflow['path'] == WORKFLOW and workflow['id'] == WORKFLOW_ID
    original, jobs = exact(POLICY['originalRun'], POLICY['originalAttempt'], 'push', ('failure',), WORKFLOW_ID)
    original_jobs = {job['id']:job for job in jobs}
    original_release = original_jobs[POLICY['originalReleaseJob']]
    assert original_release['name'] == 'release' and original_release['status'] == 'completed' and original_release['conclusion'] == 'failure'
    chain, recovery_job = recovery_chain(args.output, args.recovery_run, args.recovery_attempt, original, original_release)
    for name in ('publish-editors', 'deploy-site'):
        assert next(job for job in jobs if job['name'] == name)['conclusion'] == 'skipped'
    assert original_jobs[POLICY['originalEditorGate']]['conclusion'] == 'success'
    successful_step(original_jobs[POLICY['originalEditorGate']], 'Verify exact coverage, candidate identities and tested VSIX bytes')
    tag = api('/git/ref/tags/v2.0.0')
    assert tag['ref'] == 'refs/tags/v2.0.0' and tag['object']['type'] == 'commit' and tag['object']['sha'] == REV
    release = api('/releases/tags/v2.0.0')
    assert release['tag_name'] == 'v2.0.0' and release['draft'] is False and release['prerelease'] is False and release['published_at']
    for expected in POLICY['releaseAssets']:
        [row] = [asset for asset in release['assets'] if asset['name'] == expected['name']]
        assert row['state'] == 'uploaded' and row['size'] == expected['bytes'] and row['digest'] == 'sha256:' + expected['sha256']

    editor_receipts = []
    for item in POLICY['editorArtifacts']:
        archive, receipt = artifact(args.output, original['id'],
            {'id':item['artifact'],'name':item['name'],'digest':item['providerDigest'],'size':item['size'],'logSHA256':item['logSHA256']},
            original_jobs[item['job']], 'Run actions/upload-artifact@v7')
        if item['name'] == 'editor-vsix':
            names = {'inventory.json', *(f'{p}/master-css-vscode-2.0.37-{t}.vsix' for p in PUBLISHERS for t in TARGETS)}
            unpack(archive, args.output/'candidate-vsix', names, ('master/', 'masterco/'))
        else:
            target = item['name'].removeprefix('editor-proof-')
            assert target in TARGETS
            unpack(archive, args.output/'editor-proofs', {f'{target}-{p}.json' for p in PUBLISHERS})
        editor_receipts.append(receipt)
    previous = POLICY['npmArtifact']
    (args.output/'original-download').mkdir()
    (args.output/'recovered-download').mkdir()
    original_zip, original_receipt = artifact(args.output/'original-download', original['id'],
        {'id':previous['id'],'name':previous['name'],'digest':'sha256:'+previous['sha256'],'size':previous['size']},
        original_release, 'Preserve publication inventory and recovery evidence')
    recovered_zip, recovered_receipt = artifact(args.output/'recovered-download', args.recovery_run,
        {'id':args.recovery_artifact,'name':f'npm-release-{REV}-{args.recovery_attempt}','digest':'sha256:'+args.recovery_sha},
        recovery_job, RECOVERY_UPLOAD)
    unpack(original_zip, args.output/'original-npm', npm_names(original_zip), ('packages/',))
    unpack(recovered_zip, args.output/'recovered-npm', npm_names(recovered_zip), ('packages/',))
    value = {'source':REV,'originalRun':original['id'],'originalAttempt':original['run_attempt'],'recoveryRun':args.recovery_run,
             'recoveryAttempt':args.recovery_attempt,'recoveryRef':'refs/heads/main','recoveryChain':chain,
             'originalNPM':original_receipt,'recoveryNPM':recovered_receipt,'editorOriginals':editor_receipts,
             'publishedGitHubRelease':release['id']}
    (args.output/'provider-proof.json').write_text(json.dumps(value,indent=2)+'\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for key in ('recovery-run','recovery-attempt','recovery-artifact','current-run'):
        parser.add_argument('--'+key,type=int,required=True)
    parser.add_argument('--recovery-sha',required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--execute',action='store_true')
    args = parser.parse_args()
    assert all(getattr(args,k)>0 for k in ('recovery_run','recovery_attempt','recovery_artifact','current_run'))
    assert re.fullmatch(r'[a-f0-9]{64}',args.recovery_sha)
    bind(args)
