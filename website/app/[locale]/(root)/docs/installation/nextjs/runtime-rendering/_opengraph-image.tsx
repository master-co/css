import { Props } from 'websites-shared/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import NextjsSvg from 'websites-shared/images/frameworks/nextjs.svg'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    title: 'Runtime Rendering',
    icon: <NextjsSvg width="256" />
})