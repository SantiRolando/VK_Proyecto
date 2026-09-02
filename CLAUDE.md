# CLAUDE.md

## Documentación de Mantine UI

- La documentación completa de Mantine UI se encuentra en `agents/llms-full.txt`.
- Consulta ese archivo antes de escribir o modificar código que use componentes, hooks o estilos de Mantine: incluye props, API de estilos, ejemplos de uso y guías de solución de problemas.

## Convenciones de archivos React

- Archivos de componentes de React en kebab-case (ejemplo: `landing-page.jsx`).
- Los componentes en sí en PascalCase (ejemplo: `LandingPage`), según las mejores prácticas de React.

## PWA

- La aplicación es una PWA (Progressive Web App): todo el diseño de la UI debe tenerlo en cuenta (rendimiento, carga rápida, responsive, soporte offline futuro).
- No implementar soporte PWA por ahora; se hará en una iteración posterior.

## Internacionalización (i18n)

- Ningún string visible para el usuario debe escribirse como literal en el código; usa siempre claves de traducción con `useI18n()`.
- Añade cada clave a los locales de español e inglés en `src/i18n/locales/`.
