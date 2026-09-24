// Composición de la seed: construye una DB completa y consistente con el
// ER nuevo (15 entidades, camelCase — §5.2 del plan).

import { buildIdentity } from './users.js'
import { buildSizes } from './sizes.js'
import { buildCatalog } from './catalog.js'
import { buildSettings } from './settings.js'
import { buildHistory } from './history.js'

export function seedDatabase() {
  const { users, measurementProfiles, addresses } = buildIdentity()
  const sizes = buildSizes()
  const { products, productVariants } = buildCatalog(sizes)
  const settings = buildSettings()
  const {
    sizeGenerations,
    sales,
    saleLines,
    discountCoupons,
    pointsMovements,
    transactions,
    transactionLines,
    alerts,
  } = buildHistory({ sizes, products, productVariants })

  // Clon profundo: cada seed devuelve instancias nuevas. Sin esto, los
  // builders comparten arrays a nivel de módulo y un reset contamina la
  // base con mutaciones de seeds anteriores.
  return structuredClone({
    users,
    measurementProfiles,
    addresses,
    sizes,
    products,
    productVariants,
    sizeGenerations,
    sales,
    saleLines,
    discountCoupons,
    pointsMovements,
    transactions,
    transactionLines,
    alerts,
    settings,
  })
}
