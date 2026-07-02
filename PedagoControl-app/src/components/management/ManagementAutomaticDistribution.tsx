import { Link } from 'react-router-dom'
import { managementProgramDraft } from '../../data/managementPrograms'
import { prepareManagementProgram } from '../../services/managementProgramService'
import { Card, Icon } from '../common'
import { AnnualMeta, ManagementKpi, ManagementPreviewRows, ManagementProgramSteps, MatrixCell } from '../portalComponents'

export function ManagementAutomaticDistribution() {
  const prepared = prepareManagementProgram(managementProgramDraft)
  const monthRows = [
    { month: 'Septembre 2024', days: 20, total: 16, cells: ['1.1 -> 1.3|8 periodes|Du 02/09 au 13/09', '2.1|8 periodes|Du 16/09 au 27/09', '', '', '', '', '', ''] },
    { month: 'Octobre 2024', days: 21, total: 21, cells: ['', '2.2|8 periodes|Du 01/10 au 11/10', '2.3|7 periodes|Du 14/10 au 23/10', '3.1|6 periodes|Du 24/10 au 31/10', '', '', '', ''] },
    { month: 'Novembre 2024', days: 20, total: 20, cells: ['', '', '3.2|7 periodes|Du 04/11 au 13/11', '3.3|7 periodes|Du 14/11 au 25/11', '4.1|6 periodes|Du 26/11 au 30/11', '', '', ''] },
    { month: 'Decembre 2024', days: 15, total: 15, cells: ['', '', '', '4.2|6 periodes|Du 02/12 au 09/12', '4.3|6 periodes|Du 10/12 au 17/12', '5.1|3 periodes|Du 18/12 au 20/12', '', ''] },
    { month: 'Janvier 2025', days: 20, total: 20, cells: ['', '', '', '', '5.2|7 periodes|Du 06/01 au 15/01', '5.3|7 periodes|Du 16/01 au 27/01', '6.1|6 periodes|Du 28/01 au 31/01', ''] },
    { month: 'Fevrier 2025', days: 20, total: 20, cells: ['', '', '', '', '', '6.2|7 periodes|Du 03/02 au 12/02', '6.3|7 periodes|Du 13/02 au 24/02', '7.1|6 periodes|Du 25/02 au 28/02'] },
    { month: 'Mars 2025', days: 21, total: 21, cells: ['', '', '', '', '', '7.2|8 periodes|Du 03/03 au 14/03', '7.3|7 periodes|Du 17/03 au 26/03', '8.1|6 periodes|Du 27/03 au 31/03'] },
    { month: 'Avril 2025', days: 20, total: 20, cells: ['', '', '', '', '', '', '8.2|7 periodes|Du 01/04 au 10/04', '8.3|6 periodes|Du 11/04 au 22/04'] },
    { month: 'Mai 2025', days: 20, total: 20, cells: ['', '', '', '', '', '', '', '8.4|6 periodes|Du 05/05 au 13/05|8.5|6 periodes|Du 14/05 au 22/05'] },
    { month: 'Juin 2025', days: 19, total: 16, cells: ['', '', '', '', '', '', '', '8.6|6 periodes|Du 02/06 au 09/06|8.8|4 periodes|Du 18/06 au 23/06'] },
  ]

  return (
    <section className="management-program-page management-distribution-page">
      <ManagementProgramSteps active={2} />
      <section className="management-distribution-meta">
        <AnnualMeta icon="home" label="Ecole" value="College La Reussite" />
        <AnnualMeta icon="calendar" label="Annee scolaire" value={prepared.draft.schoolYear} />
        <AnnualMeta icon="users" label="Classe / Niveau" value={prepared.draft.className} />
        <AnnualMeta icon="book" label="Matiere" value={prepared.draft.subject} />
        <AnnualMeta icon="calendar" label="Periode" value="02/09/2024 - 30/06/2025" />
      </section>

      <section className="management-workspace">
        <div className="management-work-main">
          <section className="management-kpis distribution-kpis">
            <ManagementKpi icon="calendar" value="302" label="Total jours calendrier" detail="jours" tone="green" />
            <ManagementKpi icon="alert" value="66" label="Jours exclus" detail="jours" tone="red" />
            <ManagementKpi icon="checkCircle" value={prepared.totalWorkingDays} label="Jours ouvrables valides" detail="jours" tone="green" />
            <ManagementKpi icon="book" value={prepared.draft.chapters.length} label="Chapitres" detail="programme" tone="blue" />
            <ManagementKpi icon="clipboard" value={prepared.totalSubChapters} label="Sous-chapitres" detail="saisis" tone="orange" />
            <ManagementKpi icon="calendar" value={prepared.totalPeriods} label="Periodes prevues" detail="total" tone="purple" />
          </section>

          <Card title="Repartition automatique par mois" className="management-matrix-card">
            <div className="matrix-toolbar"><button type="button" className="blue-button">Vue par mois</button><button type="button" className="secondary-button">Vue complete</button><button type="button" className="secondary-button"><Icon name="down" /> Exporter (PDF/Excel)</button></div>
            <div className="management-table-wrap">
              <table className="management-distribution-matrix">
                <thead><tr><th>Mois</th><th>Jours ouvrables</th>{prepared.draft.chapters.map((chapter, index) => <th key={chapter.id}>Chap. {index + 1}<span>{chapter.title}</span></th>)}<th>Total periodes</th></tr></thead>
                <tbody>{monthRows.map((row) => <tr key={row.month}><td><strong>{row.month}</strong></td><td>{row.days} jours</td>{row.cells.map((cell, index) => <td key={`${row.month}-${index}`}>{cell ? <MatrixCell value={cell} /> : <span className="empty-matrix-cell">-</span>}</td>)}<td><strong>{row.total}</strong><span>periodes</span></td></tr>)}</tbody>
                <tfoot><tr><td>TOTAL</td><td>{prepared.totalWorkingDays} jours</td>{prepared.draft.chapters.map((chapter) => <td key={`${chapter.id}-total`}>{chapter.periods} periodes</td>)}<td>{prepared.totalPeriods} periodes</td></tr></tfoot>
              </table>
            </div>
          </Card>
        </div>

        <aside className="management-work-side">
          <Card title="Details des jours exclus" className="management-side-card">
            <div className="excluded-days">
              {['Dimanches|40 jours', 'Samedis exclus|12 jours', 'Jours feries|8 jours', 'Conges scolaires|4 jours', 'Fetes speciales|2 jours'].map((item) => { const [label, value] = item.split('|'); return <p key={label}><span>{label}</span><strong>{value}</strong></p> })}
              <p className="total"><span>Total exclus</span><strong>66 jours</strong></p>
            </div>
          </Card>
          <Card title="Apercu du programme" className="management-side-card">
            <ManagementPreviewRows rows={[['Chapitres', String(prepared.draft.chapters.length)], ['Sous-chapitres', String(prepared.totalSubChapters)], ['Periodes prevues', String(prepared.totalPeriods)], ['Objectif', 'Terminer le 30/06/2025'], ['Statut', 'Brouillon']]} />
          </Card>
          <Card title="Actions" className="management-side-card quick-actions">
            <Link className="secondary-button" to="/management/programmes/chapitres"><Icon name="arrow" /> Etape precedente</Link>
            <button type="button" className="secondary-button"><Icon name="file" /> Ajuster la repartition</button>
            <button type="button" className="secondary-button"><Icon name="eye" /> Apercu complet jour par jour</button>
            <Link className="green-action" to="/management/programmes/validation">Valider et envoyer a l'ecole <Icon name="arrow" /></Link>
          </Card>
          <Card title="Note importante" className="management-side-card"><div className="program-help no-margin"><Icon name="info" /> La repartition est basee sur les jours ouvrables valides. Vous pouvez ajuster manuellement avant validation finale.</div></Card>
        </aside>
      </section>
    </section>
  )
}
