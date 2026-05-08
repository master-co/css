import DocHeader from '~/internal/components/DocHeader';
import Body from '~/internal/layouts/body';

export default function Page() {
    return (
        <Body className="bg:cover bg:linear-gradient(ground,base|100vh,base) bg:no-repeat">
            <DocHeader stickable />
        </Body>
    );
}
