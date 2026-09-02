import { SiteHeader } from './site-header.jsx'
import { Hero } from './hero.jsx'
import { HowItWorks } from './how-it-works.jsx'
import { Benefits } from './benefits.jsx'
import { Store } from './store.jsx'
import { CtaSection } from './cta-section.jsx'

export function LandingPage() {
  return (
    <div className="bg-white">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Store />
      <CtaSection />
    </div>
  )
}
