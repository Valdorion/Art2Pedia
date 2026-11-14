import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import type { EventConfig } from '../types';
import { windowInfo } from '../utils/eventWindow';

type BannerProps = {
  now: Date;
  event: EventConfig;
};

export function WindowBanner({ now, event }: BannerProps) {
  const info = windowInfo(now, event);
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: info.open ? 'rgba(63,185,80,0.16)' : 'rgba(248,81,73,0.14)',
          borderColor: info.open ? colors.green : colors.danger,
        },
      ]}
    >
      <Text style={[styles.bannerLabel, { color: info.open ? colors.green : colors.danger }]}>{info.label}</Text>
      <Text style={styles.bannerDetail}>{info.detail}</Text>
    </View>
  );
}

export function DexHeader() {
  const { players, me, stock, event, game, capturedCount } = useDex();
  const now = useNow();
  const total = players.filter((p) => p.id !== me?.id).length;
  const effStock = stock.stock;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Pokédex</Text>
          <Text style={styles.subtitle}>
            {capturedCount} / {total} cartes capturées
          </Text>
        </View>
        <View style={[styles.stockPill, effStock === 0 && styles.stockPillEmpty]}>
          <Text style={styles.stockText}>📸 {effStock}</Text>
        </View>
      </View>
      <WindowBanner now={now} event={event} />
      <View style={styles.actions}>
        <Link href="/scan-friend" style={[styles.actionBtn, styles.actionPrimary]}>
          <Text style={styles.actionTextDark}>Scanner un ami</Text>
        </Link>
        <Link href="/scan-stand" style={[styles.actionBtn, styles.actionBtn2]}>
          <Text style={styles.actionText}>Stand (+{game.qrRechargeAmount})</Text>
        </Link>
        <Link href="/my-card" style={[styles.actionBtn, styles.actionBtn2]}>
          <Text style={styles.actionText}>Ma carte</Text>
        </Link>
      </View>
      <Text style={styles.rules}>
        Règles : {game.freePhotosPerMorning} photos offertes chaque matin d’événement, +{game.qrRechargeAmount} par QR de stand
        ({game.maxScansPerStandPerDay} scan/stand/jour). Jeu actif du {event.startDate} au {event.endDate}, de {event.openHour}h00 à{' '}
        {event.closeHour}h00. Une photo de duo capture la carte des 2 joueurs.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 56,
    paddingBottom: 10,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  stockPill: {
    backgroundColor: colors.panel2,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stockPillEmpty: {
    borderColor: colors.red,
  },
  stockText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.btn,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: colors.yellow,
  },
  actionBtn2: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  actionTextDark: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  rules: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  banner: {
    borderWidth: 1,
    borderRadius: radius.btn,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerLabel: {
    fontWeight: '800',
    fontSize: 13,
  },
  bannerDetail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
