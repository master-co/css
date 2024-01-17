import { Props } from 'websites/types/Props'
import create from '~/og-image'
import metadata from './metadata'

export const alt = metadata.title
export const contentType = 'image/jpg'
export const runtime = 'nodejs'

export default (props: Props) => create({
    props,
    metadata,
    title: 'Styled Components',
    icon: <img src={require('!!url-loader!websites/images/styled-components.png').default} width={216} height={216} />
})