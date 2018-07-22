const path = require('path');
const {externals, resolve} = require('./webpack.settings');

// plugins
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
    chunkFilename: '[name].js'
  },
  externals,
  resolve,
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
    })
  ],
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'es2015'
          }
        }
      },
      {
        test: /\.schema\.js|canner\.def\.js$/,
        use: [
          {
            loader: 'canner-schema-loader',
          },
          {
            loader: 'babel-loader'
          }
        ],
      },
      {
        exclude: /node_modules/,
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                require('babel-preset-env'),
                require('babel-preset-react'),
                require('babel-preset-stage-0'),
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: 'https://cdn.canner.io/cms-page/'
            }
          }
        ]
      }
    ]
  }
};
