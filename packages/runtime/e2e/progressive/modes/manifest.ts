export default {
  variables: [
    { namespace: 'content', key: 'external', values: [{ path: [':root,:host'], value: '" ↗"' }] }
  ],
  variants: ['light', 'dark'].map(name => ({ token: `@manual-${name}`, branches: [{ selector: `&:where(.${name},.${name} *)`, conditions: [] }] }))
}
