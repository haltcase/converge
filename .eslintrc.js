module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    babelOptions: {
      configFile: './babel.config.js'
    }
  },
  extends: 'standard',
  rules: {
    // no-unused-expressions doesn't seem to play well with pipeline
    'no-unused-expressions': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',

    // these cause parsing errors
    'no-extra-parens': ['off'],
    'space-unary-ops': ['off'],
    quotes: ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }]
  }
}
