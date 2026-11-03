import Link from "~/components/Link";
import ALink from '../ALink';
import CodeHTML2CSS from "../Code/CodeHTML2CSS";
import StyleEditor from "./StyleEditor";

const StyleSelectors = ({ name }: any) => {
    return (
        <>
            <h3 id="states-and-selectors">States and selectors</h3>
            <CodeHTML2CSS>
                {`
                    <div class="${name}">...</div>
                `}
            </CodeHTML2CSS>
            <p>Master <b>supports all native CSS selectors</b>, just add <code>:hover</code>, <code>:disabled</code>, chaining,
                combinators and other CSS selectors as usual.</p>
            <p>To learn more, see the <ALink href="/docs/selectors">Selectors</ALink> documentation.</p>
        </>
    )
};

export default StyleSelectors;