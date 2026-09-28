import { usePublicContact } from '@features/fit/hooks/use-public-contact.js'
import { useI18n } from '@i18n/context.js'
import { Button, Text } from '@mantine/core'
import { IconBrandWhatsapp, IconMail } from '@tabler/icons-react'

// Estado "fuera de rango" (T042): la capa de datos derivó la consulta a
// atención personalizada. Se ofrece contacto por mail/WhatsApp de VK (SETTING).
export function OutOfRange({ onReset }) {
  const { t } = useI18n()
  const { data: contact } = usePublicContact()

  const emailHref = contact?.email ? `mailto:${contact.email}` : null
  const whatsappHref = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <Text fw={700} size="lg">
        {t('fit.outOfRange.title')}
      </Text>
      <Text c="dimmed" maw={420}>
        {t('fit.outOfRange.body')}
      </Text>

      <div className="flex flex-wrap justify-center gap-2">
        {emailHref && (
          <Button component="a" href={emailHref} leftSection={<IconMail size={16} />}>
            {t('fit.outOfRange.contact')}
          </Button>
        )}
        {whatsappHref && (
          <Button
            component="a"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            variant="light"
            color="teal"
            leftSection={<IconBrandWhatsapp size={16} />}
          >
            {t('enums.channel.Whatsapp')}
          </Button>
        )}
      </div>

      <Button variant="outline" onClick={onReset}>
        {t('fit.outOfRange.again')}
      </Button>
    </div>
  )
}
