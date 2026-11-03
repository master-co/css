import BrowserHeader from '../BrowserHeader'

const HelloWorldSection = ({ url }: any) => {
    return (
        <>
            <p>Now, start developing your UI with Master CSS. 🎉</p>
            <div className="demo p:0!">
                <BrowserHeader url={url} />
                <h1 className="font:40 font:heavy italic m:50 text:center">
                    Hello World
                </h1>
            </div>
        </>
    )
}

export default HelloWorldSection