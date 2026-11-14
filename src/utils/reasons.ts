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
    default:
      return 'Action impossible pour le moment.';
  }
}
