// Donnees mockees partagees par les portails. Ces structures seront remplacees par les futurs appels API.

export const demoAccounts = [
  { role: 'Enseignant', username: 'michaux', password: '123456', redirect: '/enseignant' },
  { role: 'Admin-Gestionnaire', username: 'admin', password: '123456', redirect: '/directeur' },
  { role: 'Promoteur / Directeur', username: 'tuzolana', password: '123456', redirect: '/directeur' },
  { role: 'Management', username: 'managemet', password: '123456', redirect: '/management/ecoles' },
  { role: 'Prefet des Etudes', username: 'prefet', password: '123456', redirect: '/prefet' },
]

export const navItems = [
  { to: '/directeur', icon: 'home', label: 'Tableau de bord' },
  { to: '/directeur/programmes', icon: 'book', label: 'Programmes scolaires' },
  { to: '/directeur/repartition', icon: 'calendar', label: 'Répartition annuelle' },
  { to: '/directeur/enseignants', icon: 'users', label: 'Enseignants' },
  { to: '/directeur/classes', icon: 'network', label: 'Classes & Cours' },
  { to: '/directeur/suivi-avancement', icon: 'trend', label: "Suivi d'avancement" },
  { to: '/directeur/evaluations-controles', icon: 'checkCircle', label: 'Évaluations & Contrôles' },
  { to: '/directeur/rapports', icon: 'file', label: 'Centre de Supervision' },
  { to: '/directeur/calendrier', icon: 'calendar', label: 'Calendrier' },
  { to: '/directeur/messages', icon: 'message', label: 'Messages', badge: '3' },
  { to: '/directeur/parametres', icon: 'settings', label: 'Paramètres' },
]

export const managementNavItems = [
  { to: '/management', icon: 'home', label: 'Tableau de bord' },
  { to: '/management/ecoles', icon: 'home', label: 'Ecoles clientes' },
  { to: '/management/souscriptions', icon: 'pie', label: 'Souscriptions' },
  { to: '/management/paiements', icon: 'file', label: 'Paiements' },
  { to: '/management/programmes/planification', icon: 'book', label: 'Planification programmes' },
  { to: '/management/programmes/chapitres', icon: 'clipboard', label: 'Structure chapitres' },
  { to: '/management/programmes/repartition', icon: 'calendar', label: 'Repartition automatique' },
  { to: '/management/programmes/validation', icon: 'checkCircle', label: 'Validation & envoi' },
  { to: '/management/programmes/envoyes', icon: 'arrow', label: 'Programmes envoyes' },
  { to: '/management/envois/historique', icon: 'clock', label: 'Historique des envois' },
  { to: '/management/utilisateurs', icon: 'users', label: 'Utilisateurs management' },
  { to: '/management/rapports', icon: 'clipboard', label: 'Rapports' },
  { to: '/management/statistiques', icon: 'chart', label: 'Statistiques' },
  { to: '/management/parametres', icon: 'settings', label: 'Parametres' },
  { to: '/management/audit', icon: 'shield', label: 'Audit' },
  { to: '/management/notifications', icon: 'bell', label: 'Supervision', badge: '12' },
  { to: '/management/historique', icon: 'clock', label: 'Historique actions' },
  { to: '/management/aide', icon: 'info', label: 'Aide & support' },
]

