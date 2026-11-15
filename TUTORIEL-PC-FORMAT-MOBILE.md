# Tutoriel — lancer et tester manuellement Art2Dex sur un PC en gardant le format mobile

Ce guide explique comment **lancer** puis **tester manuellement**, étape par étape, l'app **Art2Dex** dans le navigateur d'un PC (Windows / macOS / Linux) tout en gardant un rendu **format téléphone** (fenêtre étroite, ratio mobile), grâce au mode « appareil » des outils de développement du navigateur.

> Le guide général (Expo Go, émulateur Android, parcours complet avec caméra/QR) est dans [TUTORIEL.md](TUTORIEL.md). Celui-ci est le complément « 100 % PC, rendu mobile, test manuel ».

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

## 5. Test manuel pas à pas (checklist)

Toutes les routes sont accessibles directement par URL : `/register`, `/dex`, `/card/<id>`, `/my-card`, `/admin`.

### 5.0 Préparer un état propre

L'état de l'app est persisté côté web dans le `localStorage` (clé `art2dex/state/v1`). Pour partir de zéro :

- DevTools → onglet **Application** → *Local Storage* → `http://localhost:8081` → supprime la clé `art2dex/state/v1` (ou « Clear site data »), puis rafraîchis (`F5`).

### 5.1 Inscription (`/register`)

| Action | Résultat attendu |
|---|---|
| Ouvrir `http://localhost:8081` | redirection vers `/register` (pas encore inscrit) : titre « Art2Dex », champs Pseudo / Avatar / Couleur |
| « Créer ma carte 🪪 » avec pseudo vide | erreur rouge « Le pseudo doit contenir au moins 2 caractères. » |
| Pseudo « A » (1 caractère) | même erreur |
| Pseudo « Testeur », emoji 🧪, couleur bleue, « Créer ma carte 🪪 » | redirection vers `/dex` |

### 5.2 Pokédex (`/dex`) — état par défaut

- Titre « Pokédex », sous-titre « **0 / 23 cartes capturées** », pastille « 📸 **5** » en haut à droite (stock offert).
- Bannière **rouge** « Hors évènement » (dates par défaut 2025-10-25 → 2025-10-26, 9h00–19h00).
- 3 boutons : « Scanner un ami », « Stand (+5) », « Ma carte », puis le texte des règles.
- Grille **3 colonnes** de 23 cartes de démo : 16 cartes « Vues » (grises, avec leur dernière photo grise — 8 duos de démo pré-liés) et 7 cartes « ??? » (jamais photographiées). Aucune « ★ Capturée » tant que tu n'as pris aucune photo de duo avec toi.

### 5.3 Admin (`/admin`) — ouvrir la fenêtre de jeu et valider les champs

La date du jour au format `AAAA-MM-JJ` :

```bash
date +%F                              # macOS / Linux
Get-Date -Format "yyyy-MM-dd"         # Windows PowerShell
```

