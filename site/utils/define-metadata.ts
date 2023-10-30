import extend from '@techor/extend';
import type { Metadata } from 'next';
import authors from 'shared/data/authors'

export default function defineMetadata(metadata: Metadata | Record<string, any>) {
    if (metadata.authors) {
        metadata.authors = metadata.authors.map((author: string) => authors.find(({ name }) => name === author))
    }
    return metadata
}