export const clientSchools = [
  { code: 'PED-2026-0001', name: 'Complexe Scolaire La Reussite', responsible: 'Jean-Pierre KIALA', phone: '+243 81 234 5678', province: 'Kinshasa', city: 'Kinshasa', commune: 'Limete', category: 'Ecole moyenne', teachersAllowed: 15, period: '01/09/2026 - 28/02/2027', endDate: '28/02/2027', balance: '205,00 $', status: 'Actif' },
  { code: 'PED-2026-0002', name: 'Institut Nzambe Malamu', responsible: 'Rachel BIKORO', phone: '+243 82 450 1189', province: 'Kinshasa', city: 'Kinshasa', commune: 'Ngaliema', category: 'Ecole grande', teachersAllowed: 35, period: '01/09/2026 - 31/08/2027', endDate: '31/08/2027', balance: '0,00 $', status: 'Actif' },
  { code: 'PED-2026-0003', name: 'CS Les Elites', responsible: 'Patrick MUKENDI', phone: '+243 99 871 0042', province: 'Haut-Katanga', city: 'Lubumbashi', commune: 'Kampemba', category: 'Ecole moyenne', teachersAllowed: 18, period: '01/09/2026 - 30/11/2026', endDate: '30/11/2026', balance: '75,00 $', status: 'Bientot expire' },
  { code: 'PED-2026-0004', name: 'EP Lumiere', responsible: 'Marie KASONGO', phone: '+243 84 700 2210', province: 'Kongo Central', city: 'Matadi', commune: 'Mvuzi', category: 'Petite ecole', teachersAllowed: 8, period: '01/09/2026 - 30/09/2026', endDate: '30/09/2026', balance: '50,00 $', status: 'En retard' },
  { code: 'PED-2026-0005', name: 'College Bel Avenir', responsible: 'Alain ILUNGA', phone: '+243 85 619 7403', province: 'Nord-Kivu', city: 'Goma', commune: 'Karisimbi', category: 'Ecole moyenne', teachersAllowed: 14, period: '01/09/2026 - 28/02/2027', endDate: '28/02/2027', balance: '0,00 $', status: 'Suspendu' },
  { code: 'PED-2026-0006', name: 'Groupe Scolaire Excellence', responsible: 'Claudine MBUYI', phone: '+243 97 555 3021', province: 'Kasai-Oriental', city: 'Mbuji-Mayi', commune: 'Bipemba', category: 'Ecole grande', teachersAllowed: 42, period: '01/09/2026 - 31/08/2027', endDate: '31/08/2027', balance: '0,00 $', status: 'Actif' },
  { code: 'PED-2026-0007', name: 'Institut Vision', responsible: 'Didier LUKOKI', phone: '+243 81 902 4409', province: 'Kinshasa', city: 'Kinshasa', commune: 'Gombe', category: 'Petite ecole', teachersAllowed: 10, period: '01/10/2026 - 31/12/2026', endDate: '31/12/2026', balance: '25,00 $', status: 'Bientot expire' },
  { code: 'PED-2026-0008', name: 'EP Les Petits Genies', responsible: 'Sarah NDAYA', phone: '+243 82 334 0981', province: 'Lualaba', city: 'Kolwezi', commune: 'Dilala', category: 'Petite ecole', teachersAllowed: 6, period: 'Non defini', endDate: '-', balance: '0,00 $', status: 'Brouillon' },
]

export const subjects = [
  { name: 'Mathématiques', color: 'blue', programs: 12, total: 48, done: 34, rate: 71, status: 'En avance', teacher: 'M. Jean Kabasele', className: '5ème A', delay: '4 chapitres' },
  { name: 'Français', color: 'purple', programs: 10, total: 40, done: 26, rate: 65, status: 'Conforme', teacher: 'Mme. Grace Mbuyi', className: '3ème', delay: '3 chapitres' },
  { name: 'Physique-Chimie', color: 'green', programs: 8, total: 32, done: 18, rate: 56, status: 'En retard', teacher: 'M. Patrick Ilunga', className: '4ème', delay: '2 chapitres' },
  { name: 'Histoire-Géo', color: 'orange', programs: 9, total: 36, done: 28, rate: 78, status: 'En avance', teacher: 'Mme. Esther Tshi', className: '2nde', delay: '1 chapitre' },
  { name: 'Anglais', color: 'red', programs: 7, total: 28, done: 14, rate: 50, status: 'En retard', teacher: 'M. David Mukendi', className: '6ème A', delay: '1 chapitre' },
  { name: 'SVT', color: 'green', programs: 7, total: 28, done: 20, rate: 71, status: 'Conforme', teacher: 'M. Junior Mbala', className: '5ème B', delay: 'Chapitre 11 non validé' },
  { name: 'Informatique', color: 'purple', programs: 6, total: 24, done: 20, rate: 83, status: 'En avance', teacher: 'Mme. Rachel Banza', className: '2nde A', delay: 'Aucun' },
  { name: 'Éducation Civique', color: 'cyan', programs: 5, total: 20, done: 16, rate: 80, status: 'Conforme', teacher: 'M. Alain Lubaki', className: '6ème B', delay: 'Aucun' },
]

