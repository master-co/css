import Features from 'internal/components/Features'
import Feature from 'internal/components/Feature'
import { IconStatusChange, IconSettingsExclamation, IconShieldCheck, IconPencilExclamation, IconFunction, IconSparkles } from '@tabler/icons-react'
import Link from 'internal/components/Link'

export default () => (
    <Features className="my:3xl grid-cols:3@sm">
        <Feature>
            <IconStatusChange className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#sort-classes">Sort classes</Link></p>
                <p>Enforce a consistent and logical order of classes</p>
            </div>
        </Feature>
        <Feature>
            <IconShieldCheck className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#no-invalid-classes">No invalid classes</Link></p>
                <p>Detect syntax errors early when writing classes</p>
            </div>
        </Feature>
        <Feature>
            <IconSparkles className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#prefer-canonical-classes">Prefer canonical classes</Link></p>
                <p>Prefer semantic utilities, theme tokens, and short aliases</p>
            </div>
        </Feature>
        <Feature>
            <IconSettingsExclamation className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#disallow-unknown-classes">Disallow unknown classes</Link></p>
                <p>Enforce the use of Master CSS syntax to apply styles</p>
            </div>
        </Feature>
        <Feature>
            <IconPencilExclamation className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#no-conflicting-classes">No conflicting classes</Link></p>
                <p>Avoid applying classes with the same CSS declaration</p>
            </div>
        </Feature>
        <Feature>
            <IconFunction className="app-icon-primary" />
            <div>
                <p className='text:lg!'><Link href="#supports-js-utilities">Supports JS utilities</Link></p>
                <p>Check the classes in popular utility arguments</p>
            </div>
        </Feature>
    </Features>
)
