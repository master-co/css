import { getVariableNamespacePublicKeys, tokenFamilies } from './manifest-utilities'

/** Registry consumers can exist before a project defines any values in that namespace. */
export const variableNamespaceSources = [
  ...[...new Set([
    ...tokenFamilies.flatMap(family => family.namespaces),
  ])].filter(namespace => namespace !== 'breakpoint').sort().map(namespace => ({
    namespace,
    consumers: [
      ...getVariableNamespacePublicKeys(namespace).map(key => `${key}-`),
    ],
  })),
]

export function variableNamespaceSourcesMarkdown(namespaces?: readonly string[]) {
  const rows = namespaces ? variableNamespaceSources.filter(row => namespaces.includes(row.namespace)) : variableNamespaceSources
  return ['| Namespace | Consumers |', '| --- | --- |', ...rows.map(({ namespace, consumers }) =>
    `| \`${namespace}-*\` | ${consumers.map(key => `\`${key}\``).join(', ')} |`,
  )].join('\n')
}
