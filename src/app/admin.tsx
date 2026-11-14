import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { useDex } from '../store/DexContext';
import { colors, radius } from '../theme';
import type { EventConfig } from '../types';
import { windowInfo } from '../utils/eventWindow';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function Admin() {
  const { event, game, saveEventConfig, saveGameConfig } = useDex();
  const now = useNow();

  const [name, setName] = useState(event.name);
  const [edition, setEdition] = useState(event.edition);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [openHour, setOpenHour] = useState(String(event.openHour));
  const [closeHour, setCloseHour] = useState(String(event.closeHour));
  const [freePhotos, setFreePhotos] = useState(String(game.freePhotosPerMorning));
  const [qrAmount, setQrAmount] = useState(String(game.qrRechargeAmount));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(false);
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      setError('Les dates doivent être au format AAAA-MM-JJ.');
      return;
    }
    if (startDate > endDate) {
      setError('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }
    const oh = Number(openHour);
    const ch = Number(closeHour);
    if (!Number.isInteger(oh) || oh < 0 || oh > 23) {
      setError("L’heure d’ouverture doit être un entier entre 0 et 23.");
      return;
    }
    if (!Number.isInteger(ch) || ch < 1 || ch > 24) {
      setError("L’heure de fermeture doit être un entier entre 1 et 24.");
      return;
    }
    if (oh >= ch) {
      setError("L’heure d’ouverture doit être strictement inférieure à l’heure de fermeture.");
      return;
    }
    const fp = Number(freePhotos);
    const qa = Number(qrAmount);
    if (!Number.isInteger(fp) || fp < 0) {
      setError('Le nombre de photos offertes doit être un entier positif ou nul.');
      return;
    }
    if (!Number.isInteger(qa) || qa < 0) {
      setError('Le montant de recharge QR doit être un entier positif ou nul.');
      return;
    }
    setError(null);
    const nextEvent: EventConfig = { name: name.trim() || event.name, edition: edition.trim(), startDate, endDate, openHour: oh, closeHour: ch };
    saveEventConfig(nextEvent);
    saveGameConfig({ freePhotosPerMorning: fp, qrRechargeAmount: qa });
    setSaved(true);
  };

  const preview = windowInfo(now, { ...event, name, edition, startDate, endDate, openHour: Number(openHour) || 0, closeHour: Number(closeHour) || 0 });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>⚙️ Admin</Text>
      <Text style={styles.subtitle}>Règle ici la fenêtre de jeu de l’édition annuelle (aucune date codée en dur dans l’app).</Text>

      <Text style={styles.label}>Nom de l’événement</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Art2Play" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Édition</Text>
      <TextInput style={styles.input} value={edition} onChangeText={setEdition} placeholder="2025" placeholderTextColor={colors.muted} keyboardType="numeric" />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Date de début (AAAA-MM-JJ)</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2025-10-25" placeholderTextColor={colors.muted} autoCapitalize="none" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Date de fin (AAAA-MM-JJ)</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2025-10-26" placeholderTextColor={colors.muted} autoCapitalize="none" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Ouverture (heure, 0-23)</Text>
          <TextInput style={styles.input} value={openHour} onChangeText={setOpenHour} placeholder="9" placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Fermeture (heure, 1-24)</Text>
          <TextInput style={styles.input} value={closeHour} onChangeText={setCloseHour} placeholder="19" placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Photos offertes / matin</Text>
          <TextInput style={styles.input} value={freePhotos} onChangeText={setFreePhotos} placeholder="5" placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Recharge QR stand (+photos)</Text>
          <TextInput style={styles.input} value={qrAmount} onChangeText={setQrAmount} placeholder="5" placeholderTextColor={colors.muted} keyboardType="numeric" />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>✅ Enregistré</Text> : null}

      <TouchableOpacity style={styles.cta} onPress={save}>
        <Text style={styles.ctaText}>Enregistrer</Text>
      </TouchableOpacity>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>État actuel de la fenêtre (avec ces valeurs) :</Text>
        <Text style={[styles.previewValue, { color: preview.open ? colors.green : colors.danger }]}>
          {preview.label} — {preview.detail}
        </Text>
      </View>

      <Link href="/register" style={styles.backLink}>
        <Text style={styles.backText}>← Retour</Text>
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
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 19,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontWeight: '600',
    fontSize: 13,
  },
  saved: {
    color: colors.green,
    marginTop: 14,
    fontWeight: '800',
    fontSize: 14,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.btn,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  preview: {
    marginTop: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.btn,
    padding: 12,
    gap: 4,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  previewValue: {
    fontWeight: '700',
    fontSize: 13,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 24,
  },
  backText: {
    color: colors.muted,
    fontSize: 13,
  },
});
