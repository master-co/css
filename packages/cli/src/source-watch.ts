import fs from 'node:fs'
import path from 'node:path'
import type { Stats } from 'node:fs'

type SourceGlob = Pick<typeof import('fast-glob'), 'generateTasks'>
const normalize = (value: string) => value.replace(/\\/g, '/')

export function createSourceWatchPlan(fg: SourceGlob, cwd: string, patterns: string[], ignore: readonly string[] = []) {
  const tasks = fg.generateTasks(patterns.map(normalize), { cwd, ignore: ignore.map(normalize) })
  const bases = tasks.map(task => path.resolve(cwd, task.base))
  const match = (file: string, pattern: string) => {
    const absolute = normalize(path.resolve(cwd, file))
    const candidate = /[/\\]$/.test(file) && !absolute.endsWith('/') ? absolute + '/' : absolute
    return path.matchesGlob(candidate, normalize(path.resolve(cwd, pattern)))
  }
  const excluded = (file: string) => tasks.length > 0 && tasks.every(task => task.negative.some(pattern => match(file, pattern)))
  const matches = (file: string) => tasks.some(task => task.positive.some(pattern => match(file, pattern))
    && !task.negative.some(pattern => match(file, pattern)))
  const contains = (parent: string, child: string) => {
    const relative = path.relative(parent, child)
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  }
  const roots = [...new Set(bases.map((base) => {
    // Watching an existing ancestor also catches creation of a missing glob base.
    while (!fs.existsSync(base) || !fs.statSync(base).isDirectory()) {
      const parent = path.dirname(base)
      if (parent === base) break
      base = parent
    }
    return base
  }))]
  return {
    roots: roots.filter(root => !roots.some(other => other !== root && contains(other, root))),
    matches,
    ignored(file: string, stats?: Stats) {
      const absolute = path.resolve(cwd, file)
      if (excluded(absolute) || (stats?.isDirectory() && excluded(absolute + path.sep))) return true
      if (stats?.isDirectory()) return !bases.some(base => contains(base, absolute) || contains(absolute, base))
      return stats?.isFile() ? !matches(absolute) : false
    }
  }
}
