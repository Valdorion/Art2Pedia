# Tutoriel — tester Art2Dex en local sur un PC

Ce guide explique comment lancer et tester l’app **Art2Dex** (Expo React Native, SDK 58) sur un PC Windows / macOS / Linux, sans Mac ni build cloud.

## 1. Prérequis

| Outil | Pourquoi | Vérification |
|---|---|---|
| Node.js ≥ 20 (v22 LTS recommandé) + npm 10+ | runtime de l’app | `node -v` / `npm -v` |
| Git | cloner le projet | `git --version` |
| **Expo Go** sur un téléphone Android ou iOS (recommandé) | lancer l’app sans rien compiler | app store « Expo Go », version à jour |
| OU émulateur Android (Android Studio) | tester sur PC sans téléphone | `adb devices` doit lister l’émulateur |

> La caméra et le scan QR fonctionnent dans **Expo Go** (aucun dev build nécessaire). Sur PC sans téléphone, un émulateur Android fait l’affaire pour tout sauf le scan de QR (voir §6).

## 2. Récupérer le projet

```bash
git clone https://github.com/Valdorion/Art2Pedia.git
cd Art2Pedia
git checkout feat/art2dex-pokedex
npm install
```

## 3. Lancer l’app

```bash
npx expo start
```

Dans le terminal Metro :

- touche **`a`** → ouvre l’app sur l’émulateur Android connecté,
- ou scanne le **QR code** affiché avec l’app **Expo Go** du téléphone (PC et téléphone sur le même Wi-Fi),
- touche **`w`** → version web dans le navigateur (sans caméra, utile pour voir le dex et l’admin).

Alternative « build natif » (si Expo Go pose souci) :

```bash
npx expo run:android   # compile et installe sur l’émulateur/appareil connecté
```

## 4. Vérifications rapides (sans lancer l’UI)

```bash
npm test           # smoke tests métier → affiche « ✅ smoke tests OK »
npm run typecheck  # tsc --noEmit, doit être silencieux
npm run lint       # expo lint, 0 erreur
```

## 5. Premier parcours de test

1. **Inscription** : au premier lancement, écran « Créer ma carte 🪪 » → pseudo (min 2 caractères), choisis un emoji et une couleur → « Créer ma carte 🪪 » → tu arrives sur le **Pokédex** (grille 3 colonnes, 24 joueurs de démo : cartes « ??? » grises, « Vues » grises avec photo, quelques-unes déjà « ★ Capturées » via les duos de démo).
2. **Ouvrir la fenêtre de jeu** : par défaut le jeu est actif uniquement le **2025-10-25/26 de 9h à 19h**, donc la bannière est rouge « Hors événement ». Va sur **⚙️ Admin** (lien en bas de l’écran d’inscription ou sur « Ma carte »), mets :
   - `startDate` = `endDate` = **aujourd’hui** au format `AAAA-MM-JJ` (ex. `2026-11-14`),
   - ouverture `0`, fermeture `24`,
   - laisse `5` photos/matin et `+5` recharge QR → « Enregistrer » → `✅ Enregistré`, la bannière passe au vert.
3. **Voir une carte** : touche une carte du dex → fiche avec état (grise « ? », grise + dernière photo, ou capturée en couleur) + bouton « 📸 Photographier ».
4. **Photo de duo** : « 📸 Photographier <pseudo> » → caméra frontale → obturateur rond → la carte des **2 joueurs** passe « ★ Capturée » en couleur et le stock descend (pastille `📸 N` en haut du dex, bord rouge à 0).
5. **Ma carte / QR perso** : bouton « Ma carte » → ta carte, ton **QR personnel** `art2dex://player/<id>`, tes stats et tes photos de duo.
6. **Scanner un ami** (besoin d’un 2ᵉ appareil, ou d’un QR imprimé) : « Scanner un ami » → scanne le QR perso de l’autre joueur → sa carte s’ouvre directement.
7. **Recharger au stand** : « Stand (+5) » → scanne un QR `art2dex://stand/<id>` → alerte « +5 photos » → retour au dex. 1 seul scan par stand et par jour ; refusé hors fenêtre de jeu.
8. **Stock vide** : après avoir pris 5 photos, le bouton « Photographier » est désactivé avec la raison « Stock de photos vide : scanne un QR sur un stand du salon pour recharger. »

## 6. Générer un QR de stand à scanner (test)

Dans un terminal, à la racine du projet :

```bash
npx tsx -e "import { standQr } from './src/utils/qr'; console.log(standQr('stand-accueil'))"
# → art2dex://stand/stand-accueil
```

Colle ce texte dans un générateur de QR en ligne (ex. qrcode-monkey) et **imprime-le** ou affiche-le sur un autre écran, puis scanne-le depuis l’écran « Stand (+5) ». Les 5 stands valides : `stand-accueil`, `stand-artistes`, `stand-jeux-indes`, `stand-cosplay`, `stand-restauration`.

## 7. Voir le canva des 7 écrans

Ouvre simplement **`preview/canvas.html`** dans un navigateur (aucune install). Le PNG statique est dans `preview/canvas.png` ; pour le régénérer : `python3 preview/gen_canvas.py` (nécessite `pip install pillow`).

## 8. Où tester quoi

| Écran | Expo Go (téléphone) | Émulateur Android | Web (`w`) |
|---|---|---|---|
| Inscription, Pokédex, fiche carte, ma carte, admin | ✅ | ✅ | ✅ |
| Caméra photo de duo | ✅ | ✅ (caméra virtuelle) | ❌ pas de caméra |
| Scan QR ami / stand | ✅ (QR imprimé ou 2ᵉ écran) | ⚠️ photo sans QR réel | ❌ |

## 9. Dépannage

- **Port 8081 occupé** : `npx expo start --port 8082`
- **Métro capricieux / cache** : `npx expo start -c`
- **« SDK incompatible » dans Expo Go** : mettre l’app Expo Go à jour (elle doit supporter SDK 58)
- **Diagnostic général** : `npx expo-doctor`
- **Windows : `adb` non reconnu** : ajouter `C:\Users\<toi>\AppData\Local\Android\Sdk\platform-tools` au PATH
- **L’émulateur n’a pas de caméra** : teste les écrans caméra/QR sur un vrai téléphone avec Expo Go
- **La fenêtre de jeu est fermée** : c’est normal hors dates admin → regla dans ⚙️ Admin (les valeurs sont persistées dans AsyncStorage, elles survivent au redémarrage ; pour repartir à zéro, vide le cache de l’app Expo Go)
