import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const origins = { main: 'https://css.master.co', rc: 'https://rc.css.master.co' }

export function assertPagesTarget(project, { name, branch, origin }) {
  assert.equal(origin, origins[branch], 'Release channel must use its canonical origin')
  assert.ok(origins[branch], 'Only main and rc are site release channels')
  assert.equal(project?.name, name, 'Cloudflare returned a different Pages project')
  assert.equal(project.production_branch, branch, 'Selected Pages project has a different production branch')
  assert.ok(project.domains?.includes(new URL(origin).hostname), 'Selected Pages project does not serve this canonical hostname')
}

/** Read-only preflight: never create projects, change domains, or trigger builds.
 * https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/
 */
export async function verifyPagesTarget(env = process.env, fetchProject = fetch) {
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'PAGES_PROJECT', 'PUBLIC_COMMIT_REF', 'PUBLIC_URL']) {
    assert.ok(env[key], `Missing ${key}; configure the release target before deployment`)
  }
  const response = await fetchProject(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/pages/projects/${encodeURIComponent(env.PAGES_PROJECT)}`, {
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
    redirect: 'error',
    signal: AbortSignal.timeout(15000)
  })
  assert.ok(response.ok, `Pages target lookup failed (HTTP ${response.status})`)
  const payload = await response.json()
  assert.equal(payload.success, true, 'Pages target lookup was not successful')
  assertPagesTarget(payload.result, { name: env.PAGES_PROJECT, branch: env.PUBLIC_COMMIT_REF, origin: env.PUBLIC_URL })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyPagesTarget()
  console.log('Verified the Pages project, production branch and canonical hostname; no deployment performed.')
}
