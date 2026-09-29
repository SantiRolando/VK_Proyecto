import { PageHeader } from '@components/page-header.jsx'
import { AddressesBody } from '@features/account/addresses-page.jsx'
import { ProfilesBody } from '@features/account/profiles-page.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconBrandWhatsapp,
  IconId,
  IconMail,
  IconRuler,
  IconUser,
} from '@tabler/icons-react'
import { useSearchParams } from 'react-router'

// Fila de dato: etiqueta + valor, con ícono. Se usa para los datos de la cuenta.
function Field({ icon: Icon, label, value }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" size="md" radius="xl" aria-hidden>
        <Icon size={16} stroke={1.5} />
      </ThemeIcon>
      <div>
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>
          {value}
        </Text>
      </div>
    </Group>
  )
}

// Información de cuenta (bug squash sesión #1): antes no existía ninguna pantalla
// que mostrara los datos del usuario. Reúne los datos de `/auth/me` y, en la
// segunda pestaña, la agenda de perfiles y direcciones — que antes vivía en rutas
// separadas (`/account/profiles`, `/account/addresses`).
export function AccountInfoPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = searchParams.get('tab') === 'agenda' ? 'agenda' : 'cuenta'

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('account.info.title')} subtitle={t('account.info.subtitle')} />

      <Tabs
        value={tab}
        onChange={(next) => setSearchParams(next === 'agenda' ? { tab: 'agenda' } : {})}
        keepMounted={false}
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="cuenta" leftSection={<IconId size={16} />}>
            {t('account.info.tabAccount')}
          </Tabs.Tab>
          <Tabs.Tab value="agenda" leftSection={<IconRuler size={16} />}>
            {t('account.info.tabAgenda')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="cuenta">
          <Stack gap="md">
            <Card withBorder radius="md" padding="lg">
              <Group gap="md" mb="md" wrap="nowrap">
                <ThemeIcon size={48} radius="xl" variant="light" aria-hidden>
                  <IconUser size={24} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Title order={2} size="h3">
                    {user?.name}
                  </Title>
                  <Badge variant="light" mt={4}>
                    {t(`enums.userType.${user?.type}`)}
                  </Badge>
                </div>
              </Group>

              <Stack gap="md">
                <Field
                  icon={IconMail}
                  label={t('account.info.email')}
                  value={user?.email ?? '—'}
                />
                <Field
                  icon={IconBrandWhatsapp}
                  label={t('account.info.whatsapp')}
                  value={user?.whatsappPhone ?? '—'}
                />
              </Stack>
            </Card>

            <Text size="xs" c="dimmed">
              {t('account.info.whatsappHint')}
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="agenda">
          <Stack gap="xl">
            <section>
              <Title order={3} size="h4" mb="sm">
                {t('account.profiles.title')}
              </Title>
              <ProfilesBody />
            </section>

            <section>
              <Title order={3} size="h4" mb="sm">
                {t('account.addresses.title')}
              </Title>
              <AddressesBody />
            </section>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}
