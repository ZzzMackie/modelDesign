const path = require('path');
const { merge } = require('webpack-merge');
const { defineConfig } = require('@vue/cli-service');

const webpackBaseConfig = require(path.resolve('../../build/webpack.base.config'));
const config = {};
module.exports = defineConfig(merge(webpackBaseConfig, config));