export const alerts = [
  { title: 'Mathématiques - 5ème', detail: 'Retard de 4 chapitres', time: "Aujourd'hui", tone: 'critical' },
  { title: 'Français - 3ème', detail: 'Retard de 3 chapitres', time: 'Hier', tone: 'critical' },
  { title: 'Physique-Chimie - 4ème', detail: 'Retard de 2 chapitres', time: 'Hier', tone: 'critical' },
  { title: 'Histoire - 2nde', detail: 'Retard de 1 chapitre', time: '2 j', tone: 'warning' },
  { title: 'SVT - 5ème', detail: 'Chapitre 11 non validé', time: '2 j', tone: 'warning' },
]

export const evaluations = [
  { subject: 'Mathématiques', className: '5ème A', teacher: 'M. Jean Kabasele', type: 'Contrôle mensuel', planned: '03 Sept. 2024', done: '03 Sept. 2024', status: 'Réalisée', notes: true },
  { subject: 'Français', className: '4ème B', teacher: 'Mme. Grace Mbuyi', type: 'Interrogation', planned: '06 Sept. 2024', done: '06 Sept. 2024', status: 'Réalisée', notes: true },
  { subject: 'Physique-Chimie', className: '3ème A', teacher: 'M. Patrick Ilunga', type: 'Contrôle mensuel', planned: '05 Sept. 2024', done: '-', status: 'En retard', notes: false },
  { subject: 'Histoire-Géo', className: '2nde C', teacher: 'Mme. Esther Tshi', type: 'Examen trimestriel', planned: '04 Sept. 2024', done: '-', status: 'En retard', notes: false },
  { subject: 'Anglais', className: '6ème A', teacher: 'M. David Mukendi', type: 'Interrogation', planned: '07 Sept. 2024', done: '07 Sept. 2024', status: 'Réalisée', notes: true },
  { subject: 'SVT', className: '5ème B', teacher: 'M. Junior Mbala', type: 'Contrôle mensuel', planned: '10 Sept. 2024', done: '-', status: 'À venir', notes: false },
  { subject: 'Informatique', className: '2nde A', teacher: 'Mme. Rachel Banza', type: 'Interrogation', planned: '12 Sept. 2024', done: '-', status: 'À venir', notes: false },
  { subject: 'Éducation Civique', className: '6ème B', teacher: 'M. Alain Lubaki', type: "Évaluation de fin d'unité", planned: '13 Sept. 2024', done: '-', status: 'À venir', notes: false },
]

export const reports = [
  { title: "Rapport d'exécution des programmes", desc: "Analyse détaillée de l'exécution des programmes par matière et par classe.", data: 'Chapitres prévus vs réalisés|Taux d’exécution|Avancement par matière et classe', period: 'Trimestriel', date: '03 Sept. 2024 10:35', color: 'blue' },
  { title: 'Rapport par enseignant', desc: 'Évaluation de la performance des enseignants et respect du programme.', data: 'Progression par cours|Retards et chapitres manquants|Taux de conformité', period: 'Trimestriel', date: '02 Sept. 2024 16:20', color: 'green' },
  { title: 'Rapport par classe', desc: 'Vue d’ensemble de la progression des classes dans toutes les matières.', data: 'Nombre de matières|Progression moyenne|Comparaison entre classes', period: 'Mensuel', date: '01 Sept. 2024 09:15', color: 'orange' },
  { title: 'Rapport de retard', desc: "Identification des retards dans l'exécution des programmes.", data: 'Enseignants en retard|Matières concernées|Nombre de chapitres manquants', period: 'Mensuel', date: '03 Sept. 2024 11:05', color: 'red' },
  { title: "Rapport global de l'établissement", desc: 'Synthèse globale de toutes les activités pédagogiques de l’établissement.', data: "Taux global d’exécution|Évaluations réalisées|Performances générales", period: 'Annuel', date: '31 Août 2024 14:40', color: 'purple' },
]

