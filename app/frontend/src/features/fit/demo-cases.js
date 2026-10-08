import {
  Audience,
  FitWarning,
  GenerationOutcome,
  Line,
  ReferralReason,
} from '@constants/enums.js'

/*
  Casos de demostración del generador. Andamiaje, no producto: existen
  para mostrar el motor sin tipear medidas en vivo y se retiran cuando el
  cliente valide esta versión.

  Viven en el código y no en la base a propósito: la demo no puede depender de
  que alguien haya corrido un seed antes.

  El talle esperado sale de correr el motor contra las tablas cargadas (mismos
  rangos en el mock y en el backend), así que sirve para verificar en el momento
  que el motor devolvió lo que se esperaba. `demo-cases.test.jsx` lo comprueba
  caso por caso: si una tabla cambia, el test cae.
*/
export const DEMO_CASES = [
  {
    id: 'directEndurance',
    line: Line.Endurance,
    audience: Audience.Adult,
    measures: { bust: 85, waist: 67 },
    expected: { outcome: GenerationOutcome.Direct, size: 'M' },
  },
  {
    // Misma tabla que Endurance con las etiquetas corridas un paso: mismo
    // índice, otra letra. Es lo que se quiere ver cuando la tabla se comparte.
    id: 'directSoft',
    line: Line.Soft,
    audience: Audience.Adult,
    measures: { bust: 88, waist: 70 },
    expected: { outcome: GenerationOutcome.Direct, size: 'M' },
  },
  {
    id: 'adjacentRows',
    line: Line.Endurance,
    audience: Audience.Adult,
    measures: { bust: 90, waist: 67 },
    expected: { outcome: GenerationOutcome.Direct, size: 'L' },
  },
  {
    id: 'warningJammer',
    line: Line.Jammer,
    audience: Audience.Adult,
    measures: { waist: 80, hip: 96 },
    expected: {
      outcome: GenerationOutcome.WithWarning,
      size: 'L',
      warning: FitWarning.AdjacentSizeMayFit,
    },
  },
  {
    id: 'warningSunga',
    line: Line.Sunga,
    audience: Audience.Adult,
    measures: { waist: 76, hip: 92 },
    expected: {
      outcome: GenerationOutcome.WithWarning,
      size: 'M',
      warning: FitWarning.AdjacentSizeMayFit,
    },
  },
  {
    id: 'proportion',
    line: Line.Endurance,
    audience: Audience.Adult,
    measures: { bust: 106, waist: 64 },
    expected: {
      outcome: GenerationOutcome.Referred,
      size: null,
      referralReason: ReferralReason.ProportionMismatch,
    },
  },
  {
    id: 'aboveTable',
    line: Line.Endurance,
    audience: Audience.Adult,
    measures: { bust: 120, waist: 95 },
    expected: {
      outcome: GenerationOutcome.Referred,
      size: null,
      referralReason: ReferralReason.MeasureAboveTable,
    },
  },
  {
    /*
      Endurance infantil se resuelve solo por edad: las medidas de contorno no
      participan. Por eso el caso fuerza el público a infantil.
    */
    id: 'kidsAge',
    line: Line.Endurance,
    audience: Audience.Kids,
    measures: { age: 9 },
    expected: { outcome: GenerationOutcome.Direct, size: 'L' },
  },
]
