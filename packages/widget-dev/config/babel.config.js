module.exports = {
  presets: [
    "@babel/env",
    "@babel/typescript",
    [
      "@babel/react",
      {
        runtime: "automatic",
      },
    ],
  ],
};
