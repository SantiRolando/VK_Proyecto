import { useExport } from '@hooks/use-export.js'
import { useI18n } from '@i18n/context.js'
import { Button, Group } from '@mantine/core'
import { IconFileSpreadsheet } from '@tabler/icons-react'

/*
  Exportación de un reporte a CSV y Excel. Las columnas llegan con los encabezados ya traducidos
  y el Excel se carga recién al usarlo.
*/
export function ExportButtons({ filename, sheetName, columns, rows }) {
  const { t } = useI18n()
  const { exportCsv, exportExcel, isExporting } = useExport()

  const disabled = rows.length === 0 || isExporting

  return (
    <Group gap="xs">
      <Button
        variant="light"
        size="compact-sm"
        disabled={disabled}
        onClick={() => exportCsv(filename, columns, rows)}
      >
        {t('admin.analytics.export.csv')}
      </Button>
      <Button
        variant="light"
        size="compact-sm"
        color="teal"
        rightSection={<IconFileSpreadsheet size={14} />}
        disabled={disabled}
        onClick={() => exportExcel(filename, sheetName, columns, rows)}
      >
        {t('admin.analytics.export.excel')}
      </Button>
    </Group>
  )
}
