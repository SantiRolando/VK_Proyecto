import { PageHeader } from '@components/page-header.jsx'
import { AddressesBody } from '@features/account/addresses-page.jsx'
import { AlertsBody } from '@features/account/alerts-body.jsx'
import { ProfilesBody } from '@features/account/profiles-page.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { isAdmin } from '@features/auth/permissions.js'
import { useTabParam } from '@hooks/use-tab-param.js'
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
  IconBell,
  IconBrandWhatsapp,
  IconId,
  IconMail,
  IconRuler,
  IconUser,
} from '@tabler/icons-react'

// Los valores de `?tab=` son el slug en inglés de la etiqueta de cada pestaña.
const ACCOUNT_TAB = 'account'
const AGENDA_TAB = 'profiles-addresses'
const BASE_TABS = [ACCOUNT_TAB, AGENDA_TAB]

/*
  Los avisos de reposición son de las cuentas de cliente: un admin no tiene suscripciones y el
  endpoint responde 403, así que su pestaña no se le ofrece y `?tab=alerts` cae en la de cuenta.
*/
const ALERTS_TAB = 'alerts'

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

/*
  Información de cuenta: los datos de `/auth/me`, la agenda de perfiles y direcciones y los avisos
  de reposición, cada uno en su pestaña.
*/
export function AccountInfoPage() {
  const { t } = useI18n()
  const { user } = useAuth()

  const withAlerts = !isAdmin(user)
  const tabs = withAlerts ? [...BASE_TABS, ALERTS_TAB] : BASE_TABS

  const [tab, setTab] = useTabParam(tabs, ACCOUNT_TAB)

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('account.info.title')} subtitle={t('account.info.subtitle')} />

      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value={ACCOUNT_TAB} leftSection={<IconId size={16} />}>
            {t('account.info.tabAccount')}
          </Tabs.Tab>
          <Tabs.Tab value={AGENDA_TAB} leftSection={<IconRuler size={16} />}>
            {t('account.info.tabAgenda')}
          </Tabs.Tab>
          {withAlerts && (
            <Tabs.Tab value={ALERTS_TAB} leftSection={<IconBell size={16} />}>
              {t('account.info.tabAlerts')}
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value={ACCOUNT_TAB}>
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

        <Tabs.Panel value={AGENDA_TAB}>
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

        {withAlerts && (
          <Tabs.Panel value={ALERTS_TAB}>
            <section>
              <Title order={3} size="h4" mb="sm">
                {t('account.alerts.title')}
              </Title>
              <AlertsBody />
            </section>
          </Tabs.Panel>
        )}
      </Tabs>
    </Container>
  )
}
