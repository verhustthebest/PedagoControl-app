import { Pool } from 'pg'

type VercelRequest = {
  method?: string
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

let pool: Pool | null = null

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    })
  }

  return pool
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method && request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    await getPool().query('select 1')
    response.status(200).json({ ok: true, database: 'connected' })
  } catch (error) {
    response.status(500).json({
      ok: false,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Database connection failed',
    })
  }
}
