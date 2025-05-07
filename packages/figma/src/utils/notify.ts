import post from './post'

export default function notify(message: string, options?: NotificationOptions) {
    post('notify', { message, options })
}