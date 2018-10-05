const path = require('path');
const webpack = require('webpack');
const zip = require('compression-webpack-plugin');
const CssEntryPlugin = require("css-entry-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const devMode = process.env.NODE_ENV !== 'production';

const babelOpts = {
    presets: ['latest'],
    plugins: ['transform-object-rest-spread']
};
const devDir = path.join(__dirname, 'dev');
const testDir = path.join(__dirname, 'frontend-tests');

module.exports = {
    devtool: 'source-map',
    entry: {
        "modacContextMenu": path.join(devDir, 'main.js')
    },
    output: {
        path: path.join(__dirname, 'pub/System/ModacContextMenuPlugin'),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.vue', '.js']
    },
    watchOptions: {
        aggregateTimeout: 250,
        ignored: '/node_modules/',
        poll: 1000
    },
    plugins: [
        new zip({
            minRation: 1,
            include: [/\.(?:js|css)$/]
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        }),
        new VueLoaderPlugin()
    ],
    stats: {
        entrypoints: false,
        children: false,
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: 'eslint-loader',
                include: [devDir],
                enforce: "pre"
            },
            {
                test: /\.vue$/,
                use: 'vue-loader',
                include: [devDir, testDir],
            },
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOpts
                    }
                ],
                include: [devDir, testDir],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                include: [devDir],
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.pug$/,
                include: [devDir],
                use: 'pug-plain-loader'
            }
        ]
    }
};
