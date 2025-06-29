import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { CertificationService, type CertificateData } from '../../services/certificationService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificate: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadCertificateData(id);
    }
  }, [id]);

  const loadCertificateData = async (certificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await CertificationService.getCertificateData(parseInt(certificationId));
      setCertificateData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    try {
      setIsDownloading(true);
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Onliversity_Certificate_${certificateData?.certification_title.replace(/\s+/g, '_')}.pdf`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLinkedIn = () => {
    // In a real implementation, this would open a LinkedIn share dialog
    alert('LinkedIn sharing functionality would be implemented here.');
  };

  const handleBackToCertifications = () => {
    navigate('/student/dashboard/certifications');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificateData) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Certificate</h2>
          <p className="text-gray-600 mb-4">{error || 'Certificate not found'}</p>
          <button 
            onClick={handleBackToCertifications}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Certifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={handleBackToCertifications}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <Icon name="arrow-left-bold-duotone" size={20} />
        Back to Certifications
      </button>

      {/* Certificate Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Certificate</h1>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Icon name="download-bold-duotone" size={16} />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Icon name="share-bold-duotone" size={16} />
            Share on LinkedIn
          </button>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="card p-8 mb-8 overflow-hidden">
        <div 
          ref={certificateRef}
          className="bg-gradient-to-r from-blue-50 to-purple-50 p-12 rounded-lg border-8 border-double border-blue-200 relative"
          style={{ aspectRatio: '1.414/1' }}
        >
          {/* Certificate Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-[#2727E6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="medal-bold-duotone" size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Certificate of Completion</h2>
            <p className="text-xl text-gray-600">Onliversity</p>
          </div>
          
          {/* Certificate Body */}
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600 mb-6">This is to certify that</p>
            <p className="text-3xl font-bold text-[#2727E6] mb-6">{certificateData.student_name}</p>
            <p className="text-lg text-gray-600 mb-6">has successfully completed</p>
            <p className="text-2xl font-bold text-gray-900 mb-6">{certificateData.certification_title}</p>
            <p className="text-lg text-gray-600 mb-6">on</p>
            <p className="text-xl font-semibold text-gray-900 mb-8">
              {CertificationService.formatCertificateDate(certificateData.issue_date)}
            </p>
          </div>
          
          {/* Skills Verified */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-gray-900 mb-4">Skills Verified</p>
            <div className="flex flex-wrap justify-center gap-2">
              {certificateData.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* Certificate Footer */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500">Certificate ID: {certificateData.id}</p>
              <p className="text-sm text-gray-500">Verify at: onliversity.com/verify</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <img 
                  src="https://via.placeholder.com/150x60?text=Signature" 
                  alt="Signature" 
                  className="inline-block"
                />
              </div>
              <p className="text-sm font-medium text-gray-900">Dr. Jane Smith</p>
              <p className="text-xs text-gray-500">Chief Academic Officer</p>
            </div>
          </div>
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="w-96 h-96 bg-[#2727E6] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Certificate Information */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Certificate ID</span>
              <span className="font-medium">{certificateData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recipient</span>
              <span className="font-medium">{certificateData.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Certification</span>
              <span className="font-medium">{certificateData.certification_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Issue Date</span>
              <span className="font-medium">{CertificationService.formatCertificateDate(certificateData.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Issuing Organization</span>
              <span className="font-medium">Onliversity</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Information</h3>
          <p className="text-gray-600 mb-4">
            This certificate can be verified online to confirm its authenticity.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={`https://onliversity.com/verify/${certificateData.id}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                />
                <button className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-lg hover:bg-gray-200 transition-colors">
                  <Icon name="copy-bold-duotone" size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QR Code
              </label>
              <div className="bg-white p-4 inline-block rounded-lg border border-gray-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://onliversity.com/verify/${certificateData.id}`} 
                  alt="Verification QR Code" 
                  className="w-32 h-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="mt-8 card p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Achievement</h3>
        <p className="text-gray-600 mb-6">
          Showcase your new skills and certification on your professional profiles.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0077B5] text-white rounded-lg hover:bg-[#006699] transition-colors">
            <Icon name="share-bold-duotone" size={20} />
            Share on LinkedIn
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a91da] transition-colors">
            <Icon name="share-bold-duotone" size={20} />
            Share on Twitter
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4267B2] text-white rounded-lg hover:bg-[#365899] transition-colors">
            <Icon name="share-bold-duotone" size={20} />
            Share on Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;