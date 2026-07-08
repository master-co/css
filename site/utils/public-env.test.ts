import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolvePublicEnv, resolveVersion } from './public-env.js'

const repository = JSON.stringify({
  repository: {
    url: 'https://github.com/master-co/css.git'
  }
})

test('resolves version from a tag on HEAD', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': 'v2.0.0-rc.77\n',
      'describe --tags --abbrev=0 --match v*-rc.*': 'v2.0.0-rc.76\n'
    }),
    commitRef: 'rc',
    releaseRequired: true
  }), '2.0.0-rc.77')
})

test('resolves release version from a remote channel tag when local tags are unavailable', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': [
        '696b2096fecbf4ebf3df067ec332ea5a0e9df1b9\trefs/tags/v2.0.0-rc.79',
        '81555a8dae6eb593df92f974f037fcbcac12d244\trefs/tags/v2.0.0-rc.78'
      ].join('\n'),
      'describe --tags --abbrev=0 --match v*-rc.*': ''
    }),
    repositoryUrl: JSON.parse(repository).repository.url,
    commitRef: 'rc',
    releaseRequired: true
  }), '2.0.0-rc.79')
})

test('ignores peeled remote tag refs', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/tags/v2.0.0-rc.80^{}',
        '696b2096fecbf4ebf3df067ec332ea5a0e9df1b9\trefs/tags/v2.0.0-rc.79'
      ].join('\n'),
      'describe --tags --abbrev=0 --match v*-rc.*': ''
    }),
    repositoryUrl: JSON.parse(repository).repository.url,
    commitRef: 'rc',
    releaseRequired: true
  }), '2.0.0-rc.79')
})

test('keeps release channels isolated when resolving remote tags', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': [
        '696b2096fecbf4ebf3df067ec332ea5a0e9df1b9\trefs/tags/v2.0.0-rc.79',
        '34c523c6953787aac41b6eb863edbba54480b4be\trefs/tags/v2.0.0-beta.215',
        '3482d1cdc49314f367d040969926a12881ee4e08\trefs/tags/v1.37.8'
      ].join('\n'),
      'describe --tags --abbrev=0 --match v*-rc.*': ''
    }),
    repositoryUrl: JSON.parse(repository).repository.url,
    commitRef: 'rc',
    releaseRequired: true
  }), '2.0.0-rc.79')
})

test('falls back to the latest reachable release tag', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'describe --tags --abbrev=0 --match v*-rc.*': 'v2.0.0-rc.76\n'
    }),
    commitRef: 'rc'
  }), '2.0.0-rc.76')
})

test('resolves stable release versions for main', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*': [
        '696b2096fecbf4ebf3df067ec332ea5a0e9df1b9\trefs/tags/v2.0.0-rc.79',
        '3482d1cdc49314f367d040969926a12881ee4e08\trefs/tags/v1.37.8'
      ].join('\n'),
      'describe --tags --abbrev=0 --match v* --exclude v*-*': 'v1.37.7\n'
    }),
    repositoryUrl: JSON.parse(repository).repository.url,
    commitRef: 'main',
    releaseRequired: true
  }), '1.37.8')
})

test('falls back to a commit-derived prerelease when no tags exist for non-release refs', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v* --sort=-v:refname': '',
      'describe --tags --abbrev=0 --match v*': '',
      'rev-parse --short HEAD': 'abc1234\n'
    }),
    commitRef: 'feature/site-preview'
  }), '0.0.0-abc1234')
})

test('throws for release refs when no release tag can be resolved', () => {
  assert.throws(() => resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': '',
      'describe --tags --abbrev=0 --match v*-rc.*': ''
    }),
    repositoryUrl: JSON.parse(repository).repository.url,
    commitRef: 'rc',
    releaseRequired: true
  }), /Unable to resolve Master CSS site version/)
})

