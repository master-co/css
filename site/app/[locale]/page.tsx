import DocHeader from '~/internal/components/DocHeader';
import Body from '~/internal/layouts/body';

export default function Page() {
    return (
        <Body className="bg:cover bg:linear-gradient(ground,base|100vh,base) bg:no-repeat">
            <DocHeader stickable />
        </Body>
    );
}

export const metadata = {
    title: 'Master CSS - The CSS language and framework',
    description: 'The CSS language and framework for rapidly building modern and high-performance websites.'
}