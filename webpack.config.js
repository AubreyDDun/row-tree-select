const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// TODO: minimizer
module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    index: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'RowTreeSelect',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'less'],
    alias: {
      '@ant-design/icons/lib/dist$': path.resolve(__dirname, './src/helpers/icons.ts'),
    },
  },
  module: {
    rules: [
      {
        // TODO: sort?
        test: /\.tsx?$/,
        use: [
          'babel-loader',
          'ts-loader'
        ],
        exclude: /node_modules/
      },
      {
        // https://www.webpackjs.com/loaders/less-loader/
        test: /src.+\.less/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path]-[local]-[hash:base64:5]'
              }
            }
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true
            }
          }
        ],
      },
      {
        test: /node_modules.+\.less/,
        loader: 'style-loader',
      },
      {
        // 第三方库的css
        test: /\.css$/,
        loader: 'css-loader'
      }
    ]
  },
  plugins: [
    new BundleAnalyzerPlugin(),
    new AntdDayjsWebpackPlugin()
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin(),
    ]
  }
};
