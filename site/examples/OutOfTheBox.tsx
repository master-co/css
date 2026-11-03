/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
export default function OutOfTheBoxExample() {
    return (
        <div className="bg:gray-22 p:10 r:10 max-w:350">
            <img className="object:cover w:full square r:5" src="/images/clothes.jpeg" loading="lazy" alt="clothes" />
            <div className="mt:10 p:15">
                <div className="font:24 font:bold capitalize">texture crew sweater</div>
                <div className="font:14 font:gray-66 mt:5">Designed for on the move</div>
                <div className="mt:12 font:semibold">$120.0 USD</div>
                <div className="mt:12 flex gap:8">
                    <button className="square w:40 h:40 font:0 round b:1|solid|gray-28 p:3">
                        <div className="bg:white full round">white</div>
                    </button>
                    <button className="square w:40 h:40 font:0 round b:1|solid|gray-28 p:3">
                        <div className="bg:#999 full round">white</div>
                    </button>
                    <button className="square w:40 h:40 font:0 round b:1|solid|gray-28 p:3">
                        <div className="bg:#333 full round">white</div>
                    </button>
                </div>
                <div className="mt:20 font:12 font:semibold letter-spacing:2 font:gray-66 uppercase">size</div>
                <div className="mt:12 flex gap:8">
                    <button className="p:10|15 r:3 font:14 font:semibold b:1|solid|gray-28">XS</button>
                    <button className="p:10|15 r:3 font:14 font:semibold bg:gray-28">S</button>
                    <button className="p:10|15 r:3 font:14 font:semibold b:1|solid|gray-28">M</button>
                    <button className="p:10|15 r:3 font:14 font:semibold b:1|solid|gray-28">L</button>
                    <button className="p:10|15 r:3 font:14 font:semibold b:1|solid|gray-28">XL</button>
                </div>
                <a className="font:gray-66 font:12 text:underline mt:20 inline-block" href="/">
                    Get delivery dates
                </a>
            </div>
        </div>
    )
}