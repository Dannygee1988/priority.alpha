import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import Button from './Button';

interface LockedFeatureProps {
  children: React.ReactNode;
  isLocked: boolean;
  featureName: string;
  requiredPlan?: string;
  onUpgrade?: () => void;
}

const LockedFeature: React.FC<LockedFeatureProps> = ({
  children,
  isLocked,
  featureName,
  requiredPlan = 'Professional',
  onUpgrade
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Greyed out content */}
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-xl">
        <div className="text-center p-8 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">
            {featureName} Locked
          </h3>
          
          <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
            Upgrade to {requiredPlan} to unlock this feature and access the full platform.
          </p>
          
          <Button
            size="md"
            leftIcon={<Crown size={16} />}
            rightIcon={<ArrowRight size={16} />}
            onClick={onUpgrade}
            className="bg-primary hover:bg-primary-700"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LockedFeature;