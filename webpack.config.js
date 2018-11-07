'use strict';

const webpack = require('webpack');
const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'source-map',
	entry: './src/client/index.tsx',

	output: {
		path: path.resolve(__dirname, 'dist/client'),
		publicPath: '/dist/client',
		filename: 'project.bundle.js'
	},

	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: [/\.tsx?$/],
				exclude: /(node_modules|bower_components)/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					},
					'ts-loader'
				]
			}
		]
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js']
	},

	externals: {
		createjs: 'createjs'
	}
};
