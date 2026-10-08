/*
  Reglas del formulario de configuración. Devuelven el código del mensaje y la pantalla lo
  traduce, como el resto de la app. Los campos numéricos no llevan regla: el stepper clampea
  contra el contrato en cada cambio, así que no pueden quedar fuera de rango.
*/

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// El mock rechaza un canal vacío: la regla lo adelanta para no esperar el 422.
export const settingsValidation = {
  coordinationEmail: (value) => {
    const email = value.trim()
    if (!email) return 'required'
    return EMAIL.test(email) ? null : 'email'
  },
  coordinationWhatsapp: (value) => (value.trim() ? null : 'required'),
}
