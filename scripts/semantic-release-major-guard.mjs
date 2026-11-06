// A `BREAKING CHANGE:` footer or `!` makes the commit analyzer release a major version
// whatever the commit type says. Major versions are an explicit author decision, so a
// major release must be requested by a `Bump(Major)` commit in the released range.

export const MAJOR_REQUEST = /^Bump\(Major\)(?::|!:)/

/** Fails before any package is staged when a major release was inferred, not requested. */
export function verifyRelease(_config, { commits = [], nextRelease }) {
  if (nextRelease?.type !== 'major') return
  if (commits.some(commit => MAJOR_REQUEST.test(commit.message ?? ''))) return
  const sources = commits
    .filter(commit => /^BREAKING[ -]CHANGE:/m.test(commit.message ?? '') || /^[^\s:(]+(?:\([^)]*\))?!:/.test(commit.message ?? ''))
    .map(commit => `${commit.hash?.slice(0, 9) ?? '?'} ${(commit.message ?? '').split('\n')[0]}`)
  throw new Error([
    `Refusing to release ${nextRelease.version}: a major version was inferred, but no Bump(Major) commit requests one.`,
    ...(sources.length ? ['Breaking markers:', ...sources.map(source => `  ${source}`)] : []),
    'Reword the breaking footer as a note, or add a Bump(Major) commit when a major release is intended.'
  ].join('\n'))
}
