import { Link } from 'react-router-dom'
import { managementProgramDraft } from '../../data/managementPrograms'
import { prepareManagementProgram } from '../../services/managementProgramService'
import { Card, Icon } from '../common'
import { ManagementPreviewRows, ManagementProgramSteps, ProgramField } from '../portalComponents'

export function ManagementProgramPlanning() {
  const prepared = prepareManagementProgram(managementProgramDraft)
  const excludedDays = [
    ['Dimanches', '40 jours'],
    ['Samedi exclus', prepared.draft.calendar.includeSaturday ? '0 jour' : '12 jours'],
    ['Jours feries', '8 jours'],
    ['Conges scolaires', '4 jours'],
    ['Fetes speciales', '2 jours'],
  ]

  return (
    <section className="management-program-page management-planning-page">
      <ManagementProgramSteps active={0} />
      <section className="management-workspace">
        <div className="management-work-main">
          <Card title="1. Informations generales" className="program-card management-form-card">
            <div className="program-form-grid four">
              <ProgramField label="Ecole concernee"><select defaultValue="College La Reussite"><option>College La Reussite</option><option>Institut Excellence</option></select></ProgramField>
              <ProgramField label="Annee scolaire / Promotion"><select defaultValue={prepared.draft.schoolYear}><option>{prepared.draft.schoolYear}</option><option>2025 - 2026</option></select></ProgramField>
              <ProgramField label="Classe / Niveau"><select defaultValue={prepared.draft.className}><option>{prepared.draft.className}</option><option>5eme A</option><option>4eme B</option></select></ProgramField>
              <ProgramField label="Matiere"><select defaultValue={prepared.draft.subject}><option>{prepared.draft.subject}</option><option>Francais</option><option>Physique-Chimie</option></select></ProgramField>
              <ProgramField label="Date de debut de l'annee scolaire"><input type="date" defaultValue={prepared.draft.calendar.startDate} /></ProgramField>
              <ProgramField label="Date de fin de l'annee scolaire"><input type="date" defaultValue={prepared.draft.calendar.endDate} /></ProgramField>
              <label className="program-field"><span>Inclure les samedis ? *</span><div className="segmented-choice"><label><input type="radio" name="includeSaturday" defaultChecked /> Oui</label><label><input type="radio" name="includeSaturday" /> Non</label></div></label>
              <ProgramField label="Jours de cours par semaine"><input defaultValue="6 jours (Lun - Sam)" /></ProgramField>
            </div>
            <div className="program-help"><Icon name="info" /> Les jours ouvrables seront calcules automatiquement selon les samedis, jours feries, conges et fetes saisis.</div>
          </Card>

          <Card title="Configuration des periodes pedagogiques" className="program-card management-form-card">
            <div className="program-form-grid three">
              <ProgramField label="Type de decoupage"><select defaultValue="Trimestres"><option>Trimestres</option><option>Semestres</option><option>Periodes personnalisees</option></select></ProgramField>
              <ProgramField label="Nombre de trimestres"><select defaultValue="3"><option>3</option><option>2</option><option>4</option></select></ProgramField>
              <div className="program-info-box compact"><Icon name="info" /><p><strong>Decoupage manuel</strong><span>Definissez les dates et periodes prevues pour chaque periode.</span></p></div>
            </div>
            <div className="management-table-wrap">
              <table className="management-config-table">
                <thead><tr><th>#</th><th>Nom de la periode</th><th>Date de debut</th><th>Date de fin</th><th>Nombre de semaines</th><th>Periodes prevues</th><th>Objectif / Remarque</th><th>Actions</th></tr></thead>
                <tbody>{prepared.draft.periods.map((period, index) => (
                  <tr key={period.id}>
                    <td>{index + 1}</td>
                    <td><input defaultValue={period.name} /></td>
                    <td><input type="date" defaultValue={period.startDate} /></td>
                    <td><input type="date" defaultValue={period.endDate} /></td>
                    <td><input defaultValue={index === 0 ? '16 semaines' : '12 semaines'} /></td>
                    <td><input type="number" defaultValue={index === 1 ? 76 : 80} /></td>
                    <td><input defaultValue={index === 0 ? 'Acquerir les bases fondamentales' : index === 1 ? 'Approfondir les notions' : 'Maitriser et consolider'} /></td>
                    <td><button type="button" className="icon-button"><Icon name="file" /></button><button type="button" className="icon-button danger"><Icon name="alert" /></button></td>
                  </tr>
                ))}</tbody>
                <tfoot><tr><td colSpan={4}>TOTAL</td><td>40 semaines</td><td>{prepared.totalPeriods} periodes prevues</td><td colSpan={2} /></tr></tfoot>
              </table>
            </div>
            <button type="button" className="secondary-button add-period-button"><Icon name="plus" /> Ajouter un trimestre / periode</button>
          </Card>

          <Card title="Organisation du cours" className="program-card management-form-card">
            <div className="program-form-grid five">
              <ProgramField label="Nombre total de chapitres"><input type="number" defaultValue={prepared.draft.chapters.length} /></ProgramField>
              <ProgramField label="Nombre total de sous-chapitres"><input type="number" defaultValue={prepared.totalSubChapters} /></ProgramField>
              <ProgramField label="Nombre total de periodes prevues"><input type="number" defaultValue={prepared.totalPeriods} /></ProgramField>
              <ProgramField label="Periodes par semaine"><input type="number" defaultValue="6" /></ProgramField>
              <ProgramField label="Duree d'une periode"><select defaultValue="45 minutes"><option>45 minutes</option><option>50 minutes</option><option>60 minutes</option></select></ProgramField>
            </div>
            <div className="success-toast inline"><Icon name="checkCircle" /> Avec {prepared.totalPeriods} periodes prevues sur {prepared.totalWorkingDays} jours ouvrables estimes, votre organisation est coherente.</div>
          </Card>

          <div className="program-actions management-screen-actions">
            <Link className="secondary-button" to="/management/ecoles"><Icon name="arrow" /> Etape precedente</Link>
            <button type="button" className="secondary-button">Enregistrer brouillon</button>
            <Link className="blue-button" to="/management/programmes/chapitres">Passer a l'etape suivante <Icon name="arrow" /></Link>
          </div>
        </div>

        <aside className="management-work-side">
          <Card title="Apercu du programme" className="management-side-card">
            <ManagementPreviewRows rows={[
              ['Ecole', 'College La Reussite'],
              ['Annee scolaire', prepared.draft.schoolYear],
              ['Classe / Niveau', prepared.draft.className],
              ['Matiere', prepared.draft.subject],
              ['Periode', '02/09/2024 - 30/06/2025'],
              ['Samedis inclus', 'Oui'],
              ['Jours ouvrables estimes', `${prepared.totalWorkingDays} jours`],
              ['Periodes pedagogiques', '3 trimestres'],
              ['Chapitres', String(prepared.draft.chapters.length)],
              ['Sous-chapitres', String(prepared.totalSubChapters)],
              ['Periodes prevues', `${prepared.totalPeriods} periodes`],
              ['Statut', 'Brouillon'],
            ]} />
          </Card>
          <Card title="Jours a exclure" className="management-side-card">
            <div className="excluded-days">{excludedDays.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}<p className="total"><span>Total exclus</span><strong>54 jours</strong></p></div>
          </Card>
          <Card title="Actions rapides" className="management-side-card quick-actions">
            <button type="button" className="secondary-button"><Icon name="file" /> Enregistrer brouillon</button>
            <button type="button" className="secondary-button"><Icon name="down" /> Reinitialiser le formulaire</button>
            <button type="button" className="secondary-button danger"><Icon name="alert" /> Supprimer le programme</button>
          </Card>
        </aside>
      </section>
    </section>
  )
}
