import { addressesService } from '@api/services/addresses-service.js'
import { profilesService } from '@api/services/profiles-service.js'
import { sizeService } from '@api/services/size-service.js'
import { testTools } from '@api/services/test-tools.js'
import { Providers } from '@app/providers.jsx'
import { queryClient } from '@app/query-client.js'
import { AppRouter } from '@app/router.jsx'
import { routes } from '@app/routes.js'
import { SeedUser } from '@constants/enums.js'
import { signInAs } from '@test/session.js'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

/*
  Flujo completo de perfiles y direcciones sobre el router y los providers reales, contra el
  transporte mock: se crean y administran perfiles de medidas y direcciones
  como lo haría el cliente, se alterna el perfil activo desde el selector global
  (el formulario de medición se precarga) y se comprueba en el contrato que el
  historial queda separado por perfil.

  El idioma se fija en español para que las aserciones sean texto visible real.
*/

function renderAt(path) {
  return render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Providers>,
  )
}

// Ana arranca con dos perfiles ("Training" predeterminado y "Son"), dos direcciones y
// generaciones en ambos perfiles; el cliente nuevo arranca sin perfiles ni direcciones.
// El contenido de la pantalla vive en `<main>`, así el scope no se confunde con el header.
// El router es perezoso: se espera a que el layout monte antes de acotar.
async function mainView() {
  return within(await screen.findByRole('main'))
}

const MEASURE_LABELS = {
  height: /Altura/,
  bust: /Busto/,
  waist: /Cintura/,
  hip: /Cadera/,
  torso: /Torso/,
}

const ADDRESS_LABELS = {
  street: /Calle/,
  number: /Número/,
  city: /Ciudad/,
  department: /Departamento/,
  reference: /Referencia/,
}

async function fillProfile(user, dialog, name, measures) {
  const form = within(dialog)
  const nameInput = form.getByLabelText(/Nombre del perfil/)
  await user.clear(nameInput)
  await user.type(nameInput, name)

  for (const [field, matcher] of Object.entries(MEASURE_LABELS)) {
    const input = form.getByLabelText(matcher)
    await user.clear(input)
    await user.type(input, measures[field])
  }

  await user.click(form.getByRole('button', { name: 'Guardar' }))
}

async function fillAddress(user, dialog, values) {
  const form = within(dialog)
  for (const [field, matcher] of Object.entries(ADDRESS_LABELS)) {
    const input = form.getByLabelText(matcher)
    await user.clear(input)
    if (values[field]) await user.type(input, values[field])
  }

  await user.click(form.getByRole('button', { name: 'Guardar dirección' }))
}

// El `Menu` de Mantine monta el dropdown en un portal con transición: Testing Library no
// siempre lo encuentra, así que se busca en el DOM crudo y se abre con `fireEvent.click`.
async function openProfileMenu(trigger, targetName) {
  const findItem = () =>
    [...document.querySelectorAll('[role="menuitem"]')].find(
      (node) => node.textContent.trim() === targetName,
    )

  for (let attempt = 0; attempt < 4; attempt += 1) {
    fireEvent.click(trigger)

    const found = await waitFor(
      () => {
        const node = findItem()
        if (!node) throw new Error('El menú no abrió')
        return node
      },
      { timeout: 2000 },
    ).catch(() => null)

    if (found) return found
  }

  throw new Error(`El selector de perfil no abrió el menú (${targetName})`)
}

beforeEach(async () => {
  window.localStorage.setItem('vkfit.language', 'es')
  queryClient.clear()
  // La DB mock es un módulo con estado: se re-siembra con las herramientas de la suite.
  await testTools.resetDatabase()
})

