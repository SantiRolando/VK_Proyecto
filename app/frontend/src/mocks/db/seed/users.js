// Seed: identidad y contacto (USER, MEASUREMENT_PROFILE, ADDRESS).
// Credenciales demo del plan §7.2 (solo modo mock).

import { createRandom, daysAgo, pick } from '@mocks/db/seed/helpers.js'

// Los tres primeros usuarios son fijos: sus credenciales están documentadas y los
// tests de otros módulos dependen de ellas (Ana y su historial, Nuevo Cliente).
// Los ids de esas cuentas viven en `SeedUser` (`@constants/enums.js`): no se
// escriben a mano en los tests.
const fixedUsers = [
  {
    id: 1,
    type: 'Admin',
    name: 'Vikinga Admin',
    email: 'admin@vikinga.test',
    password: 'admin123',
    whatsappPhone: '+59899000001',
    pointsBalance: 0,
    createdAt: daysAgo(90),
  },
  {
    id: 2,
    type: 'Customer',
    name: 'Ana Rodríguez',
    email: 'ana@example.test',
    password: 'cliente123',
    whatsappPhone: '+59899000002',
    pointsBalance: 120,
    createdAt: daysAgo(80),
  },
  {
    id: 3,
    type: 'Customer',
    name: 'Nuevo Cliente',
    email: 'nuevo@example.test',
    password: 'cliente123',
    whatsappPhone: '+59899000003',
    pointsBalance: 0,
    createdAt: daysAgo(1),
  },
]

// Padrón de demostración: sin esto, la pantalla de usuarios y sus gráficos
// quedarían con tres filas. Determinista (PRNG con semilla) para que la demo y
// los tests sean estables.
const FIRST_NAMES = [
  'Lucía',
  'Martín',
  'Sofía',
  'Joaquín',
  'Valentina',
  'Diego',
  'Camila',
  'Federico',
  'Julieta',
  'Nicolás',
  'Agustina',
  'Rodrigo',
  'Florencia',
  'Matías',
  'Paula',
  'Andrés',
  'Carolina',
  'Gonzalo',
  'Micaela',
  'Sebastián',
  'Renata',
  'Emiliano',
]

const LAST_NAMES = [
  'Pérez',
  'Silva',
  'Fernández',
  'Rodríguez',
  'Martínez',
  'Gómez',
  'Acosta',
  'Varela',
  'Techera',
  'Pintos',
  'Cabrera',
  'Olivera',
  'Da Silva',
  'Núñez',
  'Ramos',
]

const SALES_STAFF = ['Mostrador', 'Depósito']

const slug = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')

function buildDemoUsers() {
  const random = createRandom(20260928)
  const generated = []
  let id = 4

  // Altas repartidas en 12 meses, con más volumen en los últimos para que la
  // tendencia tenga forma.
  const months = [
    { from: 355, count: 1 },
    { from: 325, count: 1 },
    { from: 295, count: 2 },
    { from: 265, count: 1 },
    { from: 235, count: 2 },
    { from: 205, count: 2 },
    { from: 175, count: 3 },
    { from: 145, count: 3 },
    { from: 115, count: 3 },
    { from: 85, count: 4 },
    { from: 55, count: 4 },
    { from: 25, count: 5 },
  ]

  for (const { from, count } of months) {
    for (let i = 0; i < count; i += 1) {
      const first = pick(random, FIRST_NAMES)
      const last = pick(random, LAST_NAMES)

      generated.push({
        id,
        type: 'Customer',
        name: `${first} ${last}`,
        email: `${slug(first)}.${slug(last)}${id}@example.test`,
        password: 'cliente123',
        whatsappPhone: `+59899${String(100000 + id).slice(-6)}`,
        // Saldo variado: la mayoría en 0 porque no todos calificaron.
        pointsBalance: random() < 0.3 ? Math.round(random() * 120) : 0,
        createdAt: daysAgo(Math.max(1, from + Math.floor(random() * 20)), 12),
      })
      id += 1
    }
  }

  // Dos cuentas de personal más, para que el filtro por rol y la acción de
  // otorgar/revocar admin tengan con qué demostrarse.
  for (const role of SALES_STAFF) {
    generated.push({
      id,
      type: 'Admin',
      name: `${role} Vikinga`,
      email: `${slug(role)}@vikinga.test`,
      password: 'admin123',
      whatsappPhone: `+59899${String(100000 + id).slice(-6)}`,
      pointsBalance: 0,
      createdAt: daysAgo(Math.max(1, 200 - id), 12),
    })
    id += 1
  }

  return generated
}

const users = [...fixedUsers, ...buildDemoUsers()]

const measurementProfiles = [
  {
    id: 1,
    userId: 2,
    name: 'Training',
    height: 168,
    bust: 90,
    waist: 72,
    hip: 98,
    torso: 142,
    isDefault: true,
  },
  {
    id: 2,
    userId: 2,
    name: 'Son',
    height: 145,
    bust: 72,
    waist: 64,
    hip: 76,
    torso: 120,
    isDefault: false,
  },
]

const addresses = [
  {
    id: 1,
    userId: 2,
    street: 'Av. Italia',
    number: '1234',
    city: 'Montevideo',
    department: 'Montevideo',
    reference: 'Casa con reja blanca',
    isDefault: true,
    active: true,
  },
  {
    id: 2,
    userId: 2,
    street: 'Rambla de los Argentinos',
    number: '56',
    city: 'Piriápolis',
    department: 'Maldonado',
    reference: '',
    isDefault: false,
    active: true,
  },
]

export function buildIdentity() {
  return {
    users,
    measurementProfiles,
    addresses,
  }
}
