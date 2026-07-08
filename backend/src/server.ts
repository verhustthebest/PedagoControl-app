import app from './app'
import prisma from './prisma/client'

const port = Number(process.env.PORT) || 4000

const server = app.listen(port, () => {
  console.log(`CONTRÔLE PÉDAGOGIQUE API running on port ${port}`)
})

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
