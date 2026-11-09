import { profileApi } from '@/services/profileApi';
import { getPostsErrorMessage, postsApi } from '@/services/postsApi';
import type { CommunityProfile } from '@/types/profile';

export interface CommunityProfileResult {
  profile: CommunityProfile;
  detailsAvailable: boolean;
}

export async function getCommunityProfile(userId: string): Promise<CommunityProfileResult | null> {
  const profile = await profileApi.getProfileByUserId(userId);
  if (profile) return { profile, detailsAvailable: true };

  // O cadastro da conta não cria um registro no microsserviço de perfis.
  // Nesse caso, usa somente a identificação já publicada pelo autor.
  try {
    const author = await postsApi.getAuthor(userId);
    return author ? { profile: author, detailsAvailable: false } : null;
  } catch (error) {
    throw new Error(getPostsErrorMessage(error));
  }
}
