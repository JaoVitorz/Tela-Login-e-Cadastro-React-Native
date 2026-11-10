import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPostsErrorMessage, postsApi } from '@/services/postsApi';
import { colors } from '@/theme/colors';
import type { CommunityPost } from '@/types/posts';

export function ProfilePosts({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  const load = useCallback(
    async (nextPage = 1) => {
      const version = ++requestVersion.current;
      setLoading(true);
      setError('');
      if (nextPage === 1) setPosts([]);
      try {
        const response = await postsApi.listByAuthor(userId, nextPage, 10);
        if (version !== requestVersion.current) return;
        setPosts((current) =>
          nextPage === 1
            ? response.data
            : [
                ...current,
                ...response.data.filter(
                  (post) => !current.some((existing) => existing._id === post._id),
                ),
              ],
        );
        setPage(nextPage);
        setHasMore(nextPage < response.pagination.pages);
      } catch (error) {
        if (version === requestVersion.current) setError(getPostsErrorMessage(error));
      } finally {
        if (version === requestVersion.current) setLoading(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestVersion.current++;
      };
    }, [load]),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Publicações</Text>
      {posts.map((post) => (
        <View key={post._id} style={styles.post}>
          <Text style={styles.title}>{post.titulo}</Text>
          {!!post.descricao && <Text style={styles.text}>{post.descricao}</Text>}
          {!!post.imagem?.url && (
            <Image
              source={{ uri: post.imagem.url }}
              resizeMode="cover"
              style={styles.image}
              accessibilityLabel={`Imagem da publicação ${post.titulo}`}
            />
          )}
          <Text style={styles.meta}>
            {post.likes.length} curtidas · {post.comentarios.length} comentários
          </Text>
        </View>
      ))}
      {loading && (
        <ActivityIndicator color={colors.action} accessibilityLabel="Carregando publicações" />
      )}
      {!loading && !error && !posts.length && (
        <Text style={styles.text}>Nenhuma publicação ainda.</Text>
      )}
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => void load(posts.length ? page + 1 : 1)}
          >
            <Text style={styles.link}>Tentar novamente</Text>
          </Pressable>
        </>
      )}
      {hasMore && !error && (
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void load(page + 1)}
        >
          <Text style={styles.link}>Carregar mais publicações</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, marginTop: 9, padding: 16, gap: 13 },
  heading: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  post: { gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  title: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  text: { fontSize: 14, color: colors.loginMuted, lineHeight: 22 },
  image: { width: '100%', height: 220, borderRadius: 10 },
  meta: { fontSize: 12, color: colors.textMuted },
  error: { color: colors.errorText, lineHeight: 22 },
  link: { color: colors.action, fontWeight: '700', paddingVertical: 10 },
});
