import React, { useCallback, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { profileApi } from '@/services/profileApi';

const pending = new Map<string, Promise<string | null>>();

function loadAvatar(userId: string, isCurrentUser: boolean) {
  const key = isCurrentUser ? 'me:' + userId : userId;
  const existing = pending.get(key);
  if (existing) return existing;

  const request = profileApi.getAvatarUrl(userId, isCurrentUser).catch(() => null);
  pending.set(key, request);
  void request.then(() => {
    setTimeout(() => pending.delete(key), 60_000);
  });
  return request;
}

export function ProfileAvatar({ userId, currentUserId, style, children }: {
  userId?: string | null;
  currentUserId?: string | null;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [photo, setPhoto] = useState<{ userId: string; uri: string } | null>(null);
  const [failedPhoto, setFailedPhoto] = useState<typeof photo>(null);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    let active = true;
    void loadAvatar(userId, userId === currentUserId).then((uri) => {
      if (active) setPhoto(uri ? { userId, uri } : null);
    });
    return () => { active = false; };
  }, [userId, currentUserId]));

  const visiblePhoto = photo?.userId === userId && photo !== failedPhoto ? photo : null;
  return (
    <View style={[style, styles.frame]} accessible={false}>
      {children}
      {visiblePhoto && (
        <Image
          source={{ uri: visiblePhoto.uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailedPhoto(visiblePhoto)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});