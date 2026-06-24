import clsx from 'clsx'
import Demo from 'internal/components/Demo'

export default (props: any) =>
    <Demo>
        <p {...props} className={clsx('m:0 font:medium font:xl', props.className)}>
            Heavy boxes perform quick waltzes and jigs.
        </p>
    </Demo>