describe('perfiles de medidas', () => {
  it('crea dos perfiles y administra la agenda: edición, predeterminado y baja', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.EmptyCustomer)

    renderAt(routes.accountProfiles)
    const view = await mainView()

    expect(await view.findByText('Todavía no tenés perfiles')).toBeInTheDocument()

    // Alta del primer perfil: queda predeterminado por ser el primero.
    await user.click(view.getByRole('button', { name: 'Nuevo perfil' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nuevo perfil' })
    await fillProfile(user, dialog, 'Entrenamiento', {
      height: '168',
      bust: '90',
      waist: '72',
      hip: '98',
      torso: '142',
    })

    expect(await view.findByText('Entrenamiento')).toBeInTheDocument()
    expect(view.getByText('Predeterminado')).toBeInTheDocument()

    // Alta del segundo perfil.
    await user.click(view.getByRole('button', { name: 'Nuevo perfil' }))
    dialog = await screen.findByRole('dialog', { name: 'Nuevo perfil' })
    await fillProfile(user, dialog, 'Hijo', {
      height: '145',
      bust: '72',
      waist: '64',
      hip: '76',
      torso: '120',
    })

    expect(await view.findByText('Hijo')).toBeInTheDocument()

    const profiles = await profilesService.listMine()
    expect(profiles.map((profile) => profile.name)).toEqual(['Entrenamiento', 'Hijo'])
    expect(profiles[0]).toMatchObject({ name: 'Entrenamiento', isDefault: true })

    // Edición: se renombra el segundo perfil (los perfiles se listan con el
    // predeterminado primero).
    await user.click(view.getAllByRole('button', { name: 'Editar perfil' })[1])
    dialog = await screen.findByRole('dialog', { name: 'Editar perfil' })
    await fillProfile(user, dialog, 'Hijo 2026', {
      height: '145',
      bust: '72',
      waist: '64',
      hip: '76',
      torso: '120',
    })

    expect(await view.findByText('Hijo 2026')).toBeInTheDocument()

    // Predeterminado: la marca pasa al segundo perfil.
    await user.click(view.getByRole('button', { name: 'Usar por defecto' }))
    await waitFor(async () => {
      const list = await profilesService.listMine()
      expect(list.find((profile) => profile.name === 'Hijo 2026').isDefault).toBe(true)
    })

    // Baja: se elimina el predeterminado y el usuario queda sin default (como en
    // la API: no se promueve otro).
    await user.click(view.getAllByRole('button', { name: 'Eliminar' })[0])
    dialog = await screen.findByRole('dialog', { name: 'Eliminar perfil' })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(async () => {
      const list = await profilesService.listMine()
      expect(list).toHaveLength(1)
      expect(list[0]).toMatchObject({ name: 'Entrenamiento', isDefault: false })
    })
  })

  it('alterna el perfil activo desde el selector global y precarga la medición', async () => {
    await signInAs(SeedUser.Ana)

    renderAt(routes.fit({ line: 'endurance' }))

    // El perfil predeterminado (Training) precarga el formulario de medición.
    // (El `NumberInput` muestra el sufijo " cm" en el valor cuando no está enfocado.)
    expect(await screen.findByLabelText(/Altura/)).toHaveValue('168 cm')
    expect(screen.getByLabelText(/Cadera/)).toHaveValue('98 cm')

    /*
      El perfil activo se cambia desde el menú del avatar de cuenta, que ahora
      reúne el menú de cuenta y el selector de perfil.
    */
    const trigger = await screen.findByRole('button', { name: 'Cuenta' })
    fireEvent.click(await openProfileMenu(trigger, 'Son'))

    // Cambiar de perfil remonta el formulario con las medidas del nuevo perfil.
    await waitFor(() => expect(screen.getByLabelText(/Altura/)).toHaveValue('145 cm'))
    expect(screen.getByLabelText(/Cadera/)).toHaveValue('76 cm')
  })

  it('separa el historial de mediciones por perfil', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.Ana)

    // Ana ya tiene generaciones repartidas entre sus dos perfiles.
    const allBefore = await sizeService.listGenerations()
    const trainingBefore = await sizeService.listGenerations({ profileId: 1 })
    const sonBefore = await sizeService.listGenerations({ profileId: 2 })
    expect(trainingBefore.length + sonBefore.length).toBe(allBefore.length)

    renderAt(routes.fit({ line: 'endurance' }))

    // Con el perfil predeterminado (Training) se genera una medición nueva.
    await user.click(await screen.findByRole('button', { name: 'Obtener mi talle' }))
    expect(
      await screen.findByRole('heading', { name: 'Tu talle recomendado' }),
    ).toBeInTheDocument()

    const allAfter = await sizeService.listGenerations()
    const trainingAfter = await sizeService.listGenerations({ profileId: 1 })
    const sonAfter = await sizeService.listGenerations({ profileId: 2 })

    // La generación nueva queda en Training y el historial de Son no cambia.
    expect(trainingAfter).toHaveLength(trainingBefore.length + 1)
    expect(allAfter).toHaveLength(allBefore.length + 1)
    expect(sonAfter).toHaveLength(sonBefore.length)

    // Los historiales por perfil no se solapan.
    const trainingIds = new Set(trainingAfter.map((generation) => generation.id))
    expect(sonAfter.some((generation) => trainingIds.has(generation.id))).toBe(false)
  })
})

