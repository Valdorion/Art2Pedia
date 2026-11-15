# Tutoriel — lancer et tester manuellement Art2Dex sur ton PC en gardant le format mobile

Ce guide explique comment **lancer** puis **tester manuellement**, étape par étape, l'app **Art2Dex** ( livrée par la [MR #1](https://github.com/Valdorion/Art2Pedia/pull/1), branche `feat/art2dex-pokedex` — Expo React Native SDK 58, Expo Router ) **depuis un PC** Windows / macOS / Linux, tout en gardant un rendu **format téléphone** grâce au mode « appareil » des outils de développement du navigateur.

> Après la fusion de la MR #1 dans `main`, un simple `git checkout main` suffit ; les commandes ci-dessous restent identiques.
> Guides complémentaires (sur la branche de la MR #1) : [TUTORIEL.md](https://github.com/Valdorion/Art2Pedia/blob/feat/art2dex-pokedex/TUTORIEL.md) (parcours complet téléphone/émulateur) et [TUTORIEL-PC-FORMAT-MOBILE.md](https://github.com/Valdorion/Art2Pedia/blob/feat/art2dex-pokedex/TUTORIEL-PC-FORMAT-MOBILE.md) (version détaillée web + device toolbar).

## 1. Principe

```bash
npm run web        # = npx expo start --web
```

Metro démarre et ouvre l'app dans le navigateur à l'adresse **http://localhost:8081**. Par défaut, l'app occupe toute la largeur de la fenêtre (rendu « desktop »). Pour garder le **format mobile sur PC**, on active le *device toolbar* (mode appareil) des DevTools du navigateur avec un preset de téléphone (ex. iPhone 14 Pro 393×852, ou personnalisé 390×844).

## 2. Prérequis

| Outil | Pourquoi | Vérification |
|---|---|---|
| Node.js ≥ 20 (v22 LTS recommandé) + npm 10+ | lancer le serveur Expo | `node -v` / `npm -v` |
| Git | cloner le projet | `git --version` |
| Navigateur récent : **Chrome**, **Edge**, **Firefox** ou **Safari** | DevTools avec mode appareil | — |

Aucun émulateur ni téléphone n'est requis pour ce tutoriel (voir §6 pour la caméra et le scan QR).

## 3. Récupérer le code de la MR #1 et installer

```bash
git clone https://github.com/Valdorion/Art2Pedia.git
cd Art2Pedia
git checkout feat/art2dex-pokedex     # code de la MR #1
npm install
```

Alternative sans Git sur la branche : télécharge le zip de la branche depuis la MR #1 —
https://github.com/Valdorion/Art2Pedia/archive/refs/heads/feat/art2dex-pokedex.zip — dézippe-le, ouvre un terminal dans le dossier, puis `npm install`.

## 4. Lancer l'app en mode web

```bash
npm run web        # ouvre http://localhost:8081 dans le navigateur
```

Alternative : `npx expo start`, puis presse la touche **`w`** dans le terminal Metro.

- Port 8081 déjà occupé : `npx expo start --web --port 8082` puis ouvre http://localhost:8082.
- Cache Metro capricieux : `npx expo start -c`.

## 5. Garder le format mobile sur PC (device toolbar)

### Chrome / Edge

1. Ouvre les DevTools : **`F12`** (ou `Ctrl+Shift+I` / `Cmd+Option+I`).
2. Active le mode appareil : **`Ctrl+Shift+M`** (macOS : `Cmd+Shift+M`), ou clique l'icône 📱💻 en haut à gauche des DevTools.
3. Dans la barre de dimensions en haut de la page, choisis un preset téléphone :
   - **iPhone 14 Pro** (393×852, DPR 3), **Pixel 7** (412×915), etc.,
   - ou **Edit… → Add custom device** : largeur `390`, hauteur `844`, DPR `3`, coche **Touch**.
4. Laisse le zoom à **100 %**.
5. Optionnel : menu **⋯** de la device toolbar → **Show device frame** (affiche le cadre physique du téléphone).
6. **Rafraîchis la page** (`Ctrl+R` / `Cmd+R`) pour appliquer le viewport.
7. Astuce : épingle les DevTools à droite (⋯ → *Dock side* → droite) pour garder l'app bien visible à côté.

### Firefox

`Ctrl+Shift+M` (macOS : `Cmd+Shift+M`) → choisis un preset (ex. iPhone 14 Pro Max) dans la barre responsive, coche **« Tactile »**, zoom 100 %, puis rafraîchis.

### Safari (macOS)

1. Active le menu Développer : **Safari → Réglages → Avancé → « Afficher le menu Développer dans la barre de menus »**.
2. **Développer → « Entrer en mode conception responsive »** (ou `Cmd+Ctrl+R`).
3. Choisis un appareil (iPhone 14 Pro…) dans la barre du haut, puis rafraîchis.

> Si l'app apparaît encore « étirée en desktop », le mode appareil n'est pas actif : vérifie que l'icône 📱 de la device toolbar est bien activée (bleue), puis rafraîchis la page.

## 6. Test manuel pas à pas (checklist)

Toutes les routes sont accessibles directement par URL : `/register`, `/dex`, `/card/<id>`, `/my-card`, `/admin`, `/scan-friend`, `/scan-stand`, `/duo-camera`.

### 6.0 Partir d'un état propre

En web, l'état de l'app est persisté dans le `localStorage` (clé `art2dex/state/v1`). Pour repartir à zéro :

- DevTools → onglet **Application** → *Local Storage* → `http://localhost:8081` → supprime la clé `art2dex/state/v1` (ou « Clear site data »), puis rafraîchis (`F5`).

### 6.1 Inscription (`/register`)

| Action | Résultat attendu |
|---|---|
| Ouvrir `http://localhost:8081` | redirection vers `/register` : titre « Art2Dex », champs Pseudo / Avatar / Couleur |
| « Créer ma carte 🪪 » avec pseudo vide, ou pseudo « A » (1 caractère) | erreur rouge « Le pseudo doit contenir au moins 2 caractères. » |
| Pseudo « Testeur », emoji 🧪, couleur bleue → « Créer ma carte 🪪 » | redirection vers `/dex` |

### 6.2 Pokédex (`/dex`) — état par défaut

- Titre « Pokédex », sous-titre « **0 / 23 cartes capturées** », pastille « 📸 **5** » en haut à droite (stock offert).
- Bannière **rouge** « Hors événement » (dates par défaut : 2025-10-25 → 2025-10-26, 9h00–19h00).
- 3 boutons : « Scanner un ami », « Stand (+5) », « Ma carte ».
- Grille **3 colonnes** de 23 cartes de démo : **16 cartes « Vues »** (grises, avec leur dernière photo grisée — 8 duos de démo pré-liés) et **7 cartes « ??? »** (jamais photographiées). Aucune « ★ Capturée » tant que tu n'as pris aucune photo de duo avec toi.

### 6.3 Admin (`/admin`) — ouvrir la fenêtre de jeu et valider les champs

La date du jour au format `AAAA-MM-JJ` :

```bash
date +%F                        # macOS / Linux
Get-Date -Format "yyyy-MM-dd"   # Windows PowerShell
```

| Action | Résultat attendu |
|---|---|
| Ouvrir `/admin` (ou lien « ⚙️ Admin » de l'inscription / « Ma carte ») | champs pré-remplis : Art2Play, 2025, 2025-10-25, 2025-10-26, 9, 19, 5, 5 |
| `startDate` = `25/10/2025` → « Enregistrer » | erreur « Les dates doivent être au format AAAA-MM-JJ. » |
| `openHour` = 20, `closeHour` = 10 → « Enregistrer » | erreur « L'heure d'ouverture doit être strictement inférieure à l'heure de fermeture. » |
| `startDate` = `endDate` = **aujourd'hui**, `openHour` = **0**, `closeHour` = **24** → « Enregistrer » | « ✅ Enregistré » |
| Retour sur `/dex` | bannière **verte** « Fenêtre de jeu ouverte — Jusqu'à 24h00 » |
| Rafraîchir (`F5`) | toujours inscrit, bannière toujours verte : la config est persistée (localStorage) |

### 6.4 Fiche carte (`/card/<id>`) — les 3 états + bouton désactivé

| Action | Résultat attendu |
|---|---|
| `/card/p-bulbi` (fenêtre ouverte) | titre « **?????** », carte grisée, bouton rouge actif « 📸 Photographier BulbiFan » |
| `/card/p-pika` (déjà en duo avec d'autres) | titre « ????? », texte « Vue : déjà photographiée par quelqu'un d'autre (pas avec toi)… », carte grise + photo grise |
| `startDate`/`endDate` = une date passée dans `/admin` → `/card/p-bulbi` | bouton **grisé/désactivé** + raison « Le jeu n'est actif que pendant les jours d'événement définis par l'admin, aux horaires réglés. » |
| Remettre aujourd'hui / 0–24 dans `/admin` | bouton à nouveau actif |

> L'état « ★ Capturée » (titre = pseudo, carte en couleur) n'apparaît qu'après une vraie photo de duo avec toi — donc via la caméra, hors web (voir §7).

### 6.5 Ma carte (`/my-card`) — QR perso, stats, persistance

- Ta carte en couleur (emoji + couleur choisis à l'inscription).
- **QR personnel** blanc avec la valeur `art2dex://player/me-…` + légende « Montre ce QR pour qu'on te photographie 📸 ».
- Stats : « **0/23** cartes capturées », « **0** photos de duo », « Aucune photo de duo pour le moment. »
- Boutons « 📖 Voir le Pokédex » et « ⚙️ Admin ».
- **Astuce test cross-appareil** : capture d'écran du QR (DevTools → ⋯ → « Capture screenshot », ou outil de capture de l'OS) → scanne cette image depuis l'app **Expo Go** d'un autre appareil via « Scanner un ami ».
- Rafraîchir (`F5`) → tout est conservé (inscription, config admin, stock).

### 6.6 Navigation directe par URL

| URL | Résultat attendu |
|---|---|
| `/` | redirige vers `/dex` (inscrit) ou `/register` (non inscrit) |
| `/dex`, `/my-card`, `/admin` | écrans correspondants en format mobile |
| `/card/p-pika` | fiche du joueur de démo « PikaNoob » |
| `/scan-friend`, `/scan-stand`, `/duo-camera` | s'ouvrent mais la **caméra ne fonctionne pas en web** → voir §7 |

### 6.7 Récap des vérifications

| # | Vérification | ✅ attendu |
|---|---|---|
| 1 | Lancement | `npm run web` → http://localhost:8081 s'ouvre |
| 2 | Format mobile | device toolbar actif (📱), preset téléphone, zoom 100 % |
| 3 | Inscription | erreur pseudo < 2 car., puis création → `/dex` |
| 4 | Dex | grille 3 col., « 0 / 23 », pastille 📸 5, bannière rouge par défaut |
| 5 | Admin | validations (format date, horaires), « ✅ Enregistré », bannière verte, persistance au F5 |
| 6 | Fiche carte | états ????? / Vue grise, bouton actif, bouton désactivé + raison hors fenêtre |
| 7 | Ma carte | QR perso `art2dex://player/…`, stats 0/23 et 0 photo |
| 8 | Persistance | F5 conserve inscription + config (localStorage `art2dex/state/v1`) |

## 7. Limites du web (caméra / scan QR) et comment tester depuis le PC

| Écran | Web (`npm run web`) | Pourquoi |
|---|---|---|
| Inscription, Pokédex, fiche carte, ma carte, admin | ✅ | pur React Native Web + AsyncStorage → localStorage |
| `duo-camera` (photo de duo) | ❌ | `CameraView` d'`expo-camera` (natif) |
| `scan-friend` / `scan-stand` (scan QR) | ❌ | `ScannerShell` → `expo-camera` (natif) |

Pour ces 3 écrans, teste sur un **téléphone avec Expo Go** (PC et téléphone sur le même Wi-Fi, scanne le QR affiché par Metro) ou un **émulateur Android** — voir [TUTORIEL.md §1, §3, §6](https://github.com/Valdorion/Art2Pedia/blob/feat/art2dex-pokedex/TUTORIEL.md).

Astuces pour les QR **depuis le PC** :

- **QR perso** : capture d'écran du QR affiché sur `/my-card` (§6.5), à scanner depuis un autre appareil.
- **QR de stand** : génère le texte dans un terminal à la racine du projet :

```bash
npx tsx -e "import { standQr } from './src/utils/qr'; console.log(standQr('stand-accueil'))"
# → art2dex://stand/stand-accueil
```

Colle ce texte dans un générateur de QR en ligne, affiche le QR sur un second écran (ou imprime-le) et scanne-le depuis le téléphone via « Stand (+5) ». Les 5 stands valides : `stand-accueil`, `stand-artistes`, `stand-jeux-indes`, `stand-cosplay`, `stand-restauration`.

## 8. Vérifications rapides en ligne de commande (sans UI)

```bash
npm test           # smoke tests métier (tsx scripts/smoke.ts) → « ✅ smoke tests OK »
npm run typecheck  # tsc --noEmit, doit être silencieux
npm run lint       # expo lint, 0 erreur
```

## 9. Dépannage

- **Rendu « desktop » malgré tout** : mode appareil inactif → `Ctrl+Shift+M`, preset téléphone, rafraîchir.
- **Port 8081 occupé** : `npx expo start --web --port 8082` → http://localhost:8082.
- **Metro capricieux / cache** : `npx expo start -c`.
- **Page blanche** : vérifie que le terminal Metro tourne, essaie `http://127.0.0.1:8081`, vide le cache (`-c`).
- **État bizarre après des tests** : supprime la clé `art2dex/state/v1` du localStorage (DevTools → Application) puis F5 — repart à zéro. Le stock de photos se réinitialise aussi à chaque nouveau jour d'événement (`freePhotosPerMorning` = 5 par défaut).
- **Fenêtre de jeu fermée** : normal hors dates admin → règle les dates dans `/admin` comme au §6.3.

## 10. Voir les maquettes des 7 écrans

Ouvre simplement `preview/canvas.html` dans le navigateur (aucune installation) — 7 maquettes de téléphone en CSS pur. Le PNG statique est dans `preview/canvas.png`.
