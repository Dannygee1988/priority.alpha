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
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {featureName} Locked
          </h3>
          
          <p className="text-sm text-neutral-600 mb-4">
            Upgrade to {requiredPlan} to unlock this feature and access the full platform.
          </p>
          
          <Button
            size="sm"
            leftIcon={<Crown size={16} />}
            rightIcon={<ArrowRight size={16} />}
            onClick={onUpgrade}
            className="bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LockedFeature;