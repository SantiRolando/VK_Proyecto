import { useI18n } from '@i18n/context.js'
import { SegmentedControl, useMantineColorScheme } from '@mantine/core'
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'

// Selector de esquema de color: claro, oscuro o sistema. Mantine persiste la elección y en
// `auto` sigue `prefers-color-scheme`.
export function ThemePicker({ size = 'xs' }) {
  const { t } = useI18n()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const options = [
    { value: 'light', label: <IconSun size={16} stroke={1.5} />, aria: t('theme.light') },
    { value: 'dark', label: <IconMoon size={16} stroke={1.5} />, aria: t('theme.dark') },
    {
      value: 'auto',
      label: <IconDeviceDesktop size={16} stroke={1.5} />,
      aria: t('theme.system'),
    },
  ]

  return (
    <SegmentedControl
      size={size}
      value={colorScheme}
      onChange={setColorScheme}
      aria-label={t('theme.label')}
      data={options.map((option) => ({
        value: option.value,
        label: (
          <span title={option.aria} aria-label={option.aria} role="img">
            {option.label}
          </span>
        ),
      }))}
    />
  )
}
