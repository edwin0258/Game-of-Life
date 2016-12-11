module.exports = {
  entry: './entry.js',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /.jsx$/,
        loader: 'babel-loader',
        exclude: '/node_modules/',
        query: {
          presets: ['es2015', 'react','stage-0']
        }
      },
      {
        test: /\.scss$/,
        loaders: ['style','css','sass']
      }
    ]
  }
}
