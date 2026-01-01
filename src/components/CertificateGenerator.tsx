import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Award, CheckCircle2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faAward, faStar } from '@fortawesome/free-solid-svg-icons';
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
            className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 border-8 border-double border-blue-600 rounded-lg p-8 sm:p-12 shadow-2xl"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%),
                radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 50%),
                radial-gradient(circle at bottom left, rgba(147, 197, 253, 0.1), transparent 50%)
              `
            }}
          >
            {/* Decorative Corner Elements */}
            <div className="absolute top-4 left-4 text-4xl text-blue-600 opacity-20">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="absolute top-4 right-4 text-4xl text-blue-600 opacity-20">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="absolute bottom-4 left-4 text-4xl text-blue-600 opacity-20">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="absolute bottom-4 right-4 text-4xl text-blue-600 opacity-20">
              <FontAwesomeIcon icon={faStar} />
            </div>

            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-full shadow-lg">
                  <FontAwesomeIcon icon={faAward} className="text-5xl" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Certificate of Completion
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full"></div>
            </div>

            {/* Body */}
            <div className="text-center space-y-6 mb-8">
              <p className="text-lg text-gray-600">This is to certify that</p>
              
              <div className="py-4 px-8 bg-white rounded-lg shadow-inner border-2 border-blue-200">
                <p className="text-3xl sm:text-4xl font-serif font-bold text-blue-900">
                  {userName || 'Your Name'}
                </p>
              </div>

              <p className="text-lg text-gray-600">has successfully completed</p>

              <div className="py-3 px-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-300">
                <p className="text-2xl sm:text-3xl font-semibold text-blue-800">
                  {certificate.examTitle}
                </p>
              </div>

              <div className="flex justify-center items-center gap-4 text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Score: {certificate.score}%</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold capitalize">{certificate.level} Level</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-blue-200 pt-6 mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center sm:text-left">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Certificate Number</p>
                  <p className="font-mono font-bold text-blue-800">
                    {certificate.certificateNumber}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                  <p className="font-semibold text-gray-700">
                    {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* Signature Section */}
                  <div className="text-center sm:text-left">
                    <div className="mb-2">
                      <img 
                        src="/mobilogo.png" 
                        alt="Mobilaws Logo" 
                        className="h-12 mx-auto sm:mx-0"
                      />
                    </div>
                    <div className="border-t-2 border-gray-400 pt-2 inline-block min-w-[200px]">
                      <p className="text-sm font-signature text-gray-700" style={{ fontFamily: 'cursive' }}>
                        mobilaws
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Authorized Signature</p>
                    </div>
                  </div>

                  {/* Organization Info */}
                  <div className="text-center sm:text-right">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      www.mobilaws.com
                    </p>
                    <p className="text-xs text-gray-500">
                      South Sudan Legal Education Platform
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Empowering legal knowledge through technology
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <FontAwesomeIcon icon={faAward} className="text-blue-600" style={{ fontSize: '20rem' }} />
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

