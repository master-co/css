import { Props } from 'shared/types/Props'
import create from '~/og-image'
import metadata from './metadata'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata
})