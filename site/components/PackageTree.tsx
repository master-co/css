import DocumentFileTree from './DocumentFileTree'
import { packageTrees, type PackageTreeName } from '../utils/package-trees'

export default function PackageTree({ name }: { name: PackageTreeName }) {
  return <DocumentFileTree {...packageTrees[name]} />
}
