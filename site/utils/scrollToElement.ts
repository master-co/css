import animateScrollTo from 'animated-scroll-to';
import { isBrowser } from './isBrowser';

const scrollSmoothSupported = isBrowser && CSS.supports('scroll-behavior', 'smooth')

export function scrollToElement(el: HTMLElement, scrollElement: HTMLElement, offset = 0) {
    const scrollElementRect = scrollElement.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const top = scrollElement.scrollTop
        + elRect.top - scrollElementRect.top
        - (scrollElementRect.height - elRect.height) / 2
        + offset
    if (top === 0) {
        return;
    }
    if (scrollSmoothSupported) {
        scrollElement.scrollTo({ top, behavior: 'smooth' })
    } else {
        animateScrollTo(top, {
            elementToScroll: scrollElement
        })
    }
}