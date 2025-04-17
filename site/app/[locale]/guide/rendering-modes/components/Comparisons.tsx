import InlineBad from '~/internal/components/InlineBad'
import InlineGood from '~/internal/components/InlineGood'
import InlineWarn from '~/internal/components/InlineWarn'
import Link from '~/internal/components/Link'

export default () => (
    <>
        <table className=''>
            <thead>
                <tr>
                    <th className="sticky bg:base pt:4x top:48 z:1 top:60@sm">Modes</th>
                    <th className="sticky bg:base pt:4x text:center top:48 w:1/6 z:1 top:60@sm">Progressive</th>
                    <th className="sticky bg:base pt:4x text:center top:48 w:1/6 z:1 top:60@sm">Runtime</th>
                    <th className="sticky bg:base pt:4x text:center top:48 w:1/6 z:1 top:60@sm">Extract</th>
                    <th className="sticky bg:base pt:4x text:center top:48 w:1/6 z:1 top:60@sm">Pre-render</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colSpan={4}><small>Technologies</small></td>
                </tr>
                <tr>
                    <th>CSR (Client-side Rendering)</th>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <th>SSR (Server-side Rendering)</th>
                    <td><InlineGood /></td>
                    <td>-</td>
                    <td>-</td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <th>SSG (Static Site Generation)</th>
                    <td><InlineGood /></td>
                    <td>-</td>
                    <td>-</td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <td colSpan={4}><small>Frameworks</small></td>
                </tr>
                <tr>
                    <th>Master CSS</th>
                    <td><InlineGood /></td>
                    <td><InlineGood /> ~27kB</td>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <th><Link href="https://tailwindcss.com/" indicate>Tailwind CSS</Link></th>
                    <td><InlineBad /></td>
                    <td><InlineBad /> Dev</td>
                    <td><InlineGood /></td>
                    <td>-</td>
                </tr>
                <tr>
                    <th><Link href="https://unocss.dev/" indicate>Uno CSS</Link></th>
                    <td><InlineBad /></td>
                    <td><InlineGood /> ~53kB</td>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <td colSpan={4}><small>Runtime Overhead</small></td>
                </tr>
                <tr>
                    <th>JavaScript runtime</th>
                    <td><InlineWarn /></td>
                    <td><InlineWarn /></td>
                    <td><InlineGood />Zero</td>
                    <td><InlineGood />Zero</td>
                </tr>
                <tr>
                    <th>Style calculation</th>
                    <td><InlineGood />Minimal</td>
                    <td><InlineGood />Minimal</td>
                    <td><InlineWarn />Heavy</td>
                    <td><InlineGood />Minimal</td>
                </tr>
                <tr>
                    <th>Memory overhead</th>
                    <td><InlineGood />Lifecycle</td>
                    <td><InlineGood />Lifecycle</td>
                    <td><InlineWarn />Heavy</td>
                    <td><InlineGood />Minimal</td>
                </tr>
                <tr>
                    <td colSpan={4}><small>Page Load Speed</small></td>
                </tr>
                <tr>
                    <th>Render-blocking CSS</th>
                    <td><InlineGood />Internal</td>
                    <td><InlineGood />Internal</td>
                    <td><InlineWarn />External</td>
                    <td><InlineGood />Internal</td>
                </tr>
                <tr>
                    <th>Render-blocking JS</th>
                    <td><InlineGood />Defer</td>
                    <td><InlineWarn />Yes</td>
                    <td><InlineGood />No</td>
                    <td><InlineGood />No</td>
                </tr>
                <tr>
                    <th>Pre-rendering</th>
                    <td><InlineGood /></td>
                    <td><InlineBad /></td>
                    <td><InlineWarn /></td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <td colSpan={4}><small>CSS Sources</small></td>
                </tr>
                <tr>
                    <th>Possible CSS bytes for a page</th>
                    <td><InlineGood />~5kB</td>
                    <td><InlineGood />0kB</td>
                    <td><InlineWarn />~400kB</td>
                    <td><InlineGood />~5kB</td>
                </tr>
                <tr>
                    <th>Source of CSS bytes</th>
                    <td><InlineGood />Page</td>
                    <td><InlineGood />Page</td>
                    <td><InlineWarn />Bundle</td>
                    <td><InlineGood />Page</td>
                </tr>
                <tr>
                    <th>The source of generated CSS</th>
                    <td><InlineGood />Attribute</td>
                    <td><InlineGood />Attribute</td>
                    <td><InlineWarn />Raw</td>
                    <td><InlineGood />Attribute</td>
                </tr>
                <tr>
                    <td colSpan={4}><small>Capability</small></td>
                </tr>
                <tr>
                    <th>Class concatenation</th>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                    <td><InlineBad />No</td>
                    <td><InlineWarn />Initial</td>
                </tr>
                <tr>
                    <th>Class interpolation</th>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                    <td><InlineBad />No</td>
                    <td><InlineWarn />Initial</td>
                </tr>
                <tr>
                    <th>Classes in .html</th>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                </tr>
                <tr>
                    <th>Classes in .js, .jsx, .vue, ...</th>
                    <td><InlineGood />Yes</td>
                    <td><InlineGood />Yes</td>
                    <td><InlineWarn />Partial</td>
                    <td><InlineBad />No</td>
                </tr>
                <tr>
                    <td colSpan={4}><small>SEO metrics</small></td>
                </tr>
                <tr>
                    <th>LCP (Largest Contentful Paint)</th>
                    <td><InlineGood />Fastest</td>
                    <td><InlineWarn /></td>
                    <td><InlineWarn /></td>
                    <td><InlineGood />Fastest</td>
                </tr>
                <tr>
                    <th>FCP (First Contentful Paint)</th>
                    <td><InlineGood />Fastest</td>
                    <td><InlineWarn /></td>
                    <td><InlineWarn /></td>
                    <td><InlineGood />Fastest</td>
                </tr>
                <tr>
                    <th>CLS (Cumulative Layout Shift)</th>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                </tr>
                <tr>
                    <th>INP (Interaction to Next Paint)</th>
                    <td><InlineGood /></td>
                    <td><InlineWarn /></td>
                    <td><InlineGood /></td>
                    <td><InlineGood /></td>
                </tr>
            </tbody>
        </table>

        <div className='flex gap:10|20 text:12 flex:wrap mt:40'>
            <div className='flex:0|0|auto'>SSG Static Site Generation</div>
            <div className='flex:0|0|auto'>SSR Server-side Rendering</div>
            <div className='flex:0|0|auto'>CSR Client-side Rendering</div>
            <div className='flex:0|0|auto'>SPA Single-page Application</div>
            <div className='flex:0|0|auto'>RR Runtime Rendering</div>
            <div className='flex:0|0|auto'>SE Static Extraction</div>
            <div className='flex:0|0|auto'>PR Progressive Rendering</div>
            <div className='flex:0|0|auto'>SaaS Software as a Service</div>
        </div>
    </>
)