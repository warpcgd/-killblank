import path from 'path'
import webpack from 'webpack'

import { CleanWebpackPlugin } from 'clean-webpack-plugin'

const ROOT = path.dirname(__dirname)

const config: webpack.Configuration = {
  mode: 'production',
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : 'source-map',
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue']
  },
  output: {
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  optimization: {
    minimizer: [new CleanWebpackPlugin()]
  },
  externals: {
    fsevents: "require('fsevents')"
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            extends: path.resolve(ROOT, '.babelrc')
          }
        }
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: false
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  }
}

export default config
