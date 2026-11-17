import { Link } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DexHeader } from '../components/DexHeader';
import { PlayerCard } from '../components/PlayerCard';
import { useDex } from '../store/DexContext';
import { colors } from '../theme';
import type { Player } from '../types';

export default function Dex() {
  const { players, me, cardViewOf } = useDex();
  const others = players.filter((p) => p.id !== me?.id);

  return (
    <View style={styles.container}>
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={<DexHeader />}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: Player }) => (
          <Link href={{ pathname: '/card/[id]', params: { id: item.id } }} asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <PlayerCard player={item} view={cardViewOf(item)} />
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    paddingBottom: 40,
  },
});
