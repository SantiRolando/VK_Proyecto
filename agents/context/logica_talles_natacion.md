# Lógica de recomendación de talles --- Vestimenta de natación

## Contexto del proyecto

El documento describe una aplicación orientada a clientes de una marca
de natación. El objetivo principal es permitir que el cliente pueda
identificar correctamente su talle y, además, visualizar una
representación corporal mediante un avatar/probador virtual, sin
utilizar una fotografía personal.

La aplicación está pensada principalmente para smartphone.

Según el documento, el cliente debe proporcionar cinco medidas
corporales:

-   Altura
-   Cintura
-   Cadera
-   Pecho/Busto
-   Torso

> **Fuente:** documento `Preguntas y Respuestas SACN FIT (1).docx`.

## Objetivo de esta especificación

Transformar las tablas de talles del documento en una estructura de
datos y una lógica determinística que permita:

1.  Recibir las medidas corporales del usuario.
2.  Identificar la tabla correspondiente al producto.
3.  Utilizar únicamente las medidas que esa tabla contempla.
4.  Determinar si existe un talle que contenga todas las medidas dentro
    de sus rangos.
5.  Si no existe una coincidencia exacta, encontrar el talle más
    cercano.
6.  Devolver el talle recomendado junto con sus equivalencias USA/EU y,
    opcionalmente, información que permita explicar el resultado.

------------------------------------------------------------------------

# 1. Medidas de entrada

El modelo de datos del usuario puede ser:

``` js
{
  height: Number, // cm
  waist: Number,  // cm
  hip: Number,    // cm
  bust: Number,   // cm
  torso: Number   // cm
}
```

Todas las medidas deben estar expresadas en centímetros.

## Uso de cada medida

No todas las tablas utilizan las cinco medidas.

  -----------------------------------------------------------------------
  Producto                Medidas utilizadas para Medidas no utilizadas
                          talle                   para talle
  ----------------------- ----------------------- -----------------------
  Mujer --- Endurance     busto + cintura         altura, cadera, torso

  Mujer --- Soft          busto + cintura         altura, cadera, torso

  Hombre --- Jammer       cintura + cadera        altura, busto, torso

  Hombre --- Sungas       cintura + cadera        altura, busto, torso
  -----------------------------------------------------------------------

La altura y el torso pueden seguir siendo necesarios para otras
funcionalidades de la aplicación, especialmente la representación
corporal/avatar, pero **no deben introducirse en el cálculo del talle
mientras las tablas no tengan rangos para esas variables**.

------------------------------------------------------------------------

# 2. Tablas de talles

## Mujer --- Línea Endurance

  Talle VK         Busto (cm)   Cintura (cm)   USA   EU
  ---------- ---------------- -------------- ----- ----
  XS               74.9--78.7    63.5--64.77    28   34
  S               78.8--82.55     64.7--66.0    30   36
  M                83.8--87.6     66.0--69.8    32   38
  L               88.9--92.71   71.12--74.93    34   40
  XL             93.98--99.06    76.2--80.01    36   42
  2XL           99.06--104.14   81.28--85.09    38   44
  3XL          104.14--107.95     83.8--88.9    40   46

## Mujer --- Línea Soft

La tabla presenta los mismos rangos corporales de busto y cintura que
Endurance, pero cambia la nomenclatura del talle VK:

  Talle VK         Busto (cm)   Cintura (cm)   USA   EU
  ---------- ---------------- -------------- ----- ----
  XXS              74.9--78.7    63.5--64.77    28   34
  XS              78.8--82.55     64.7--66.0    30   36
  S                83.8--87.6     66.0--69.8    32   38
  M               88.9--92.71   71.12--74.93    34   40
  L              93.98--99.06    76.2--80.01    36   42
  XL            99.06--104.14   81.28--85.09    38   44
  XXL          104.14--107.95     83.8--88.9    40   46

## Hombre --- Jammer

  Talle VK     Cintura (cm)   Cadera (cm)   USA   EU
  ---------- -------------- ------------- ----- ----
  XS                 75--80        80--85    30   44
  S                  80--85        85--90    32   46
  M                  85--90        90--95    34   48
  L                  90--95       95--100    36   50
  XL                95--100      100--105    38   52
  2XL              100--105      105--110    40   54

## Hombre --- Sungas

