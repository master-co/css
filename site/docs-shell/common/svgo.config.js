
import { nanoid } from 'nanoid'

export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false
        },
      },
    },
    {
      name: 'prefixIds',
      params: {
        prefix: () => nanoid(5),
      }
    }
  ],
}