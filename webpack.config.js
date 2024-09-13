import path from 'path';

export default {
  entry: './src/libp2pNode.js',
  output: {
    path: path.resolve('public'),
    filename: 'bundle.js',
  },
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    fallback: {
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      vm: 'vm-browserify',
      buffer: 'buffer/',
      process: 'process/browser',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}