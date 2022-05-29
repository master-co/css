import { Style } from '../style';

export class ScreenReader extends Style {
    static override semantics = {
        'sr-only': {
            'position': 'absolute',
            'width': '1',
            'height': '1',
            'padding': '0',
            'margin': '-1',
            'overflow': 'hidden',
            'clip': 'rect(0,0,0,0)',
            'white-space': 'nowrap',
            'border-width': '0'
        }
    }
}