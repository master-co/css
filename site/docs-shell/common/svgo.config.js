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
    // Prefix ids from the SVG file name so server and client renders stay identical.
    'prefixIds',
  ],
}
