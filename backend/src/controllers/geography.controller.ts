import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { createCity, createCommune, createNeighborhood, listCities, listCommunes, listNeighborhoods, listProvinces } from '../services/geography.service'

export async function provinces(_request: AuthenticatedRequest, response: Response) { return response.json({ items: await listProvinces() }) }
export async function cities(request: AuthenticatedRequest, response: Response) { return response.json({ items: await listCities(request.params.parentId as string) }) }
export async function communes(request: AuthenticatedRequest, response: Response) { return response.json({ items: await listCommunes(request.params.parentId as string) }) }
export async function neighborhoods(request: AuthenticatedRequest, response: Response) { return response.json({ items: await listNeighborhoods(request.params.parentId as string) }) }

async function created(response: Response, operation: Promise<{ public_id: string; name: string } | null>) {
  const item = await operation
  return item ? response.status(201).json({ item }) : response.status(404).json({ message: 'Resource not found' })
}
export async function addCity(request: AuthenticatedRequest, response: Response) { return created(response, createCity(request.params.parentId as string, request.body.name)) }
export async function addCommune(request: AuthenticatedRequest, response: Response) { return created(response, createCommune(request.params.parentId as string, request.body.name)) }
export async function addNeighborhood(request: AuthenticatedRequest, response: Response) { return created(response, createNeighborhood(request.params.parentId as string, request.body.name)) }
