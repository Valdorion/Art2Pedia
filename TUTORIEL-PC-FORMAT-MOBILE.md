# Tutoriel — tester Art2Dex sur un PC en gardant le format mobile

Ce guide explique comment lancer **Art2Dex** dans le navigateur d'un PC (Windows / macOS / Linux) tout en gardant un rendu **format téléphone** (fenêtre étroite, ratio mobile), grâce au mode « appareil » des outils de développement du navigateur. Aucun émulateur ni téléphone requis pour la partie navigation.

> Le guide général (Expo Go, émulateur Android, parcours complet avec caméra/QR) est dans [TUTORIEL.md](TUTORIEL.md). Celui-ci est le complément « 100 % PC, rendu mobile ».

## 1. Principe

```bash
npm run web        # = npx expo start --web
```

Metro démarre et ouvre l'app à l'adresse **http://localhost:8081** dans ton navigateur. Par défaut, l'app occupe toute la largeur de la fenêtre : le rendu est « desktop ». Pour obtenir le **format mobile sur PC**, on active le *device toolbar* (mode appareil) des DevTools du navigateur, avec un preset de téléphone (ex. iPhone 14 Pro 393×852, ou personnalisé 390×844).

## 2. Prérequis

| Outil | Pourquoi | Vérification |
|---|---|---|
| Node.js ≥ 20 (v22 LTS recommandé) + npm 10+ | lancer le serveur Expo | `node -v` / `npm -v` |
| Git | cloner le projet | `git --version` |
| Navigateur récent : **Chrome**, **Edge**, **Firefox** ou **Safari** | DevTools avec mode appareil | — |

## 3. Lancer l'app en mode web

```bash
git clone https://github.com/Valdorion/Art2Pedia.git
cd Art2Pedia
git checkout feat/art2dex-pokedex
npm install
npm run web        # ouvre http://localhost:8081 dans le navigateur
```

Alternative : `npx expo start`, puis touche **`w`** dans le terminal Metro.

## 4. Passer le navigateur en format mobile (device toolbar)

### Chrome / Edge

1. Ouvre les DevTools : **`F12`** (ou `Ctrl+Shift+I` / `Cmd+Option+I`).
2. Active le mode appareil : **`Ctrl+Shift+M`** (ou `Cmd+Shift+M`) — ou clique sur l'icône 📱💻 en haut à gauche des DevTools.
3. Dans la barre qui apparaît en haut de la page, choisis un téléphone dans le sélecteur de dimensions :
   - preset **« iPhone 14 Pro »** (393×852, DPR 3), **« Pixel 7 »** (412×915), etc.,
   - ou **« Edit… » → « Add custom device »** : largeur `390`, hauteur `844`, DPR `3`, coche **Touch** et un user-agent mobile.
4. Laisse le **zoom à 100 %**.
5. Optionnel, pour un vrai rendu « téléphone sur le PC » : menu **⋯** de la device toolbar → **« Show device frame »** (affiche le cadre physique du téléphone).
6. **Rafraîchis la page** (`Ctrl+R` / `Cmd+R`) pour appliquer le viewport.

Astuce : épingle les DevTools à droite (⋯ → *Dock side* → icône droite) pour garder la fenêtre de l'app bien visible à côté.

### Firefox

`Ctrl+Shift+M` (ou `Cmd+Shift+M`) → choisis un preset (ex. iPhone 14 Pro Max) dans la barre responsive, coche **« Tactile »** pour simuler les événements touch, zoom 100 %, puis rafraîchis.

### Safari (macOS)

1. Active le menu Développer : **Safari → Réglages → Avancé → « Afficher le menu Développer dans la barre de menus »**.
2. **Développer → « Entrer en mode conception responsive »** (ou `Cmd+Ctrl+R`).
3. Choisis un appareil (iPhone 14 Pro…) dans la barre du haut, puis rafraîchis.

> Si l'app apparaît encore « étirée en desktop », c'est que le mode appareil n'est pas actif : vérifie que l'icône 📱 de la device toolbar est bien bleue/activée, puis rafraîchis.

