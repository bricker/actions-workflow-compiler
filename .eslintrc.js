module.exports = {
  extends: 'airbnb-base',
  root: true,
  rules: {
    'no-await-in-loop': 0,
    'no-console': 0,
    'arrow-body-style': 0,
    'no-param-reassign': 0,
    'class-methods-use-this': 0,
    'max-classes-per-file': 0,
    'no-restricted-syntax': 0,
    'object-curly-newline': 0,
    'max-len': [
      'error',
      {
        code: 160,
        ignoreStrings: true,
      },
    ],
  },
};
