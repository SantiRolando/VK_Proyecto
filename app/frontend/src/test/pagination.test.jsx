import { Providers } from '@app/providers.jsx'
import { Pagination } from '@components/pagination.jsx'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
  Pie de un listado paginado: el rango visible, el salto de página y el tamaño de página.
*/

function renderPagination(props) {
  return render(
    <Providers>
      <Pagination page={1} pageSize={20} total={136} {...props} />
    </Providers>,
  )
}

beforeEach(() => {
  window.localStorage.setItem('vkfit.language', 'es')
})

describe('Pagination', () => {
  it('muestra el rango de la página y la página activa', () => {
    renderPagination({ page: 2 })

    expect(screen.getByText('Mostrando 21–40 de 136')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute(
      'data-active',
      'true',
    )
  })

  it('avisa el cambio de página', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onPageChange = vi.fn()
    renderPagination({ onPageChange })

    await user.click(screen.getByRole('button', { name: '4' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('muestra el tamaño de página con el que se pidió el listado', () => {
    renderPagination({ pageSize: 50, total: 136, onPageSizeChange: vi.fn() })

    expect(screen.getByRole('combobox', { name: 'Filas por página' })).toHaveValue(
      '50 por página',
    )
    expect(screen.getByText('Mostrando 1–50 de 136')).toBeInTheDocument()
  })

  it('sin filas no dibuja nada', () => {
    renderPagination({ total: 0 })

    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
