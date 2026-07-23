import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes'
import healthRoutes from './routes/health.routes'
import lessonReportRoutes from './routes/lesson-report.routes'
import notificationRoutes from './routes/notification.routes'
import parentalRoutes from './routes/parental.routes'
import parentalGuardianRoutes from './routes/parental-guardian.routes'
import parentRegistrationRoutes from './routes/parent-registration.routes'
import parentPortalRoutes from './routes/parent-portal.routes'
import parentalBillingRoutes from './routes/parental-billing.routes'
import parentalStudentRoutes from './routes/parental-student.routes'
import schoolRoutes from './routes/school.routes'
import schoolClassRoutes from './routes/school-class.routes'
import attachmentRequestRoutes from './routes/attachment-request.routes'
import technicalJournalRoutes from './routes/technical-journal.routes'
import parentContributionRoutes from './routes/parent-contribution.routes'
import notificationTestRoutes from './routes/notification-test.routes'
import geographyRoutes from './routes/geography.routes'
import { globalApiRateLimit } from './middleware/rate-limit.middleware'
import { resolveTrustProxyHops } from './config/network'
import { configureHttpBoundary } from './config/http'
import { validateRuntimeEnvironment } from './config/environment'
import { requestContext } from './middleware/request-context.middleware'
import { globalErrorHandler, notFound } from './middleware/error.middleware'

dotenv.config()
validateRuntimeEnvironment()

const app = express()
app.set('trust proxy', resolveTrustProxyHops())
app.use(requestContext)
configureHttpBoundary(app)
app.use('/api', globalApiRateLimit)

app.use('/api', authRoutes)
app.use('/api', healthRoutes)
app.use('/api', lessonReportRoutes)
app.use('/api', notificationRoutes)
app.use('/api', notificationTestRoutes)
app.use('/api', geographyRoutes)
app.use('/api', parentalRoutes)
app.use('/api', parentRegistrationRoutes)
app.use('/api', parentPortalRoutes)
app.use('/api', parentalBillingRoutes)
app.use('/api', parentalGuardianRoutes)
app.use('/api', parentalStudentRoutes)
app.use('/api', schoolRoutes)
app.use('/api', schoolClassRoutes)
app.use('/api', attachmentRequestRoutes)
app.use('/api', technicalJournalRoutes)
app.use('/api', parentContributionRoutes)
app.use(notFound)
app.use(globalErrorHandler)

export default app
