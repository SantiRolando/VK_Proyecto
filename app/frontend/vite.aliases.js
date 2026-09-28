// Alias de imports (`@components/...`, `@api/...`). Los comparten Vite y Vitest
// para que el build y los tests resuelvan igual; `jsconfig.json` los replica
// para el editor.

import { fileURLToPath } from 'node:url'

function dir(relative) {
  return fileURLToPath(new URL(relative, import.meta.url))
}

export const aliases = {
  '@api': dir('./src/api'),
  '@app': dir('./src/app'),
  '@assets': dir('./src/assets'),
  '@components': dir('./src/components'),
  '@config': dir('./src/config'),
  '@constants': dir('./src/constants'),
  '@features': dir('./src/features'),
  '@hooks': dir('./src/hooks'),
  '@i18n': dir('./src/i18n'),
  '@mocks': dir('./src/mocks'),
  '@pages': dir('./src/pages'),
  '@test': dir('./src/test'),
  '@theme': dir('./src/theme'),
  '@utils': dir('./src/utils'),
}
