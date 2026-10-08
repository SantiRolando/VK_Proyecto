import { SurfaceCard } from '@components/surface-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Container, Text, Title } from '@mantine/core'

/*
  Armazón de las secciones de contenido de la landing: contenedor, título y subtítulo. No
  fija fondo ni color de texto: el fondo de la página y el color lo pone el tema, así que el
  claro y el oscuro salen sin ramas propias.
*/
export function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="px-4 py-24">
      <Container size="sm">
        <Title order={2}>{title}</Title>
        <Text c="dimmed" mt="sm">
          {subtitle}
        </Text>
        {children}
      </Container>
    </section>
  )
}

/*
  Sección de tres tarjetas con icono, título y descripción. Las tres secciones del medio
  eran esta misma estructura copiada, así que la pieza vive acá y cada sección aporta
  sólo sus claves de idioma.

  La tarjeta es la `SurfaceCard` del armazón, la misma que usan las pantallas de la app,
  y el encabezado (icono, título y descripción) lo arma el componente. `titleKey` es la
  clave y no el texto traducido porque además hace de `key` de la lista.
*/
export function FeatureSection({ id, titleKey, subtitleKey, items }) {
  const { t } = useI18n()

  return (
    <Section id={id} title={t(titleKey)} subtitle={t(subtitleKey)}>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, titleKey: itemTitleKey, bodyKey }) => (
          <SurfaceCard
            key={itemTitleKey}
            icon={Icon}
            title={t(itemTitleKey)}
            description={t(bodyKey)}
          />
        ))}
      </div>
    </Section>
  )
}
