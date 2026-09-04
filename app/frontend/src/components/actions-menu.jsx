import { ActionIcon, Menu } from '@mantine/core'
import { IconDotsVertical } from '@tabler/icons-react'

// Menú de acciones genérico: un botón de tres puntos que abre un dropdown.
// Sirve para cards, tablas o cualquier listado donde no queramos repartir
// botones por cada fila.
//
// `actions` es un array de { label, icon, color, onClick }:
//   - `label`: texto visible de la opción (ya traducido).
//   - `icon`: ícono opcional, se muestra a la izquierda del label.
//   - `color`: color opcional de la opción (ej. 'red' para acciones destructivas).
//   - `onClick`: callback que se ejecuta al seleccionar la opción.
//
// `label` es el texto accesible (aria-label) del botón de tres puntos.
export function ActionsMenu({ actions, label, ...menuProps }) {
  return (
    <Menu position="bottom-end" withinPortal shadow="sm" {...menuProps}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={label}>
          <IconDotsVertical size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {actions.map((action) => (
          <Menu.Item
            key={action.label}
            leftSection={action.icon}
            color={action.color}
            onClick={action.onClick}
          >
            {action.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
