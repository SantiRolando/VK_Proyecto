import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Constitución VI: el FE es agnóstico de su fuente de datos. Solo la capa
    // de datos (`src/api/`) y el propio mock (`src/mocks/`) pueden importar
    // de `src/mocks/`. Los componentes y hooks usan los services.
    name: 'vkfit/no-mocks-outside-data-layer',
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/api/**', 'src/mocks/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/mocks/**', '**/mocks'],
              message:
                'Los componentes y hooks no pueden importar de src/mocks (constitución VI). Usá los services de src/api/services.',
            },
          ],
        },
      ],
    },
  },
])
