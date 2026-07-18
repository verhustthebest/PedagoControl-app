import { useEffect, useState } from 'react'
import { useAuth } from '../../auth'
import { loadAdminPortal, type AdminPortalData, type LoadState } from '../../services/adminParental'

export function useAdminPortal() {
  const { user } = useAuth()
  const [state, setState] = useState<LoadState<AdminPortalData>>({ status: 'loading', data: null })
  const reload = () => {
    if (!user) return
    setState({ status: 'loading', data: null })
    void loadAdminPortal(user)
      .then(data => setState({ status: data.school || data.settings || data.students !== null ? 'success' : 'empty', data }))
      .catch(error => setState({ status: 'error', data: null, message: error instanceof Error ? error.message : 'Chargement impossible' }))
  }
  useEffect(reload, [user])
  return { ...state, reload, user }
}
