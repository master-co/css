import { builtinTokenNamespaces } from '@master/css-tooling/builtins'
import { getUtilityVariableNamespaces, getVariableNamespacePublicKeys, manifestUtilities } from './manifest-utilities'

/** Registry consumers can exist before a project defines any values in that namespace. */
export const variableNamespaceSources = [
  { namespace: 'breakpoint', consumers: ['@md', '@<md', '@sm&<lg'] },
  ...[...new Set([
    ...builtinTokenNamespaces.flatMap(entry => entry.variableAliasRefs.map(ref => ref.replace(/^[=~]/, ''))),
    ...manifestUtilities.flatMap(getUtilityVariableNamespaces),
  ])].filter(namespace => namespace !== 'breakpoint').sort().map(namespace => ({
    namespace,
    consumers: [
      ...getVariableNamespacePublicKeys(namespace).map(key => `${key}-`),
      ...(namespace === 'container' ? ['@container(md)'] : []),
    ],
  })),
]

export function variableNamespaceSourcesMarkdown() {
  return ['| Namespace | Consumers |', '| --- | --- |', ...variableNamespaceSources.map(({ namespace, consumers }) =>
    `| \`${namespace}-*\` | ${consumers.map(key => `\`${key}\``).join(', ')} |`,
  )].join('\n')
}