export const teacherNavItems = [
  { to: '/enseignant', icon: 'home', label: 'Tableau de bord' },
  { to: '/enseignant/mes-programmes', icon: 'clipboard', label: 'Mes programmes' },
  { to: '/enseignant/ma-progression', icon: 'trend', label: 'Ma progression' },
  { to: '/enseignant/cahier-texte', icon: 'calendar', label: 'Rapport quotidien' },
  { to: '/enseignant/mes-evaluations', icon: 'checkCircle', label: 'Mes évaluations' },
  { to: '/enseignant/mes-classes', icon: 'users', label: 'Mes classes' },
  { to: '/enseignant/documents', icon: 'file', label: 'Documents' },
  { to: '/enseignant/messages', icon: 'message', label: 'Messages', badge: '3' },
  { to: '/enseignant/profil', icon: 'user', label: 'Mon profil' },
]

export const prefectNavItems = [
  { to: '/prefet', icon: 'home', label: 'Tableau de bord' },
  { to: '/prefet/validations', icon: 'checkCircle', label: 'Validation des progressions', badge: '8' },
  { to: '/prefet/controle-programmes', icon: 'book', label: 'Controle des programmes' },
  { to: '/prefet/suivi-enseignants', icon: 'users', label: 'Suivi des enseignants' },
  { to: '/prefet/cahier-textes', icon: 'clipboard', label: 'Cahier de textes numerique' },
  { to: '/prefet/evaluations', icon: 'calendar', label: 'Evaluations' },
  { to: '/prefet/rapports', icon: 'file', label: 'Validation rapports' },
  { to: '/prefet/calendrier', icon: 'calendar', label: 'Calendrier academique' },
  { to: '/prefet/alertes', icon: 'alert', label: 'Alertes pedagogiques', badge: '5' },
  { to: '/prefet/messages', icon: 'message', label: 'Messages', badge: '3' },
  { to: '/prefet/parametres', icon: 'settings', label: 'Parametres pedagogiques' },
]

export const prefectLessonSubmissions = [
  { id: 1, teacher: 'Jean Kabasele', subject: 'Mathematiques', className: '5eme A', chapter: 'Chapitre 4 : Fractions', subChapter: '4.2 Addition et soustraction', date: '03/05/2024', time: '07:30 - 08:30', content: 'Mise au meme denominateur, exemples guides et exercices 1 a 6 page 45.', expected: 'Chapitre 4.2 selon la repartition annuelle', status: 'En attente', rate: 68, delay: 'Aucun' },
  { id: 2, teacher: 'Patrick Ilunga', subject: 'Physique-Chimie', className: '3eme A', chapter: 'Chapitre 3 : La matiere', subChapter: '3.1 Etats physiques', date: '02/05/2024', time: '09:00 - 10:00', content: 'Definition de la matiere, solides, liquides, gaz, exercices de classification.', expected: 'Chapitre 3.2 Changements d etat', status: 'Correction demandee', rate: 52, delay: '1 sous-chapitre' },
  { id: 3, teacher: 'Grace Mbuyi', subject: 'Francais', className: '4eme B', chapter: 'Chapitre 2 : Texte narratif', subChapter: '2.3 Schema narratif', date: '03/05/2024', time: '10:15 - 11:15', content: 'Identification de la situation initiale, element perturbateur et denouement.', expected: 'Chapitre 2.3 selon le programme', status: 'En attente', rate: 74, delay: 'Aucun' },
  { id: 4, teacher: 'Esther Tshi', subject: 'Histoire-Geographie', className: '2nde C', chapter: 'Chapitre 5 : Afrique centrale', subChapter: '5.1 Etats et capitales', date: '01/05/2024', time: '11:30 - 12:30', content: 'Carte politique, localisation et activite de synthese.', expected: 'Chapitre 6 : Economie regionale', status: 'En retard', rate: 43, delay: '2 chapitres' },
]

