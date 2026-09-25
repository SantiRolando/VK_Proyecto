import { Group, Image, Stack, Text } from '@mantine/core'
import { Drawer } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

import heightImage from '../../assets/altura.jpg'
import bustImage from '../../assets/pecho.jpg'
import waistImage from '../../assets/cintura.jpg'
import hipImage from '../../assets/cadera.jpg'
import torsoImage from '../../assets/torso.jpg'

const MEASURES = [
  { field: 'height', image: heightImage },
  { field: 'bust', image: bustImage },
  { field: 'waist', image: waistImage },
  { field: 'hip', image: hipImage },
  { field: 'torso', image: torsoImage },
]

// Guía visual "cómo me mido" (T040): drawer con imagen e instrucción por
// medida. Mobile-first: drawer inferior.
export function MeasureHelp({ opened, onClose }) {
  const { t } = useI18n()

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={t('fit.measure.title')}
      position="bottom"
      size="lg"
    >
      <Stack gap="lg">
        {MEASURES.map(({ field, image }) => (
          <Group key={field} gap="md" wrap="nowrap" align="flex-start">
            <Image
              src={image}
              alt={t(`fit.measure.${field}`)}
              w={72}
              h={72}
              radius="sm"
              fit="cover"
            />
            <div>
              <Text fw={600}>{t(`fit.measure.${field}`)}</Text>
              <Text size="sm" c="dimmed" mt={2}>
                {t(`fit.measure.${field}.help`)}
              </Text>
            </div>
          </Group>
        ))}
      </Stack>
    </Drawer>
  )
}
