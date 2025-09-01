import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error, isLoading } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = !email || emailRegex.test(email);

  // Password validation (min 8 characters)
  const isPasswordValid = !password || password.length >= 8;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full animate-scale-up">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img 
              src="https://res.cloudinary.com/deyzbqzya/image/upload/v1747914532/Pri0r1ty_PRIMARY-Logo_Colour-Long-Pos-RGB_1_qhsx8u.png"
              alt="Logo"
              className="h-36 w-auto"
            />
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-neutral-800 mb-6">Sign in to your account</h1>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              fullWidth
              leftIcon={<Mail size={18} />}
              error={!isEmailValid ? "Please enter a valid email address" : undefined}
            />
            
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              fullWidth
              leftIcon={<Lock size={18} />}
              error={!isPasswordValid ? "Password must be at least 8 characters" : undefined}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-800">
                  Forgot your password?
                </a>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-error-50 text-error-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight size={18} />}
                disabled={!isEmailValid || !isPasswordValid || !email || !password}
              >
                Sign in
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-primary hover:text-primary-800">
                Sign up
              </a>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;