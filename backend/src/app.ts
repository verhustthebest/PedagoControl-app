import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes'
import healthRoutes from './routes/health.routes'
import lessonReportRoutes from './routes/lesson-report.routes'
import notificationRoutes from './routes/notification.routes'
import parentalRoutes from './routes/parental.routes'
import schoolRoutes from './routes/school.routes'

dotenv.config()

const app = express()
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://pedago-control-app.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean))

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
}))
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api', healthRoutes)
app.use('/api', lessonReportRoutes)
app.use('/api', notificationRoutes)
app.use('/api', parentalRoutes)
app.use('/api', schoolRoutes)

export default app
