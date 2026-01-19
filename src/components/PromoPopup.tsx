
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PromoPopupProps {
  image: string;
  link?: string;
  active: boolean;
}

const PromoPopup: React.FC<PromoPopupProps> = ({ image, link, active }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if active, has image, and hasn't been shown in this session
    const hasSeenPopup = sessionStorage.getItem('hasSeenPromoPopup');
    if (active && image && !hasSeenPopup) {
      // Small delay to let the page load a bit
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [active, image]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenPromoPopup', 'true');
  };

  const handleImageClick = () => {
    if (link) {
      window.open(link, '_blank');
      handleClose();
    }
  };

  if (!active || !image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none text-white">
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute right-2 top-2 z-10 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className={`cursor-${link ? 'pointer' : 'default'} w-full h-full`}
            onClick={handleImageClick}
          >
            <img 
              src={image} 
              alt="Promotional Content" 
              className="w-full h-auto rounded-lg shadow-2xl"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoPopup;
