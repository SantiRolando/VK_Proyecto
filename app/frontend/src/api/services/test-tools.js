/*
  Herramientas de la suite contra la API mock: re-sembrar la base y reconfigurar el transporte
  (latencia y tasa de fallos). La app no las usa; existen para que cada test arranque de un
  estado conocido.
*/
import { apiClient } from '@api/client/api-client.js'

export const testTools = {
  resetDatabase: () => apiClient.post('/__test/reset'),
  configureTransport: (payload) => apiClient.post('/__test/transport', payload),
}
