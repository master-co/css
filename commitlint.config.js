import config from '@aronrepo/commitlint-config'

/** A breaking marker releases a major version, which only an explicit Bump(Major) commit may request. */
const breakingChangeRequiresMajor = ({ header, notes = [] }) => {
  const breaking = notes.some(note => /^BREAKING[ -]CHANGE$/.test(note.title)) || /^[^\s:(]+(?:\([^)]*\))?!:/.test(header ?? '')
  if (!breaking || /^Bump\(Major\)(?::|!:)/.test(header ?? '')) return [true]
  return [false, 'BREAKING CHANGE footers and "!" release a major version; use Bump(Major) to request one, or describe the change in the body']
}

export default {
  ...config,
  plugins: [{ rules: { 'breaking-change-requires-major': breakingChangeRequiresMajor } }],
  rules: { ...config.rules, 'breaking-change-requires-major': [2, 'always'] }
}
