import clsx from 'clsx';

export default function StylesHomeGridsBg(props: any) {
    return (
        <div {...props} className={clsx('homeGridsBg', props.className)} >
            <div className="homeGrids grids-bg"></div>
        </div>
    )
}