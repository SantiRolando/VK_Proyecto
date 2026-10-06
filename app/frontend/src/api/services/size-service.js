/*
  Talles y generaciones contra el contrato del backend: recomendación pública, detalle,
  historial y tablas de talles.

  La respuesta de `recommend` y la del historial son DTOs distintos en el backend; acá se
  llevan a una misma forma de "generación" para las pantallas.
*/

import { apiClient } from '@api/client/api-client.js'
import { getGuestSessionId } from '@api/client/session.js'
import {
  audienceCodec,
  decodePage,
  decodeSize,
  fitTypeCodec,
  lineCodec,
  optionalNumber,
  outcomeCodec,
  ratingCodec,
  referralCodec,
  sourceCodec,
  warningCodec,
} from '@api/wire.js'

const MEASURES = ['height', 'bust', 'waist', 'hip', 'torso']

function decodeRecommendation(dto) {
  return {
    id: dto.id,
    guestSessionId: dto.guestSessionId ?? null,
    outcome: outcomeCodec.decode(dto.outcome),
    suggestedSize: decodeSize(dto.suggestedSize),
    line: dto.suggestedSize ? lineCodec.decode(dto.suggestedSize.line) : null,
    audience: dto.suggestedSize ? audienceCodec.decode(dto.suggestedSize.audience) : null,
    adjacentSizes: (dto.adjacentSizes ?? []).map(decodeSize),
    warnings: (dto.warnings ?? []).map(warningCodec.decode),
    referralReason: referralCodec.decode(dto.referralReason ?? null),
    stockAvailableAtQuery: dto.stockAvailable ?? null,
    createdAt: dto.createdAt,
    rating: null,
    comment: null,
    ratedAt: null,
  }
}

function decodeHistoryItem(dto) {
  return {
    id: dto.id,
    customerId: dto.customerId ?? null,
    profileId: dto.profileId ?? null,
    adminId: dto.adminId ?? null,
    onBehalf: dto.adminId != null,
    line: lineCodec.decode(dto.line),
    audience: audienceCodec.decode(dto.audience),
    height: dto.height ?? null,
    bust: dto.bust ?? null,
    waist: dto.waist ?? null,
    hip: dto.hip ?? null,
    torso: dto.torso ?? null,
    age: dto.age ?? null,
    outcome: outcomeCodec.decode(dto.outcome),
    suggestedSize:
      dto.suggestedSizeId != null
        ? { id: dto.suggestedSizeId, code: dto.suggestedSizeCode }
        : null,
    warnings: (dto.warnings ?? []).map(warningCodec.decode),
    referralReason: referralCodec.decode(dto.referralReason ?? null),
    stockAvailableAtQuery: dto.stockAvailableAtQuery ?? null,
    fitType: fitTypeCodec.decode(dto.fitType ?? null),
    source: sourceCodec.decode(dto.source ?? null),
    rating: ratingCodec.decode(dto.rating ?? null),
    comment: dto.comment ?? null,
    ratedAt: dto.ratedAt ?? null,
    createdAt: dto.createdAt,
  }
}

/*
  El `guestSessionId` del dispositivo viaja siempre: sin sesión identifica al invitado (y es
  el que luego permite releer el resultado); con sesión el backend lo ignora.
*/
function encodeRecommendRequest(payload) {
  const body = {
    line: lineCodec.encode(payload.line),
    audience: audienceCodec.encode(payload.audience),
    guestSessionId: getGuestSessionId(),
    age: optionalNumber(payload.age),
    source: sourceCodec.encode(payload.source ?? null),
    fitType: fitTypeCodec.encode(payload.fitType ?? null),
  }
  for (const field of MEASURES) body[field] = optionalNumber(payload[field])
  if (payload.profileId != null) body.profileId = payload.profileId
  if (payload.onBehalf) body.onBehalf = true
  if (payload.customerId != null) body.customerId = payload.customerId
  return body
}

export const sizeService = {
  createGeneration: (payload) =>
    apiClient
      .post('/public/fit/recommend', encodeRecommendRequest(payload))
      .then(decodeRecommendation),
  getGeneration: (generationId) =>
    apiClient.get(`/public/fit/generations/${generationId}`).then(decodeRecommendation),
  // Detalle con medidas, solo para el dueño con sesión (o un admin).
  getGenerationDetail: (generationId) =>
    apiClient.get(`/fit/generations/${generationId}`).then(decodeHistoryItem),
  /*
    El backend pagina y no filtra por perfil: se pide la primera página grande y el filtro por
    `profileId` se resuelve acá.
  */
  listGenerations: (params) =>
    apiClient
      .get('/fit/generations', { page: 1, size: 100 })
      .then((page) => decodePage(page, decodeHistoryItem).items)
      .then((items) =>
        params?.profileId
          ? items.filter((item) => item.profileId === Number(params.profileId))
          : items,
      ),
  // Pendiente en el backend (módulo de feedback y puntos): hoy responde el mock.
  submitFeedback: (generationId, payload) =>
    apiClient.patch(`/fit/generations/${generationId}/feedback`, payload),
  getSizes: (params) =>
    apiClient
      .get('/public/sizes', {
        line: lineCodec.encode(params?.line ?? null),
        audience: audienceCodec.encode(params?.audience ?? null),
      })
      .then((sizes) => sizes.map(decodeSize)),
  getPublicContact: () => apiClient.get('/public/contact'),
}
