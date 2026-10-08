/*
  Exportación de reportes del panel.

  El CSV se arma acá; el Excel vive en `excel.js` (se importa en forma dinámica
  desde `use-export`). Las columnas son `{ label, value(row) }`, con el label ya
  traducido por la pantalla: los datos no se traducen, los encabezados sí.
*/

function escapeCell(value) {
  const text = value == null ? '' : String(value)
  return /[",\n\r;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const lines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(','),
  )
  return [header, ...lines].join('\r\n')
}

export function downloadText(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// BOM para que Excel abra el CSV en UTF-8 y no rompa los acentos.
export function downloadCsv(filename, columns, rows) {
  downloadText(
    `${filename}.csv`,
    `\uFEFF${buildCsv(columns, rows)}`,
    'text/csv;charset=utf-8',
  )
}
