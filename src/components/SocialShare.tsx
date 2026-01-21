import React from 'react';
import { Link2, Share2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faWhatsapp, faFacebook, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  url = typeof window !== 'undefined' ? window.location.href : '', 
  title = "Check out Excellence Academia!", 
  description = "Expert tutoring and university application assistance.",
  className = ""
}) => {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-[#25D366] hover:bg-[#128C7E]'
    },
    {
      name: 'Facebook',
      icon: <FontAwesomeIcon icon={faFacebook} className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#1877F2] hover:bg-[#166FE5]'
    },
    {
      name: 'X',
      icon: <FontAwesomeIcon icon={faXTwitter} className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-gray-800'
    },
    {
      name: 'LinkedIn',
      icon: <FontAwesomeIcon icon={faLinkedin} className="h-4 w-4" />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`,
      color: 'bg-[#0A66C2] hover:bg-[#004182]'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share it with your friends to help us grow.",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-1 flex items-center justify-center gap-2">
          <Share2 className="h-5 w-5 text-yellow-400" />
          Share & Support Us
        </h3>
        <p className="text-sm text-muted-foreground">Help your friends achieve academic excellence too!</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <TooltipProvider>
          {shareLinks.map((link) => (
            <Tooltip key={link.name}>
              <TooltipTrigger asChild>
                <a 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-3 rounded-full text-white transition-transform hover:scale-110 shadow-lg ${link.color}`}
                >
                  {link.icon}
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share on {link.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 border-none shadow-lg"
                onClick={handleCopyLink}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Link</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SocialShare;
