import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { CardView, Player } from '../types';
import { colors, radius } from '../theme';

type Props = {
  player: Player;
  view: CardView;
  large?: boolean;
};

export function CardVisual({ player, view, large = false }: Props) {
  const captured = view.status === 'captured';
  const unknown = view.status === 'unknown';
  const photo = view.photo;
  const pv = 10 + 10 * player.photos.length;
  const tag = captured ? '★ Capturé' : view.status === 'seen' ? 'Vu' : '???';
  const name = captured ? player.pseudo : '?????';

  return (
    <View style={[styles.card, { backgroundColor: colors.cardPaper }, large && styles.cardLarge]}>
      <View style={[styles.header, { backgroundColor: player.color }]}>
        <Text style={styles.pseudo} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <View style={styles.photoZone}>
        {photo?.uri ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.emojiTile, { backgroundColor: `${player.color}33` }]}>
            <Text style={[styles.emoji, large && styles.emojiLarge]}>{photo?.emoji ?? player.emoji}</Text>
          </View>
        )}
        {!captured && (
          <View style={styles.greyOverlay}>
            {unknown && <Text style={[styles.question, large && styles.questionLarge]}>?</Text>}
          </View>
        )}
        {captured && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CAPTURÉ</Text>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerType}>Type : Convention</Text>
        <Text style={styles.footerPv}>PV {pv}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardLarge: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pseudo: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagPill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  photoZone: {
    aspectRatio: 1,
    margin: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E7DFC8',
    position: 'relative',
  },
  photo: {
    ...StyleSheet.absoluteFill,
  },
  emojiTile: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  emojiLarge: {
    fontSize: 96,
  },
  greyOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(140,145,152,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(20,20,20,0.55)',
  },
  questionLarge: {
    fontSize: 120,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  badgeText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  footerType: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  footerPv: {
    color: colors.redDark,
    fontSize: 12,
    fontWeight: '800',
  },
});