Los rangos de cintura y cadera son los mismos que para Jammer:

  Talle VK     Cintura (cm)   Cadera (cm)   USA   EU
  ---------- -------------- ------------- ----- ----
  XS                 75--80        80--85    30   44
  S                  80--85        85--90    32   46
  M                  85--90        90--95    34   48
  L                  90--95       95--100    36   50
  XL                95--100      100--105    38   52
  2XL              100--105      105--110    40   54

------------------------------------------------------------------------

# 3. Estructura de datos recomendada

Las tablas deben almacenarse como configuración/datos y no como una
cadena de `if/else`.

``` js
const sizeTables = {
  mujerEndurance: [
    { size: "XS",  bust: [74.9, 78.7],   waist: [63.5, 64.77], usa: 28, eu: 34 },
    { size: "S",   bust: [78.8, 82.55],  waist: [64.7, 66.0],  usa: 30, eu: 36 },
    { size: "M",   bust: [83.8, 87.6],   waist: [66.0, 69.8],  usa: 32, eu: 38 },
    { size: "L",   bust: [88.9, 92.71],  waist: [71.12, 74.93], usa: 34, eu: 40 },
    { size: "XL",  bust: [93.98, 99.06], waist: [76.2, 80.01],  usa: 36, eu: 42 },
    { size: "2XL", bust: [99.06, 104.14], waist: [81.28, 85.09], usa: 38, eu: 44 },
    { size: "3XL", bust: [104.14, 107.95], waist: [83.8, 88.9], usa: 40, eu: 46 }
  ],

  mujerSoft: [
    { size: "XXS", bust: [74.9, 78.7],   waist: [63.5, 64.77], usa: 28, eu: 34 },
    { size: "XS",  bust: [78.8, 82.55],  waist: [64.7, 66.0],  usa: 30, eu: 36 },
    { size: "S",   bust: [83.8, 87.6],   waist: [66.0, 69.8],  usa: 32, eu: 38 },
    { size: "M",   bust: [88.9, 92.71],  waist: [71.12, 74.93], usa: 34, eu: 40 },
    { size: "L",   bust: [93.98, 99.06], waist: [76.2, 80.01],  usa: 36, eu: 42 },
    { size: "XL",  bust: [99.06, 104.14], waist: [81.28, 85.09], usa: 38, eu: 44 },
    { size: "XXL", bust: [104.14, 107.95], waist: [83.8, 88.9], usa: 40, eu: 46 }
  ],

  hombreJammer: [
    { size: "XS",  waist: [75, 80],   hip: [80, 85],   usa: 30, eu: 44 },
    { size: "S",   waist: [80, 85],   hip: [85, 90],   usa: 32, eu: 46 },
    { size: "M",   waist: [85, 90],   hip: [90, 95],   usa: 34, eu: 48 },
    { size: "L",   waist: [90, 95],   hip: [95, 100],  usa: 36, eu: 50 },
    { size: "XL",  waist: [95, 100], hip: [100, 105], usa: 38, eu: 52 },
    { size: "2XL", waist: [100, 105], hip: [105, 110], usa: 40, eu: 54 }
  ],

  hombreSungas: [
    { size: "XS",  waist: [75, 80],   hip: [80, 85],   usa: 30, eu: 44 },
    { size: "S",   waist: [80, 85],   hip: [85, 90],   usa: 32, eu: 46 },
    { size: "M",   waist: [85, 90],   hip: [90, 95],   usa: 34, eu: 48 },
    { size: "L",   waist: [90, 95],   hip: [95, 100],  usa: 36, eu: 50 },
    { size: "XL",  waist: [95, 100], hip: [100, 105], usa: 38, eu: 52 },
    { size: "2XL", waist: [100, 105], hip: [105, 110], usa: 40, eu: 54 }
  ]
};
```

------------------------------------------------------------------------

# 4. Definición de "medida dentro del rango"

Los rangos deben considerarse inclusivos:

``` js
function isWithinRange(value, [min, max]) {
  return value >= min && value <= max;
}
```

Por ejemplo:

``` js
isWithinRange(85, [83.8, 87.6]);
// true
```

## Distancia respecto de un rango

Para encontrar el talle más cercano:

``` js
function distanceToRange(value, [min, max]) {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}
```

Esto significa:

-   Si la medida está dentro del rango → distancia `0`.
-   Si está por debajo → distancia hasta el mínimo.
-   Si está por encima → distancia desde el máximo.

Ejemplo:

