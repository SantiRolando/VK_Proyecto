// Contrato de red del backend ↔ modelo del FE.
//
// La API real escribe los enums en UPPER_SNAKE (`ENDURANCE`, `WITH_WARNING`) y
// el FE los maneja en PascalCase (`Endurance`, `WithWarning`, ver
// `constants/enums.js`). Los services convierten con estos codecs en ambos
// sentidos, y los controllers mock los usan para hablar el mismo contrato.

import {
  Audience,
  FitType,
  FitWarning,
  GenerationOutcome,
  GenerationSource,
  Line,
  Rating,
  ReferralReason,
  UserType,
} from '@constants/enums.js'

function toUpperSnake(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()
}

function codec(enumObject) {
  const values = Object.values(enumObject)
  const fromWire = new Map(values.map((value) => [toUpperSnake(value), value]))
  return {
    values,
    encode: (value) => (value == null ? value : toUpperSnake(value)),
    decode: (wire) => (wire == null ? wire : (fromWire.get(wire) ?? wire)),
  }
}

export const lineCodec = codec(Line)
export const audienceCodec = codec(Audience)
export const roleCodec = codec(UserType)
export const sourceCodec = codec(GenerationSource)
export const fitTypeCodec = codec(FitType)
export const ratingCodec = codec(Rating)
export const outcomeCodec = codec(GenerationOutcome)
export const warningCodec = codec(FitWarning)
export const referralCodec = codec(ReferralReason)

// Paginación del backend: `{ items, page, size, totalElements, totalPages }` →
// `{ items, meta }`, la forma que consumen los hooks de listados.
export function decodePage(page, decodeItem = (item) => item) {
  return {
    items: (page?.items ?? []).map(decodeItem),
    meta: {
      total: page?.totalElements ?? 0,
      page: page?.page ?? 1,
      size: page?.size ?? 0,
      totalPages: page?.totalPages ?? 0,
    },
  }
}

export function decodeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    type: roleCodec.decode(user.role),
    name: user.name,
    email: user.email,
    whatsappPhone: user.whatsappPhone,
    pointsBalance: user.pointsBalance ?? 0,
    createdAt: user.createdAt,
  }
}

// `AuthResponseDTO` → sesión del FE. `token` es el access token (Bearer) y
// `refreshToken` el opaco de un solo uso para `/auth/refresh` y `/auth/logout`.
export function decodeAuth(auth) {
  return {
    user: decodeUser(auth.user),
    token: auth.accessToken,
    refreshToken: auth.refreshToken ?? null,
    expiresInSeconds: auth.expiresInSeconds ?? null,
  }
}

export function decodeSize(size) {
  if (!size) return null
  return {
    ...size,
    line: lineCodec.decode(size.line),
    audience: audienceCodec.decode(size.audience),
  }
}

// Números del formulario: `''` y `undefined` viajan como null (campo omitido).
export function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// El backend exige solo dígitos con `+` opcional; el formulario admite espacios
// y guiones para escribir cómodo.
export function normalizePhone(value) {
  const raw = String(value ?? '').trim()
  const plus = raw.startsWith('+') ? '+' : ''
  return plus + raw.replace(/\D/g, '')
}
