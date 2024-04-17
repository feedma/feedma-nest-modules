module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts}',
    '!**/*.d.ts',
    '!**/.eslintrc.js',
    '!**/node_modules/**',
    '!<rootDir>/**/*types.ts',
    '!<rootDir>/*.config.js',
    '!<rootDir>/*.setup.js',
    '!<rootDir>/coverage/**',
    '!<rootDir>/docs/**',
    '!<rootDir>/test/**',
    '!<rootDir>/dist/**',
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
    '^@src/(.*)$': ['<rootDir>/src/$1'],
    '^@config/(.*)$': ['<rootDir>/src/config/$1'],
    '^@database/(.*)$': ['<rootDir>/src/database/$1'],
    '^@modules/(.*)$': ['<rootDir>/src/modules/$1'],
    '^@shared/(.*)$': ['<rootDir>/src/shared/$1'],
    '^@test/(.*)$': ['<rootDir>/test/$1'],
  },
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
