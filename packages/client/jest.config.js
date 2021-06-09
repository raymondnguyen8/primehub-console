// TODO:
module.exports = {
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '^test/(.*)': '<rootDir>/test/$1',
    '^utils/(.*)': '<rootDir>/src/utils/$1',
    '^images/(.*)': '<rootDir>/__mocks__/fileMocks.js',
    '^components/(.*)': '<rootDir>/src/components/$1',
    '^containers/(.*)': '<rootDir>/src/containers/$1',
    '^cms-layouts/(.*)': '<rootDir>/src/cms-layouts/$1',
    '^cms-components/(.*)': '<rootDir>/src/cms-components/$1',
    '^styledShare/(.*)': '<rootDir>/src/styled_share/$1',
    '^context/(.*)': '<rootDir>/src/context/$1',
    '^ee/(.*)': '<rootDir>/src/ee/$1',
    '^constant/(.*)': '<rootDir>/src/constant/$1',
    '^interfaces/(.*)': '<rootDir>/src/interfaces/$1',
    '^queries/(.*)': '<rootDir>/src/queries/$1',
    '^@types/(.*)': '<rootDir>/src/@types/$1',
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMocks.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/fileMocks.js'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost/',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>[/\\\\](node_modules)[/\\\\]'],
  transformIgnorePatterns: ['/node-modules/', '/dist/'],
  transform: {
    '\\.tsx?$': 'ts-jest',
    // '\\.jsx?$': 'babel-jest',
    '\\.[jt]sx?$': 'babel-jest',
  },
};