| Action | Résultat attendu |
|---|---|
| Ouvrir `/admin` (ou lien « ⚙️ Admin » de l'inscription / « Ma carte ») | champs pré-remplis : Art2Play, 2025, 2025-10-25, 2025-10-26, 9, 19, 5, 5 + aperçu de la fenêtre courante |
| `startDate` = `25/10/2025` → « Enregistrer » | erreur « Les dates doivent être au format AAAA-MM-JJ. » |
| `openHour` = 20, `closeHour` = 10 → « Enregistrer » | erreur « L'heure d'ouverture doit être strictement inférieure à l'heure de fermeture. » |
| `startDate` = `endDate` = **aujourd'hui**, `openHour` = **0**, `closeHour` = **24** → « Enregistrer » | « ✅ Enregistré » |
| Retour sur `/dex` | bannière **verte** « Fenêtre de jeu ouverte — Jusqu'à 24h00 », règles mises à jour (0h00–24h00) |
| Rafraîchir (`F5`) | toujours inscrit, bannière toujours verte : la config est persistée (localStorage) |

### 5.4 Fiche carte (`/card/<id>`) — les 3 états + bouton désactivé

| Action | Résultat attendu |
|---|---|
| Depuis le dex, toucher une carte « ??? » (ex. URL directe `/card/p-bulbi`) | titre « **?????** », texte « Inconnue : ce joueur n'a jamais été photographié. Carte grisée. », bannière verte, bouton rouge actif « 📸 Photographier BulbiFan » |
| Ouvrir `/card/p-pika` (déjà en duo avec d'autres) | titre « ????? » (pas capturé **avec toi**), texte « Vue : déjà photographiée par quelqu'un d'autre (pas avec toi)… », carte grise + photo grise |
| Mettre `startDate`/`endDate` à une date passée dans `/admin` → « Enregistrer » → ouvrir `/card/p-bulbi` | bouton **grisé/désactivé** + raison rouge « Le jeu n'est actif que pendant les jours d'évènement définis par l'admin, aux horaires réglés. » |
| Remettre aujourd'hui / 0–24 dans `/admin` | bouton à nouveau actif |

> L'état « ★ Capturée » (titre = pseudo, carte en couleur) n'apparaît qu'après une vraie photo de duo avec toi : voir §6 (caméra, donc téléphone/émulateur).

### 5.5 Ma carte (`/my-card`) — QR perso, stats, persistance

- Titre « Ma carte », ta carte en couleur (emoji + couleur choisis à l'inscription).
- **QR personnel** blanc (180 px) avec la valeur `art2dex://player/me-…` + légende « Montre ce QR pour qu'on te photographie 📸 ».
- Stats : « **0/23** cartes capturées », « **0** photos de duo », puis « Aucune photo de duo pour le moment. »
- Boutons « 📖 Voir le Pokédex » et « ⚙️ Admin ».
- **Astuce test cross-appareil** : fais une capture d'écran du QR (DevTools → ⋯ → « Capture screenshot », ou outil de capture de l'OS) → scanne cette image depuis l'app **Expo Go** d'un autre appareil via « Scanner un ami ».
- Rafraîchir (`F5`) → tout est conservé (inscription, config admin, stock).

### 5.6 Navigation directe par URL

| URL | Résultat attendu |
|---|---|
| `/` | redirige vers `/dex` (inscrit) ou `/register` (non inscrit) |
| `/dex`, `/my-card`, `/admin` | écrans correspondants en format mobile |
| `/card/p-pika` | fiche du joueur de démo « PikaNoob » |
| `/scan-friend`, `/scan-stand`, `/duo-camera` | s'ouvrent mais la **caméra ne fonctionne pas en web** → voir §6 |

### 5.7 Récap des vérifications

| # | Vérification | ✅ attendu |
|---|---|---|
| 1 | Lancement | `npm run web` → http://localhost:8081 s'ouvre |
| 2 | Format mobile | device toolbar actif (📱 bleue), preset téléphone, zoom 100 % |
| 3 | Inscription | erreur pseudo < 2 car., puis création → `/dex` |
| 4 | Dex | grille 3 col., « 0 / 23 », pastille 📸 5, bannière rouge par défaut |
| 5 | Admin | validations (format date, horaires), ✅ Enregistré, bannière verte, persistance au F5 |
| 6 | Fiche carte | 3 états (????? / Vue grise / bouton actif), bouton désactivé + raison hors fenêtre |
| 7 | Ma carte | QR perso `art2dex://player/…`, stats 0/23 et 0 photo |
| 8 | Persistance | F5 conserve inscription + config (localStorage `art2dex/state/v1`) |

## 6. Limites du web (caméra / scan QR) et astuces pour tester depuis le PC

| Écran | Web (`npm run web`) | Pourquoi |
|---|---|---|
| Inscription, Pokédex, fiche carte, ma carte, admin | ✅ | pur React Native Web + AsyncStorage → localStorage |
| `duo-camera` (photo de duo) | ❌ | `CameraView` d'`expo-camera` (natif) |
| `scan-friend` / `scan-stand` (scan QR) | ❌ | `ScannerShell` → `expo-camera` (natif) |

Pour ces 3 écrans, teste sur un **téléphone avec Expo Go** (même Wi-Fi, scanne le QR de Metro) ou un **émulateur Android** — voir [TUTORIEL.md](TUTORIEL.md) §1, §3, §6.

Astuces pour tester les QR **depuis le PC** :

- **QR perso** : capture d'écran du QR affiché sur `/my-card` (§5.5), à scanner depuis un autre appareil.
- **QR de stand** : génère le texte dans un terminal à la racine du projet :

```bash
npx tsx -e "import { standQr } from './src/utils/qr'; console.log(standQr('stand-accueil'))"
# → art2dex://stand/stand-accueil
```

puis colle-le dans un générateur de QR en ligne, affiche le QR sur un second écran (ou une seconde fenêtre) et scanne-le depuis le téléphone. Les 5 stands valides : `stand-accueil`, `stand-artistes`, `stand-jeux-indes`, `stand-cosplay`, `stand-restauration`.

## 7. Dépannage

- **L'app s'affiche en pleine largeur (rendu desktop)** : le mode appareil n'est pas actif → `Ctrl+Shift+M`, choisis un preset téléphone, rafraîchis.
- **Port 8081 occupé** : `npx expo start --web --port 8082` puis ouvre http://localhost:8082.
- **Metro capricieux / cache** : `npx expo start -c`.
- **Page blanche ou boucle de chargement** : vérifie que le terminal Metro tourne bien, essaie `http://127.0.0.1:8081`, vide le cache (`-c`).
- **État bizarre après des tests** : supprime la clé `art2dex/state/v1` dans le localStorage (DevTools → Application) puis rafraîchis — repart à zéro. Le stock de photos se réinitialise aussi à chaque nouveau jour d'évènement (`freePhotosPerMorning`) : pour re-tester ce reset sur PC, supprime la clé localStorage ou change la date système du PC.
- **La fenêtre de jeu est fermée** : normal hors dates admin → règle les dates dans `/admin` comme au §5.3.

## 8. Récap : quoi tester où

| Scénario | Commande / outil | Format mobile garanti ? |
|---|---|---|
| Navigation + parcours manuel complet sur PC, fenêtre type téléphone | `npm run web` + device toolbar (ce guide, §5) | ✅ via le viewport du navigateur |
| Caméra (photo de duo) + scan QR + conso du stock | Expo Go sur téléphone (même Wi-Fi) ou émulateur Android | ✅ natif |
| Règles métier hors UI (fenêtre, stock, états de carte, QR) | `npm test` (smoke tests `scripts/smoke.ts`) | n/a (Node) |
| Canva des 7 écrans (maquettes) | ouvrir `preview/canvas.html` dans le navigateur | ✅ maquettes téléphone en CSS |
