#!/usr/bin/env node

const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const config = require("../config/webpack.config.js");

const compiler = Webpack(config);
const server = new WebpackDevServer(config.devServer, compiler);

/**
 * Start the development server.
 */
const runServer = async () => {
  await server.start();
};

runServer();
