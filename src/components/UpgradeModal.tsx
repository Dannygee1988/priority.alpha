import React from 'react';
import { X, Check, Crown, Zap, Building2 } from 'lucide-react';
import Button from './Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'advisor',
      name: 'Advisor',
      price: '£29.99',
      period: 'per month',
      description: 'Basic access to AI advisory features',
      features: [
        'AI Advisor Chat',
        'GPT Assistant',
        'Basic Chat History',
        'Email Support'
      ],
      color: 'border-neutral-200',
      buttonColor: 'bg-neutral-600 hover:bg-neutral-700',
      current: true
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '£99.99',
      period: 'per month',
      description: 'Full business management suite',
      features: [
        'Everything in Advisor',
        'Dashboard & Analytics',
        'Data Management',
        'CRM System',
        'Social Media Tools',
        'Public Relations',
        'Finance Management',
        'Settings & Configuration'
      ],
      color: 'border-primary ring-2 ring-primary',
      buttonColor: 'bg-primary hover:bg-primary-700',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '£299.99',
      period: 'per month',
      description: 'Complete platform access with advanced features',
      features: [
        'Everything in Professional',
        'Human Resources',
        'Investor Relations',
        'Advanced Tools',
        'Calendar Management',
        'Community Features',
        'Priority Support',
        'Custom Integrations'
      ],
      color: 'border-warning-300',
      buttonColor: 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 flex items-center">
                <Crown size={28} className="mr-3 text-warning-500" />
                Upgrade Your Plan
              </h2>
              <p className="text-neutral-500 mt-2">
                Unlock the full power of Pri0r1ty's business management platform
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X size={20} className="text-neutral-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg border-2 p-6 transition-all ${plan.color} ${
                  plan.popular ? 'transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-neutral-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    {plan.id === 'advisor' && <Zap size={32} className="text-neutral-600" />}
                    {plan.id === 'professional' && <Crown size={32} className="text-primary" />}
                    {plan.id === 'enterprise' && <Building2 size={32} className="text-warning-500" />}
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-800 mb-2">{plan.name}</h3>
                  <p className="text-neutral-500 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-neutral-800">{plan.price}</span>
                    <span className="text-neutral-500 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={16} className="text-success-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  className={plan.current ? 'opacity-50 cursor-not-allowed' : plan.buttonColor}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500">
              All plans include 24/7 support and regular feature updates. 
              <br />
              Cancel anytime. No hidden fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;