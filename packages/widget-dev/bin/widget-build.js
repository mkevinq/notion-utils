#!/usr/bin/env node

const Webpack = require("webpack");

const config = require("../config/webpack.config.js");

const compiler = Webpack(config, (err, stats) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log(
    stats.toString({
      colors: true,
    })
  );
});
