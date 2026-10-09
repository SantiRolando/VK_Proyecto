import { SurfaceCard } from '@components/surface-card.jsx'
import { ConversionBlock } from '@features/admin/dashboard/conversion-block.jsx'
import { CriticalStockBlock } from '@features/admin/dashboard/critical-stock-block.jsx'
import {
  useConversion,
  useCriticalStock,
  usePrecision,
} from '@features/admin/dashboard/hooks/use-dashboard.js'
import { InFlightBlock } from '@features/admin/dashboard/in-flight-block.jsx'
import { PrecisionBlock } from '@features/admin/dashboard/precision-block.jsx'
import { useAdminSales } from '@features/admin/sales/hooks/use-admin-sales.js'
import { useI18n } from '@i18n/context.js'
import { SimpleGrid, Stack } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconChartHistogram } from '@tabler/icons-react'
import 'dayjs/locale/es'
import { useState } from 'react'

const DEFAULT_RANGE_DAYS = 30

function toIso(date) {
  if (!date) return undefined
  return new Date(date).toISOString().slice(0, 10)
}

/*
  Indicadores del panel en una sola superficie: el rango de fechas alimenta la conversión y la
  precisión; el stock crítico y las ventas en vuelo son una foto del momento.
*/
export function IndicatorsSection() {
  const { t, language } = useI18n()
  const [range, setRange] = useState(() => [
    new Date(Date.now() - DEFAULT_RANGE_DAYS * 86_400_000),
    new Date(),
  ])
  const params = { from: toIso(range[0]), to: toIso(range[1]) }

  const conversion = useConversion(params)
  const precision = usePrecision(params)
  const critical = useCriticalStock()
  const inFlight = useAdminSales({ open: true, pageSize: 20 })

  return (
    <section aria-label={t('admin.analytics.indicators')}>
      <SurfaceCard
        titleSectionVariant="top"
        icon={IconChartHistogram}
        title={t('admin.analytics.indicators')}
      >
        <Stack gap="lg">
          <DatePickerInput
            type="range"
            label={t('admin.dashboard.range')}
            value={range}
            onChange={setRange}
            locale={language}
            clearable
            maw={360}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <ConversionBlock query={conversion} />
            <PrecisionBlock query={precision} />
            <CriticalStockBlock query={critical} />
            <InFlightBlock query={inFlight} />
          </SimpleGrid>
        </Stack>
      </SurfaceCard>
    </section>
  )
}
