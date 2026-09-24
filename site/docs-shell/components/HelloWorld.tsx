import BrowserHeader from './BrowserHeader'
import Demo from './Demo'

export default function HelloWorld({ url = 'localhost:8080' }: any) {
  return (
    <Demo className="helloWorld" $px={0} $py={0}>
      <BrowserHeader url={url} />
      <h1 className="m-2xl italic font-5xl font-heavy text-center text-strong">Hello World</h1>
    </Demo>
  )
}
