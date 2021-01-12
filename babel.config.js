module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],

  // ant-design-vue 配置按需加载
  plugins: [
    [
      'import',
      {
        libraryName: 'ant-design-vue',
        libraryDirectory: 'es',
        style: 'css',
      },
    ],
    [
      "import",
      {
        "libraryName": "@ant-design/icons",
        "libraryDirectory": "es/icons",
        "camel2DashComponentName": false
      },
      "@ant-design/icons"
    ],
  ],
};
