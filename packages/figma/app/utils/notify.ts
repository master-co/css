import post from './post'

export default function notify(message: string, options?: any) {
    post('notify', { message, options })
}