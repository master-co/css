import { expect, test, vi } from 'vitest'
import { PureCSSCache } from '../src/pure-css-cache'

test('isolates operations, full inputs and mutable return values', () => {
  const cache = new PureCSSCache()
  const compute = vi.fn(() => ({ items: [1] }))
  cache.run('parse', ['css', { from: 'a.css' }], compute).items.push(2)
  const second = cache.run('parse', ['css', { from: 'a.css' }], compute)
  expect(second).toEqual({ items: [1] })
  second.items.push(3)
  expect(cache.run('parse', ['css', { from: 'a.css' }], compute)).toEqual({ items: [1] })
  cache.run('dependencies', ['css', { from: 'a.css' }], compute)
  cache.run('parse', ['css', { from: 'b.css' }], compute)
  expect(compute).toHaveBeenCalledTimes(3)
})

test.each([[Infinity, 2], [18, 128]])('evicts least recently used values with budget %s and capacity %s', (budget, capacity) => {
  const cache = new PureCSSCache(budget, capacity)
  const compute = vi.fn(() => 'ab') // Eight serialized UTF-16 bytes.
  cache.run('x', 1, compute)
  cache.run('x', 2, compute)
  cache.run('x', 1, compute)
  cache.run('x', 3, compute)
  cache.run('x', 2, compute)
  expect(compute).toHaveBeenCalledTimes(4)
})

test('does not retain values above the byte budget', () => {
  const cache = new PureCSSCache(18)
  const large = vi.fn(() => 'oversized')
  cache.run('x', 4, large)
  cache.run('x', 4, large)
  expect(large).toHaveBeenCalledTimes(2)
})

test('does not cache a failed operation', () => {
  const cache = new PureCSSCache()
  const compute = vi.fn().mockImplementationOnce(() => { throw Error('broken') }).mockReturnValue('recovered')
  expect(() => cache.run('x', 1, compute)).toThrow('broken')
  expect(cache.run('x', 1, compute)).toBe('recovered')
  expect(compute).toHaveBeenCalledTimes(2)
})
