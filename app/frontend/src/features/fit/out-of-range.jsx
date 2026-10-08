import { usePublicContact } from '@features/fit/hooks/use-public-contact.js'
import { useI18n } from '@i18n/context.js'
import { Button, Text } from '@mantine/core'
import { IconBrandWhatsapp, IconMail } from '@tabler/icons-react'

/*
  Estado "derivado a atención personalizada": la API no encontró un
  talle estándar (`outcome = Referred`) y explica por qué en `reason`. Se
  ofrece contacto por mail/WhatsApp de VK.
*/
export function OutOfRange({ reason, onReset }) {
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
        {reason ? t(`enums.referralReason.${reason}`) : t('fit.outOfRange.body')}
      </Text>
      <Text c="dimmed" maw={420} size="sm">
        {t('fit.outOfRange.body')}
      </Text>

      <div className="flex flex-wrap justify-center gap-2">
        {emailHref && (
          <Button component="a" href={emailHref} rightSection={<IconMail size={16} />}>
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
            rightSection={<IconBrandWhatsapp size={16} />}
          >
            {t('enums.channel.Whatsapp')}
          </Button>
        )}
      </div>

      {onReset && (
        <Button variant="outline" onClick={onReset}>
          {t('fit.outOfRange.again')}
        </Button>
      )}
    </div>
  )
}
