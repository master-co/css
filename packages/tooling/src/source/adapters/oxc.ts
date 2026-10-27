import { extractOxcClassesNative } from '../native'

export function extractOxcClasses(source: string, content: string): string[] {
  return extractOxcClassesNative(source, content)
}
