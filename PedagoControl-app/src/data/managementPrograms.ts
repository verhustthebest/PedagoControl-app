import type { AcademicPeriod, ManagementProgramDraft, OfficialProgramChapter } from '../types/management'

export const officialAcademicPeriods: AcademicPeriod[] = [
  { id: 't1', name: '1er Trimestre', kind: 'trimester', startDate: '2024-09-02', endDate: '2024-12-20', color: 'blue' },
  { id: 't2', name: '2e Trimestre', kind: 'trimester', startDate: '2025-01-06', endDate: '2025-03-28', color: 'green' },
  { id: 't3', name: '3e Trimestre', kind: 'trimester', startDate: '2025-04-07', endDate: '2025-06-30', color: 'orange' },
]

export const officialProgramChapters: OfficialProgramChapter[] = [
  { id: 'ch-01', title: 'Nombres entiers et decimaux', periods: 24, subChapters: ['1.1 Lecture et ecriture', '1.2 Comparaison', '1.3 Operations de base', '1.4 Decomposition', '1.5 Exercices d application'] },
  { id: 'ch-02', title: 'Fractions et nombres rationnels', periods: 28, subChapters: ['2.1 Fractions equivalentes', '2.2 Simplification', '2.3 Operations', '2.4 Problemes', '2.5 Evaluation'] },
  { id: 'ch-03', title: 'Equations du premier degre', periods: 20, subChapters: ['3.1 Mise en equation', '3.2 Resolution', '3.3 Problemes', '3.4 Verification', '3.5 Remediation'] },
  { id: 'ch-04', title: 'Geometrie plane', periods: 24, subChapters: ['4.1 Angles', '4.2 Triangles', '4.3 Quadrilateres', '4.4 Constructions', '4.5 Applications'] },
  { id: 'ch-05', title: 'Grandeurs et mesures', periods: 24, subChapters: ['5.1 Longueurs', '5.2 Aires', '5.3 Volumes', '5.4 Conversions', '5.5 Problemes'] },
  { id: 'ch-06', title: 'Statistiques et probabilites', periods: 28, subChapters: ['6.1 Tableaux', '6.2 Moyenne', '6.3 Diagrammes', '6.4 Probabilites', '6.5 Interpretation'] },
  { id: 'ch-07', title: 'Expressions litterales', periods: 24, subChapters: ['7.1 Developper', '7.2 Factoriser', '7.3 Reduire', '7.4 Substituer'] },
  { id: 'ch-08', title: 'Problemes et situations complexes', periods: 64, subChapters: ['8.1 Modeliser', '8.2 Calculer', '8.3 Justifier', '8.4 Synthese', '8.5 Revision', '8.6 Evaluation', '8.7 Correction', '8.8 Remediation'] },
]

export const managementProgramDraft: ManagementProgramDraft = {
  id: 'prog-mgmt-math-5eme-2024',
  schoolYear: '2024 - 2025',
  className: '6eme A',
  subject: 'Mathematiques',
  createdBy: 'Management pedagogique',
  status: 'generated',
  calendar: {
    startDate: '2024-09-02',
    endDate: '2025-06-30',
    includeSaturday: true,
    excludedDates: [
      '2024-10-14',
      '2024-11-01',
      '2024-12-23',
      '2024-12-24',
      '2024-12-25',
      '2024-12-26',
      '2024-12-27',
      '2024-12-30',
      '2024-12-31',
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      '2025-01-04',
      '2025-02-17',
      '2025-02-18',
      '2025-04-18',
      '2025-04-19',
      '2025-04-21',
      '2025-04-22',
      '2025-05-01',
      '2025-05-17',
      '2025-06-16',
      '2025-06-30',
    ],
  },
  periods: officialAcademicPeriods,
  chapters: officialProgramChapters,
}
