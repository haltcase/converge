module.exports = {
  parser: 'babel-eslint',
  extends: 'standard',
  rules: {
    // no-unused-expressions doesn't seem to play well with pipeline
    'no-unused-expressions': 'off'
  }
}
