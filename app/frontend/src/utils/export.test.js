import { buildCsv, downloadCsv } from '@utils/download.js'
import { buildExcelXml } from '@utils/excel.js'
import { describe, expect, it, vi } from 'vitest'

const columns = [
  { label: 'Línea', value: (row) => row.line },
  { label: 'Talle', value: (row) => row.size },
  { label: 'Consultas', value: (row) => row.count },
]

describe('buildCsv', () => {
  it('arma el encabezado traducido y las filas', () => {
    expect(buildCsv(columns, [{ line: 'Soft', size: 'M', count: 3 }])).toBe(
      'Línea,Talle,Consultas\r\nSoft,M,3',
    )
  })

  it('escapa comas, comillas y saltos de línea', () => {
    const csv = buildCsv(columns, [{ line: 'Soft, "especial"', size: 'M\nL', count: 1 }])
    expect(csv).toContain('"Soft, ""especial"""')
    expect(csv).toContain('"M\nL"')
  })

  it('deja vacías las celdas sin dato', () => {
    expect(buildCsv(columns, [{ line: 'Soft', size: null, count: 0 }])).toBe(
      'Línea,Talle,Consultas\r\nSoft,,0',
    )
  })
})

describe('buildExcelXml', () => {
  it('genera un workbook con los tipos de dato', () => {
    const xml = buildExcelXml('Reporte', columns, [{ line: 'Soft', size: 'M', count: 3 }])

    expect(xml).toContain('<?mso-application progid="Excel.Sheet"?>')
    expect(xml).toContain('ss:Name="Reporte"')
    expect(xml).toContain('<Data ss:Type="String">Soft</Data>')
    expect(xml).toContain('<Data ss:Type="Number">3</Data>')
  })

  it('escapa el XML', () => {
    const xml = buildExcelXml('R', columns, [{ line: 'A & B <C>', size: 'M', count: 0 }])
    expect(xml).toContain('A &amp; B &lt;C&gt;')
  })
})

describe('downloadCsv', () => {
  it('dispara la descarga con BOM para Excel', () => {
    const createObjectURL = vi.fn(() => 'blob:reporte')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    downloadCsv('reporte', columns, [{ line: 'Soft', size: 'M', count: 1 }])

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob.type).toContain('text/csv')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:reporte')

    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
