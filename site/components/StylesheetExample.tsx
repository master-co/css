import DocumentCodeExample from './DocumentCodeExample'
import { stylesheetExampleCSS } from '../reference/stylesheet-example'

/** Server-only: source and its complete compiled CSS, without a simulated preview. */
export default async function StylesheetExample({ title, source }: { title: string, source: string }) {
  const css = await stylesheetExampleCSS(source)
  return <DocumentCodeExample title={title} language="css" source={source} result={css} />
}
