// Metadatos de rol.
// `id` es el identificador estable (independiente de la traducción),
// `labelKey` apunta a la clave de traducción y `color` es el color
// Mantine asociado para renderizarlo de forma consistente.

export const ROLES = [
  { id: 'admin', labelKey: 'users.role.admin', color: 'violet' },
  { id: 'editor', labelKey: 'users.role.editor', color: 'blue' },
  { id: 'viewer', labelKey: 'users.role.viewer', color: 'gray' },
]

export function getRoleLabelKey(roleId) {
  return ROLES.find((role) => role.id === roleId)?.labelKey ?? roleId
}

export function getRoleColor(roleId) {
  return ROLES.find((role) => role.id === roleId)?.color ?? 'gray'
}
