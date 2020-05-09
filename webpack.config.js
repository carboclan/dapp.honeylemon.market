const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/lib/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'honeylemon',
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      }
    ]
  },
  resolve: {
    modules: ['node_modules']
  },
  node: {
    fs: 'empty'
  }
};
