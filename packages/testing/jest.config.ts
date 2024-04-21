export default {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts}',
    '!**/*.d.ts',
    '!**/.eslintrc.js',
    '!**/jest.{config,setup}.{js,ts}',
    '!**/node_modules/**',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/*.module.ts',
    '!<rootDir>/**/coverage/**',
    '!<rootDir>/**/lib/**',
    '!<rootDir>/**/docs/**',
    '!<rootDir>/**/test/**',
    '!<rootDir>/**/dist/**',
    '!<rootDir>/**/*types.ts',
    '!<rootDir>/*.config.js',
    '!<rootDir>/*.setup.js',
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 85,
      functions: 85,
      statements: 85,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '#node-web-compat': './node-web-compat-node.js',
  },
  modulePathIgnorePatterns: ['<rootDir>/lib/', '<rootDir>/dist'],
  rootDir: '.',
  setupFiles: [],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  testEnvironment: 'node',
};
