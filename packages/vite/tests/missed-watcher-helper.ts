import type { Plugin } from 'vite'
import { vi } from 'vitest'

/** Exercise polling recovery without changing the configured watch policy. */
export function missedWatcherEvents(): Plugin {
  return { name: 'test:miss-watcher-notifications', configureServer(server) {
    vi.spyOn(server.watcher, 'add').mockReturnValue(server.watcher)
    const emit = server.watcher.emit.bind(server.watcher)
    // Native root startup events must not become unrelated index.html reloads.
    const filesystemEvents = new Set(['add', 'addDir', 'change', 'unlink', 'unlinkDir', 'all', 'raw'])
    vi.spyOn(server.watcher, 'emit').mockImplementation((event, ...args) => typeof event === 'string' && filesystemEvents.has(event) ? false : emit(event, ...args))
  } }
}
