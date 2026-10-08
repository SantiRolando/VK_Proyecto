/*
  Excel del panel, importado con `import()` desde `use-export`. Genera SpreadsheetML 2003
  (`.xls`), que Excel y LibreOffice abren sin librería.
*/

import { downloadText } from '@utils/download.js'

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function cell(value) {
  const text = value == null ? '' : String(value)
  const isNumber = text !== '' && Number.isFinite(Number(text))
  const type = isNumber ? 'Number' : 'String'
  return `<Cell><Data ss:Type="${type}">${escapeXml(text)}</Data></Cell>`
}

export function buildExcelXml(sheetName, columns, rows) {
  const header = `<Row>${columns.map((column) => cell(column.label)).join('')}</Row>`
  const body = rows
    .map(
      (row) => `<Row>${columns.map((column) => cell(column.value(row))).join('')}</Row>`,
    )
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
    `<Worksheet ss:Name="${escapeXml(sheetName)}"><Table>`,
    header,
    body,
    '</Table></Worksheet></Workbook>',
  ].join('')
}

export function downloadExcel(filename, sheetName, columns, rows) {
  downloadText(
    `${filename}.xls`,
    buildExcelXml(sheetName, columns, rows),
    'application/vnd.ms-excel',
  )
}
