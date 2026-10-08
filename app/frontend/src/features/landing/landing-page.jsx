import { Benefits } from '@features/landing/benefits.jsx'
import { CtaSection } from '@features/landing/cta-section.jsx'
import { Hero } from '@features/landing/hero.jsx'
import { HowItWorks } from '@features/landing/how-it-works.jsx'
import { SiteHeader } from '@features/landing/site-header.jsx'
import { Store } from '@features/landing/store.jsx'

/*
  La landing sigue el esquema de color de la app: el fondo lo pone el tema y las secciones no
  lo pisan, así que el claro y el oscuro salen de los tokens. El armazón de la app ya envuelve
  sus pantallas en `<main>`, así que el punto de entrada del cliente tiene el mismo landmark.
*/
export function LandingPage() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Store />
      <CtaSection />
    </main>
  )
}
