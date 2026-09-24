export default {
  variables: [
    { namespace: 'content', key: 'external', value: '" ↗"' }
  ],
  modes: ['light', 'dark'].map(name => ({ name, branches: [{ selector: `.${name}`, conditions: [] }] }))
}
