// Seed: identidad y contacto (USER, MEASUREMENT_PROFILE, ADDRESS).
// Credenciales demo del plan §7.2 (solo modo mock).

import { daysAgo } from './helpers.js'

const users = [
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
    pointsBalance: 40,
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
