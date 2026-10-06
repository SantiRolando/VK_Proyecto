// Enums del modelo de datos (§5.1 del plan): valores del FE en PascalCase.
// Las etiquetas visibles se resuelven siempre por clave i18n
// (`enums.<enum>.<valor>`); estos objetos son solo los valores estables.
// La API real usa UPPER_SNAKE: la conversión vive en `src/api/wire.js`.

export const UserType = {
  Admin: 'Admin',
  Customer: 'Customer',
}

export const Line = {
  Endurance: 'Endurance',
  Soft: 'Soft',
  Jammer: 'Jammer',
  Sunga: 'Sunga',
}

// Público de la tabla de talles. Kids existe para Endurance (niñas, solo edad),
// Jammer y Sunga (varones); Soft no tiene tabla infantil.
export const Audience = {
  Adult: 'Adult',
  Kids: 'Kids',
}

export const KIDS_LINES = [Line.Endurance, Line.Jammer, Line.Sunga]

export const FitType = {
  Training: 'Training',
  Competition: 'Competition',
}

export const GenerationSource = {
  Direct: 'Direct',
  QR: 'QR',
  Landing: 'Landing',
}

export const GenerationOutcome = {
  Direct: 'Direct',
  WithWarning: 'WithWarning',
  Referred: 'Referred',
}

export const FitWarning = {
  AdjacentSizeMayFit: 'AdjacentSizeMayFit',
  AgeOutsideSizeRange: 'AgeOutsideSizeRange',
}

export const ReferralReason = {
  MeasureBelowTable: 'MeasureBelowTable',
  MeasureAboveTable: 'MeasureAboveTable',
  ProportionMismatch: 'ProportionMismatch',
  KidsAdultCrossover: 'KidsAdultCrossover',
  AgeOutsideTable: 'AgeOutsideTable',
}

export const Rating = {
  Small: 'Small',
  Correct: 'Correct',
  Large: 'Large',
}

export const SaleStatus = {
  PendingCoordination: 'PendingCoordination',
  Contacted: 'Contacted',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
}

export const Channel = {
  Email: 'Email',
  Whatsapp: 'Whatsapp',
}

export const DeliveryMethod = {
  StorePickup: 'StorePickup',
  HomeDelivery: 'HomeDelivery',
}

export const TransactionDirection = {
  Inbound: 'Inbound',
  Outbound: 'Outbound',
}

export const TransactionReason = {
  GoodsReceipt: 'GoodsReceipt',
  SizeExchange: 'SizeExchange',
  LossDefective: 'LossDefective',
  ManualAdjustment: 'ManualAdjustment',
  SaleConfirmed: 'SaleConfirmed',
}

export const AlertType = {
  CriticalStock: 'CriticalStock',
  RestockNotice: 'RestockNotice',
}

export const AlertStatus = {
  Active: 'Active',
  Notified: 'Notified',
  Closed: 'Closed',
}

export const DiscountType = {
  Fixed: 'Fixed',
  Percentage: 'Percentage',
}

export const PointsMovementType = {
  Feedback: 'Feedback',
  Redemption: 'Redemption',
  Adjustment: 'Adjustment',
}

// Cuentas fijas del seed de demo (`src/mocks/db/seed/users.js`). A diferencia de
// los enums de arriba, los valores son los ids estables de esas tres cuentas:
// `signInAs` los usa para entrar por el login real, así que el id nunca debería
// escribirse a mano en un test.
export const SeedUser = {
  Admin: 1,
  Ana: 2,
  EmptyCustomer: 3,
}
