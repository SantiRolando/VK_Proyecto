import { useSearchParams } from 'react-router'

/*
  Pestaña activa en `?tab=`. La pestaña por defecto no escribe el parámetro, así la ruta
  canónica de la pantalla queda limpia; un valor desconocido cae en la primera.
*/
export function useTabParam(tabs, defaultTab) {
  const [searchParams, setSearchParams] = useSearchParams()

  const requested = searchParams.get('tab')
  const tab = tabs.includes(requested) ? requested : defaultTab

  const setTab = (next) => setSearchParams(next === defaultTab ? {} : { tab: next })

  return [tab, setTab]
}
