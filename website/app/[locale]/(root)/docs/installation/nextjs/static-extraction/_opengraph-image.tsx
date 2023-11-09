import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import NextjsSvg from '~/public/images/frameworks/nextjs.svg?inlineSvg'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    title: 'Static Extraction',
    icon: <NextjsSvg width="256" />
})