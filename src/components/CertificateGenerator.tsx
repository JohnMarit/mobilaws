import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Award, CheckCircle2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faAward } from '@fortawesome/free-solid-svg-icons';
import type { Certificate } from '@/lib/examContent';

interface CertificateGeneratorProps {
  open: boolean;
  onClose: () => void;
  certificate: Certificate;
}

export default function CertificateGenerator({ open, onClose, certificate }: CertificateGeneratorProps) {
  const [userName, setUserName] = useState(certificate.userName);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      // Use html2canvas to convert the certificate to an image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Mobilaws_Certificate_${certificate.certificateNumber}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <FontAwesomeIcon icon={faCertificate} className="text-yellow-500" />
            <span>Your Certificate</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Congratulations! You've earned this certificate. Enter your full name to download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-medium">
              Full Name (as it should appear on certificate)
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your full name"
              className="text-base"
            />
          </div>

          {/* Certificate Preview */}
        <div 
          ref={certificateRef}
          className="relative overflow-hidden rounded-xl shadow-2xl border-8 border-[#0d1b3a]"
          style={{
            background: 'linear-gradient(135deg, #0b1939 0%, #0b1939 45%, #0f234f 100%)',
            color: '#0d1b3a'
          }}
        >
          {/* Accent ribbons */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 -left-16 h-40 w-80 rotate-6" style={{ background: 'linear-gradient(90deg, #f7b733 0%, #f7b733 40%, transparent 100%)' }} />
            <div className="absolute -bottom-10 -right-24 h-44 w-96 -rotate-6" style={{ background: 'linear-gradient(90deg, transparent 0%, #f7b733 60%, #f7b733 100%)' }} />
            <div className="absolute inset-8 border-[3px] border-[#f7b733] rounded-lg opacity-70" />
            <div className="absolute inset-14 border border-white/20 rounded-lg" />
          </div>

          <div className="relative bg-white/98 backdrop-blur-sm m-[18px] sm:m-6 p-6 sm:p-10 rounded-lg">
            {/* Top bar with logo and seal */}
            <div className="flex items-center justify-between mb-6">
              <img src="/mobilogo.png" alt="Mobilaws Logo" className="h-12 w-auto drop-shadow" />
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0d1b3a]">
                <span className="uppercase tracking-[0.2em] text-xs text-[#0d1b3a]">mobilaws</span>
                <FontAwesomeIcon icon={faAward} className="text-[#f7b733]" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm uppercase tracking-[0.35em] text-[#0d1b3a]">Certificate</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0d1b3a]">of High School Graduation</h1>
              <div className="h-[3px] w-40 mx-auto bg-[#f7b733] rounded-full" />
              <p className="text-xs uppercase tracking-[0.3em] text-[#0d1b3a]/80">Proudly present to</p>
            </div>

            {/* Name */}
            <div className="text-center mb-6">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-[#0d1b3a]">
                {userName || 'Your Name'}
              </p>
              <div className="mt-3 text-xs sm:text-sm text-[#0d1b3a]/70 px-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
              </div>
            </div>

            {/* Exam details */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[#0d1b3a] mb-6">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Score: {certificate.score}%</span>
              </div>
              <span className="hidden sm:inline text-[#0d1b3a]/50">|</span>
              <div className="flex items-center gap-2 font-semibold capitalize">
                <Award className="h-5 w-5 text-[#f7b733]" />
                <span>{certificate.level} Level</span>
              </div>
              <span className="hidden sm:inline text-[#0d1b3a]/50">|</span>
              <div className="font-semibold">{certificate.examTitle}</div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#0d1b3a] text-sm mb-8">
              <div>
                <p className="uppercase tracking-[0.18em] text-xs text-[#0d1b3a]/70 mb-1">Certificate No.</p>
                <p className="font-mono font-bold">{certificate.certificateNumber}</p>
              </div>
              <div className="sm:text-right">
                <p className="uppercase tracking-[0.18em] text-xs text-[#0d1b3a]/70 mb-1">Issued</p>
                <p className="font-semibold">
                  {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-[#0d1b3a]">
              <div className="flex flex-col items-center gap-2">
                <div className="h-[1px] w-full bg-[#0d1b3a]/60" />
                <p className="text-lg font-semibold lowercase tracking-wide">mobilaws</p>
                <p className="text-xs text-[#0d1b3a]/70">Authorized Signature</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-[1px] w-full bg-[#0d1b3a]/60" />
                <p className="text-lg font-semibold">www.mobilaws.com</p>
                <p className="text-xs text-[#0d1b3a]/70">Official Website</p>
              </div>
            </div>
          </div>
        </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!userName.trim() || isDownloading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Certificate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

