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
    // Titles name files, not page content; svgo 4 no longer removes them by default.
    'removeTitle',
    // Prefix ids from the SVG file name so server and client renders stay identical.
    'prefixIds',
  ],
}
