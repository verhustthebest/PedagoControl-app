import { Router } from 'express'
import { addCity, addCommune, addNeighborhood, cities, communes, neighborhoods, provinces } from '../controllers/geography.controller'
import { authenticateBearerToken, requireAnyRole, requireSchoolContext } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { geographyNameBody, geographyParentParams } from '../validation/schemas'

const router = Router()
const management = [authenticateBearerToken, requireSchoolContext(), requireAnyRole(['SUPER_ADMIN'])] as const
router.get('/geography/provinces', ...management, provinces)
router.get('/geography/provinces/:parentId/cities', ...management, validate({ params: geographyParentParams }), cities)
router.post('/geography/provinces/:parentId/cities', ...management, validate({ params: geographyParentParams, body: geographyNameBody }), addCity)
router.get('/geography/cities/:parentId/communes', ...management, validate({ params: geographyParentParams }), communes)
router.post('/geography/cities/:parentId/communes', ...management, validate({ params: geographyParentParams, body: geographyNameBody }), addCommune)
router.get('/geography/communes/:parentId/neighborhoods', ...management, validate({ params: geographyParentParams }), neighborhoods)
router.post('/geography/communes/:parentId/neighborhoods', ...management, validate({ params: geographyParentParams, body: geographyNameBody }), addNeighborhood)
export default router
