import { useState } from 'react'

/*
  Estado de un listado paginado. `resetPage` vuelve a la primera página: la llaman los filtros,
  así un cambio de filtros no deja la lista en una página que ya no existe.
*/
export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const changePageSize = (size) => {
    setPageSize(size)
    setPage(1)
  }

  return {
    page,
    pageSize,
    setPage,
    setPageSize: changePageSize,
    resetPage: () => setPage(1),
  }
}
