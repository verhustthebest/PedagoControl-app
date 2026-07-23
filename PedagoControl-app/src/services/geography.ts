import { apiRequest } from './api'

export type GeographyItem = { public_id: string; name: string }
type GeographyResponse = { items: GeographyItem[] }

/** API géographique centralisée : seuls les public_id traversent le navigateur. */
export const geographyApi = {
  provinces: () => apiRequest<GeographyResponse>('/geography/provinces'),
  cities: (provinceId: string) => apiRequest<GeographyResponse>(`/geography/provinces/${encodeURIComponent(provinceId)}/cities`),
  communes: (cityId: string) => apiRequest<GeographyResponse>(`/geography/cities/${encodeURIComponent(cityId)}/communes`),
  neighborhoods: (communeId: string) => apiRequest<GeographyResponse>(`/geography/communes/${encodeURIComponent(communeId)}/neighborhoods`),
  addCity: (provinceId: string, name: string) => apiRequest<{ item: GeographyItem }>(`/geography/provinces/${encodeURIComponent(provinceId)}/cities`, { method: 'POST', body: JSON.stringify({ name }) }),
  addCommune: (cityId: string, name: string) => apiRequest<{ item: GeographyItem }>(`/geography/cities/${encodeURIComponent(cityId)}/communes`, { method: 'POST', body: JSON.stringify({ name }) }),
  addNeighborhood: (communeId: string, name: string) => apiRequest<{ item: GeographyItem }>(`/geography/communes/${encodeURIComponent(communeId)}/neighborhoods`, { method: 'POST', body: JSON.stringify({ name }) }),
}