test('allows overriding the site version', () => {
  const publicEnv = resolvePublicEnv({
    env: {
      CF_PAGES_BRANCH: 'rc',
      NEXT_PUBLIC_VERSION: '2.0.0-rc.99'
    },
    cwd: '/repo',
    runGit: unexpectedGit,
    repositoryUrl: JSON.parse(repository).repository.url
  })

  assert.equal(publicEnv.NEXT_PUBLIC_VERSION, '2.0.0-rc.99')
})

test('supports legacy release tags when no channel is known', () => {
  assert.equal(resolveVersion({
    runGit: git({
      'tag --points-at HEAD --list v* --sort=-v:refname': 'v2.0.0-rc.77\n',
      'describe --tags --abbrev=0 --match v*': 'v2.0.0-rc.76\n'
    }),
    commitRef: 'feature/site-preview'
  }), '2.0.0-rc.77')
})

test('uses repo-owned defaults for the rc Cloudflare Pages build', () => {
  const publicEnv = resolvePublicEnv({
    env: {
      CF_PAGES_BRANCH: 'rc'
    },
    cwd: '/repo',
    runGit: git({
      'symbolic-ref --short HEAD': 'rc',
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': '696b2096fecbf4ebf3df067ec332ea5a0e9df1b9\trefs/tags/v2.0.0-rc.79',
      'describe --tags --abbrev=0 --match v*-rc.*': 'v2.0.0-rc.76'
    }),
    repositoryUrl: JSON.parse(repository).repository.url
  })

  assert.equal(publicEnv.NEXT_PUBLIC_PROJECT, 'Master CSS')
  assert.equal(publicEnv.NEXT_PUBLIC_HOST, 'rc.css.master.co')
  assert.equal(publicEnv.NEXT_PUBLIC_URL, 'https://rc.css.master.co')
  assert.equal(publicEnv.NEXT_PUBLIC_PLAY_API_URL, '/api/play')
  assert.equal(publicEnv.NEXT_PUBLIC_SITE_LOCALE_PREFIX_MODE, 'canonical')
  assert.equal(publicEnv.NEXT_PUBLIC_VERSION, '2.0.0-rc.79')
})

test('uses localhost for local development even on rc', () => {
  const publicEnv = resolvePublicEnv({
    env: {
      NODE_ENV: 'development',
      PORT: '3001'
    },
    cwd: '/repo',
    runGit: git({
      'symbolic-ref --short HEAD': 'rc',
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': '',
      'describe --tags --abbrev=0 --match v*-rc.*': 'v2.0.0-rc.76'
    }),
    repositoryUrl: JSON.parse(repository).repository.url
  })

  assert.equal(publicEnv.NEXT_PUBLIC_HOST, 'localhost:3001')
  assert.equal(publicEnv.NEXT_PUBLIC_URL, 'http://localhost:3001')
  assert.equal(publicEnv.NEXT_PUBLIC_SITE_LOCALE_PREFIX_MODE, 'always')
})

test('allows overriding the site locale prefix mode', () => {
  const publicEnv = resolvePublicEnv({
    env: {
      NEXT_PUBLIC_SITE_LOCALE_PREFIX_MODE: 'canonical',
      NODE_ENV: 'development'
    },
    cwd: '/repo',
    runGit: git({
      'symbolic-ref --short HEAD': 'rc',
      'tag --points-at HEAD --list v*-rc.* --sort=-v:refname': '',
      'ls-remote --tags --sort=-v:refname https://github.com/master-co/css.git v*-rc.*': '',
      'describe --tags --abbrev=0 --match v*-rc.*': 'v2.0.0-rc.76'
    }),
    repositoryUrl: JSON.parse(repository).repository.url
  })

  assert.equal(publicEnv.NEXT_PUBLIC_SITE_LOCALE_PREFIX_MODE, 'canonical')
})

function unexpectedGit(args: string[]) {
  throw new Error(`Unexpected git command: ${args.join(' ')}`)
}

function git(outputs: Record<string, string>) {
  return (args: string[]) => {
    const key = args.join(' ')
    if (key in outputs) return outputs[key]
    throw new Error(`Unexpected git command: ${key}`)
  }
}
