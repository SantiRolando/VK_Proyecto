import { downloadCsv } from '@utils/download.js'
import { useCallback, useState } from 'react'

/*
  Exportación de los reportes del panel: el Excel se carga con `import()` la primera vez
  que se usa, así el chunk del exportador no viaja en el bundle inicial.

  `columns` es `[{ label, value(row) }]`, con los encabezados ya traducidos.
*/
export function useExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async (task) => {
    setIsExporting(true)
    setError(null)
    try {
      await task()
    } catch (exportError) {
      setError(exportError)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const exportCsv = useCallback(
    (filename, columns, rows) => run(() => downloadCsv(filename, columns, rows)),
    [run],
  )

  const exportExcel = useCallback(
    (filename, sheetName, columns, rows) =>
      run(async () => {
        const { downloadExcel } = await import('@utils/excel.js')
        downloadExcel(filename, sheetName, columns, rows)
      }),
    [run],
  )

  return { isExporting, error, exportCsv, exportExcel }
}
