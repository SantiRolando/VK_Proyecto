// Service de direcciones (US4/US5) contra `/addresses` del backend.
// La edición es un PUT completo (el formulario manda todos los campos).

import { apiClient } from '@api/client/api-client.js'

function encodeAddress(payload) {
  return {
    street: payload.street,
    number: payload.number || null,
    city: payload.city,
    department: payload.department,
    reference: payload.reference || null,
  }
}

function decodeAddress(address) {
  return { ...address, number: address.number ?? '', reference: address.reference ?? '' }
}

export const addressesService = {
  listMine: () => apiClient.get('/addresses').then((items) => items.map(decodeAddress)),
  create: (payload) =>
    apiClient.post('/addresses', encodeAddress(payload)).then(decodeAddress),
  update: (addressId, payload) =>
    apiClient.put(`/addresses/${addressId}`, encodeAddress(payload)).then(decodeAddress),
  remove: (addressId) => apiClient.delete(`/addresses/${addressId}`),
  setDefault: (addressId) =>
    apiClient.put(`/addresses/${addressId}/default`).then(decodeAddress),
}
