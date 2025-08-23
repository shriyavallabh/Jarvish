'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Share2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImagePreviewProps {
  content: {
    title: string;
    subtitle?: string;
    body: string;
    highlights?: string[];
  };
  branding: {
    advisorName: string;
    firmName?: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    phone?: string;
    email?: string;
    arnNumber?: string;
    euinNumber?: string;
    disclaimer?: string;
  };
  aspectRatio?: string;
  className?: string;
  onGenerate?: () => void;
}

export default function ImagePreview({
  content,
  branding,
  aspectRatio = '16:9',
  className = '',
  onGenerate,
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    renderPreview();
  }, [content, branding]);

  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case '1:1':
        return { width: 400, height: 400 };
      case '16:9':
        return { width: 400, height: 225 };
      case '9:16':
        return { width: 225, height: 400 };
      case '4:3':
        return { width: 400, height: 300 };
      default:
        return { width: 400, height: 300 };
    }
  };

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, branding.primaryColor);
    gradient.addColorStop(1, branding.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    ctx.restore();

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${width * 0.08}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(content.title, width / 2, height * 0.2);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Subtitle
    if (content.subtitle) {
      ctx.font = `${width * 0.04}px Inter, sans-serif`;
      ctx.fillStyle = '#E0E0E0';
      ctx.fillText(content.subtitle, width / 2, height * 0.3);
    }

    // Body
    ctx.font = `${width * 0.035}px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    
    const maxWidth = width * 0.8;
    const lines = wrapText(ctx, content.body, maxWidth);
    let yPos = height * 0.45;
    
    lines.forEach(line => {
      ctx.fillText(line, width * 0.1, yPos);
      yPos += width * 0.05;
    });

    // Highlights
    if (content.highlights && content.highlights.length > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      const highlightY = height * 0.65;
      ctx.fillRect(width * 0.05, highlightY, width * 0.9, height * 0.15);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${width * 0.03}px Inter, sans-serif`;
      content.highlights.slice(0, 2).forEach((highlight, index) => {
        ctx.fillText(
          `• ${highlight}`,
          width * 0.1,
          highlightY + (index + 1) * height * 0.05
        );
      });
    }

    // Branding bar
    const brandingHeight = height * 0.12;
    const brandingY = height - brandingHeight;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, brandingY, width, brandingHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${width * 0.035}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(branding.advisorName, width * 0.05, brandingY + brandingHeight * 0.4);
    
    if (branding.firmName) {
      ctx.font = `${width * 0.025}px Inter, sans-serif`;
      ctx.fillText(branding.firmName, width * 0.05, brandingY + brandingHeight * 0.7);
    }

    // Contact info
    ctx.font = `${width * 0.02}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    if (branding.phone) {
      ctx.fillText(branding.phone, width * 0.95, brandingY + brandingHeight * 0.4);
    }
    if (branding.email) {
      ctx.fillText(branding.email, width * 0.95, brandingY + brandingHeight * 0.7);
    }

    // Compliance info
    if (branding.arnNumber || branding.euinNumber) {
      ctx.fillStyle = '#CCCCCC';
      ctx.font = `${width * 0.018}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      const complianceText = [
        branding.arnNumber ? `ARN: ${branding.arnNumber}` : '',
        branding.euinNumber ? `EUIN: ${branding.euinNumber}` : '',
      ].filter(Boolean).join(' | ');
      
      ctx.fillText(complianceText, width / 2, height - 5);
    }

    // Convert to image URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      }
    }, 'image/png');
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 3); // Limit to 3 lines
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (onGenerate) {
        onGenerate();
      } else {
        // Call API to generate high-quality image
        const response = await fetch('/api/render/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            customBranding: branding,
            aspectRatio: aspectRatio.replace(':', '_'),
            optimize: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate image');
        }

        const data = await response.json();
        toast.success('Image generated successfully!');
        
        // Open in new tab
        if (data.image?.url) {
          window.open(data.image.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${content.title.replace(/\s+/g, '_')}_preview.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Preview downloaded!');
      }
    }, 'image/png');
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], 'preview.png', { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: content.title,
            text: content.body,
          });
        } else {
          toast.error('Sharing not supported on this device');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share image');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxWidth: '100%' }}
          />
          {loading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => renderPreview()}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={loading}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        {navigator.share && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            disabled={loading}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate HD</>
          )}
        </Button>
      </div>
    </div>
  );
}