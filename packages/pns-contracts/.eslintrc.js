module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    // 'plugin:prettier/recommended',
    'plugin:node/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    // project: './tsconfig.json',
  },
  rules: {
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] },
    ],
    'semi': [2, 'always'],
    'node/no-missing-import': 0,
    // 'prettier/prettier': [
    //   'error',
    //   {},
    //   {
    //     usePrettierrc: true,
    //   },
    // ],
  },
  root: true,
};
