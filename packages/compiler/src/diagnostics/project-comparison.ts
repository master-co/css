import { createCompiler } from '../index'
import type { MasterCSSProjectComparisonRequest, MasterCSSProjectComparison } from '../index'

/** Compare prepared project states without reading files or evaluating browser styles. */
export async function compareProjectSnapshots(request: MasterCSSProjectComparisonRequest): Promise<MasterCSSProjectComparison> {
  using compiler = await createCompiler()
  return compiler.compareProjectSnapshots(request)
}
