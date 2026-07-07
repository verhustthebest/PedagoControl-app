import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes'
import healthRoutes from './routes/health.routes'
import lessonReportRoutes from './routes/lesson-report.routes'
import schoolRoutes from './routes/school.routes'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', healthRoutes)
app.use('/api', lessonReportRoutes)
app.use('/api', schoolRoutes)

export default app
