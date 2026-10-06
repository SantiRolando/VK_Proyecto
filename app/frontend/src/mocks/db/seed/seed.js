// Composición de la seed: arma una DB completa y consistente entre entidades.

import { buildCatalog } from '@mocks/db/seed/catalog.js'
import { buildHistory } from '@mocks/db/seed/history.js'
import { buildSettings } from '@mocks/db/seed/settings.js'
import { buildSizes } from '@mocks/db/seed/sizes.js'
import { buildIdentity } from '@mocks/db/seed/users.js'

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

  /*
    Clon profundo: los builders comparten arrays a nivel de módulo, así que un reset
    contamina la base con las mutaciones de la seed anterior.
  */
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
