import React from "react"

const BoxList = ({ showClasses, renderClasses , children }: any) => {
    return (
        <div className="demo grid-cols:3 grid-cols:4@md gap:12">
            {
                showClasses.map((className: string) => {
                    return (
                        <div key={className} className="flex center-content w:full my:10">
                            <div className="inline t:center">
                                <code className="f:12 lh:4.5">{ className }</code>
                                {
                                    children ? 
                                    React.Children.map(children, child =>
                                        React.cloneElement(child, {
                                          className: `${child.props.className} ${className}`
                                        })
                                      )
                                    : <div className={`w:80 h:80 bg:blue-60/.2 r:5 m:auto ${className} ${renderClasses}`}></div>
                                }
                            </div>
                        </div>
                    )
                })
            }
        </div>
        
    )
}

export default BoxList