export const prefectTeacherControls = [
  { teacher: 'M. Jean Kabasele', subject: 'Mathematiques', className: '5eme A', submitted: 14, validated: 12, rejected: 1, waiting: 1, rate: 68, delay: 'Aucun', status: 'Conforme' },
  { teacher: 'Mme. Grace Mbuyi', subject: 'Francais', className: '4eme B', submitted: 11, validated: 9, rejected: 0, waiting: 2, rate: 74, delay: 'Aucun', status: 'Conforme' },
  { teacher: 'M. Patrick Ilunga', subject: 'Physique-Chimie', className: '3eme A', submitted: 8, validated: 5, rejected: 2, waiting: 1, rate: 52, delay: '1 sous-chapitre', status: 'En retard' },
  { teacher: 'Mme. Esther Tshi', subject: 'Histoire-Geographie', className: '2nde C', submitted: 7, validated: 4, rejected: 1, waiting: 2, rate: 43, delay: '2 chapitres', status: 'Critique' },
  { teacher: 'M. David Mukendi', subject: 'Anglais', className: '6eme A', submitted: 13, validated: 12, rejected: 0, waiting: 1, rate: 81, delay: 'Aucun', status: 'En avance' },
]

export const prefectCommunications = [
  { from: 'Jean Kabasele', title: 'Progression soumise', preview: 'Chapitre 4.2 envoye pour validation.', time: '09:42', icon: 'checkCircle' },
  { from: 'Grace Mbuyi', title: 'Correction effectuee', preview: 'Observation ajoutee au cahier de textes.', time: '08:15', icon: 'message' },
  { from: 'Direction', title: 'Rapport hebdomadaire', preview: 'Synthese pedagogique attendue avant vendredi.', time: 'Hier', icon: 'file' },
  { from: 'Patrick Ilunga', title: 'Justification retard', preview: 'Demande de replanification du chapitre 3.', time: '2 j', icon: 'alert' },
]

export const teacherPrograms = [
  { subject: 'Mathématiques', className: '5ème A', chapter: 'Chapitre 5', topic: 'Fractions', done: 11, total: 18, rate: 61, color: 'blue' },
  { subject: 'Mathématiques', className: '6ème B', chapter: 'Chapitre 4', topic: 'Nombres décimaux', done: 9, total: 16, rate: 56, color: 'blue' },
  { subject: 'Physique-Chimie', className: '5ème A', chapter: 'Chapitre 3', topic: 'La matière', done: 6, total: 14, rate: 43, color: 'purple' },
  { subject: 'Physique-Chimie', className: '6ème B', chapter: 'Chapitre 2', topic: 'Les mélanges', done: 5, total: 14, rate: 36, color: 'purple' },
]

export const mathChapters = [
  ['Nombres entiers et opérations', 'Terminé', '10/09/2024', '08/09/2024'],
  ['Nombres décimaux', 'Terminé', '25/09/2024', '22/09/2024'],
  ['Divisibilité', 'Terminé', '10/10/2024', '09/10/2024'],
  ['Fractions', 'En cours', '25/10/2024', '-'],
  ['Calcul littéral', 'À venir', '10/11/2024', '-'],
  ['Équations et inéquations', 'À venir', '25/11/2024', '-'],
  ['Triangles et quadrilatères', 'À venir', '10/12/2024', '-'],
  ['Aires et périmètres', 'À venir', '25/12/2024', '-'],
  ['Statistiques', 'À venir', '10/01/2025', '-'],
  ['Problèmes', 'À venir', '25/01/2025', '-'],
]

export const initialProgressHistory = [
  { date: '01/05/2024', subject: 'Mathématiques', className: '5ème A', chapter: 'Ch. 3 / 3.2 : Nombres décimaux', status: 'Validé' },
  { date: '30/04/2024', subject: 'Mathématiques', className: '5ème A', chapter: 'Ch. 3 / 3.1 : Lecture et écriture des décimaux', status: 'Validé' },
  { date: '27/04/2024', subject: 'Français', className: '5ème A', chapter: 'Ch. 2 / 2.1 : Le texte narratif', status: 'Validé' },
  { date: '25/04/2024', subject: 'Physique-Chimie', className: '5ème A', chapter: 'Ch. 2 / 2.3 : Les mélanges', status: 'Rejeté' },
  { date: '20/04/2024', subject: 'Mathématiques', className: '5ème A', chapter: 'Ch. 2 / 2.1 : Fractions', status: 'Validé' },
]

