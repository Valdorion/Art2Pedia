#!/usr/bin/env python3
"""Régénère preview/canvas.png (1680x2120, mode RGB) : 7 maquettes de téléphones + légende des règles."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1680, 2120
BG = (14, 17, 22)
PANEL = (23, 28, 36)
PANEL2 = (31, 38, 48)
BORDER = (42, 49, 59)
RED = (227, 53, 13)
YELLOW = (255, 203, 5)
TEXT = (242, 245, 247)
MUTED = (154, 163, 173)
GREEN = (63, 185, 80)
DANGER = (248, 81, 73)
PAPER = (245, 239, 217)
INK = (20, 20, 20)
GREY_OVERLAY = (140, 145, 152)

PHONE_W, PHONE_H = 320, 640
GAP = 40
MARGIN = 60
COLS = 3

FONT = ImageFont.load_default()
FONT_B = ImageFont.load_default()


def font(size, bold=False):
    for name in ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf") if bold else ("DejaVuSans.ttf",):
        for root in ("/usr/share/fonts", "/usr/local/share/fonts"):
            p = Path(root) / "truetype" / "dejavu" / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return FONT_B if bold else FONT


def text(d, xy, s, fill=TEXT, size=14, bold=False, anchor=None):
    d.text(xy, s, fill=fill, font=font(size, bold), anchor=anchor)


def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def phone(d, x, y, draw_screen):
    rrect(d, (x, y, x + PHONE_W, y + PHONE_H), 28, fill=(5, 7, 10), outline=BORDER, width=3)
    d.rounded_rectangle((x + 110, y + 8, x + 210, y + 24), radius=8, fill=(5, 7, 10))
    draw_screen(d, x, y)


def screen_bg(d, x, y):
    d.rectangle((x + 3, y + 28, x + PHONE_W - 3, y + PHONE_H - 3), fill=BG)


def card(d, x, y, w, h, header_color, name, tag, emoji, grey=False, q=False, badge=False, big=False):
    rrect(d, (x, y, x + w, y + h), 12, fill=PAPER, outline=BORDER, width=2)
    hh = 30 if not big else 38
    d.rounded_rectangle((x, y, x + w, y + hh), radius=12, fill=header_color)
    d.rectangle((x, y + hh - 12, x + w, y + hh), fill=header_color)
    text(d, (x + 10, y + hh / 2), name, fill=(255, 255, 255), size=11 if not big else 14, bold=True, anchor="lm")
    tw = 8 * len(tag) + 16
    rrect(d, (x + w - tw - 8, y + hh / 2 - 9, x + w - 8, y + hh / 2 + 9), 999, fill=(0, 0, 0, 90))
    text(d, (x + w - tw / 2 - 8, y + hh / 2), tag, fill=(255, 255, 255), size=9 if not big else 11, anchor="mm")
    ph = h - hh - 42 if not big else h - hh - 52
    py = y + hh + 7
    d.rounded_rectangle((x + 7, py, x + w - 7, py + ph), radius=8, fill=(231, 223, 200))
    text(d, (x + w / 2, py + ph / 2), emoji, fill=INK, size=34 if not big else 74, anchor="mm")
    if grey:
        d.rounded_rectangle((x + 7, py, x + w - 7, py + ph), radius=8, fill=(*GREY_OVERLAY, 200))
        if q:
            text(d, (x + w / 2, py + ph / 2), "?", fill=(20, 20, 20), size=40 if not big else 84, bold=True, anchor="mm")
    if badge:
        bw = 62
        rrect(d, (x + w - bw - 12, py + 8, x + w - 12, py + 26), 999, fill=YELLOW, outline=INK, width=2)
        text(d, (x + w - bw / 2 - 12, py + 17), "CAPTURÉ", fill=INK, size=8, bold=True, anchor="mm")
    fy = y + h - 26
    text(d, (x + 10, fy + 8), "Type : Convention", fill=INK, size=9 if not big else 11, anchor="lm")
    text(d, (x + w - 10, fy + 8), "PV 30", fill=(168, 38, 6), size=10 if not big else 12, bold=True, anchor="rm")


def banner(d, x, y, w, ok, label, detail):
    col = GREEN if ok else DANGER
    rrect(d, (x, y, x + w, y + 40), 10, outline=col, width=1, fill=(*col, 40))
    text(d, (x + 10, y + 12), label, fill=col, size=11, bold=True)
    text(d, (x + 10, y + 27), detail, fill=MUTED, size=9)


def scr_register(d, x, y):
    screen_bg(d, x, y)
    s = x + 16
    text(d, (s, y + 44), "Art2Dex", fill=RED, size=30, bold=True)
    text(d, (s, y + 84), "Le Pokédex de la convention Art2Play 2025.", fill=MUTED, size=10)
    text(d, (s, y + 116), "Pseudo", fill=TEXT, size=11, bold=True)
    rrect(d, (s, y + 132, x + PHONE_W - 16, y + 162), 10, fill=PANEL, outline=BORDER)
    text(d, (s + 10, y + 147), "PikaNoob", fill=TEXT, size=12, anchor="lm")
    text(d, (s, y + 176), "Avatar", fill=TEXT, size=11, bold=True)
    emojis = ["⚡", "🧢", "🔥", "💧", "🪨", "😼", "🦊", "🧬", "🍄", "🌸"]
    for i, e in enumerate(emojis):
        cx = s + (i % 5) * 56
        cy = y + 194 + (i // 5) * 40
        rrect(d, (cx, cy, cx + 44, cy + 34), 8, fill=PANEL, outline=YELLOW if i == 0 else BORDER, width=2)
        text(d, (cx + 22, cy + 17), e, fill=TEXT, size=15, anchor="mm")
    text(d, (s, y + 286), "Couleur de carte", fill=TEXT, size=11, bold=True)
    cols = [RED, YELLOW, (59, 76, 202), GREEN, (255, 122, 26), (176, 101, 201), (78, 165, 217), TEXT]
    for i, c in enumerate(cols):
        cx = s + i * 34
        cy = y + 302
        d.ellipse((cx, cy, cx + 26, cy + 26), fill=c, outline=TEXT if i == 0 else None, width=3)
    rrect(d, (s, y + PHONE_H - 92, x + PHONE_W - 16, y + PHONE_H - 52), 10, fill=RED)
    text(d, (x + PHONE_W / 2, y + PHONE_H - 72), "Créer ma carte 🪪", fill=(255, 255, 255), size=13, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + PHONE_H - 32), "⚙️ Admin", fill=MUTED, size=10, anchor="mm")


def scr_dex(d, x, y):
    screen_bg(d, x, y)
    s = x + 14
    text(d, (s, y + 44), "Pokédex", fill=TEXT, size=24, bold=True)
    text(d, (s, y + 74), "3 / 24 cartes capturées", fill=MUTED, size=10)
    rrect(d, (x + PHONE_W - 76, y + 44, x + PHONE_W - 14, y + 72), 999, fill=PANEL2, outline=BORDER, width=2)
    text(d, (x + PHONE_W - 45, y + 58), "📸 5", fill=TEXT, size=12, bold=True, anchor="mm")
    banner(d, s, y + 88, PHONE_W - 28, True, "Fenêtre de jeu ouverte", "Jusqu'à 19h00")
    bw = (PHONE_W - 28 - 12) // 3
    for i, (lbl, fill, tc) in enumerate([("Scanner un ami", YELLOW, INK), ("Stand (+5)", PANEL2, TEXT), ("Ma carte", PANEL2, TEXT)]):
        bx = s + i * (bw + 6)
        rrect(d, (bx, y + 140, bx + bw, y + 166), 8, fill=fill, outline=BORDER if fill == PANEL2 else None)
        text(d, (bx + bw / 2, y + 153), lbl, fill=tc, size=8, bold=True, anchor="mm")
    cells = [
        ((255, 203, 5), "?????", "???", "🦊", True, True, False),
        ((59, 76, 202), "?????", "Vu", "🤝", True, False, False),
        ((227, 53, 13), "MarioKart8", "★ Capturé", "🍖", False, False, True),
        ((63, 185, 80), "?????", "???", "🌱", True, True, False),
        ((255, 122, 26), "?????", "Vu", "🔥", True, False, False),
        ((176, 101, 201), "Kakarotto", "★ Capturé", "🐉", False, False, True),
        ((45, 108, 223), "?????", "???", "💨", True, True, False),
        ((201, 167, 232), "?????", "???", "🧬", True, True, False),
        ((247, 168, 196), "?????", "Vu", "🏆", True, False, False),
    ]
    cw = (PHONE_W - 28 - 12) // 3
    ch = 118
    for i, (hc, nm, tg, em, grey, q, badge) in enumerate(cells):
        cx = s + (i % 3) * (cw + 6)
        cy = y + 178 + (i // 3) * (ch + 6)
        card(d, cx, cy, cw, ch, hc, nm, tg, em, grey=grey, q=q, badge=badge)


def scr_card(d, x, y, captured):
    screen_bg(d, x, y)
    s = x + 16
    name = "MarioKart8" if captured else "?????"
    text(d, (x + PHONE_W / 2, y + 48), name, fill=TEXT, size=20, bold=True, anchor="mm")
    hc = RED if captured else (59, 76, 202)
    tag = "★ Capturé" if captured else "Vu"
    card(d, s, y + 72, PHONE_W - 32, 250, hc, name, tag, "🍖" if captured else "🤝", grey=not captured, badge=captured, big=True)
    msg = "★ Capturée ! Photo de duo avec toi : la carte passe en couleur." if captured else "Vue : déjà photographiée (pas avec toi). Dernière photo grisée."
    text(d, (x + PHONE_W / 2, y + 336), msg, fill=MUTED, size=9, anchor="mm")
    banner(d, s, y + 380, PHONE_W - 32, True, "Fenêtre de jeu ouverte", "Jusqu'à 19h00")
    rrect(d, (s, y + PHONE_H - 120, x + PHONE_W - 16, y + PHONE_H - 80), 10, fill=RED)
    text(d, (x + PHONE_W / 2, y + PHONE_H - 100), "📸 Photographier " + name, fill=(255, 255, 255), size=12, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + PHONE_H - 46), "← Retour au Pokédex", fill=MUTED, size=10, anchor="mm")


def scr_camera(d, x, y):
    screen_bg(d, x, y)
    g = d  # gradient simulé
    for i in range(0, PHONE_H - 28):
        t = i / (PHONE_H - 28)
        g.line((x + 3, y + 28 + i, x + PHONE_W - 3, y + 28 + i), fill=(int(35 - 20 * t), int(48 - 30 * t), int(67 - 45 * t)))
    text(d, (x + PHONE_W / 2, y + 52), "Photo avec MarioKart8", fill=(255, 255, 255), size=13, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + 74), "📸 4 restantes", fill=YELLOW, size=11, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + 300), "🙂", fill=TEXT, size=90, anchor="mm")
    rrect(d, (x + 40, y + 130, x + PHONE_W - 40, y + 420), 10, outline=YELLOW, width=4)
    d.ellipse((x + PHONE_W / 2 - 34, y + PHONE_H - 96, x + PHONE_W / 2 + 34, y + PHONE_H - 28), fill=RED, outline=(255, 255, 255), width=4)
    text(d, (x + PHONE_W / 2, y + PHONE_H - 62), "📸", fill=TEXT, size=20, anchor="mm")


def scr_stand(d, x, y):
    screen_bg(d, x, y)
    for i in range(0, 440):
        t = i / 440
        d.line((x + 3, y + 28 + i, x + PHONE_W - 3, y + 28 + i), fill=(int(35 - 20 * t), int(48 - 30 * t), int(67 - 45 * t)))
    text(d, (x + PHONE_W / 2, y + 52), "Recharge stand", fill=(255, 255, 255), size=13, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + 74), "+5 photos par QR de stand", fill=YELLOW, size=10, bold=True, anchor="mm")
    rrect(d, (x + 40, y + 110, x + PHONE_W - 40, y + 330), 10, outline=YELLOW, width=4)
    text(d, (x + PHONE_W / 2, y + 380), "Scanne le QR d’un stand du salon", fill=(255, 255, 255), size=9, anchor="mm")
    banner(d, x + 14, y + PHONE_H - 130, PHONE_W - 28, True, "🔋 Stand scanné : +5 photos", "Nouveau stock : 📸 9")


def scr_admin(d, x, y):
    screen_bg(d, x, y)
    s = x + 16
    text(d, (s, y + 44), "⚙️ Admin", fill=TEXT, size=22, bold=True)
    text(d, (s, y + 76), "Fenêtre de jeu de l’édition annuelle (pas de dates en dur).", fill=MUTED, size=9)
    text(d, (s, y + 106), "Édition", fill=TEXT, size=11, bold=True)
    rrect(d, (s, y + 122, x + PHONE_W - 16, y + 150), 10, fill=PANEL, outline=BORDER)
    text(d, (s + 10, y + 136), "2026", fill=TEXT, size=12, anchor="lm")
    half = (PHONE_W - 32 - 10) // 2
    for i, (lbl, val) in enumerate([("Début (AAAA-MM-JJ)", "2026-10-24"), ("Fin (AAAA-MM-JJ)", "2026-10-25")]):
        bx = s + i * (half + 10)
        text(d, (bx, y + 164), lbl, fill=TEXT, size=9, bold=True)
        rrect(d, (bx, y + 178, bx + half, y + 206), 10, fill=PANEL, outline=BORDER)
        text(d, (bx + 10, y + 192), val, fill=TEXT, size=10, anchor="lm")
    for i, (lbl, val) in enumerate([("Ouverture (0-23)", "10"), ("Fermeture (1-24)", "18")]):
        bx = s + i * (half + 10)
        text(d, (bx, y + 220), lbl, fill=TEXT, size=9, bold=True)
        rrect(d, (bx, y + 234, bx + half, y + 262), 10, fill=PANEL, outline=BORDER)
        text(d, (bx + 10, y + 248), val, fill=TEXT, size=11, anchor="lm")
    for i, (lbl, val) in enumerate([("Photos/matin", "5"), ("Recharge QR", "+5")]):
        bx = s + i * (half + 10)
        text(d, (bx, y + 276), lbl, fill=TEXT, size=9, bold=True)
        rrect(d, (bx, y + 290, bx + half, y + 318), 10, fill=PANEL, outline=BORDER)
        text(d, (bx + 10, y + 304), val, fill=TEXT, size=11, anchor="lm")
    rrect(d, (s, y + PHONE_H - 150, x + PHONE_W - 16, y + PHONE_H - 110), 10, fill=GREEN)
    text(d, (x + PHONE_W / 2, y + PHONE_H - 130), "Enregistrer", fill=(255, 255, 255), size=13, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + PHONE_H - 84), "✅ Enregistré", fill=GREEN, size=11, bold=True, anchor="mm")
    text(d, (x + PHONE_W / 2, y + PHONE_H - 40), "← Retour", fill=MUTED, size=10, anchor="mm")


def legend(d, x, y, w, h):
    rrect(d, (x, y, x + w, y + h), 14, fill=PANEL, outline=BORDER)
    text(d, (x + 20, y + 20), "Règles métier implémentées", fill=YELLOW, size=17, bold=True)
    rules = [
        "1. Inscription → carte perso (pseudo, emoji, couleur) + QR art2dex://player/<id>",
        "2. Dex 3 colonnes : jamais photographié = grise « ? » ; vu = grise + dernière photo ;",
        "    duo avec moi = « capturée », photo en couleur (remplace l’ancienne)",
        "3. Photo de duo ajoutée sur les cartes des 2 joueurs, consomme 1 photo de stock",
        "4. Fenêtre de jeu = jours d’événement définis par l’admin (écran /admin, AsyncStorage),",
        "    de openHour à closeHour — aucune date codée en dur",
        "5. Stock : freePhotosPerMorning photos chaque matin d’événement (reset par jour)",
        "6. Recharge +qrRechargeAmount via QR stand (stand-accueil, artistes, jeux indés,",
        "    cosplay, restauration), 1 scan/stand/jour, uniquement dans la fenêtre de jeu",
        "7. Thème Pokémon : Pokédex, ★ Capturé, PV, Type : Convention, rouge #E3350D / jaune #FFCB05",
        "8. QR : scan joueur → sa carte ; scan stand → recharge ; QR invalide → erreur",
    ]
    for i, r in enumerate(rules):
        text(d, (x + 20, y + 52 + i * 24), r, fill=TEXT, size=12)


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")
    text(d, (MARGIN, 36), "Art2Dex — Canva de prévisualisation", fill=TEXT, size=30, bold=True)
    text(d, (MARGIN, 78), "7 maquettes d’écrans Expo React Native — mode Pokédex de l’Art2Play (rouge #E3350D / jaune #FFCB05)", fill=MUTED, size=14)

    top = 120
    positions = [(MARGIN + c * (PHONE_W + GAP), top + r * (PHONE_H + GAP)) for r in range(3) for c in range(COLS)]
    screens = [
        ("1 — Inscription (pseudo + emoji + couleur + QR perso)", scr_register),
        ("2 — Pokédex grille 3x3 (grise ?, grise+photo, capturée)", scr_dex),
        ("3 — Carte capturée (photo couleur + badge ★ Capturé)", lambda d, x, y: scr_card(d, x, y, True)),
        ("4 — Carte « vue » (dernière photo grisée, pseudo masqué)", lambda d, x, y: scr_card(d, x, y, False)),
        ("5 — Caméra duo (viseur + obturateur + stock)", scr_camera),
        ("6 — Stand QR (+5 photos, 1 scan/stand/jour)", scr_stand),
    ]
    for (px, py), (cap, fn) in zip(positions[:6], screens):
        phone(d, px, py, fn)
        text(d, (px + PHONE_W / 2, py + PHONE_H + 10), cap, fill=MUTED, size=12, anchor="mm")

    px, py = positions[6]
    phone(d, px, py, scr_admin)
    text(d, (px + PHONE_W / 2, py + PHONE_H + 10), "7 — Admin (édition, dates AAAA-MM-JJ, horaires, photos, recharge)", fill=MUTED, size=12, anchor="mm")

    lx = positions[7][0]
    ly = positions[7][1]
    legend(d, lx, ly, 2 * PHONE_W + GAP, PHONE_H)

    out = Path(__file__).resolve().parent / "canvas.png"
    img.save(out)
    print(f"✅ {out} ({img.size[0]}x{img.size[1]}, mode {img.mode})")


if __name__ == "__main__":
    main()
