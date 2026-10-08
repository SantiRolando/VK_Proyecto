/*
  Reglas del juego: lectura y edición en bloque.

  El catálogo de campos vive acá, no en el formulario: el rango y el valor por defecto
  son parte del contrato y el mock los aplica al validar. Repetirlos en la pantalla deja
  que el formulario acepte valores que la validación después rechaza.

  `fallback` es el valor que se lee cuando la clave falta o no es un número.
*/

import { apiClient } from '@api/client/api-client.js'

export const SETTINGS_FIELDS = [
  {
    name: 'successProbability',
    key: 'success_probability',
    min: 0,
    max: 100,
    // Paso del botón: cinco puntos porcentuales mueven la aguja sin pasarse.
    step: 5,
    unit: '%',
    fallback: 0,
  },
  {
    name: 'pointsPerFeedback',
    key: 'points_per_feedback',
    min: 0,
    max: 1000,
    step: 5,
    fallback: 0,
  },
  {
    name: 'maxDailyFeedback',
    key: 'max_daily_feedback',
    min: 0,
    max: 100,
    step: 1,
    fallback: 0,
  },
  { name: 'coordinationEmail', key: 'coordination_email', fallback: '' },
  { name: 'coordinationWhatsapp', key: 'coordination_whatsapp', fallback: '' },
  {
    name: 'staleSaleDays',
    key: 'stale_sale_days',
    min: 0,
    max: 365,
    step: 1,
    fallback: 0,
  },
]

// Un campo con rango es entero y se valida; sin rango es texto libre.
export function isIntegerField(field) {
  return field.max !== undefined
}

export const adminSettingsService = {
  get: () => apiClient.get('/admin/settings'),
  update: (payload) => apiClient.patch('/admin/settings', payload),
}
