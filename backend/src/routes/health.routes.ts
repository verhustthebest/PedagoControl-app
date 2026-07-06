import { Router } from 'express'

const router = Router()

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', app: 'PEDAGO CONTROL API' })
})

export default router