describe('agenda de direcciones', () => {
  it('crea, edita, marca como predeterminada y elimina direcciones', async () => {
    const user = userEvent.setup()
    await signInAs(SeedUser.EmptyCustomer)

    renderAt(routes.accountAddresses)
    const view = await mainView()

    expect(await view.findByText('Todavía no tenés direcciones')).toBeInTheDocument()

    // Alta de la primera dirección (queda predeterminada).
    await user.click(view.getByRole('button', { name: 'Nueva dirección' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nueva dirección' })
    await fillAddress(user, dialog, {
      street: 'Rivera',
      number: '3000',
      city: 'Montevideo',
      department: 'Montevideo',
      reference: 'Apto 2',
    })

    expect(
      await view.findByText('Rivera 3000, Montevideo, Montevideo, Apto 2'),
    ).toBeInTheDocument()
    expect(view.getByText('Predeterminada')).toBeInTheDocument()

    // Alta de la segunda dirección.
    await user.click(view.getByRole('button', { name: 'Nueva dirección' }))
    dialog = await screen.findByRole('dialog', { name: 'Nueva dirección' })
    await fillAddress(user, dialog, {
      street: 'Sarandí',
      number: '100',
      city: 'Piriápolis',
      department: 'Maldonado',
      reference: '',
    })

    expect(
      await view.findByText('Sarandí 100, Piriápolis, Maldonado'),
    ).toBeInTheDocument()

    // Predeterminada: la marca pasa a la segunda dirección.
    await user.click(view.getByRole('button', { name: 'Usar por defecto' }))
    await waitFor(async () => {
      const list = await addressesService.listMine()
      expect(list.find((address) => address.city === 'Piriápolis').isDefault).toBe(true)
    })

    // Edición de la dirección que quedó sin la marca (el listado la muestra
    // después de la predeterminada).
    await user.click(view.getAllByRole('button', { name: 'Editar dirección' })[1])
    dialog = await screen.findByRole('dialog', { name: 'Editar dirección' })
    const cityInput = within(dialog).getByLabelText(/Ciudad/)
    await user.clear(cityInput)
    await user.type(cityInput, 'Las Piedras')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar dirección' }))

    expect(
      await view.findByText('Rivera 3000, Las Piedras, Montevideo, Apto 2'),
    ).toBeInTheDocument()

    // Baja de la predeterminada: el usuario queda sin default (como en la API).
    await user.click(view.getAllByRole('button', { name: 'Eliminar' })[0])
    dialog = await screen.findByRole('dialog', { name: 'Eliminar dirección' })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(async () => {
      const list = await addressesService.listMine()
      expect(list).toHaveLength(1)
      expect(list[0]).toMatchObject({ city: 'Las Piedras', isDefault: false })
    })
  })
})
