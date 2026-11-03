import Link from "~/components/Link";
import ALink from '../ALink';
import CodeHTML2CSS from "../Code/CodeHTML2CSS";
import StyleEditor from "./StyleEditor";

const StyleFunctions = ({ name }: any) => {
    return (
        <>
            <h3 id="applying-with-functions">Applying with functions</h3>
            <CodeHTML2CSS>
                {`
                    <div class="${name}">...</div>
                `}
            </CodeHTML2CSS>
            <p>Master <b>supports native CSS variables and functions</b>, just add <code>var(<i>--key</i>)</code> or use shorthand
                <code>$(<i>key</i>)</code> for variables.
            </p>
            <p>You can also use <code>calc(expression)</code>, <code>env(expression)</code> and other CSS functions if the property
                supports it.</p>
            <p>To learn more, see the <ALink href="/docs/functions">Functions</ALink> documentation.</p>
        </>
    )
};

export default StyleFunctions;