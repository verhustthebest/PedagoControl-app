import { Link } from 'react-router-dom'

export function UnauthenticatedAccess() {
  return <main className="access-state"><section><h1>Accès non authentifié</h1><p>Votre session est absente ou a expiré.</p><Link to="/login">Se connecter</Link></section></main>
}

export function ForbiddenAccess() {
  return <main className="access-state"><section><h1>Accès interdit</h1><p>Votre rôle ne permet pas d’accéder à ce portail.</p><Link to="/">Retour à l’accueil</Link></section></main>
}
