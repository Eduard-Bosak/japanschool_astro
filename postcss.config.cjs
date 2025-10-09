const path = require('path');

module.exports = ({ env, file }) => ({
  plugins: [
    require('postcss-import')({
      path: [path.join(__dirname, 'src')]
    }),
    require('autoprefixer')(),
    env === 'production' ? require('cssnano')({ preset: 'default' }) : false
  ].filter(Boolean)
});
