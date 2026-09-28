import { routes } from '@app/routes.js'
import { ChannelBadge } from '@components/channel-badge.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { OrderSummary } from '@components/order-summary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { SaleStatusBadge } from '@components/sale-status-badge.jsx'
import { useSale } from '@features/checkout/hooks/use-sale.js'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconCircleCheck,
  IconCopy,
  IconExternalLink,
  IconMessage,
} from '@tabler/icons-react'
import { addressFullLine } from '@utils/address.js'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

// Confirmación de la compra (T063): estado de la venta, resumen y el mensaje
// de coordinación listo para enviar por el canal elegido.
export function ConfirmationPage() {
  const { t, formatDate } = useI18n()
  const { saleId } = useParams()
  const navigate = useNavigate()
  const query = useSale(Number(saleId))

  const sale = query.data
  const contact = sale?.contact ?? null
  const openedRef = useRef(false)
  const [copied, setCopied] = useState(false)

  // Se intenta abrir el canal elegido con el mensaje ya armado. Si el
  // navegador bloquea la apertura, el botón queda como respaldo.
  useEffect(() => {
    if (!contact?.url || openedRef.current) return
    openedRef.current = true
    window.open(contact.url, '_blank', 'noopener,noreferrer')
  }, [contact?.url])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.body)
      setCopied(true)
    } catch {
      // Sin permiso de portapapeles: el mensaje queda visible para copiar a mano.
    }
  }

  return (
    <Container size="md" py="xl">
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {sale && (
          <Stack gap="lg">
            <PageHeader
              title={t('checkout.confirmation.title')}
              subtitle={t('checkout.confirmation.subtitle')}
            />

            <Card withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text fw={600}>
                    {t('checkout.confirmation.order', { id: sale.id })}
                  </Text>
                  <SaleStatusBadge status={sale.status} />
                </Group>

                <Group gap="xs">
                  <ChannelBadge channel={sale.channel} />
                  <Badge variant="light" color="gray">
                    {t(`enums.deliveryMethod.${sale.deliveryMethod}`)}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                  {t('checkout.confirmation.createdAt')}:{' '}
                  {formatDate(sale.createdAt, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Text>

                {sale.address && <Text size="sm">{addressFullLine(sale.address)}</Text>}
              </Stack>
            </Card>

            <OrderSummary
              lines={sale.lines}
              subtotal={sale.subtotal}
              discount={sale.discount}
              total={sale.total}
            />

            {contact ? (
              <Card withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Group gap="xs">
                    <IconMessage size={18} />
                    <Text fw={600}>{t('checkout.confirmation.contactTitle')}</Text>
                  </Group>

                  <Text size="sm" c="dimmed">
                    {t('checkout.confirmation.contactHint')}
                  </Text>

                  <Paper withBorder radius="sm" p="sm">
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {contact.body}
                    </Text>
                  </Paper>

                  <Group gap="xs">
                    {contact.url && (
                      <Button
                        component="a"
                        href={contact.url}
                        target="_blank"
                        rel="noreferrer"
                        leftSection={<IconExternalLink size={16} />}
                      >
                        {t('checkout.confirmation.open', {
                          channel: t(`enums.channel.${contact.channel}`),
                        })}
                      </Button>
                    )}
                    <Button
                      variant="light"
                      leftSection={<IconCopy size={16} />}
                      onClick={handleCopy}
                    >
                      {copied
                        ? t('checkout.confirmation.copied')
                        : t('checkout.confirmation.copy')}
                    </Button>
                  </Group>

                  {!contact.url && (
                    <Alert variant="light" color="orange">
                      <Text size="sm">{t('checkout.confirmation.noTarget')}</Text>
                    </Alert>
                  )}

                  {contact.to && (
                    <Text size="xs" c="dimmed">
                      {t('checkout.confirmation.target', { target: contact.to })}
                    </Text>
                  )}
                </Stack>
              </Card>
            ) : (
              <Alert variant="light" color="gray" icon={<IconCircleCheck size={18} />}>
                <Text size="sm">{t('checkout.confirmation.noContact')}</Text>
              </Alert>
            )}

            <Group gap="xs">
              <Button variant="light" onClick={() => navigate(routes.catalog())}>
                {t('checkout.confirmation.continue')}
              </Button>
              <Button variant="subtle" color="gray" onClick={() => navigate(routes.home)}>
                {t('checkout.confirmation.home')}
              </Button>
            </Group>
          </Stack>
        )}
      </QueryBoundary>
    </Container>
  )
}
