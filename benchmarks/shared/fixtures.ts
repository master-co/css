import type { BenchmarkFixture, BenchmarkFixtureId } from './types'

export function getFixture(fixtures: BenchmarkFixture[], id: BenchmarkFixtureId): BenchmarkFixture {
  const fixture = fixtures.find((candidate) => candidate.id === id)
  if (!fixture) throw new Error(`Unknown benchmark fixture: ${id}`)
  return fixture
}

export function getFixtures(fixtures: BenchmarkFixture[], ids: BenchmarkFixtureId[]): BenchmarkFixture[] {
  return ids.map((id) => getFixture(fixtures, id))
}

export function validateFixtures(fixtures: BenchmarkFixture[]) {
  const seen = new Set<BenchmarkFixtureId>()

  for (const fixture of fixtures) {
    if (seen.has(fixture.id)) throw new Error(`Duplicate benchmark fixture id: ${fixture.id}`)
    seen.add(fixture.id)
    if (!fixture.name) throw new Error(`Benchmark fixture ${fixture.id} is missing a name.`)
    if (!fixture.purpose) throw new Error(`Benchmark fixture ${fixture.id} is missing a purpose.`)
    if (!fixture.stress) throw new Error(`Benchmark fixture ${fixture.id} is missing a stress description.`)
  }
}
