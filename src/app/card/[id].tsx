import { Link, router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardVisual } from '../../components/CardVisual';
import { WindowBanner } from '../../components/DexHeader';
import { useNow } from '../../hooks/useNow';
import { useDex } from '../../store/DexContext';
import { colors, radius } from '../../theme';
import { isPlayWindow } from '../../utils/eventWindow';
import { effectiveStock } from '../../utils/photoStock';
import { reasonText } from '../../utils/reasons';

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { players, cardViewOf, stock, event, game } = useDex();
  const now = useNow();

  const player = players.find((p) => p.id === id);
  if (!player) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Joueur introuvable.</Text>
        <Link href="/dex" style={styles.backLink}>
          <Text style={styles.backText}>← Retour au Pokédex</Text>
        </Link>
      </View>
    );
  }

  const view = cardViewOf(player);
  const open = isPlayWindow(now, event);
  const eff = effectiveStock(stock, now, game, event).stock;
  const canShoot = open && eff > 0;
  const reason = !open ? 'hors-fenetre' : eff <= 0 ? 'stock-vide' : undefined;

  const statusText =
    view.status === 'captured'
      ? '★ Capturée ! Tu as pris une photo de duo avec ce joueur : sa carte passe en couleur.'
      : view.status === 'seen'
        ? 'Vue : déjà photographiée par quelqu’un d’autre (pas avec toi). Sa dernière photo reste grisée.'
        : 'Inconnue : ce joueur n’a jamais été photographié. Carte grisée.';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{view.status === 'captured' ? player.pseudo : '?????'}</Text>
      <CardVisual player={player} view={view} large />
      <Text style={styles.status}>{statusText}</Text>
      <WindowBanner now={now} event={event} />
      <TouchableOpacity
        style={[styles.cta, !canShoot && styles.ctaDisabled]}
        disabled={!canShoot}
        onPress={() => router.push({ pathname: '/duo-camera', params: { target: player.id } })}
      >
        <Text style={styles.ctaText}>📸 Photographier {player.pseudo}</Text>
      </TouchableOpacity>
      {reason ? <Text style={styles.reason}>{reasonText(reason)}</Text> : null}
      <Link href="/dex" style={styles.backLink}>
        <Text style={styles.backText}>← Retour au Pokédex</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  status: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  muted: {
    color: colors.muted,
  },
  cta: {
    backgroundColor: colors.red,
    borderRadius: radius.btn,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  reason: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 6,
  },
  backText: {
    color: colors.muted,
    fontSize: 13,
  },
});
