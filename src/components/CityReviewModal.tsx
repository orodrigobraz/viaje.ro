import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Upload, Trash2 } from 'lucide-react';
import { CityReview, CityReviewPhoto } from '@/hooks/useCityReviews';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  stateName: string;
  existingReview?: CityReview;
  existingPhotos?: CityReviewPhoto[];
  onSave: (rating: number, comment: string, photoFiles: File[]) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<boolean>;
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
}: CityReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setPhotoFiles([]);
    setPhotoPreviewUrls([]);
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
    const success = await onSave(rating, comment, photoFiles);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Editar Avaliação' : 'Adicionar Avaliação'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {cityName}, {stateName}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação</label>
              <div className="flex gap-1 justify-center py-4">
                {renderStars()}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {rating > 0 ? `${rating} estrela${rating !== 1 ? 's' : ''}` : 'Selecione uma avaliação'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentário</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Compartilhe sua experiência sobre esta cidade..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fotos ({existingPhotos.length + photoFiles.length}/10)
              </label>
              
              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img
                        src={photo.photo_url}
                        alt="Review photo"
                        className="w-full h-full object-cover rounded-md"
                      />
                      {onDeletePhoto && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDeletePhoto(photo.id, photo.photo_url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* New Photos Preview */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveNewPhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
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
                  <label htmlFor="photo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Adicionar Fotos
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {existingReview && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="sm:mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};