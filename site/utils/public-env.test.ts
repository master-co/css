import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolvePublicEnv, resolveVersion } from './public-env.js'

const repository = JSON.stringify({
    repository: {
        url: 'https://github.com/master-co/css.git'
    }
})

test('resolves version from a tag on HEAD', () => {
    assert.equal(resolveVersion(git({
        'tag --points-at HEAD --list v* --sort=-v:refname': 'v2.0.0-rc.77\n',
        'describe --tags --abbrev=0 --match v*': 'v2.0.0-rc.76\n'
    })), '2.0.0-rc.77')
})

test('falls back to the latest reachable release tag', () => {
    assert.equal(resolveVersion(git({
        'tag --points-at HEAD --list v* --sort=-v:refname': '',
        'describe --tags --abbrev=0 --match v*': 'v2.0.0-rc.76\n'
    })), '2.0.0-rc.76')
})

test('falls back to a commit-derived prerelease when no tags exist', () => {
    assert.equal(resolveVersion(git({
        'tag --points-at HEAD --list v* --sort=-v:refname': '',
        'describe --tags --abbrev=0 --match v*': '',
        'rev-parse --short HEAD': 'abc1234\n'
    })), '0.0.0-abc1234')
})

test('uses repo-owned defaults for the rc Cloudflare Pages build', () => {
    const publicEnv = resolvePublicEnv({
        env: {
            CF_PAGES_BRANCH: 'rc'
        },
        cwd: '/repo',
        runGit: git({
            'symbolic-ref --short HEAD': 'rc',
            'tag --points-at HEAD --list v* --sort=-v:refname': '',
            'describe --tags --abbrev=0 --match v*': 'v2.0.0-rc.76'
        }),
        repositoryUrl: JSON.parse(repository).repository.url
    })

    assert.equal(publicEnv.NEXT_PUBLIC_PROJECT, 'Master CSS')
    assert.equal(publicEnv.NEXT_PUBLIC_HOST, 'rc.css.master.co')
    assert.equal(publicEnv.NEXT_PUBLIC_URL, 'https://rc.css.master.co')
    assert.equal(publicEnv.NEXT_PUBLIC_PLAY_API_URL, '/api/play')
    assert.equal(publicEnv.NEXT_PUBLIC_VERSION, '2.0.0-rc.76')
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
            'tag --points-at HEAD --list v* --sort=-v:refname': '',
            'describe --tags --abbrev=0 --match v*': 'v2.0.0-rc.76'
        }),
        repositoryUrl: JSON.parse(repository).repository.url
    })

    assert.equal(publicEnv.NEXT_PUBLIC_HOST, 'localhost:3001')
    assert.equal(publicEnv.NEXT_PUBLIC_URL, 'http://localhost:3001')
})

function git(outputs: Record<string, string>) {
    return (args: string[]) => {
        const key = args.join(' ')
        if (key in outputs) return outputs[key]
        throw new Error(`Unexpected git command: ${key}`)
    }
}
