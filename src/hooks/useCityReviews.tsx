import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface CityReview {
  id: string;
  user_id: string;
  city_name: string;
  state_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  cover_photo_position_x: number;
  cover_photo_position_y: number;
  cover_photo_scale: number;
}

export interface CityReviewPhoto {
  id: string;
  review_id: string;
  photo_url: string;
  created_at: string;
  is_cover: boolean;
}

export const useCityReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Map<string, CityReview>>(new Map());
  const [photos, setPhotos] = useState<Map<string, CityReviewPhoto[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('city_reviews')
        .select('*')
        .eq('user_id', user.id);

      if (reviewsError) throw reviewsError;

      const reviewsMap = new Map<string, CityReview>();
      reviewsData?.forEach((review) => {
        const key = `${review.city_name}-${review.state_name}`;
        reviewsMap.set(key, review);
      });
      setReviews(reviewsMap);

      // Load photos for all reviews
      if (reviewsData && reviewsData.length > 0) {
        const reviewIds = reviewsData.map((r) => r.id);
        const { data: photosData, error: photosError } = await supabase
          .from('city_review_photos')
          .select('*')
          .in('review_id', reviewIds);

        if (photosError) throw photosError;

        const photosMap = new Map<string, CityReviewPhoto[]>();
        photosData?.forEach((photo) => {
          const existing = photosMap.get(photo.review_id) || [];
          photosMap.set(photo.review_id, [...existing, photo]);
        });
        setPhotos(photosMap);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as avaliações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [user]);

  const getReview = (cityName: string, stateName: string): CityReview | undefined => {
    const key = `${cityName}-${stateName}`;
    return reviews.get(key);
  };

  const getReviewPhotos = (reviewId: string): CityReviewPhoto[] => {
    return photos.get(reviewId) || [];
  };

  const saveReview = async (
    cityName: string,
    stateName: string,
    rating: number,
    comment: string,
    photoFiles: File[],
    coverPhotoIndex: number | null = null,
    coverPosition: { x: number; y: number; scale: number } = { x: 0.5, y: 0.5, scale: 1.0 }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Upsert review
      const { data: reviewData, error: reviewError } = await supabase
        .from('city_reviews')
        .upsert({
          user_id: user.id,
          city_name: cityName,
          state_name: stateName,
          rating,
          comment: comment || null,
          cover_photo_position_x: coverPosition.x,
          cover_photo_position_y: coverPosition.y,
          cover_photo_scale: coverPosition.scale,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,city_name,state_name',
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Upload photos
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${reviewData.id}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('city-review-photos')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('city-review-photos')
            .getPublicUrl(fileName);

          const { error: photoError } = await supabase
            .from('city_review_photos')
            .insert({
              review_id: reviewData.id,
              photo_url: publicUrl,
              is_cover: coverPhotoIndex === i,
            });

          if (photoError) throw photoError;
        }
      }

      await loadReviews();
      toast({
        title: 'Sucesso',
        description: 'Avaliação salva com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error saving review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a avaliação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteReview = async (cityName: string, stateName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const review = getReview(cityName, stateName);
      if (!review) return false;

      // Delete photos from storage
      const reviewPhotos = getReviewPhotos(review.id);
      for (const photo of reviewPhotos) {
        const path = photo.photo_url.split('/city-review-photos/')[1];
        if (path) {
          await supabase.storage
            .from('city-review-photos')
            .remove([path]);
        }
      }

      const { error } = await supabase
        .from('city_reviews')
        .delete()
        .eq('user_id', user.id)
        .eq('city_name', cityName)
        .eq('state_name', stateName);

      if (error) throw error;

      await loadReviews();
      toast({
        title: 'Sucesso',
        description: 'Avaliação excluída com sucesso!',
      });
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a avaliação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string): Promise<boolean> => {
    try {
      const path = photoUrl.split('/city-review-photos/')[1];
      if (path) {
        await supabase.storage
          .from('city-review-photos')
          .remove([path]);
      }

      const { error } = await supabase
        .from('city_review_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      await loadReviews();
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a foto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const setCoverPhoto = async (photoId: string, reviewId: string): Promise<boolean> => {
    try {
      // Remove cover from all photos of this review
      const { error: removeError } = await supabase
        .from('city_review_photos')
        .update({ is_cover: false })
        .eq('review_id', reviewId);

      if (removeError) throw removeError;

      // Set new cover photo
      const { error: setCoverError } = await supabase
        .from('city_review_photos')
        .update({ is_cover: true })
        .eq('id', photoId);

      if (setCoverError) throw setCoverError;

      await loadReviews();
      toast({
        title: 'Sucesso',
        description: 'Foto de capa atualizada!',
      });
      return true;
    } catch (error) {
      console.error('Error setting cover photo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível definir a foto de capa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCoverPosition = async (
    cityName: string,
    stateName: string,
    position: { x: number; y: number; scale: number }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('city_reviews')
        .update({
          cover_photo_position_x: position.x,
          cover_photo_position_y: position.y,
          cover_photo_scale: position.scale,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('city_name', cityName)
        .eq('state_name', stateName);

      if (error) throw error;

      await loadReviews();
      return true;
    } catch (error) {
      console.error('Error updating cover position:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a posição da foto.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    reviews,
    photos,
    loading,
    getReview,
    getReviewPhotos,
    saveReview,
    deleteReview,
    deletePhoto,
    setCoverPhoto,
    updateCoverPosition,
    loadReviews,
  };
};