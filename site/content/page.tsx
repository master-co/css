import DocHeader from '~/site/docs-shell/components/DocHeader'

export default function Page() {
  return <DocHeader stickable />
}

export const metadata = {
  title: { absolute: 'Master CSS - Maintainable styles in markup' },
  description: 'Compose CSS and project design rules in markup, trace the impact of changes, and check generated styles.'
}
