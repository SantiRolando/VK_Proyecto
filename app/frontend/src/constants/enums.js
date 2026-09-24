// Enums del modelo de datos (§5.1 del plan): valores tal cual el ERD.
// Las etiquetas visibles se resuelven siempre por clave i18n
// (`enums.<enum>.<valor>`); estos objetos son solo los valores estables.

export const UserType = {
  Admin: 'Admin',
  Customer: 'Customer',
}

export const Line = {
  Endurance: 'Endurance',
  Soft: 'Soft',
  Jammer: 'Jammer',
  Sunga: 'Sunga',
  Kids: 'Kids',
}

export const FitType = {
  Training: 'Training',
  Competition: 'Competition',
}

export const GenerationSource = {
  Direct: 'Direct',
  QR: 'QR',
  Landing: 'Landing',
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
