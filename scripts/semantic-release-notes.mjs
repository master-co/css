import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Leave room below GitHub's 125,000-character release-body limit.
export const releaseBodyLimit = 120_000
export const releaseNotesPath = 'release-artifacts/release-notes.md'
export const releaseBodyTemplate = `<% if (nextRelease.notes.length <= ${releaseBodyLimit}) { %><%= nextRelease.notes %><% } else { %># <%= nextRelease.version %>

This large changelog is attached in full so the release page stays within GitHub's size limit. All entries and breaking-change notes are preserved in the file.

[Read the complete release notes](https://github.com/master-co/css/releases/download/<%= nextRelease.gitTag %>/release-notes-<%= nextRelease.gitTag %>.md)
<% if (lastRelease.gitTag || lastRelease.gitHead) { %>
[Compare changes](https://github.com/master-co/css/compare/<%= lastRelease.gitTag || lastRelease.gitHead %>...<%= nextRelease.gitTag %>)
<% } %><% } %>`

/** Retain the original generator output; only GitHub's rendered body is bounded. */
export async function prepare(_config, { cwd, nextRelease }) {
  assert.equal(typeof nextRelease.notes, 'string', 'Expected generated release notes')
  const file = path.join(cwd, releaseNotesPath)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, nextRelease.notes)
}
