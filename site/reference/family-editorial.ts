/** Shared prose for the family lookup in HTML, search and portable Markdown. */
export const familyText = {
  intro: 'A token family connects a class prefix to a token namespace and the CSS properties it writes. These tables list every family registered by the preset, including families without preset values.',
  mapping: 'The key alone does not identify a token. In `p-md`, `p-` reads the `spacing` namespace and `md` selects `--spacing-md`. The same key in another family can select a different token.',
  lookup: 'Read each row as prefix → token name pattern → native properties. Replace `*` with a registered key. The linked value pages list available keys; the namespace column identifies the tokens the family accepts.',
  shared: '`font-` has separate families for `--font-family-*`, `--font-size-*` and `--font-weight-*`. A key must select one of them. If the key exists in more than one of these namespaces, the class is ambiguous and emits no CSS.',
  registration: 'Register tokens in `@theme`. A native custom property outside it does not register a key, and a new namespace does not automatically create a utility family. Define a matching `@utility` pattern when adding a new family.',
  roles: '`--color-text-muted` belongs to the `color` namespace with key `text-muted`. Color roles use the same families as palette colors; they are not separate utility namespaces.',
  limits: 'This index describes token-consuming families. Fixed spellings, such as `w-full`, keep their definition even when a token has the same key. Direct-value functions, such as `p(4)`, and native declarations, such as `(padding:1rem)`, accept values without a token lookup.'
}
