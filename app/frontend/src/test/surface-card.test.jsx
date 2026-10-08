import { Providers } from '@app/providers.jsx'
import { InsetCard, SurfaceCard } from '@components/surface-card.jsx'
import { IconGift } from '@tabler/icons-react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('SurfaceCard', () => {
  it('deja el título arriba del contenido sin la variante superior', () => {
    render(
      <Providers>
        <SurfaceCard title="Sección">
          <p>Contenido</p>
        </SurfaceCard>
      </Providers>,
    )

    expect(screen.getByText('Sección')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('en la variante superior muestra icono, descripción y el slot de la derecha', () => {
    const { container } = render(
      <Providers>
        <SurfaceCard
          titleSectionVariant="top"
          icon={IconGift}
          title="Puntos por feedback"
          description="Cómo se premia el feedback."
          rightSection={<span>Equilibrada</span>}
        >
          <p>Contenido</p>
        </SurfaceCard>
      </Providers>,
    )

    expect(screen.getByText('Puntos por feedback')).toBeInTheDocument()
    expect(screen.getByText('Cómo se premia el feedback.')).toBeInTheDocument()
    expect(screen.getByText('Equilibrada')).toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('reserva el lugar de la media con el icono de relleno', () => {
    const { container } = render(
      <Providers>
        <SurfaceCard placeholderIcon={IconGift} />
      </Providers>,
    )

    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('la tarjeta hundida no repite la superficie', () => {
    render(
      <Providers>
        <InsetCard>
          <p>Control</p>
        </InsetCard>
      </Providers>,
    )

    expect(screen.getByText('Control')).toBeInTheDocument()
  })
})
