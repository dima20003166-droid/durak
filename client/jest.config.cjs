module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(jsx?|mjs)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};
