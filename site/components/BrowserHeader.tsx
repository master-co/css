import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const BrowserHeader = ({ url }: any) => {
    const [browserUrl, setBrowserUrl] = useState(url)
    useEffect(() => {
        setBrowserUrl(
            (url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('localhost')
                ? window.location.host + (url.startsWith('/') ? url : '/' + url)
                : url
            ) || window.location.host + window.location.pathname
        )
    }, [url])
    return (
        <div className="w:full p:8|12 flex contain:content rt:5 {rt:0;mt:0;bt:0}+.demo bd:blur(1)">
            <div className="w:1/4">
                {
                    ['EC6A5F', 'F4BF50', '61C454'].map((color) => (
                        <svg key={color} className={'w:10 h:10 inline-block mx:3 round v:middle ' + 'bg:#' + color}></svg>
                    ))
                }
            </div>
            <div className="w:1/2 flex center-content f:12">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30" width="12" height="12"
                    className="mr:6 opacity:.5">
                    <path
                        d="M 15 2 C 11.145666 2 8 5.1456661 8 9 L 8 11 L 6 11 C 4.895 11 4 11.895 4 13 L 4 25 C 4 26.105 4.895 27 6 27 L 24 27 C 25.105 27 26 26.105 26 25 L 26 13 C 26 11.895 25.105 11 24 11 L 22 11 L 22 9 C 22 5.2715823 19.036581 2.2685653 15.355469 2.0722656 A 1.0001 1.0001 0 0 0 15 2 z M 15 4 C 17.773666 4 20 6.2263339 20 9 L 20 11 L 10 11 L 10 9 C 10 6.2263339 12.226334 4 15 4 z" />
                </svg>
                <span className="lines:1 lh:1 f:sans font:fade-40 font:gray-70@dark">{browserUrl}</span>
            </div>
            <div className="w:1/4"></div>
        </div>
    )
}

export default BrowserHeader