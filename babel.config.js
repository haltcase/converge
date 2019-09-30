// this has to be `babel.config.js`, not `.babelrc.js`,
// so that nested packages like internal plugins still
// get compiled using this configuration

module.exports = {
  presets: [
    ['@babel/env', {
      targets: {
        node: true
      },
      // using esm instead
      modules: false,
      loose: true
    }],
    ['@babel/typescript']
  ],
  plugins: [
    'babel-plugin-macros',
    'module:stunsail/babel',
    'dynamic-import-node',
    '@babel/proposal-class-properties',
    '@babel/proposal-do-expressions',
    '@babel/proposal-function-bind',
    '@babel/proposal-nullish-coalescing-operator',
    '@babel/proposal-numeric-separator',
    '@babel/proposal-optional-chaining',
    ['@babel/proposal-pipeline-operator', {
      proposal: 'fsharp'
    }],
    '@babel/proposal-throw-expressions'
  ]
}
