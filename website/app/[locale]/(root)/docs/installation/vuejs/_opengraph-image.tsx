import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import Icon from '~/public/images/frameworks/vuejs.svg?inlineSvg'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    title: 'Progressive Rendering',
    icon: <Icon width="256" />
})