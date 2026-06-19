import clsx from 'clsx'
import Demo from 'internal/components/Demo'
import Bg from 'internal/components/Bg'

export default (props: any) =>
    <Demo>
        <Bg {...props} className={clsx(props.className, 'aspect-ratio:3/1 h:12x w:36x')} />
    </Demo>
