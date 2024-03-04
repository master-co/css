import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import Icon from '~/public/images/cdns/esm-sh.svg?inlineSvg'

export const alt = metadata.title.absolute || metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    title: 'CDN Runtime',
    icon: <Icon width="164" />
})