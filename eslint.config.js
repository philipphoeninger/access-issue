// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  {
    // Simulation components deliberately render inaccessible markup — that is the whole
    // point of the application (CLAUDE.md "What this project is"). The template a11y
    // rules would make the barriers themselves unbuildable, so they are switched off for
    // this path only. Everything outside src/app/scenarios/** keeps them as errors.
    // Do not widen this override and do not remove it — see CLAUDE.md
    // "Lint override you will encounter".
    files: ['src/app/scenarios/**/*.html'],
    rules: {
      '@angular-eslint/template/alt-text': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
      '@angular-eslint/template/mouse-events-have-key-events': 'off',
      '@angular-eslint/template/no-autofocus': 'off',
      '@angular-eslint/template/no-distracting-elements': 'off',
      '@angular-eslint/template/role-has-required-aria': 'off',
      '@angular-eslint/template/table-scope': 'off',
      '@angular-eslint/template/valid-aria': 'off',
    },
  },
);
