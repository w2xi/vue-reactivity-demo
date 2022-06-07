const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  // 入口文件 main.js
  entry: {
    main: './src/main.js'
  },
  // 输出
  output: {
    // 输出到 dist文件夹
    path: path.resolve(__dirname, './dist'),
    // js文件下
    filename: 'js/chunk-[contenthash].js',
    // 每次打包前自动清除旧的dist
    clean: true,
  },
  devtool: 'eval-cheap-module-source-map',
  resolve: {
    // 路径别名
    alias: {
      '@': path.resolve('./src')
    },
    // 引入文件时可以省略后缀
    extensions: ['.js', '.vue', '.json'],
  },
  devServer: {
    // 自定义端口号
    // port:7000,
    // 自动打开浏览器
    open: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 模板文件
      template: './public/index.html',
      // 打包后的文件名
      filename: 'index.html',
      // js文件插入 body里
      inject: 'body',
    }),
  ]
}