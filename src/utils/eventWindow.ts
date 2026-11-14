import { DEFAULT_EVENT } from '../config';
import type { EventConfig } from '../types';

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isEventDay(now = new Date(), cfg: EventConfig = DEFAULT_EVENT): boolean {
  const key = dayKey(now);
  return key >= cfg.startDate && key <= cfg.endDate;
}

export function isPlayWindow(now = new Date(), cfg: EventConfig = DEFAULT_EVENT): boolean {
  if (!isEventDay(now, cfg)) return false;
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= cfg.openHour && h < cfg.closeHour;
}

export type WindowInfo = { open: boolean; isEventDay: boolean; label: string; detail: string };

export function windowInfo(now = new Date(), cfg: EventConfig = DEFAULT_EVENT): WindowInfo {
  const open = isPlayWindow(now, cfg);
  const eventDay = isEventDay(now, cfg);
  if (open) return { open, isEventDay: eventDay, label: 'Fenêtre de jeu ouverte', detail: `Jusqu'à ${cfg.closeHour}h00` };
  if (eventDay) {
    if (now.getHours() < cfg.openHour)
      return { open, isEventDay: eventDay, label: "Le salon ouvre bientôt", detail: `Le jeu ouvre à ${cfg.openHour}h00` };
    return { open, isEventDay: eventDay, label: 'Le salon est fermé', detail: `Reprise demain à ${cfg.openHour}h00` };
  }
  return {
    open,
    isEventDay: eventDay,
    label: "Hors événement",
    detail: `Le jeu n'est actif que du ${cfg.startDate} au ${cfg.endDate}, de ${cfg.openHour}h00 à ${cfg.closeHour}h00`,
  };
}
