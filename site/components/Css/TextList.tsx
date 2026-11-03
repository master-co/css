import clsx from 'clsx'

const TextList = ({ text, showClasses, renderClasses }: any) => {
    return (
        <div className={`demo gap:20 grid-cols:2 
            ${showClasses && showClasses.length > 4 ? 'grid-cols:5@md' : 'grid-cols:'+ showClasses.length + '@md'}`}>
            {
                showClasses.map((className: string) => {
                    return (
                        <div key={className} className="flex flex:col center-content w:full">
                            <div className={clsx(className, renderClasses, 'text:center')}>{text || 'Aa'}</div>
                            <code className="bg:fade-90 bg:fade-88:hover bg:gray-20@dark bg:gray-22:hover@dark r:3 p:5|8 f:12">
                                {className}
                            </code>
                        </div>
                    )
                })
            }
        </div>

    )
}

export default TextList