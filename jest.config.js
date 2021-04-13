module.exports = {
  globals: {
    'ts-jest': { tsconfig: './tsconfig.spec.json' },
  },
  moduleFileExtensions: ['ts', 'js'],
  setupFiles: [],
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|js)$',
  transform: { '.(ts|js)': 'ts-jest' },
}
