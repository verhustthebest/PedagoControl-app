import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth'
import { apiErrorMessage } from '../../services/api'
import { getSchoolDashboard, type SchoolDashboard } from '../../services/schoolDashboard'

type DashboardState =
  | { status: 'loading'; data: null; message?: undefined }
  | { status: 'error'; data: null; message: string }
  | { status: 'success'; data: SchoolDashboard; message?: undefined }

/** Maintient les états réseau du dashboard sans redirection sur un 403 de widget. */
export function useSchoolDashboard() {
  const { user } = useAuth()
  const [state, setState] = useState<DashboardState>({ status: 'loading', data: null })

  const reload = useCallback(() => {
    if (!user?.school_id) {
      setState({ status: 'error', data: null, message: 'École associée introuvable.' })
      return
    }
    setState({ status: 'loading', data: null })
    void getSchoolDashboard(user.school_id)
      .then(({ dashboard }) => setState({ status: 'success', data: dashboard }))
      .catch((error) => setState({ status: 'error', data: null, message: apiErrorMessage(error) }))
  }, [user?.school_id])

  useEffect(reload, [reload])
  return { ...state, reload }
}
