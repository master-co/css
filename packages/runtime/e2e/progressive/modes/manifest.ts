export default {
  variables: [
    { namespace: 'content', key: 'external', values: [{ path: [':root,:host'], value: '" ↗"' }] }
  ],
  mixins: ['light', 'dark'].map(name => ({ name: `--manual-${name}`, body: [{ type: 'rule' as const, selector: `&:where(.${name},.${name} *)`, body: [{ type: 'contents' as const, fallback: [] }] }] }))
}
