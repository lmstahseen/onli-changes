import React, { useState } from 'react';
import Icon from '../common/Icon';

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  content: React.ReactNode;
}

interface OnboardingModalProps {
  steps: OnboardingStep[];
  onClose: () => void;
  userType: 'student' | 'teacher';
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ steps, onClose, userType }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSkip = () => {
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-soft-lg transform transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div 
            className="h-full bg-[#2727E6] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${steps[currentStep].iconBgColor} rounded-full flex items-center justify-center`}>
              <Icon name={steps[currentStep].icon} size={20} className={steps[currentStep].iconColor} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="close-circle-bold-duotone" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <div>
            {currentStep > 0 ? (
              <button
                onClick={handlePrevious}
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
              >
                <Icon name="arrow-left-bold-duotone" size={16} />
                Previous
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Skip Tour
              </button>
            )}
          </div>
          <button
            onClick={handleNext}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <Icon name="arrow-right-bold-duotone" size={16} />
              </>
            ) : (
              <>
                Get Started
                <Icon name="check-circle-bold-duotone" size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;