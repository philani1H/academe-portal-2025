'use client'

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ImagePopupProps {
  imageUrl: string;
  triggerComponent?: React.ReactNode;
}

const ImagePopup = ({ imageUrl, triggerComponent }: ImagePopupProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerComponent || (
          <button className="hover:opacity-80 transition-opacity">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-lg"
            />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <img
          src={imageUrl}
          alt="Full size"
          className="w-full h-auto object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}

export default ImagePopup