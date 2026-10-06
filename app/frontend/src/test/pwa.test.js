import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
  Guarda de regresión de la PWA: nada de esto es lógica de la app, pero un ícono
  renombrado o un meta borrado rompen la instalabilidad sin que ningún test de UI se
  entere.
*/

const root = process.cwd()
const viteConfig = readFileSync(join(root, 'vite.config.js'), 'utf8')
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')

describe('PWA', () => {
  it('todos los íconos declarados en el manifest existen en public/', () => {
    const manifestIcons = [...viteConfig.matchAll(/src: '(\/[^']+\.png)'/g)].map(
      (match) => match[1],
    )
    const appleIcon = indexHtml.match(/rel="apple-touch-icon"\s+href="([^"]+)"/)?.[1]

    expect(viteConfig).toContain("sizes: '192x192'")
    expect(viteConfig).toContain("sizes: '512x512'")
    expect(viteConfig).toContain("purpose: 'maskable'")
    expect(appleIcon).toBeTruthy()

    for (const source of [...manifestIcons, appleIcon]) {
      const file = join(root, 'public', source)
      expect(existsSync(file), `falta public${source}`).toBe(true)
    }
  })

  it('el documento declara los metas de instalación', () => {
    expect(indexHtml).toContain('rel="apple-touch-icon"')
    expect(indexHtml).toContain('name="theme-color"')
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable"')
    expect(indexHtml).toContain('name="description"')
  })

  it('el service worker queda en autoUpdate y precachea el build', () => {
    expect(viteConfig).toContain("registerType: 'autoUpdate'")
    expect(viteConfig).toContain('globPatterns')
    expect(viteConfig).toContain('navigateFallbackDenylist')
  })
})
