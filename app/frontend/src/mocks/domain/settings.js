// Lectura de SETTING (configuración clave-valor del ER, §5.2). Los valores se
// guardan como texto; estos helpers convierten y aplican el valor por defecto.

export function settingValue(settings, key, fallback = null) {
  const setting = settings.find((item) => item.key === key)
  return setting?.value ?? fallback
}

export function settingNumber(settings, key, fallback = 0) {
  const value = Number(settingValue(settings, key, fallback))
  return Number.isFinite(value) ? value : fallback
}
