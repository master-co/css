import { getVariableNamespacePublicKeys, tokenFamilies } from './manifest-utilities'

/** Registry consumers can exist before a project defines any values in that namespace. */
export const variableNamespaceSources = [
  { namespace: 'breakpoint', consumers: ['@md', '@media((width<64rem))', '@sm&<lg'] },
  ...[...new Set([
    ...tokenFamilies.flatMap(family => family.namespaces),
  ])].filter(namespace => namespace !== 'breakpoint').sort().map(namespace => ({
    namespace,
    consumers: [
      ...getVariableNamespacePublicKeys(namespace).map(key => `${key}-`),
      ...(namespace === 'container' ? ['@container((width>=28rem))'] : []),
    ],
  })),
]

export function variableNamespaceSourcesMarkdown() {
  return ['| Namespace | Consumers |', '| --- | --- |', ...variableNamespaceSources.map(({ namespace, consumers }) =>
    `| \`${namespace}-*\` | ${consumers.map(key => `\`${key}\``).join(', ')} |`,
  )].join('\n')
}
