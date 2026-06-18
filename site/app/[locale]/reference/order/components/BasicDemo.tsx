import clsx from 'clsx'
import Demo from 'internal/components/Demo'

export default ({ className }: any) => {
    return (
        <Demo>
            <div className="flex gap:0.625rem">
                <div className="app-box app-neutral">1</div>
                <div className={clsx(className, 'accent app-box')}>2</div>
                <div className="app-box app-neutral">3</div>
            </div>
        </Demo>
    )
}