``` js
distanceToRange(85, [83.8, 87.6]);
// 0

distanceToRange(90, [83.8, 87.6]);
// 2.4

distanceToRange(80, [83.8, 87.6]);
// 3.8
```

------------------------------------------------------------------------

# 5. Algoritmo general

El agente que implemente la lógica debe seguir este flujo:

``` text
1. Recibir las cinco medidas corporales.

2. Validar que las medidas sean números positivos.

3. Identificar género y producto.

4. Seleccionar la tabla correspondiente.

5. Determinar las medidas que realmente utiliza esa tabla.

6. Buscar talles donde todas las medidas requeridas estén dentro
   de sus rangos.

7. Si existe exactamente un talle compatible:
      devolver ese talle.

8. Si hay más de un talle compatible:
      resolver el empate utilizando las reglas específicas
      del producto.

9. Si no existe ningún talle compatible:
      calcular la distancia de las medidas a los rangos de cada talle.

10. Seleccionar el talle con menor distancia.

11. Si existe empate:
      aplicar las reglas de prioridad del producto.

12. Devolver talle VK + equivalencias USA/EU + información
    suficiente para explicar el resultado.
```

------------------------------------------------------------------------

# 6. Lógica para mujer

## Variables

Para Endurance y Soft:

``` text
busto
cintura
```

La altura, cadera y torso no participan.

## Coincidencia exacta

Primero buscar un talle en el que:

``` text
busto >= mínimoBusto
AND
busto <= máximoBusto
AND
cintura >= mínimoCintura
AND
cintura <= máximoCintura
```

En JavaScript:

``` js
function getWomenExactMatches(table, bust, waist) {
  return table.filter(item =>
    isWithinRange(bust, item.bust) &&
    isWithinRange(waist, item.waist)
  );
}
```

## Si no existe coincidencia exacta

Calcular:

``` js
distance =
  distanceToRange(bust, item.bust) +
  distanceToRange(waist, item.waist);
```

Y elegir el talle con menor distancia.

``` js
function getWomenSize(table, bust, waist) {
  const exactMatches = getWomenExactMatches(table, bust, waist);

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    // Resolver según la política definida para límites/empates.
    return exactMatches[0];
  }

  return table
    .map(item => ({
      ...item,
      distance:
        distanceToRange(bust, item.bust) +
        distanceToRange(waist, item.waist)
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}
```

### Importante

El documento **no define explícitamente qué hacer cuando busto y cintura
apuntan a dos talles diferentes**.

Por ejemplo, puede ocurrir:

``` text
Busto → M
Cintura → L
```

La regla de resolución de ese conflicto debe definirse como una decisión
de negocio antes de considerar la implementación como definitiva.

Una política matemática posible es minimizar la distancia total, pero
eso es una **decisión de implementación**, no una regla explícita del
documento.

------------------------------------------------------------------------

# 7. Lógica para hombre

## Variables

Para Jammer y Sungas:

``` text
cintura
cadera
```

La altura, busto y torso no participan.

## Prioridad de cintura

El documento indica que para las prendas masculinas la cintura debe
tomarse como referencia principal y que, cuando la medida queda entre
dos talles, se debe elegir el talle mayor para conseguir un ajuste más
cómodo.

Por lo tanto, la lógica masculina debe dar prioridad a la cintura.

Conceptualmente:

``` text
1. Determinar el talle según cintura.
2. Si la cintura está entre dos talles:
      elegir el talle mayor.
3. Utilizar la cadera como comprobación secundaria.
4. Si ningún talle coincide perfectamente:
      encontrar el más cercano, manteniendo la cintura como
      variable de mayor prioridad.
```

## Implementación simple

``` js
function getMenSize(table, waist, hip) {
  const exactMatches = table.filter(item =>
    isWithinRange(waist, item.waist) &&
    isWithinRange(hip, item.hip)
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    // En un límite compartido, priorizar el talle mayor.
    return exactMatches[exactMatches.length - 1];
  }

  return table
    .map(item => ({
      ...item,
      waistDistance: distanceToRange(waist, item.waist),
      hipDistance: distanceToRange(hip, item.hip)
    }))
    .sort((a, b) => {
      if (a.waistDistance !== b.waistDistance) {
        return a.waistDistance - b.waistDistance;
      }

      return a.hipDistance - b.hipDistance;
    })[0];
}
```

La versión anterior trata la cintura como criterio principal, en lugar
de introducir un peso arbitrario como `cintura * 2`.

------------------------------------------------------------------------

# 8. Límites entre talles

