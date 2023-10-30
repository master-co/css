import { animations } from '@master/css'
import Code from 'shared/components/Code'

const Default = () =>
    <Code lang="js" beautify>
        {JSON.stringify(animations)}
    </Code>

export default Default