import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Eye } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate } from '@fortawesome/free-solid-svg-icons';
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
      <DialogContent className="max-w-5xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl text-blue-800">
            <FontAwesomeIcon icon={faCertificate} className="text-blue-600" />
            <span>Your Certificate</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-slate-600">
            Congrats! Confirm how your name should appear and download instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-medium text-slate-700">
              Full Name (as it should appear on certificate)
            </Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your full name"
              className="text-base border-blue-200 focus-visible:ring-blue-500"
            />
          </div>

          {/* Certificate Preview - Blue, modern frame */}
          <div 
            ref={certificateRef}
            className="relative bg-white border border-blue-200 p-10 sm:p-12 shadow-xl rounded-3xl overflow-hidden"
            style={{
              aspectRatio: '16/11',
              width: '100%',
              maxWidth: '100%'
            }}
          >
            {/* Gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 opacity-90" />
            {/* Decorative corners */}
            <div className="absolute inset-3 rounded-2xl border border-blue-200/70" />
            <div className="absolute inset-6 rounded-xl border border-blue-100" />
            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 text-8xl font-black text-blue-900 select-none">
              Mobilaws
            </div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col justify-between">
              {/* Header Section */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-blue-900 tracking-wide mb-2">
                  CERTIFICATE OF COMPLETION
                </h1>
                <div className="h-[3px] w-32 mx-auto bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"></div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 mb-4">This is to certify that</p>
                  
                  <div className="mb-4">
                    <p className="text-2xl font-serif font-bold text-blue-900 border-b-2 border-blue-200 pb-2 inline-block px-8">
                      {userName || 'Your Name'}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 mb-2">has successfully completed</p>
                  
                  <p className="text-lg font-semibold text-blue-800 mb-4">
                    {certificate.examTitle}
                  </p>

                  <div className="flex justify-center items-center gap-6 text-xs text-slate-600">
                    <span>Score: {certificate.score}%</span>
                    <span>•</span>
                    <span className="capitalize">{certificate.level} Level</span>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="border-t border-blue-100 pt-4">
                <div className="flex justify-between items-end gap-6">
                  {/* Left: Signature */}
                  <div className="flex-1">
                    <div className="pt-2 inline-block min-w-[200px]">
                      <p
                        className="text-xl leading-tight mb-1"
                        style={{
                          fontFamily: '"Pacifico", "Segoe Script", "Brush Script MT", cursive',
                          backgroundImage: 'linear-gradient(90deg, #1e3a8a, #2563eb, #1d4ed8)',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent'
                        }}
                      >
                        Mobilaws
                      </p>
                      <div className="h-px bg-blue-200 mb-1" />
                      <p className="text-xs text-slate-500">Authorized Signature</p>
                    </div>
                  </div>

                  {/* Center: Certificate Info */}
                  <div className="flex-1 text-center">
                    <p className="text-xs text-slate-500 mb-1">Certificate Number</p>
                    <p className="text-xs font-mono text-blue-900 mb-3">
                      {certificate.certificateNumber}
                    </p>
                    <p className="text-xs text-slate-500 mb-1">Issue Date</p>
                    <p className="text-xs text-blue-900">
                      {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Right: Organization */}
                  <div className="flex-1 text-right">
                    <p className="text-xs font-semibold text-blue-900 mb-1">
                      www.mobilaws.com
                    </p>
                    <p className="text-xs text-slate-500">
                      South Sudan Legal Education Platform
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto border-blue-200 text-blue-700"
            >
              Close
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!userName.trim() || isDownloading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
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

