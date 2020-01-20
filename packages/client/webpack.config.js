const antdTheme = require('./package.json').theme;
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const tsImportPluginFactory = require('ts-import-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {externals, resolve} = require('./webpack.settings');
const path = require('path');
const webpack = require('webpack');
const devMode = process.env.NODE_ENV !== 'production'
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    index: devMode ? './src/index.tsx' : ['./src/public-import.js', './src/index.tsx'],
    landing: './src/landing.tsx',
    job: devMode ? './src/job.tsx' : ['./src/public-import.js', './src/job.tsx']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: devMode ? 'https://localhost:8090/' : ''
  },
  mode: devMode ? 'development' : 'production',
  externals,
  resolve,
  devServer: {
    port: "8090",
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: {
      rewrites: [
        { from: /^\/job/, to: '/job.html' },
        { from: /^\/landing$/, to: '/landing.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    https: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'es2015'
          },
          getCustomTransformers: () => ({
            before: [tsImportPluginFactory({
              libraryName: 'antd',
              style: true,
            })]
          }),
        }
      },
      {
        test: /(\.schema\.js|canner\.def\.js)$/,
        use: [{
          loader: "canner-schema-loader"
        }, {
          loader: "babel-loader"
        }]
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }, {
        test: /\.css$/,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, "css-loader"]
      }, {
        test: /\.less$/,
        loader: 'ignore-loader'
      }, {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      chunks: ['index'],
      template: 'docs/index.html',
      filename: 'index.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['landing'],
      template: 'docs/index.html',
      filename: 'landing.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['job'],
      template: 'docs/index.html',
      filename: 'job.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: devMode ? 'server' : 'disabled',
      openAnalyzer: false
    }),
    new CompressionPlugin()
  ]
};