export function reasonText(reason?: string): string {
  switch (reason) {
    case 'hors-fenetre':
      return "Le jeu n'est actif que pendant les jours d'événement définis par l'admin, aux horaires réglés.";
    case 'stock-vide':
      return 'Stock de photos vide : scanne un QR sur un stand du salon pour recharger.';
    case 'stand-deja-scanne':
      return "Ce stand a déjà été scanné aujourd'hui.";
    case 'no-me':
      return "Inscris-toi d'abord pour jouer.";
    case 'cible-inconnue':
      return 'Joueur introuvable.';
    case 'deja-capturee':
      return 'Carte déjà débloquée.';
    case 'mode-collection':
      return "En mode Collection, la validation se fait avec le code temporaire du joueur (pas de scan QR direct).";
    case 'mode-classique':
      return 'En mode Classique, scanne le QR du joueur pour débloquer sa carte.';
    case 'format':
      return 'Le code doit contenir 6 chiffres.';
    case 'mismatch':
      return 'Code incorrect ou expiré : demande au joueur de te montrer son code actuel.';
    case 'reused':
      return 'Ce code a déjà été utilisé.';
    case 'groupe-inconnu':
      return 'Collection introuvable.';
    case 'deja-membre':
      return 'Tu fais déjà partie de cette collection.';
    default:
      return 'Action impossible pour le moment.';
  }
}
