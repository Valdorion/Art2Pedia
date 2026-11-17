import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { CardView, Player } from '../types';
import { CardVisual } from './CardVisual';

type Props = {
  player: Player;
  view: CardView;
};

export function PlayerCard({ player, view }: Props) {
  return (
    <View style={styles.cell}>
      <CardVisual player={player} view={view} />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1 / 3,
    padding: 5,
    maxWidth: '33.3334%',
  },
});
