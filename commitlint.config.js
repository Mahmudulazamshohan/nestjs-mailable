module.exports = { 
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow longer lines for semantic-release commits
    'body-max-line-length': [0, 'always'],
    // Ignore commits that start with chore(release):
    'subject-case': [0, 'always'],
  },
  ignores: [
    (message) => message.includes('chore(release):'),
    (message) => message.includes('[skip ci]'),
  ]
};
