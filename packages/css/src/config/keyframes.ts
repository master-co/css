export const keyframes = {
    fade: {
        from: { opacity: 0 },
        to: { opacity: 0 }
    },
    flash: {
        'from,50%,to': { opacity: 1 },
        '25%,75%': { opacity: 0 }
    },
    float: {
        '0%': { transform: 'none' },
        '50%': { transform: 'translateY(-1.25rem)' },
        '100%': { transform: 'none' }
    },
    heart: {
        '0%': { transform: 'scale(1)' },
        '14%': { transform: 'scale(1.3)' },
        '28%': { transform: 'scale(1)' },
        '42%': { transform: 'scale(1.3)' },
        '70%': { transform: 'scale(1)' }
    },
    jump: {
        '0%,100%': {
            transform: 'translateY(-25%)',
            'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)'
        },
        '50%': {
            transform: 'translateY(0)',
            'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)'
        }
    },
    ping: {
        '75%,100%': {
            transform: 'scale(2)',
            opacity: 0
        }
    },
    pulse: {
        '0%': { transform: 'none' },
        '50%': { transform: 'scale(1.05)' },
        '100%': { transform: 'none' }
    },
    rotate: {
        from: { transform: 'rotate(-360deg)' },
        to: { transform: 'none' }
    },
    shake: {
        '0%': { transform: 'none' },
        '6.5%': { transform: 'translateX(-6px) rotateY(-9deg)' },
        '18.5%': { transform: 'translateX(5px) rotateY(7deg)' },
        '31.5%': { transform: 'translateX(-3px) rotateY(-5deg)' },
        '43.5%': { transform: 'translateX(2px) rotateY(3deg)' },
        '50%': { transform: 'none' }
    },
    zoom: {
        from: { transform: 'scale(0)' },
        '100%': { transform: 'none' }
    }
}