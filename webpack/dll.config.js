import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import WebpackIsomorphicToolsConfig from './webpack-isomorphic-tools.js';
import HappyPack from 'happypack';

const happyThreadPool = HappyPack.ThreadPool({ size: 4 });

const webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(WebpackIsomorphicToolsConfig);

const context = path.resolve(__dirname, '../');
const assetsPath = path.resolve(__dirname, '../static/dist');
const host = (process.env.HOST || 'localhost');
const port = (+process.env.PORT + 1) || 3001;
const babelrc = fs.readFileSync('./.babelrc');

let babelLoaderQuery = {};
try {
  babelLoaderQuery = JSON.parse(babelrc);
} catch (err) {
  console.error('==>     ERROR: Error parsing your .babelrc.');
  console.error(err);
}

babelLoaderQuery.plugins = [
		[
			"react-css-modules",
			{
        context: context,
        webpackHotModuleReloading: true,
				"generateScopedName": "[path]___[local]___[hash:base64:5]"
			}
		],
  ...babelLoaderQuery.plugins, 
    "react-hot-loader/babel"
];


export default {
  context,
  devtool: 'cheap-module-eval-source-map',
  performance: {
    hints: false
  },
  entry: {
    'app_assets':  ['./app/client.js'],
    'vendor': [
      'axios',
      'react',
      'react-dom',
      'react-redux',
      'react-router',
      'react-immutable-proptypes',
      'react-motion',
      'redux-devtools-log-monitor',
      'react-modal',
      'redux',
      'redux-form',
      'redux-saga',
      'redux-immutable',
      'immutable',
      'querystring',
      'strip-ansi',
      'ansi-regex',
      'ansi-html',
      'html-entities',
      'babel-runtime/core-js',
      'babel-polyfill',
      'process',
      'fbjs',
      'warning',
      'react-helmet',
      'react-proxy',
      'history',
      'strict-uri-encode'
    ]
  },
  output: {
    path: assetsPath,
    filename: '[name].dll.js',
    library: '[name]',
    publicPath: 'http://' + host + ':' + ( port - 1 ) + '/dist/',
    devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              exportAsEs6Default: true
            }
          }
        ]
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'happypack/loader',
            options: {
              id: 'ctmJSX'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'happypack/loader',
            options: {
              id: 'ctmCSS'
            }
          }
        ]
      },
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff'
            }
          }
        ]
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff'
            }
          }
        ]
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/octet-stream'
            }
          }
        ]
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              mimetype: 'application/file-loader'
            }
          }
        ]
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              mimetype: 'application/svg+xml'
            }
          }
        ]
      }
    ]
  },
  resolve: {
    modules: [
      'app',
      'node_modules'
    ],
    extensions: ['*', '.json', '.js', '.jsx'],
  },
  plugins: [
    new HardSourceWebpackPlugin({
      cacheDirectory: path.resolve(__dirname, '../node_modules/.cache/hard-source/dll/[confighash]'),
      recordsPath: path.resolve(__dirname, '../node_modules/.cache/hard-source/dll/[confighash]/records.json'),
      configHash: require('node-object-hash')({ sort: false }).hash
    }),
    new HappyPack({
      id: 'ctmJSX',
      threadPool: happyThreadPool,
      loaders: [
        {
          loader: 'babel-loader',
          query: babelLoaderQuery
        }
      ]
    }),
    new HappyPack({
      id: 'ctmCSS',
      threadPool: happyThreadPool,
      loaders: [
        'style-loader',
        'css-loader?modules&importLoaders=1&localIdentName=[path]___[local]___[hash:base64:5]',
        {
          loader: 'postcss-loader',
          query: {
            config: {
              path: path.resolve(__dirname, './postcss.config.js')
            }
          }
        }
      ]
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: __dirname
      }
    }),
    // hot reload
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DllPlugin({
      name: '[name]',
      path: path.join(assetsPath, '[name]-manifest.json')
    }),
    new webpack.ProvidePlugin({
      React: 'react',
      ReactDOM: 'react-dom'
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.IgnorePlugin(/webpack-stats\.json$/),
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __SERVER__: false,
      __DEVELOPMENT__: true,
      __DEVTOOLS__: true // <-------- DISABLE redux-devtools HERE
    }),
    webpackIsomorphicToolsPlugin.development()
  ]
};
