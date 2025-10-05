import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Star } from 'lucide-react';

interface CityActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  stateName: string;
  hasReview: boolean;
  onViewInfo: () => void;
  onViewReview: () => void;
  onAddReview: () => void;
}

export const CityActionMenu = ({
  isOpen,
  onClose,
  cityName,
  stateName,
  hasReview,
  onViewInfo,
  onViewReview,
  onAddReview,
}: CityActionMenuProps) => {
  const handleViewInfo = () => {
    onClose();
    onViewInfo();
  };

  const handleReviewAction = () => {
    onClose();
    if (hasReview) {
      onViewReview();
    } else {
      onAddReview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">{cityName}</h2>
            <p className="text-sm text-muted-foreground">{stateName}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleViewInfo}
              className="w-full h-16 flex items-center gap-3"
              variant="outline"
            >
              <Info className="h-5 w-5" />
              <span className="text-base">Ver Informações</span>
            </Button>

            <Button
              onClick={handleReviewAction}
              className="w-full h-16 flex items-center gap-3"
            >
              <Star className="h-5 w-5" />
              <span className="text-base">
                {hasReview ? 'Ver Avaliação' : 'Adicionar Avaliação'}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};