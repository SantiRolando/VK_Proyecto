// Validación de formato de las medidas del cuerpo (FR-005) con los mismos
// rangos que el backend. Cuáles son obligatorias depende de la tabla de talles
// (línea + público): eso lo decide cada formulario con `requiredMeasures`.
//
// Compartido por el formulario de medición y el de perfiles de medidas.

import { z } from 'zod'

// Orden de presentación de las medidas (formularios y resúmenes).
export const MEASURE_FIELDS = ['height', 'bust', 'waist', 'hip', 'torso']

export const MEASURE_RANGES = {
  height: [50, 250],
  bust: [30, 200],
  waist: [30, 200],
  hip: [30, 200],
  torso: [50, 300],
  age: [1, 120],
}

const empty = (value) => value === '' || value === null || value === undefined

function optionalMeasure(field) {
  const [min, max] = MEASURE_RANGES[field]
  return z.preprocess(
    (value) => (empty(value) ? null : Number(value)),
    z
      .number({ message: 'invalid' })
      .refine((value) => Number.isFinite(value) && value >= min && value <= max, {
        message: 'invalid',
      })
      .nullable(),
  )
}

export const measuresShape = Object.fromEntries(
  [...MEASURE_FIELDS, 'age'].map((field) => [field, optionalMeasure(field)]),
)

export const measuresSchema = z.object(measuresShape)

// Exige las medidas que la tabla usa; el resto queda opcional.
export function requiredMeasures(schema, required) {
  return schema.superRefine((values, context) => {
    for (const field of required) {
      if (values[field] == null) {
        context.addIssue({ code: 'custom', path: [field], message: 'required' })
      }
    }
  })
}

// Valores de formulario (vacíos si falta el dato) a partir de un perfil, una
// generación o cualquier objeto con las medidas.
export function measuresFormValues(source) {
  return Object.fromEntries(
    [...MEASURE_FIELDS, 'age'].map((field) => [field, source?.[field] ?? '']),
  )
}