export const textBookRows = [
  ['02/05/2024', '5ème A', 'Mathématiques', 'Chapitre 3 : Nombres décimaux', 'Validé'],
  ['02/05/2024', '6ème B', 'Mathématiques', 'Chapitre 2 : Nombres décimaux', 'Validé'],
  ['30/04/2024', '5ème A', 'Mathématiques', 'Chapitre 3 : Nombres décimaux', 'En attente'],
  ['30/04/2024', '6ème B', 'Mathématiques', 'Chapitre 2 : Nombres décimaux', 'Validé'],
  ['29/04/2024', '5ème A', 'Mathématiques', 'Chapitre 2 : Fractions', 'Validé'],
  ['27/04/2024', '5ème A', 'Mathématiques', 'Chapitre 2 : Fractions', 'Correction demandée'],
]

export const programClasses = ['5eme A', '5eme B', '4eme A', '3eme A', '2nde C']
export const programSubjects = ['Francais', 'Mathematiques', 'Physique-Chimie', 'Histoire-Geographie', 'SVT']
export const programTeachers = ['Mme. Grace Mbuyi', 'M. Jean Kabasele', 'M. Patrick Ilunga', 'Mme. Esther Tshi', 'M. Junior Mbala']
export const chapterSamples = [
  'Introduction : La langue et la communication',
  'Le verbe',
  'Le groupe nominal',
  'Les fonctions de la phrase',
  'La phrase simple',
  'La conjugaison',
  'Les accords',
  'Le texte narratif',
  'Le texte descriptif',
  'La correspondance',
  'La poesie',
  'Le vocabulaire',
  'Expression orale',
  'Expression ecrite',
  'Lecture suivie',
  'Grammaire appliquee',
  'Orthographe pratique',
  'Revisions et evaluations',
]
export const subChapterSamples = [
  'La langue : definition et caracteristiques',
  'Les elements de la communication',
  'Les formes de communication',
  'Situation de communication',
]
export const repartitionRows = [
  ['Septembre 2024', 'Chap. 1, 2', '8'],
  ['Octobre 2024', 'Chap. 3 & 4', '8'],
  ['Novembre 2024', 'Chap. 5 & 6', '8'],
  ['Decembre 2024', 'Chap. 7 & 8', '8'],
  ['Janvier 2025', 'Chap. 9 & 10', '8'],
  ['Fevrier 2025', 'Chap. 11 a 13', '12'],
  ['Mars 2025', 'Chap. 14 & 15', '8'],
  ['Avril 2025', 'Chap. 16 & 17', '8'],
  ['Mai 2025', 'Chap. 18', '4'],
  ['Juin 2025', 'Revisions & Evaluations', '4'],
]

