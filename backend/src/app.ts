import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import healthRoutes from './routes/health.routes'
import schoolRoutes from './routes/school.routes'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', healthRoutes)
app.use('/api', schoolRoutes)

export default app
