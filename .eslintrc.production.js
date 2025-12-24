module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable strict TypeScript rules for production build
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-require-imports': 'off',
    'react-hooks/set-state-in-effect': 'warn',
    'react/display-name': 'warn',
    
    // Keep critical security and functionality rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
};