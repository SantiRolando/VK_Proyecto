import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { GenerationOutcome, SeedUser } from '@constants/enums.js'
import { DEMO_CASES } from '@features/fit/demo-cases.js'
import es from '@i18n/locales/es.js'
import { signInAs } from '@test/session.js'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

// VK-82: precarga de casos de demostración en el generador de talles. La
// sección es andamiaje visible solo para un admin, llena el formulario sin
// generar y declara el talle esperado de cada caso.
//
// El último bloque corre **todos** los casos contra el motor: es lo que
// garantiza que el "esperado" que muestra la pantalla siga siendo el que la
// tabla devuelve. Si una tabla cambia, el test cae.

const caseName = (demoCase) => es[`fit.demo.case.${demoCase.id}`]
const loadCaseName = (demoCase) => `Cargar caso: ${caseName(demoCase)}`

const MEASURE_LABELS = {
  bust: /^Busto/,
  waist: /^Cintura/,
  hip: /^Cadera/,
  age: /^Edad/,
}

// La etiqueta del select trae el asterisco de obligatorio en el texto.
const LINE_LABEL = /Línea de prenda/
const lineSelect = () => screen.getByRole('combobox', { name: LINE_LABEL })

// El `NumberInput` muestra el sufijo " cm" en el valor cuando no está enfocado.
const MEASURE_SUFFIX = { bust: ' cm', waist: ' cm', hip: ' cm', age: '' }

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

describe('VK-82 · precarga de casos para demo', () => {
  beforeEach(async () => {
    window.localStorage.setItem('vkfit.language', 'es')
    queryClient.clear()
    await testTools.resetDatabase()
  })

  it('la ve un admin y el aviso de que es temporal está en pantalla', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.fit())

    expect(await screen.findByText('Casos de demostración')).toBeInTheDocument()
    expect(screen.getByText(es['fit.demo.notice'])).toBeInTheDocument()
    expect(screen.getByText(es['fit.demo.hint'])).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Cargar caso: / })).toHaveLength(
      DEMO_CASES.length,
    )
  })

  it('no la ve un cliente', async () => {
    await signInAs(SeedUser.Ana)
    renderAt(routes.fit())

    // El formulario tiene que estar montado antes de afirmar una ausencia.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /obtener mi talle/i }),
      ).toBeInTheDocument()
    })

    expect(screen.queryByText('Casos de demostración')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Cargar caso: / }),
    ).not.toBeInTheDocument()
  })

  it('cada caso menciona su talle esperado', async () => {
    await signInAs(SeedUser.Admin)
    renderAt(routes.fit())
    await screen.findByText('Casos de demostración')

    for (const demoCase of DEMO_CASES) {
      expect(
        screen.getByRole('button', { name: loadCaseName(demoCase) }),
      ).toBeInTheDocument()
    }

    // "Esperado: <talle> · <resultado>"; se repite solo donde el caso coincide.
    expect(screen.getAllByText('Esperado: M · Talle directo')).toHaveLength(2)
    expect(screen.getAllByText('Esperado: L · Talle directo')).toHaveLength(2)
    expect(screen.getAllByText('Esperado: L · Talle con aviso')).toHaveLength(1)
    expect(screen.getAllByText('Esperado: M · Talle con aviso')).toHaveLength(1)
    expect(screen.getAllByText('Esperado: Sin talle · Derivada')).toHaveLength(2)

    // Los dos casos derivados explican por qué, con la etiqueta del resultado.
    expect(
      screen.getByText(es['enums.referralReason.ProportionMismatch']),
    ).toBeInTheDocument()
    expect(
      screen.getByText(es['enums.referralReason.MeasureAboveTable']),
    ).toBeInTheDocument()
  })

  it('elegir un caso llena el formulario y no dispara la generación', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.fit())

    await user.click(
      await screen.findByRole('button', {
        name: loadCaseName(DEMO_CASES.find((item) => item.id === 'directEndurance')),
      }),
    )

    expect(await screen.findByLabelText(MEASURE_LABELS.bust)).toHaveValue('85 cm')
    expect(screen.getByLabelText(MEASURE_LABELS.waist)).toHaveValue('67 cm')
    expect(lineSelect()).toHaveValue('Endurance')
    expect(screen.getByRole('radio', { name: 'Adultos' })).toBeChecked()

    // Sigue en el formulario: el caso no generó nada.
    expect(screen.queryByText(es['fit.result.title'])).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /obtener mi talle/i })).toBeInTheDocument()

    // La generación la dispara la persona con el botón.
    await user.click(screen.getByRole('button', { name: /obtener mi talle/i }))

    expect(await screen.findByText(es['fit.result.title'])).toBeInTheDocument()
    expect(screen.getByText('M', { selector: 'p' })).toBeInTheDocument()
  })
})

describe.each(DEMO_CASES)('VK-82 · caso $id contra el motor', (demoCase) => {
  beforeEach(async () => {
    window.localStorage.setItem('vkfit.language', 'es')
    queryClient.clear()
    await testTools.resetDatabase()
  })

  it('llena el formulario con sus medidas y devuelve el talle esperado', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Admin)
    renderAt(routes.fit())

    await user.click(await screen.findByRole('button', { name: loadCaseName(demoCase) }))

    // 1) Las medidas del caso quedan cargadas en el formulario.
    await waitFor(() => {
      for (const [field, value] of Object.entries(demoCase.measures)) {
        expect(screen.getByLabelText(MEASURE_LABELS[field])).toHaveValue(
          `${value}${MEASURE_SUFFIX[field]}`,
        )
      }
    })
    expect(lineSelect()).toHaveValue(es[`enums.line.${demoCase.line}`])
    expect(
      screen.getByRole('radio', {
        name: es[`enums.audience.${demoCase.audience}`],
      }),
    ).toBeChecked()

    // 2) Generar a mano devuelve lo que la pantalla declaró como esperado.
    await user.click(screen.getByRole('button', { name: /obtener mi talle/i }))

    if (demoCase.expected.outcome === GenerationOutcome.Referred) {
      // El motivo aparece también en la tarjeta del caso: se busca dentro del
      // bloque de derivación, que es el que confirma qué devolvió el motor.
      const referral = (await screen.findByText(es['fit.outOfRange.title'])).parentElement
      expect(
        within(referral).getByText(
          es[`enums.referralReason.${demoCase.expected.referralReason}`],
        ),
      ).toBeInTheDocument()
      return
    }

    expect(await screen.findByText(es['fit.result.title'])).toBeInTheDocument()
    expect(
      screen.getByText(demoCase.expected.size, { selector: 'p' }),
    ).toBeInTheDocument()
    if (demoCase.expected.warning) {
      expect(
        screen.getByText(es[`enums.fitWarning.${demoCase.expected.warning}`]),
      ).toBeInTheDocument()
    }
  })
})