export const annualPlanRows = [
  { no: '01', chapter: 'Nombres entiers et decimaux', subs: 2, periods: 4, weeks: 'S1 - S2', month: 'sept', start: 1, span: 2, tone: 'blue', planned: 'Sept. 2024', done: '04 Oct. 2024', status: 'Realise' },
  { no: '02', chapter: 'Operations sur les nombres', subs: 3, periods: 6, weeks: 'S3 - S4', month: 'oct', start: 3, span: 2, tone: 'blue', planned: 'Oct. 2024', done: '28 Oct. 2024', status: 'Realise' },
  { no: '03', chapter: 'Multiples et diviseurs', subs: 1, periods: 4, weeks: 'S5', month: 'nov', start: 5, span: 2, tone: 'blue', planned: 'Nov. 2024', done: '18 Nov. 2024', status: 'Realise' },
  { no: '04', chapter: 'Fractions', subs: 3, periods: 6, weeks: 'S6 - S7', month: 'dec', start: 7, span: 2, tone: 'green', planned: 'Nov. - Dec. 2024', done: '02 Dec. 2024', status: 'En cours' },
  { no: '05', chapter: 'Addition et soustraction', subs: 2, periods: 4, weeks: 'S8', month: 'dec', start: 8, span: 2, tone: 'green', planned: 'Dec. 2024', done: '-', status: 'A venir' },
  { no: '06', chapter: 'Multiplication des fractions', subs: 1, periods: 4, weeks: 'S9', month: 'jan', start: 9, span: 2, tone: 'green', planned: 'Janv. 2025', done: '-', status: 'A venir' },
  { no: '07', chapter: 'Division des fractions', subs: 1, periods: 4, weeks: 'S10', month: 'feb', start: 10, span: 2, tone: 'yellow', planned: 'Janv. 2025', done: '-', status: 'A venir' },
  { no: '08', chapter: 'Puissances', subs: 1, periods: 4, weeks: 'S11', month: 'feb', start: 11, span: 2, tone: 'yellow', planned: 'Fevr. 2025', done: '-', status: 'A venir' },
  { no: '09', chapter: 'Racines carrees', subs: 1, periods: 6, weeks: 'S12', month: 'mar', start: 12, span: 2, tone: 'red', planned: 'Fevr. 2025', done: '-', status: 'Retard' },
  { no: '10', chapter: 'Proportionnalite', subs: 1, periods: 4, weeks: 'S13', month: 'mar', start: 13, span: 2, tone: 'red', planned: 'Mars 2025', done: '-', status: 'A venir' },
  { no: '11', chapter: 'Pourcentages', subs: 1, periods: 4, weeks: 'S14', month: 'apr', start: 14, span: 2, tone: 'red', planned: 'Mars 2025', done: '-', status: 'A venir' },
  { no: '12', chapter: 'Equations du 1er degre', subs: 1, periods: 4, weeks: 'S15', month: 'apr', start: 15, span: 2, tone: 'purple', planned: 'Avr. 2025', done: '-', status: 'A venir' },
  { no: '13', chapter: 'Inequations', subs: 1, periods: 4, weeks: 'S16', month: 'apr', start: 16, span: 2, tone: 'purple', planned: 'Avr. 2025', done: '-', status: 'A venir' },
  { no: '14', chapter: 'Fonctions lineaires', subs: 1, periods: 4, weeks: 'S17', month: 'may', start: 17, span: 2, tone: 'purple', planned: 'Mai 2025', done: '-', status: 'A venir' },
  { no: '15', chapter: 'Statistiques', subs: 1, periods: 4, weeks: 'S18', month: 'may', start: 18, span: 2, tone: 'purple', planned: 'Mai 2025', done: '-', status: 'A venir' },
  { no: '16', chapter: 'Probabilites', subs: 1, periods: 4, weeks: 'S19', month: 'may', start: 19, span: 2, tone: 'purple', planned: 'Mai 2025', done: '-', status: 'A venir' },
  { no: '17', chapter: 'Geometrie plane', subs: 1, periods: 6, weeks: 'S20 - S21', month: 'jun', start: 20, span: 2, tone: 'purple', planned: 'Juin 2025', done: '-', status: 'A venir' },
  { no: '18', chapter: 'Figures et solides', subs: 1, periods: 4, weeks: 'S22', month: 'jun', start: 21, span: 2, tone: 'purple', planned: 'Juin 2025', done: '-', status: 'A venir' },
]

export const schoolCalendarRows = [
  ['Rentree scolaire', '07 Sept. 2024', 'red'],
  ['1er Trimestre / Examens', '09 - 06 Dec. 2024', 'orange'],
  ['Vacances de Noel', '22 Dec. 2024 - 05 Jan. 2025', 'blue'],
  ['2eme trimestre / Examens', '10 - 14 Mars 2025', 'green'],
  ['Conge de Paques', '19 - 21 Avr. 2025', 'purple'],
  ["Examens de fin d'annee", '26 Mai - 06 Juin 2025', 'red'],
]


