// lint-staged.config.js
module.exports = {
  '*.{ts,html,css}': [
    'pnpm exec prettier --write',
    'pnpm exec eslint --fix --max-warnings=0',
    'git add'
  ]
};