export type SearchParams = Record<string, string | string[] | undefined>

export function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function buildQueryString(
  searchParams: SearchParams | undefined,
  overrides: Record<string, string | number | null | undefined>
) {
  const params = new URLSearchParams()

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      const safeValue = getStringParam(value)
      if (safeValue) {
        params.set(key, safeValue)
      }
    })
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key)
      return
    }
    params.set(key, String(value))
  })

  const query = params.toString()
  return query ? `?${query}` : ""
}

export function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) {
    items.push("ellipsis")
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (end < totalPages - 1) {
    items.push("ellipsis")
  }

  items.push(totalPages)
  return items
}
