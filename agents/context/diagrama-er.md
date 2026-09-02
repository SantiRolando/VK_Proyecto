# Descripción del Diagrama ER

El diagrama representa un sistema de ventas de productos que incluye usuarios,
ventas, cupones de descuento, gestión de talles, transacciones y alertas.

## Entidades

### USUARIO
Representa a los usuarios del sistema.

- `id_usuario` (int, PK)
- `tipo` (string): `Admin | Cliente`

### CUPON_DESCUENTO
Representa los cupones de descuento disponibles.

- `id_cupon` (int, PK)
- `id_producto` (int, FK, opcional)
- `codigo_de_cupon` (string)
- `cantidad_usos` (int)
- `tipo_descuento` (string): `Fijo | Porcentaje`
- `maximo_descuento` (decimal)
- `inicio_fecha_validez` (datetime)
- `fin_fecha_validez` (datetime)
- `activo` (boolean)

### VENTA
Registra las ventas realizadas por los usuarios.

- `id_venta` (int, PK)
- `id_usuario` (int, FK)
- `id_cupon` (int, FK, opcional)
- `fecha` (datetime)

### PRODUCTO
Representa los productos disponibles en el sistema.

- `identificador` (int, PK)
- `modelo` (string)
- `talle` (string)
- `color` (string)
- `cantidad` (int)
- `stock_minimo` (int)

### LINEA_VENTA
Representa los productos incluidos dentro de una venta.

- `id_linea_venta` (int, PK)
- `id_venta` (int, FK)
- `id_producto` (int, FK)
- `cantidad` (int)

### GENERACION_TALLE
Registra información relacionada con la recomendación y generación
de talles para un cliente.

- `identificador` (int, PK)
- `identificador_cliente` (int, FK)
- `identificador_prenda` (int, FK)
- `fecha` (datetime)
- `valoracion` (string): `Chico | Correcto | Grande`
- `medidas_entrada` (string)
- `talle_sugerido` (string)
- `talle_final` (string)
- `stock_disp_al_consultar` (boolean)
- `tipo_de_ajuste` (string): `Entrenamiento | Competición`

### TRANSACCION
Registra los movimientos financieros o de inventario.

- `id_transaccion` (int, PK)
- `direccion` (string): `Ingreso | Salida`
- `fecha` (datetime)

### TRANSACCION_LINEA
Representa el detalle de los productos involucrados en una transacción.

- `id_transaccion_linea` (int, PK)
- `id_transaccion` (int, FK)
- `id_producto` (int, FK)
- `cantidad` (int)

### ALERTA
Representa alertas relacionadas con productos.

- `id_alerta` (int, PK)
- `id_producto` (int, FK)
- `modo_de_notificacion` (string)
- `tipo_de_alerta` (string)

## Relaciones

- `USUARIO` realiza `VENTA`.
- `USUARIO` realiza `GENERACION_TALLE`.
- `VENTA` aplica opcionalmente un `CUPON_DESCUENTO`.
- `VENTA` contiene una o varias `LINEA_VENTA`.
- `LINEA_VENTA` incluye un `PRODUCTO`.
- `VENTA` evalúa un `PRODUCTO`.
- `GENERACION_TALLE` está asociada a un `PRODUCTO`/prenda.
- `PRODUCTO` aparece en `TRANSACCION_LINEA`.
- `TRANSACCION` se compone de `TRANSACCION_LINEA`.
- `PRODUCTO` registra movimientos mediante `TRANSACCION_LINEA`.
- `PRODUCTO` puede generar `ALERTA`.

## Flujo general

USUARIO
    |
    +-- realiza --> VENTA
    |                 |
    |                 +-- aplica --> CUPON_DESCUENTO
    |                 |
    |                 +-- contiene --> LINEA_VENTA
    |                                      |
    |                                      +-- incluye --> PRODUCTO
    |
    +-- realiza --> GENERACION_TALLE
                       |
                       +-- asociado a --> PRODUCTO

PRODUCTO
    |
    +-- aparece en --> TRANSACCION_LINEA --> TRANSACCION
    |
    +-- genera --> ALERTA
