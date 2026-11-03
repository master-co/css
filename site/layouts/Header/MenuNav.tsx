import clsx from 'clsx'
import ALink from '~/components/ALink'
import Link from '~/components/Link'
import { toSlug } from '~/utils/toSlug'

// TODO production / route
function MenuNav({ name, data }: any) {
    return (
        <ALink className={clsx({ 'untouchable opacity:.5': data.disabled })} href={'/docs/' + toSlug(name)}>
            <span className={clsx('capitalize', { 'f:heavy t:underline': false, 'f:semibold': false })}>
                {name.replace(/-/g, ' ')}
            </span>
            <div className="f:gray-60 f:14 mt:5">{data?.desc}</div>
        </ALink>
    )
}

export default MenuNav