Los rangos masculinos tienen límites compartidos:

``` text
XS: 75–80
S:  80–85
M:  85–90
L:  90–95
...
```

Por ejemplo:

``` text
cintura = 80
```

puede pertenecer tanto a XS como a S si ambos extremos son inclusivos.

Para resolver estos casos:

``` text
→ elegir el talle mayor
```

Esto coincide con la orientación de elegir el talle mayor cuando la
cintura queda entre dos talles.

En cambio, las tablas femeninas tienen algunos pequeños solapamientos en
sus rangos de cintura y discontinuidades entre otros rangos. No debe
asumirse que los rangos forman una secuencia perfectamente continua.

------------------------------------------------------------------------

# 9. Resultado de la función

No devolver solamente el string del talle.

Se recomienda:

``` js
{
  size: "M",
  usa: 32,
  eu: 38,

  confidence: "exact",

  measurementsUsed: [
    "bust",
    "waist"
  ],

  distances: {
    bust: 0,
    waist: 0
  }
}
```

Para una coincidencia aproximada:

``` js
{
  size: "L",
  usa: 34,
  eu: 40,

  confidence: "closest",

  measurementsUsed: [
    "bust",
    "waist"
  ],

  distances: {
    bust: 1.2,
    waist: 0
  }
}
```

Se pueden agregar:

``` js
{
  size: "L",
  usa: 34,
  eu: 40,
  confidence: "closest",
  measurementsUsed: ["bust", "waist"],
  distances: {
    bust: 1.2,
    waist: 0
  },
  explanation: "La cintura está dentro del rango del talle L y el busto queda 1.2 cm fuera."
}
```

------------------------------------------------------------------------

# 10. Selección de tabla

El producto debe determinar la tabla.

Una configuración posible:

``` js
const productTableMap = {
  "mujer-endurance": "mujerEndurance",
  "mujer-soft": "mujerSoft",
  "hombre-jammer": "hombreJammer",
  "hombre-sungas": "hombreSungas"
};
```

La función principal podría tener esta interfaz:

``` js
function recommendSize({
  product,
  height,
  waist,
  hip,
  bust,
  torso
}) {
  // 1. Validar entradas.
  // 2. Seleccionar tabla.
  // 3. Seleccionar algoritmo según producto.
  // 4. Devolver recomendación.
}
```

------------------------------------------------------------------------

# 11. Validación de entradas

Antes de calcular:

``` js
function validateMeasurement(value) {
  return Number.isFinite(value) && value > 0;
}
```

El sistema debería rechazar:

``` text
undefined
null
NaN
0
números negativos
strings no numéricos
```

También conviene normalizar la entrada si el frontend permite introducir
coma decimal:

``` text
"85,5" → 85.5
```

pero la capa de cálculo debería trabajar siempre con `Number`.

------------------------------------------------------------------------

# 12. No confundir "talle más cercano" con "talle válido"

Hay dos estados diferentes:

### Exact

Todas las medidas utilizadas por la tabla están dentro de sus
respectivos rangos.

``` js
confidence: "exact"
```

### Closest

Ningún talle contiene todas las medidas, por lo que se seleccionó el que
presenta el menor desvío.

``` js
confidence: "closest"
```

Esto es importante para UX: el sistema no debería presentar como
"coincidencia exacta" una recomendación obtenida por proximidad.

------------------------------------------------------------------------

# 13. Ejemplo conceptual

## Mujer Endurance

Entrada:

``` js
{
  product: "mujer-endurance",
  bust: 85,
  waist: 68,
  height: 170,
  hip: 95,
  torso: 65
}
```

Solo se utilizan:

``` text
busto = 85
cintura = 68
```

Comparación con M:

``` text
busto:   83.8–87.6 → 85 entra
cintura: 66.0–69.8 → 68 entra
```

Resultado:

``` text
VK: M
USA: 32
EU: 38
```

------------------------------------------------------------------------

# 14. Qué no debe hacer el algoritmo

El agente que implemente la lógica **no debe**:

-   Inventar rangos de altura.
-   Utilizar altura como factor de talle si la tabla no la contempla.
-   Utilizar torso como factor de talle si la tabla no lo contempla.
-   Promediar las cinco medidas.
-   Convertir automáticamente centímetros a otras unidades para decidir
    el talle.
-   Elegir un talle únicamente por una medida cuando la tabla exige dos,
    salvo que se aplique una regla de prioridad explícita.
