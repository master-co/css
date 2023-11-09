import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import Icon from '~/public/images/frameworks/nuxtjs.svg?inlineSvg'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'edge'

export default (props: Props) => create({
    props,
    metadata,
    title: 'Static Extraction',
    icon: <Icon width="256" />
})