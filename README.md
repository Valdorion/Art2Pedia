# Art2Dex — le Pokédex de l'Art2Play

App mobile **Expo React Native (SDK 58)** en mode Pokédex pour la convention **Art2Play** :
les visiteurs s'inscrivent à l'avance, reçoivent une carte perso + un QR code personnel,
et « capturent » les autres participants en prenant des **photos de duo** avec eux.

![Canva de prévisualisation des 7 écrans](preview/canvas.png)
[Vue HTML du canva](preview/canvas.html) — régénéré en PNG via `python3 preview/gen_canvas.py`

## Concept

- **Inscription à l'avance** → carte perso (pseudo, emoji avatar, couleur) + QR personnel `art2dex://player/<id>`.
- **Dex en grille 3 colonnes** (style Pokédex, palette rouge `#E3350D` / jaune `#FFCB05`).
- **Photo de duo** avec un autre joueur → la photo est ajoutée sur les cartes des **2 joueurs** et consomme **1 photo de stock**.
- **Fenêtre de jeu** : uniquement les jours d'événement définis par l'admin, de `openHour` à `closeHour`.
- **Stock de photos** : `freePhotosPerMorning` photos offertes chaque matin d'événement (reset par jour d'event) ; recharge de `+qrRechargeAmount` en scannant un QR de stand (1 scan/stand/jour, uniquement dans la fenêtre de jeu).

## Règles métier → implémentation

| Règle | Implémentation |
|---|---|
| Inscription → carte + QR perso | `src/app/register.tsx`, `register()` dans `src/store/DexContext.tsx`, `playerQr()` dans `src/utils/qr.ts` |
| Carte jamais photographiée | grise + « ? » : `getCardView()` → `unknown` dans `src/services/game.ts`, overlay gris dans `src/components/CardVisual.tsx` |
| Carte photographiée (pas avec moi) | grise + **dernière photo** grisée : `status: 'seen'` dans `getCardView()` |
| Photo de duo avec moi | « capturée », photo en couleur, remplace l'ancienne : `status: 'captured'` + `addDuoPhoto()` sur les 2 cartes |
| Fenêtre de jeu admin, pas de dates en dur | écran `src/app/admin.tsx` (validation AAAA-MM-JJ, horaires, entiers ≥ 0), persisté dans AsyncStorage clé `art2dex/state/v1` (`src/services/storage.ts`), testé par `isPlayWindow()` dans `src/utils/eventWindow.ts` ; valeurs par défaut dans `src/config.ts` (2025-10-25/26, 9h–19h, 5 photos, +5) |
| Stock : reset chaque matin d'event | `effectiveStock()` dans `src/utils/photoStock.ts` (reset par `dayKey`) |
| Recharge QR stand, 1 scan/stand/jour, fenêtre ouverte uniquement | `rechargeFromStand()` dans `src/store/DexContext.tsx` (clé `<stand>@<jour>`), stands listés dans `src/config.ts` : stand-accueil, stand-artistes, stand-jeux-indes, stand-cosplay, stand-restauration |
| Thème Pokémon | `src/theme.ts`, `CardVisual.tsx` (« ★ Capturé », PV, « Type : Convention ») |

## Commandes

```bash
npm install          # dépendances
npm start            # Expo Go / dev build
npm run android      # ou ios / web
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
npm test             # smoke tests métier (tsx scripts/smoke.ts)
```

## Structure

```
src/
  app/            routes Expo Router (root: ./src/app)
    _layout.tsx     DexProvider + Stack
    index.tsx       redirection register/dex
    register.tsx    inscription (pseudo, emoji, couleur) → /dex
    dex.tsx         Pokédex grille 3 colonnes
    card/[id].tsx   fiche carte + bouton « Photographier »
    duo-camera.tsx  caméra selfie → photo de duo
    scan-friend.tsx scan QR joueur → carte
    scan-stand.tsx  scan QR stand → recharge
    my-card.tsx     ma carte + QR + stats + mes photos
    admin.tsx       édition fenêtre de jeu annuelle
  components/     CardVisual, PlayerCard, DexHeader, WindowBanner, ScannerShell
  data/           mockPlayers.ts (24 joueurs de démo, 8 duos pré-liés)
  hooks/          useNow.ts (horloge rafraîchie)
  services/       game.ts (états de carte, addDuoPhoto), storage.ts (AsyncStorage)
  store/          DexContext.tsx (cœur de l'app)
  utils/          eventWindow, photoStock, qr, id, reasons
  config.ts       valeurs par défaut + stands + préfixes QR
  theme.ts        palette
preview/          canvas.html (canva autonome) + gen_canvas.py + canvas.png
scripts/          smoke.ts (tests métier Node)
```

## Configuration admin (chaque année)

Depuis l'écran d'inscription (« ⚙️ Admin ») ou « Ma carte » : nom/édition de l'événement,
`startDate`/`endDate` au format `AAAA-MM-JJ` (début ≤ fin), `openHour` (0–23) < `closeHour` (1–24),
`freePhotosPerMorning` et `qrRechargeAmount` (entiers ≥ 0). Tout est validé puis persisté dans
AsyncStorage (`art2dex/state/v1`) — **aucune date n'est codée en dur dans l'app**.

Valeurs par défaut (`src/config.ts`) : Art2Play 2025, du 2025-10-25 au 2025-10-26, 9h00–19h00, 5 photos/matin, +5 par QR de stand.

## Synchro backend (future)

L'état local (AsyncStorage) est isolé dans `src/services/storage.ts` (`loadState`/`saveState`, clé `art2dex/state/v1`) :
remplacer ces deux fonctions par des appels **Supabase** ou **Firebase** (Firestore) synchronise tout le dex
(cartes, photos, stock, scans de stands, config admin) entre les appareils, sans toucher au reste de l'app.
Les photos (`uri`) seraient uploadées vers un bucket (Supabase Storage / Firebase Storage) et remplacées par des URLs publiques.

## Hypothèses

- Mode démo hors ligne : 24 joueurs fictifs (`src/data/mockPlayers.ts`) ; en prod, remplacés par la synchro backend.
- Les photos de démo ont `uri: null` et utilisent une tuile emoji ; une vraie photo de duo stocke l'`uri` caméra.
- Une seule preview caméra active à la fois (navigation `router.replace` entre écrans caméra).
- Grisé des cartes via overlay `rgba(140,145,152,0.78)` (pas de filtre Image en RN core).
