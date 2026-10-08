import { Benefits } from '@features/landing/benefits.jsx'
import { CtaSection } from '@features/landing/cta-section.jsx'
import { Hero } from '@features/landing/hero.jsx'
import { HowItWorks } from '@features/landing/how-it-works.jsx'
import { SiteHeader } from '@features/landing/site-header.jsx'
import { Store } from '@features/landing/store.jsx'

/*
  El `bg-white` de `<main>` es lo que mantiene la landing en claro con el tema oscuro
  puesto: las secciones declaran su propio fondo, pero el marco no. El armazón de la app
  ya envuelve sus pantallas en `<main>`, así que el punto de entrada del cliente tiene el
  mismo landmark.
*/
export function LandingPage() {
  return (
    <main className="bg-white">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Store />
      <CtaSection />
    </main>
  )
}
