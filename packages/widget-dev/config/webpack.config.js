require("dotenv").config();
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const ESLintPlugin = require("eslint-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const babelConfig = require("./babel.config.js");
const tailwindConfig = require("./tailwind.config.js");

const environment = process.env["NODE_ENV"] || "development";
const isDevelopmentEnvironment = environment === "development";

const projectDirectory = fs.realpathSync(process.cwd());

module.exports = {
  context: path.resolve(projectDirectory, "src"),
  entry: "./index.tsx",
  devtool: isDevelopmentEnvironment ? "inline-source-map" : false,
  mode: !isDevelopmentEnvironment ? "production" : "development",
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        use: {
          loader: "babel-loader",
          options: babelConfig,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: tailwindConfig,
                  autoprefixer: {},
                },
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "../public/index.html",
    }),
    new MiniCssExtractPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: "../tsconfig.json",
        diagnosticOptions: {
          syntactic: true,
        },
      },
    }),
    new ESLintPlugin({ extensions: ["js", "ts", "tsx", "jsx"] }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: environment,
      API_PROXY_URL: "",
    }),
  ],
  output: {
    filename: "[name].js",
    devtoolModuleFilenameTemplate: isDevelopmentEnvironment
      ? "[absolute-resource-path]"
      : "webpack://[namespace]/[resource-path]?[loaders]",
    path: path.resolve(projectDirectory, "dist"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  devServer: {
    static: "../public",
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
};
