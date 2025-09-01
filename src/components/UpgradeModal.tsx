import React from 'react';
import { Crown, Check, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

const UpgradeModal: React.FC = () => {
  const { userProfile } = useAuth();

  const plans = [
    {
      id: 'professional',
      name: 'Professional',
      price: '£99.99',
      period: '/month',
      description: 'Full business management suite',
      icon: Zap,
      color: 'bg-primary',
      hoverColor: 'hover:bg-primary-700',
      features: [
        'AI Advisory & GPT Chat',
        'Complete CRM System',
        'Social Media Management',
        'Public Relations Tools',
        'Financial Management',
        'Data Analytics',
        'Document Management',
        'Settings & Configuration'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '£299.99',
      period: '/month',
      description: 'Complete platform access with advanced features',
      icon: Crown,
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      hoverColor: 'hover:from-purple-700 hover:to-pink-700',
      features: [
        'Everything in Professional',
        'HR Management & CV Library',
        'Investor Relations',
        'Advanced Tools Suite',
        'Calendar Integration',
        'Community Management',
        'Priority Support',
        'Custom Integrations'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-4">
            Upgrade Your Plan
          </h1>
          <p className="text-lg text-neutral-600 mb-2">
            You're currently on the <span className="font-semibold text-primary">{userProfile?.profileType}</span> plan
          </p>
          <p className="text-neutral-500">
            Unlock powerful business management features with our Professional or Enterprise plans
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'border-primary' : 'border-neutral-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 rounded-lg ${plan.color} flex items-center justify-center text-white mr-4`}>
                    <plan.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-800">{plan.name}</h3>
                    <p className="text-neutral-600">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-neutral-800">{plan.price}</span>
                    <span className="text-neutral-500 ml-1">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check size={18} className="text-success-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  fullWidth
                  className={`${plan.color} ${plan.hoverColor} text-white`}
                  rightIcon={<ArrowRight size={18} />}
                >
                  Upgrade to {plan.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
            <Users size={32} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Need Help Choosing?
            </h3>
            <p className="text-neutral-600 mb-4">
              Our team is here to help you find the perfect plan for your business needs.
            </p>
            <Button variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;