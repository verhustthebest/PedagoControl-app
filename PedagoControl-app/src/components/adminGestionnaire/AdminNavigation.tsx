import{NavLink}from'react-router-dom'
import{useAuth}from'../../auth'

const academic=[['◇','Classes','/admin/classes'],['▤','Matières','/admin/matieres'],['♜','Préfet','/admin/prefet'],['♙','Enseignants','/admin/enseignants']]as const
const parental=[
  {label:'Suivi parental',items:[['♙','Tableau de bord','/admin/suivi-parental'],['◎','Élèves','/admin/eleves'],['♧','Parents & Tuteurs','/admin/parents'],['⇄','Demandes de liaison','/admin/rattachements/demandes']]as const},
  {label:'Contribution Parent',items:[['▣','Configuration','/admin/suivi-parental/contribution'],['◷','Échéances & paiements','/admin/suivi-parental/echeances']]as const},
  {label:'Paramètres',items:[['⚙','Configuration du module','/admin/suivi-parental/configuration']]as const},
]

/** Seules les fonctions du module parental sont masquées ; le contrôle pédagogique reste obligatoire. */
export function AdminNavigation({close}:{close?:()=>void}){
 const{user}=useAuth()
 const groups=[
  {label:'Tableau de bord',items:[['⌂','Tableau de bord','/admin']]as const},
  {label:'Gestion scolaire',items:academic},
  ...(user?.modules?.parental_tracking?parental:[]),
 ]
 return <nav className="admin-nav" aria-label="Navigation Admin gestionnaire">{groups.map(group=><section key={group.label}><p>{group.label}</p>{group.items.map(([icon,label,to])=><NavLink key={to} to={to} end={to==='/admin'} onClick={close}><b>{icon}</b>{label}</NavLink>)}</section>)}</nav>
}
