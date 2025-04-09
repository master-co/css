import clsx from 'clsx'
import Demo from 'internal/components/Demo'
import Bg from 'internal/components/Bg'

export default (props: any) =>
    <Demo>
        <Bg {...props} className={clsx(props.className, 'size:auto|12x aspect:3/1')} />
    </Demo>