## 5. Parcours de test faisable en web (format mobile)

Toutes les routes sont accessibles directement par URL : `/register`, `/dex`, `/card/<id>`, `/my-card`, `/admin`.

1. **Inscription** : `http://localhost:8081` → « Créer ma carte 🪪 » → pseudo (min 2 car.), emoji, couleur → **Pokédex** (grille 3 colonnes, cartes grises « ??? », « Vues », « ★ Capturées » de démo).
2. **Ouvrir la fenêtre de jeu** : ⚙️ Admin → `startDate` = `endDate` = aujourd'hui (`AAAA-MM-JJ`), ouverture `0`, fermeture `24` → « Enregistrer » → bannière verte. (Persisté côté web dans le `localStorage`, clé `art2dex/state/v1` : ça survit au refresh.)
3. **Fiche carte** : touche une carte du dex → état + bouton « 📸 Photographier ».
4. **Ma carte / QR perso** : « Ma carte » → ta carte + ton **QR personnel** affiché en SVG (fonctionne en web).
5. **Admin** : toutes les règles (dates, horaires, stock) se règlent et se testent depuis `http://localhost:8081/admin`.

## 6. Ce qui ne marche PAS en web (caméra native)

| Écran | Web (`npm run web`) | Pourquoi |
|---|---|---|
| Inscription, Pokédex, fiche carte, ma carte, admin | ✅ | pur React Native Web + AsyncStorage → localStorage |
| `duo-camera` (photo de duo) | ❌ | `CameraView` d'`expo-camera` (natif) |
| `scan-friend` / `scan-stand` (scan QR) | ❌ | `ScannerShell` → `expo-camera` (natif) |

Pour ces 3 écrans, teste sur un **téléphone avec Expo Go** (même Wi-Fi, scanne le QR de Metro) ou un **émulateur Android** — voir [TUTORIEL.md](TUTORIEL.md) §1, §3, §6.

Astuce pour tester les QR **depuis le PC** : sur « Ma carte », fais une capture d'écran du QR perso affiché, puis scanne cette image depuis l'app Expo Go d'un autre appareil (écran « Scanner un ami »). Pour un QR de stand, génère le texte avec :

```bash
npx tsx -e "import { standQr } from './src/utils/qr'; console.log(standQr('stand-accueil'))"
# → art2dex://stand/stand-accueil
```

puis colle-le dans un générateur de QR en ligne, affiche le QR sur un second écran (ou une seconde fenêtre) et scanne-le depuis le téléphone.

## 7. Dépannage

- **L'app s'affiche en pleine largeur (rendu desktop)** : le mode appareil n'est pas actif → `Ctrl+Shift+M`, choisis un preset téléphone, rafraîchis.
- **Port 8081 occupé** : `npx expo start --web --port 8082` puis ouvre http://localhost:8082.
- **Metro capricieux / cache** : `npx expo start -c`.
- **Page blanche ou boucle de chargement** : vérifie que le terminal Metro tourne bien, essaie `http://127.0.0.1:8081`, vide le cache (`-c`).
- **Repartir à zéro (état enregistré)** : DevTools → *Application* → *Local Storage* → supprime la clé `art2dex/state/v1` (ou « Clear site data »), puis rafraîchis.
- **La fenêtre de jeu est fermée** : normal hors dates admin → règle les dates dans `/admin` comme au §5.2.

## 8. Récap : quoi tester où

| Scénario | Commande / outil | Format mobile garanti ? |
|---|---|---|
| Navigation complète sur PC, fenêtre type téléphone | `npm run web` + device toolbar (ce guide) | ✅ via le viewport du navigateur |
| Caméra (photo de duo) + scan QR | Expo Go sur téléphone (même Wi-Fi) ou émulateur Android | ✅ natif |
| Canva des 7 écrans (maquettes) | ouvrir `preview/canvas.html` dans le navigateur | ✅ maquettes téléphone en CSS |
