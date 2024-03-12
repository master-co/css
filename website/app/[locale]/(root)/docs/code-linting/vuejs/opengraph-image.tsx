import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'
import Icon from '~/public/images/frameworks/vuejs.svg?inlineSvg'
import type { AbsoluteTemplateString } from 'next/dist/lib/metadata/types/metadata-types'

export const alt = (metadata.title as AbsoluteTemplateString)?.absolute || metadata.title as string
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    icon: <Icon width="192" />
})