-   Tratar una recomendación aproximada como coincidencia exacta.
-   Introducir pesos arbitrarios sin documentarlos.
-   Asumir que las tablas femeninas y masculinas utilizan las mismas
    reglas.
-   Asumir que Endurance y Soft tienen la misma nomenclatura de talle
    VK: los rangos son equivalentes, pero la nomenclatura difiere.

------------------------------------------------------------------------

# 15. Decisiones de negocio pendientes

El documento permite definir la mayor parte del algoritmo, pero hay
algunos casos que deberían quedar explícitamente definidos antes de
producción.

## 15.1 Mujer: conflicto entre busto y cintura

Ejemplo:

``` text
busto → M
cintura → L
```

El documento no especifica qué medida tiene prioridad.

Opciones posibles:

1.  Elegir el talle mayor.
2.  Elegir el talle indicado por busto.
3.  Elegir el talle indicado por cintura.
4.  Minimizar la distancia total.
5.  Minimizar el peor desvío entre las dos medidas.
6.  Mostrar dos talles posibles y pedir preferencia de ajuste.

Esta decisión debe ser tomada por el negocio/marca.

## 15.2 Valores fuera de toda la tabla

Ejemplo:

``` text
busto = 120 cm
```

cuando el máximo disponible es aproximadamente 108 cm.

El algoritmo puede devolver el talle más cercano, pero debería marcarlo
como `closest` y, preferiblemente, informar que la medida está fuera del
rango disponible.

## 15.3 Ajuste exacto vs. cómodo

La documentación masculina establece una preferencia por el talle mayor
en determinados casos para conseguir un ajuste más cómodo.

No se especifica una regla equivalente para las prendas femeninas.

------------------------------------------------------------------------

# 16. Arquitectura recomendada

Separar:

``` text
Datos de tablas
        ↓
Validación
        ↓
Selección de tabla
        ↓
Selección de medidas relevantes
        ↓
Matching exacto
        ↓
Resolución de ambigüedades
        ↓
Matching por proximidad
        ↓
Resultado
```

La tabla debe ser configurable para poder agregar nuevos productos
posteriormente sin modificar el algoritmo.

Por ejemplo:

``` js
{
  product: "nuevo-producto",
  measurements: ["waist", "hip"],
  priority: ["waist", "hip"],
  sizes: [...]
}
```

Esto permitiría agregar futuras tablas con altura o torso sin reescribir
todo el motor.

------------------------------------------------------------------------

# 17. Especificación resumida para un agente LLM

Implementar un motor de recomendación de talles para cuatro categorías:

-   Mujer Endurance
-   Mujer Soft
-   Hombre Jammer
-   Hombre Sungas

El usuario proporciona cinco medidas en centímetros:

`height`, `waist`, `hip`, `bust`, `torso`.

Las tablas femeninas utilizan únicamente `bust` y `waist`.

Las tablas masculinas utilizan únicamente `waist` y `hip`.

Para cada talle, cada medida tiene un rango `[min, max]`.

Una medida está dentro del rango cuando:

``` js
min <= value && value <= max
```

Primero buscar coincidencias en las que todas las medidas requeridas
estén dentro de rango.

Si existe una única coincidencia, devolverla como `exact`.

Si existen varias coincidencias, resolver el empate según las reglas
específicas de la tabla.

Para productos masculinos, `waist` es la medida prioritaria. Si la
cintura cae en un límite compartido o entre dos talles, elegir el talle
mayor para un ajuste más cómodo.

Si no existe una coincidencia completa, calcular para cada talle la
distancia de cada medida a su rango mediante:

``` js
function distanceToRange(value, [min, max]) {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}
```

Seleccionar el talle más cercano.

En caso de empate en el cálculo aproximado, priorizar la cintura para
productos masculinos.

Devolver como mínimo:

``` js
{
  size,
  usa,
  eu,
  confidence,
  measurementsUsed,
  distances
}
```

No utilizar `height` ni `torso` para el cálculo mientras las tablas de
talles no proporcionen rangos para esas medidas.

------------------------------------------------------------------------

# 18. Fuente

Documento utilizado como fuente de esta especificación:

`Preguntas y Respuestas SACN FIT (1).docx`

El documento indica como objetivo de la app que los clientes puedan
seleccionar correctamente el talle y contar con una representación
corporal/avatar; también especifica las cinco mediciones corporales
requeridas y que el uso está pensado para smartphone y para clientes.
