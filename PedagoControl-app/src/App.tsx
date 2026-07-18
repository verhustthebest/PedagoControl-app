import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, DIRECTION_ROLES, ProtectedRoute } from './auth'
import { AccessibilityEnhancer } from './components'
import { DirectorLayout, ManagementLayout, PrefectLayout, TeacherLayout } from './layouts'
import { ForbiddenAccess, LoginScreen, PresentationScreen, UnauthenticatedAccess } from './pages/auth'
import { AnnualRepartition, Dashboard, EvaluationControl, ProgressTracking, Reports, SchoolPrograms, SupervisionDetail } from './pages/director'
import { TeacherDashboard, TeacherEvaluations, TeacherPrograms, TeacherProgress, TeacherTextBook } from './pages/enseignant'
import {
  ClientSchools,
  ManagementAudit,
  ManagementAutomaticDistribution,
  ManagementChapterStructure,
  ManagementNotifications,
  ManagementPayments,
  ManagementProgramPlanning,
  ManagementProgramValidation,
  ManagementReports,
  ManagementSendHistory,
  ManagementSentPrograms,
  ManagementSettings,
  ManagementStatistics,
  ManagementSubscriptions,
  ManagementSupport,
  ManagementUsers,
  NewSchoolFlow,
} from './pages/management'
import {
  PrefectAlerts,
  PrefectCalendar,
  PrefectDashboard,
  PrefectEvaluations,
  PrefectMessages,
  PrefectProgramControl,
  PrefectProgressionDetail,
  PrefectReportDetail,
  PrefectReports,
  PrefectSettings,
  PrefectTeachersFollowUp,
  PrefectTextBook,
  PrefectValidations,
} from './pages/prefet'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityEnhancer />
        <Routes>
        <Route path="/" element={<Navigate to="/demarrage" replace />} />
        <Route path="/demarrage" element={<PresentationScreen />} />
        <Route path="/presentation" element={<PresentationScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/demo" element={<Navigate to="/login" replace />} />
        <Route path="/non-authentifie" element={<UnauthenticatedAccess />} />
        <Route path="/acces-interdit" element={<ForbiddenAccess />} />

        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/management" element={<Navigate to="/management/ecoles" replace />} />
        <Route path="/management/ecoles" element={<ManagementLayout title="Ecoles clientes" crumb="Ecoles clientes"><ClientSchools /></ManagementLayout>} />
        <Route path="/management/ecoles/nouvelle" element={<ManagementLayout title="Creation ecole cliente" crumb="Creation ecole"><NewSchoolFlow /></ManagementLayout>} />
        <Route path="/management/souscriptions" element={<ManagementLayout title="Souscriptions" crumb="Souscriptions"><ManagementSubscriptions /></ManagementLayout>} />
        <Route path="/management/abonnements" element={<Navigate to="/management/souscriptions" replace />} />
        <Route path="/management/paiements" element={<ManagementLayout title="Paiements" crumb="Paiements"><ManagementPayments /></ManagementLayout>} />
        <Route path="/management/programmes/planification" element={<ManagementLayout title="Planification annuelle des programmes" crumb="Planification annuelle"><ManagementProgramPlanning /></ManagementLayout>} />
        <Route path="/management/programmes/chapitres" element={<ManagementLayout title="Structure des chapitres" crumb="Structure chapitres"><ManagementChapterStructure /></ManagementLayout>} />
        <Route path="/management/programmes/repartition" element={<ManagementLayout title="Repartition annuelle automatique" crumb="Repartition annuelle"><ManagementAutomaticDistribution /></ManagementLayout>} />
        <Route path="/management/programmes/validation" element={<ManagementLayout title="Validation et envoi du programme" crumb="Validation et envoi"><ManagementProgramValidation /></ManagementLayout>} />
        <Route path="/management/programmes/envoyes" element={<ManagementLayout title="Programmes envoyes" crumb="Programmes envoyes"><ManagementSentPrograms /></ManagementLayout>} />
        <Route path="/management/envois/historique" element={<ManagementLayout title="Historique des envois" crumb="Historique des envois"><ManagementSendHistory /></ManagementLayout>} />
        <Route path="/management/rapports" element={<ManagementLayout title="Rapports" crumb="Rapports"><ManagementReports /></ManagementLayout>} />
        <Route path="/management/statistiques" element={<ManagementLayout title="Statistiques" crumb="Statistiques"><ManagementStatistics /></ManagementLayout>} />
        <Route path="/management/parametres" element={<ManagementLayout title="Parametres" crumb="Parametres"><ManagementSettings /></ManagementLayout>} />
        <Route path="/management/audit" element={<ManagementLayout title="Audit" crumb="Audit"><ManagementAudit /></ManagementLayout>} />
        <Route path="/management/utilisateurs" element={<ManagementLayout title="Utilisateurs Management" crumb="Utilisateurs"><ManagementUsers /></ManagementLayout>} />
        <Route path="/management/notifications" element={<ManagementLayout title="Notifications" crumb="Notifications"><ManagementNotifications /></ManagementLayout>} />
        <Route path="/management/historique" element={<ManagementLayout title="Historique actions" crumb="Historique actions"><ManagementAudit /></ManagementLayout>} />
        <Route path="/management/aide" element={<ManagementLayout title="Aide et support" crumb="Aide et support"><ManagementSupport /></ManagementLayout>} />
        <Route path="/management/*" element={<Navigate to="/management/ecoles" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={DIRECTION_ROLES} />}>
        <Route path="/directeur" element={<DirectorLayout title="Dashboard Directeur" subtitle="Vue d'ensemble de l'execution des programmes scolaires"><Dashboard /></DirectorLayout>} />
        <Route path="/directeur/programmes" element={<DirectorLayout title="Programmes scolaires" crumb="Programmes scolaires"><SchoolPrograms /></DirectorLayout>} />
        <Route path="/directeur/repartition" element={<DirectorLayout title="Repartition annuelle" crumb="Repartition annuelle"><AnnualRepartition /></DirectorLayout>} />
        <Route path="/directeur/enseignants" element={<DirectorLayout title="Enseignants" crumb="Enseignants"><ProgressTracking /></DirectorLayout>} />
        <Route path="/directeur/classes" element={<DirectorLayout title="Classes & Cours" crumb="Classes & Cours"><SchoolPrograms /></DirectorLayout>} />
        <Route path="/directeur/suivi-avancement" element={<DirectorLayout title="Suivi d'avancement" crumb="Suivi d'avancement" compactFilters><ProgressTracking /></DirectorLayout>} />
        <Route path="/directeur/evaluations-controles" element={<DirectorLayout title="Evaluations & Controles" crumb="Evaluations & Controles" compactFilters><EvaluationControl /></DirectorLayout>} />
        <Route path="/directeur/rapports" element={<DirectorLayout title="Centre de Supervision" crumb="Centre de Supervision"><Reports /></DirectorLayout>} />
        <Route path="/directeur/supervision/:id" element={<DirectorLayout title="Détail supervision" crumb="Détail supervision"><SupervisionDetail /></DirectorLayout>} />
        <Route path="/directeur/calendrier" element={<DirectorLayout title="Calendrier" crumb="Calendrier"><EvaluationControl /></DirectorLayout>} />
        <Route path="/directeur/messages" element={<DirectorLayout title="Messages" crumb="Messages"><Reports /></DirectorLayout>} />
        <Route path="/directeur/parametres" element={<DirectorLayout title="Parametres" crumb="Parametres"><Reports /></DirectorLayout>} />
        <Route path="/directeur/*" element={<Navigate to="/directeur" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['PREFET']} />}>
        <Route path="/prefet" element={<PrefectLayout title="Dashboard Prefet" subtitle="Pilotage pedagogique et validation des activites scolaires"><PrefectDashboard /></PrefectLayout>} />
        <Route path="/prefet/validations" element={<PrefectLayout title="Validation des progressions" crumb="Validation des progressions"><PrefectValidations /></PrefectLayout>} />
        <Route path="/prefet/progressions/:id" element={<PrefectLayout title="Détail progression" crumb="Détail progression"><PrefectProgressionDetail /></PrefectLayout>} />
        <Route path="/prefet/controle-programmes" element={<PrefectLayout title="Controle des programmes" crumb="Controle des programmes"><PrefectProgramControl /></PrefectLayout>} />
        <Route path="/prefet/suivi-enseignants" element={<PrefectLayout title="Suivi des enseignants" crumb="Suivi des enseignants"><PrefectTeachersFollowUp /></PrefectLayout>} />
        <Route path="/prefet/cahier-textes" element={<PrefectLayout title="Cahier de textes numerique" crumb="Cahier de textes numerique"><PrefectTextBook /></PrefectLayout>} />
        <Route path="/prefet/evaluations" element={<PrefectLayout title="Evaluations" crumb="Evaluations"><PrefectEvaluations /></PrefectLayout>} />
        <Route path="/prefet/rapports" element={<PrefectLayout title="Validation des rapports quotidiens" crumb="Rapports quotidiens"><PrefectReports /></PrefectLayout>} />
        <Route path="/prefet/rapports/:id" element={<PrefectLayout title="Détail rapport quotidien" crumb="Détail rapport"><PrefectReportDetail /></PrefectLayout>} />
        <Route path="/prefet/calendrier" element={<PrefectLayout title="Calendrier academique" crumb="Calendrier academique"><PrefectCalendar /></PrefectLayout>} />
        <Route path="/prefet/alertes" element={<PrefectLayout title="Alertes pedagogiques" crumb="Alertes pedagogiques"><PrefectAlerts /></PrefectLayout>} />
        <Route path="/prefet/messages" element={<PrefectLayout title="Messages" crumb="Messages"><PrefectMessages /></PrefectLayout>} />
        <Route path="/prefet/parametres" element={<PrefectLayout title="Parametres pedagogiques" crumb="Parametres pedagogiques"><PrefectSettings /></PrefectLayout>} />
        <Route path="/prefet/*" element={<Navigate to="/prefet" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ENSEIGNANT']} />}>
        <Route path="/enseignant" element={<TeacherLayout title="Tableau de bord Enseignant" subtitle="Bienvenue, suivez vos programmes et cahiers de textes"><TeacherDashboard /></TeacherLayout>} />
        <Route path="/enseignant/mes-programmes" element={<TeacherLayout title="Mes programmes" crumb="Mes programmes"><TeacherPrograms /></TeacherLayout>} />
        <Route path="/enseignant/ma-progression" element={<TeacherLayout title="Ma progression" crumb="Ma progression"><TeacherProgress /></TeacherLayout>} />
        <Route path="/enseignant/cahier-texte" element={<TeacherLayout title="Rapport Quotidien de Cours / Pointage" crumb="Rapport quotidien"><TeacherTextBook /></TeacherLayout>} />
        <Route path="/enseignant/mes-evaluations" element={<TeacherLayout title="Mes evaluations" crumb="Mes evaluations"><TeacherEvaluations /></TeacherLayout>} />
        <Route path="/enseignant/mes-classes" element={<TeacherLayout title="Mes classes" crumb="Mes classes"><TeacherDashboard /></TeacherLayout>} />
        <Route path="/enseignant/documents" element={<TeacherLayout title="Documents" crumb="Documents"><TeacherPrograms /></TeacherLayout>} />
        <Route path="/enseignant/messages" element={<TeacherLayout title="Messages" crumb="Messages"><TeacherDashboard /></TeacherLayout>} />
        <Route path="/enseignant/profil" element={<TeacherLayout title="Mon profil" crumb="Mon profil"><TeacherDashboard /></TeacherLayout>} />
        <Route path="/enseignant/*" element={<Navigate to="/enseignant" replace />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN_GESTIONNAIRE']} />}>
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['INFORMATICIEN']} />}>
          <Route path="/informaticien/*" element={<Navigate to="/" replace />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
          <Route path="/parent/*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
