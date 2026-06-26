import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import type { BenchmarkArtifact, ByteSummary } from './types'

export function summarizeBytes(buffer: Buffer): ByteSummary {
    return {
        rawBytes: buffer.length,
        gzipBytes: gzipSync(buffer).length,
        brotliBytes: brotliCompressSync(buffer).length
    }
}

export async function measureArtifact(path: string): Promise<BenchmarkArtifact> {
    const buffer = await readFile(path)

    return {
        path,
        ...summarizeBytes(buffer),
        sha256: hashBytes(buffer)
    }
}

export function hashBytes(buffer: Buffer | string) {
    return createHash('sha256').update(buffer).digest('hex')
}
