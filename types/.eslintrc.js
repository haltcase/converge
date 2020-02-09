const [off, warn, error] = [0, 1, 2]

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    quotes: [error, "double", {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    "@typescript-eslint/member-delimiter-style": [error, {
      multiline: {
        delimiter: "none",
        requireLast: true
      }
    }],
    "@typescript-eslint/no-explicit-any": [error, {
      ignoreRestArgs: true
    }]
  }
}
