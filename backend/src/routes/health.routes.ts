import { Router } from 'express'

const router = Router()

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', app: 'CONTRÔLE PÉDAGOGIQUE API' })
})

export default router
