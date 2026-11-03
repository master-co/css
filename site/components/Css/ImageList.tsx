import ImageRange from "./ImageRange"

const ImageList = ({ showClasses, blockClasses, cols, imageClass, showCover, children }: any) => {
    return (
        <div className={`demo justify-content:start! grid-cols:${cols || '3'}! gap:20`}>
            {
                showClasses.map((className: string) => {
                    return (
                        <div key={className} className={`flex flex:col w:full align-items:center t:center pt:10 ${blockClasses || ''}`}>
                            <ImageRange
                                imageClass={imageClass}
                                className={className}
                                showCover={showCover}
                                >
                                {children || null}
                            </ImageRange>
                        </div>

                    )
                })
            }
        </div>
    )
}

export default ImageList