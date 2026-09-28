// Validación de formato de las cinco medidas del cuerpo (FR-005): números
// positivos dentro de un rango razonable. La validación de negocio (qué medida
// usa cada línea y el rango contra la tabla SIZE) vive en el controller mock.
//
// Compartido por el formulario de medición y el de perfiles de medidas.

import { z } from 'zod'

// Orden de presentación de las medidas (formularios y resúmenes).
export const MEASURE_FIELDS = ['height', 'bust', 'waist', 'hip', 'torso']

const toNumber = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined ? undefined : Number(value),
  z.number({ message: 'required' }),
)

const measure = toNumber.refine((value) => Number.isFinite(value) && value > 0, {
  message: 'invalid',
})

export const measuresShape = {
  height: measure.refine((value) => value >= 80 && value <= 250, {
    message: 'invalid',
  }),
  bust: measure.refine((value) => value >= 20 && value <= 300, {
    message: 'invalid',
  }),
  waist: measure.refine((value) => value >= 20 && value <= 300, {
    message: 'invalid',
  }),
  hip: measure.refine((value) => value >= 20 && value <= 300, {
    message: 'invalid',
  }),
  torso: measure.refine((value) => value >= 50 && value <= 300, {
    message: 'invalid',
  }),
}

export const measuresSchema = z.object(measuresShape)

// Valores de formulario (vacíos si falta el dato) a partir de un perfil, una
// generación o cualquier objeto con las cinco medidas.
export function measuresFormValues(source) {
  return Object.fromEntries(MEASURE_FIELDS.map((field) => [field, source?.[field] ?? '']))
}
