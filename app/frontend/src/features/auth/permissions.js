/*
  Traducción de rol a permiso, en un solo lugar. El único permiso que la app distingue es ser
  administrador de la plataforma: `Customer` es un valor del dato, no un permiso. De acá salen
  las puertas que estaban repartidas por el código: el armazón y las pantallas (por `useIsAdmin`),
  los guards de ruta, el destino después de entrar y el mock que hace de servidor.
*/

import { routes } from '@app/routes.js'
import { UserType } from '@constants/enums.js'

export function isAdmin(user) {
  return user?.type === UserType.Admin
}

// Destino de una cuenta con sesión: el panel para un admin, la cuenta para el resto.
export function homeRoute(user) {
  return isAdmin(user) ? routes.admin : routes.account
}
