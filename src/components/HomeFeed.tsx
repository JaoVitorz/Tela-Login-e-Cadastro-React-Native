import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Heart, ImagePlus, MessageCircle, PawPrint, Pencil, Trash2, X } from 'lucide-react-native';
import { postsApi, getPostsErrorMessage } from '@/services/postsApi';
import { colors } from '@/theme/colors';
import type { CommunityPost, PostCategory, PostImageUpload } from '@/types/posts';

const PAGE_SIZE = 10;
const categories: Array<{ value: PostCategory; label: string }> = [
  { value: 'outros', label: 'Geral' },
  { value: 'foto', label: 'Foto' },
  { value: 'adocao', label: 'Adoção' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'encontrado', label: 'Encontrado' },
  { value: 'dica', label: 'Dica' },
  { value: 'evento', label: 'Evento' },
];

function showError(message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('Não foi possível concluir', message);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

function PostCard({
  post,
  userId,
  liking,
  commenting,
  onLike,
  onComment,
  onEdit,
  onDelete,
}: {
  post: CommunityPost;
  userId: string | null;
  liking: boolean;
  commenting: boolean;
  onLike: () => void;
  onComment: (text: string) => Promise<boolean>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const liked = !!userId && post.likes.some((id) => String(id) === String(userId));
  const category = categories.find((item) => item.value === post.categoria);

  async function submitComment() {
    const text = commentText.trim();
    if (!text || commenting) return;
    if (await onComment(text)) setCommentText('');
  }

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(post.autor?.nome || 'U').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.author}>{post.autor?.nome || 'Usuário'}</Text>
          <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
        </View>
        {category && post.categoria !== 'outros' ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{category.label}</Text>
          </View>
        ) : null}
        {userId && String(post.autor?.userId) === String(userId) ? (
          <View style={styles.ownerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar publicação"
              onPress={onEdit}
            >
              <Pencil size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir publicação"
              onPress={onDelete}
            >
              <Trash2 size={18} color={colors.error} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.postTitle}>{post.titulo}</Text>
      {!!post.descricao && <Text style={styles.description}>{post.descricao}</Text>}
      {!!post.imagem?.url && (
        <Image source={{ uri: post.imagem.url }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.counts}>
        <Text style={styles.countText}>
          {post.likes.length} {post.likes.length === 1 ? 'curtida' : 'curtidas'}
        </Text>
        <Text style={styles.countText}>
          {post.comentarios.length} {post.comentarios.length === 1 ? 'comentário' : 'comentários'}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Descurtir publicação' : 'Curtir publicação'}
          disabled={liking}
          onPress={onLike}
          style={styles.action}
        >
          {liking ? (
            <ActivityIndicator size="small" color={colors.action} />
          ) : (
            <Heart
              size={19}
              color={liked ? '#df4d62' : colors.loginMuted}
              fill={liked ? '#df4d62' : 'transparent'}
            />
          )}
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {liked ? 'Curtido' : 'Curtir'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCommentsOpen((current) => !current)}
          style={styles.action}
        >
          <MessageCircle size={19} color={colors.loginMuted} />
          <Text style={styles.actionText}>Comentar</Text>
        </Pressable>
      </View>

      {commentsOpen && (
        <View style={styles.comments}>
          {post.comentarios.length === 0 ? (
            <Text style={styles.emptyComments}>Seja o primeiro a comentar.</Text>
          ) : (
            post.comentarios.map((comment, index) => (
              <View key={comment._id || `${post._id}-${index}`} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.nome}</Text>
                <Text style={styles.commentText}>{comment.texto}</Text>
              </View>
            ))
          )}
          <View style={styles.commentComposer}>
            <TextInput
              accessibilityLabel="Escreva um comentário"
              style={styles.commentInput}
              placeholder="Escreva um comentário..."
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              maxLength={500}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              disabled={!commentText.trim() || commenting}
              onPress={() => void submitComment()}
              style={styles.sendButton}
            >
              {commenting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendText}>Enviar</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function HomeFeed({ authorName, userId }: { authorName: string; userId: string | null }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('outros');
  const [photo, setPhoto] = useState<PostImageUpload | null>(null);
  const [composeError, setComposeError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);

  const loadPosts = useCallback(async (nextPage = 1) => {
    nextPage === 1 ? setLoading(true) : setLoadingMore(true);
    if (nextPage === 1) setError('');
    try {
      const response = await postsApi.list(nextPage, PAGE_SIZE);
      setPosts((current) =>
        nextPage === 1
          ? response.data
          : [
              ...current,
              ...response.data.filter(
                (item) => !current.some((existing) => existing._id === item._id),
              ),
            ],
      );
      setPage(nextPage);
      setHasMore(nextPage < response.pagination.pages);
    } catch (loadError) {
      setError(getPostsErrorMessage(loadError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  async function pickPhoto() {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setComposeError('Autorize o acesso às fotos para anexar uma imagem.');
        return;
      }
    }
    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (selection.canceled) return;
    const asset = selection.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
      setComposeError('Use uma imagem JPG, PNG, GIF ou WebP.');
      return;
    }
    if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) {
      setComposeError('A imagem deve ter no máximo 20 MB.');
      return;
    }
    setPhoto({
      uri: asset.uri,
      name: asset.fileName || `publicacao-${Date.now()}.jpg`,
      type: mimeType,
      file: asset.file || undefined,
    });
    setComposeError('');
  }

  function openNewPost() {
    setEditingPost(null);
    setTitle('');
    setDescription('');
    setCategory('outros');
    setPhoto(null);
    setComposeError('');
    setComposerOpen(true);
  }

  function openEditPost(post: CommunityPost) {
    setEditingPost(post);
    setTitle(post.titulo);
    setDescription(post.descricao || '');
    setCategory(post.categoria || 'outros');
    setPhoto(null);
    setComposeError('');
    setComposerOpen(true);
  }

  async function publish() {
    if (!title.trim()) {
      setComposeError('Dê um título à publicação.');
      return;
    }
    setPublishing(true);
    setComposeError('');
    try {
      const fields = {
        titulo: title.trim(),
        descricao: description.trim(),
        categoria: category,
        ...(photo ? { imagem: photo } : {}),
      };
      if (editingPost) {
        await postsApi.update(editingPost._id, fields);
      } else {
        await postsApi.create({ ...fields, autorNome: authorName });
      }
      setTitle('');
      setDescription('');
      setCategory('outros');
      setPhoto(null);
      setEditingPost(null);
      setComposerOpen(false);
      await loadPosts();
    } catch (publishError) {
      setComposeError(getPostsErrorMessage(publishError));
    } finally {
      setPublishing(false);
    }
  }

  async function deletePost(post: CommunityPost) {
    try {
      await postsApi.delete(post._id);
      setPosts((current) => current.filter((item) => item._id !== post._id));
    } catch (deleteError) {
      showError(getPostsErrorMessage(deleteError));
    }
  }

  function confirmDelete(post: CommunityPost) {
    const message = `Excluir “${post.titulo}”? Esta ação não pode ser desfeita.`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void deletePost(post);
      return;
    }
    Alert.alert('Excluir publicação', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void deletePost(post) },
    ]);
  }

  async function toggleLike(post: CommunityPost) {
    if (likingId) return;
    setLikingId(post._id);
    try {
      const result = await postsApi.toggleLike(post._id);
      if (!userId) {
        await loadPosts();
      } else {
        setPosts((current) =>
          current.map((item) =>
            item._id === post._id
              ? {
                  ...item,
                  likes: result.liked
                    ? [...item.likes.filter((id) => String(id) !== userId), userId]
                    : item.likes.filter((id) => String(id) !== userId),
                }
              : item,
          ),
        );
      }
    } catch (likeError) {
      showError(getPostsErrorMessage(likeError));
    } finally {
      setLikingId(null);
    }
  }

  async function addComment(postId: string, text: string): Promise<boolean> {
    if (commentingId) return false;
    setCommentingId(postId);
    try {
      const comment = await postsApi.addComment(postId, text, authorName);
      setPosts((current) =>
        current.map((item) =>
          item._id === postId ? { ...item, comentarios: [...item.comentarios, comment] } : item,
        ),
      );
      return true;
    } catch (commentError) {
      showError(getPostsErrorMessage(commentError));
      return false;
    } finally {
      setCommentingId(null);
    }
  }

  return (
    <View style={styles.feed}>
      <Pressable accessibilityRole="button" onPress={openNewPost} style={styles.createCard}>
        <View style={styles.createAvatar}>
          <PawPrint size={20} color={colors.white} />
        </View>
        <Text style={styles.createText}>Compartilhe algo com a comunidade...</Text>
        <ImagePlus size={21} color={colors.action} />
      </Pressable>

      <View style={styles.feedHeader}>
        <Text style={styles.heading}>Feed da comunidade</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadPosts()}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </Pressable>
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.action} />
          <Text style={styles.muted}>Carregando publicações...</Text>
        </View>
      ) : null}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPosts()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
      {!loading && !error && posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Ainda não há publicações. Crie a primeira!</Text>
        </View>
      ) : null}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          userId={userId}
          liking={likingId === post._id}
          commenting={commentingId === post._id}
          onLike={() => void toggleLike(post)}
          onComment={(text) => addComment(post._id, text)}
          onEdit={() => openEditPost(post)}
          onDelete={() => confirmDelete(post)}
        />
      ))}
      {hasMore && (
        <Pressable
          accessibilityRole="button"
          disabled={loadingMore}
          onPress={() => void loadPosts(page + 1)}
          style={styles.moreButton}
        >
          {loadingMore ? (
            <ActivityIndicator color={colors.action} />
          ) : (
            <Text style={styles.moreText}>Carregar mais publicações</Text>
          )}
        </Pressable>
      )}

      <Modal
        visible={composerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !publishing && setComposerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalPage}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPost ? 'Editar publicação' : 'Criar publicação'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                disabled={publishing}
                onPress={() => setComposerOpen(false)}
              >
                <X size={24} color={colors.textDark} />
              </Pressable>
            </View>
            <Text style={styles.modalAuthor}>Publicando como {authorName}</Text>
            <TextInput
              accessibilityLabel="Título da publicação"
              style={styles.titleInput}
              placeholder="Dê um título à publicação"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
            <TextInput
              accessibilityLabel="Descrição da publicação"
              style={styles.descriptionInput}
              placeholder="O que você quer compartilhar?"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              maxLength={2000}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.fieldLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {categories.map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setCategory(item.value)}
                    style={[
                      styles.categoryButton,
                      category === item.value && styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === item.value && styles.categoryButtonTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {photo || editingPost?.imagem?.url ? (
              <View>
                <Image
                  source={{ uri: photo?.uri || editingPost?.imagem?.url || '' }}
                  style={styles.preview}
                />
                <Pressable onPress={() => void pickPhoto()}>
                  <Text style={styles.removePhoto}>Trocar imagem</Text>
                </Pressable>
                {photo && (
                  <Pressable onPress={() => setPhoto(null)}>
                    <Text style={styles.removePhoto}>Cancelar nova imagem</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Pressable style={styles.photoButton} onPress={() => void pickPhoto()}>
                <ImagePlus size={20} color={colors.action} />
                <Text style={styles.photoButtonText}>Adicionar foto</Text>
              </Pressable>
            )}
            {!!composeError && <Text style={styles.errorText}>{composeError}</Text>}
            <Pressable
              accessibilityRole="button"
              disabled={publishing}
              onPress={() => void publish()}
              style={[styles.publishButton, publishing && styles.disabledButton]}
            >
              {publishing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.publishText}>
                  {editingPost ? 'Salvar alterações' : 'Publicar'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { gap: 14 },
  createCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
  },
  createAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { fontSize: 20, color: colors.textDark, fontWeight: '800' },
  refreshText: { color: colors.action, fontWeight: '700' },
  center: { padding: 26, alignItems: 'center', gap: 12 },
  muted: { color: colors.textMuted, textAlign: 'center' },
  errorBox: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.errorBackground,
    gap: 8,
  },
  errorText: { color: colors.errorText, fontSize: 13 },
  retryText: { color: colors.action, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 17 },
  authorInfo: { flex: 1 },
  ownerActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  author: { color: colors.textDark, fontWeight: '800' },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  tag: {
    backgroundColor: '#e3f6e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  tagText: { color: colors.brandPanel, fontSize: 11, fontWeight: '700' },
  postTitle: { color: colors.textDark, fontSize: 17, fontWeight: '800' },
  description: { color: colors.loginMuted, lineHeight: 20, fontSize: 14 },
  postImage: { width: '100%', height: 250, borderRadius: 10 },
  counts: { flexDirection: 'row', justifyContent: 'space-between' },
  countText: { color: colors.textMuted, fontSize: 12 },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#edf0ed',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 5 },
  actionText: { color: colors.loginMuted, fontWeight: '700', fontSize: 13 },
  likedText: { color: '#df4d62' },
  comments: { gap: 9, borderTopWidth: 1, borderTopColor: '#edf0ed', paddingTop: 12 },
  emptyComments: { color: colors.textMuted, fontSize: 12 },
  comment: { backgroundColor: '#f1f4f1', borderRadius: 12, padding: 10 },
  commentAuthor: { color: colors.textDark, fontWeight: '800', fontSize: 12 },
  commentText: { color: colors.loginMuted, fontSize: 13, marginTop: 3 },
  commentComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#f1f4f1',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    color: colors.textDark,
  },
  sendButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.action,
  },
  sendText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  moreButton: {
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 14,
    alignItems: 'center',
  },
  moreText: { color: colors.action, fontWeight: '800' },
  modalPage: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: 20, gap: 16 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { color: colors.textDark, fontSize: 22, fontWeight: '800' },
  modalAuthor: { color: colors.textMuted },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    color: colors.textDark,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    minHeight: 135,
    color: colors.textDark,
  },
  fieldLabel: { color: colors.textDark, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButtonActive: { backgroundColor: colors.action, borderColor: colors.action },
  categoryButtonText: { color: colors.textDark, fontSize: 12 },
  categoryButtonTextActive: { color: colors.white, fontWeight: '700' },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
  },
  photoButtonText: { color: colors.action, fontWeight: '700' },
  preview: { width: '100%', height: 220, borderRadius: 10 },
  removePhoto: { color: colors.error, marginTop: 8, fontWeight: '700' },
  publishButton: {
    borderRadius: 10,
    backgroundColor: colors.action,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: colors.actionDisabled },
  publishText: { color: colors.white, fontWeight: '800' },
});
