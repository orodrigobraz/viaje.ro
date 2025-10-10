import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { CityReview, CityReviewPhoto } from '@/hooks/useCityReviews';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CoverPhotoAdjuster } from './CoverPhotoAdjuster';
import { Badge } from '@/components/ui/badge';

interface CityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  stateName: string;
  existingReview?: CityReview;
  existingPhotos?: CityReviewPhoto[];
  onSave: (rating: number, comment: string, photoFiles: File[], coverPhotoIndex: number | null, coverPosition: { x: number; y: number; scale: number }) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<boolean>;
  onSetCoverPhoto?: (photoId: string, reviewId: string) => Promise<boolean>;
}

export const CityReviewModal = ({
  isOpen,
  onClose,
  cityName,
  stateName,
  existingReview,
  existingPhotos = [],
  onSave,
  onDelete,
  onDeletePhoto,
  onSetCoverPhoto,
}: CityReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState<number | null>(null);
  const [coverPosition, setCoverPosition] = useState({ x: 0.5, y: 0.5, scale: 1.0 });

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
      setCoverPosition({
        x: existingReview.cover_photo_position_x,
        y: existingReview.cover_photo_position_y,
        scale: existingReview.cover_photo_scale,
      });
    } else {
      setRating(0);
      setComment('');
      setCoverPosition({ x: 0.5, y: 0.5, scale: 1.0 });
    }
    setPhotoFiles([]);
    setPhotoPreviewUrls([]);
    setCoverPhotoIndex(null);
  }, [existingReview, isOpen]);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = photoFiles.length + existingPhotos.length + files.length;
    
    if (totalPhotos > 10) {
      alert('Você pode adicionar no máximo 10 fotos.');
      return;
    }

    setPhotoFiles([...photoFiles, ...files]);
    
    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewPhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma avaliação com estrelas.');
      return;
    }

    setSaving(true);
    const success = await onSave(rating, comment, photoFiles, coverPhotoIndex, coverPosition);
    setSaving(false);

    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    const success = await onDelete();
    if (success) {
      onClose();
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoverRating || rating);
      const isHalf = !isFilled && i - 0.5 === (hoverRating || rating);
      
      stars.push(
        <div
          key={i}
          className="relative cursor-pointer"
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {/* Left half */}
          <div
            className="absolute inset-0 w-1/2 z-10"
            onClick={() => handleStarClick(i - 0.5)}
          />
          {/* Right half */}
          <div
            className="absolute inset-0 left-1/2 w-1/2 z-10"
            onClick={() => handleStarClick(i)}
          />
          
          <Star
            className={`h-10 w-10 ${
              isFilled ? 'fill-yellow-400 text-yellow-400' : 
              isHalf ? 'fill-yellow-400 text-muted' :
              'text-muted'
            }`}
            style={isHalf ? { clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' } : undefined}
          />
          {isHalf && (
            <Star className="absolute top-0 left-0 h-10 w-10 text-muted" />
          )}
        </div>
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            {existingReview ? 'Editar Avaliação' : 'Nova Avaliação'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {cityName} • {stateName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Star Rating */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Sua avaliação</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {renderStars()}
              </div>
              {rating > 0 && (
                <span className="text-lg font-semibold text-primary">
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Seu comentário</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos sobre sua experiência nesta cidade... O que você mais gostou? Quais lugares visitou?"
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">
                Fotos da viagem
              </label>
              <span className="text-xs text-muted-foreground">
                {existingPhotos.length + photoFiles.length}/10
              </span>
            </div>
            
            {(existingPhotos.length > 0 || photoPreviewUrls.length > 0) && (
              <div className="grid grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square group">
                    <img
                      src={photo.photo_url}
                      alt="Foto da cidade"
                      className={`w-full h-full object-cover rounded-lg border-2 ${
                        photo.is_cover ? 'border-primary' : 'border-border'
                      }`}
                    />
                    {photo.is_cover && (
                      <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Capa
                      </Badge>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!photo.is_cover && onSetCoverPhoto && existingReview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => onSetCoverPhoto(photo.id, existingReview.id)}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Capa
                        </Button>
                      )}
                      {onDeletePhoto && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 shadow-lg"
                          onClick={() => onDeletePhoto(photo.id, photo.photo_url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className={`w-full h-full object-cover rounded-lg border-2 ${
                        coverPhotoIndex === index ? 'border-primary' : 'border-border'
                      }`}
                    />
                    {coverPhotoIndex === index && (
                      <Badge className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Capa
                      </Badge>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant={coverPhotoIndex === index ? 'default' : 'secondary'}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => setCoverPhotoIndex(coverPhotoIndex === index ? null : index)}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {coverPhotoIndex === index ? 'É Capa' : 'Definir Capa'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 shadow-lg"
                        onClick={() => handleRemoveNewPhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {existingPhotos.length + photoFiles.length < 10 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Adicionar Fotos
                </Button>
              </div>
            )}
          </div>

          {/* Cover Photo Adjuster */}
          {(() => {
            const coverPhoto = existingPhotos.find(p => p.is_cover) || 
              (coverPhotoIndex !== null && photoPreviewUrls[coverPhotoIndex] ? { photo_url: photoPreviewUrls[coverPhotoIndex] } : null);
            
            return coverPhoto ? (
              <div className="space-y-3 pt-4 border-t">
                <CoverPhotoAdjuster
                  photoUrl={coverPhoto.photo_url}
                  initialPosition={coverPosition}
                  onPositionChange={setCoverPosition}
                />
              </div>
            ) : null;
          })()}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex-row gap-2">
          {existingReview && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="min-w-24"
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            onClick={handleSave}
            disabled={saving || rating === 0}
            className="min-w-24"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};