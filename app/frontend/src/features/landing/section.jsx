import { useI18n } from '@i18n/context.js'
import { Container, Text, Title } from '@mantine/core'

/*
  Armazón de las secciones claras de la landing: contenedor, título y subtítulo. `alt`
  invierte el fondo para cortar la sucesión de secciones blancas, no para cambiar el
  contenido.
*/
export function Section({ id, title, subtitle, alt = false, children }) {
  return (
    <section id={id} className={`px-4 py-24 ${alt ? 'bg-gray-100' : 'bg-white'}`}>
      <Container size="sm">
        <Title order={2} c="black">
          {title}
        </Title>
        <Text c="gray.7" mt="sm">
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

  La tarjeta lleva `bg-white` fijo: sobre el fondo gris de `alt` hace falta y sobre el
  blanco no cambia nada, porque el borde ya la recorta. `titleKey` es la clave y no el
  texto traducido porque además hace de `key` de la lista.
*/
export function FeatureSection({ id, titleKey, subtitleKey, items, alt = false }) {
  const { t } = useI18n()

  return (
    <Section id={id} title={t(titleKey)} subtitle={t(subtitleKey)} alt={alt}>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, titleKey: itemTitleKey, bodyKey }) => (
          <div
            key={itemTitleKey}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <Icon size={28} stroke={1.5} className="text-black" />
            <Title order={3} c="black" mt="md">
              {t(itemTitleKey)}
            </Title>
            <Text c="gray.6" mt="xs" size="sm">
              {t(bodyKey)}
            </Text>
          </div>
        ))}
      </div>
    </Section>
  )
}
