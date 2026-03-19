import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Errors State
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  // Input Handlers
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    if (showAlert) setShowAlert(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
    if (showAlert) setShowAlert(false);
  };

  // Validation Logic
  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Please fill the field';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Please fill the field';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setShowAlert(false);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const response = await login({
        email: normalizedEmail,
        password
      });

      const { access_token, user: userData } = response.data;

      // Store Auth Data exactly as requested
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('Login successful, navigating to Dashboard Hub...');
      navigate('/dashboard');

    } catch (err) {
      console.error('Login Failure:', err);
      // On error (401), show the global alert banner
      setAlertMessage("Invalid email or password. Please try again.");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans">
      
      {/* ── LEFT PANEL: BRAND & PREVIEW ─────────────────── */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#1a1f36] via-[#2d3561] to-[#3b82f6] relative overflow-hidden p-8 md:p-12 flex flex-col justify-between items-center text-center">
        
        {/* Decorative Blurred Circles */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-blue-400 opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 rounded-full bg-indigo-500 opacity-10 blur-3xl" />

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-3 self-start">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            📊
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">DashBuilder</span>
        </div>

        {/* Mock Dashboard Illustration (Hidden on Mobile) */}
        <div className="hidden md:block relative z-10 w-full max-w-sm mx-auto animate-fade-in-up">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 p-4 rounded-2xl text-left shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Revenue</p>
                <h4 className="text-lg font-black text-[#1a1f36]">$84,250</h4>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl text-left shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Orders</p>
                <h4 className="text-lg font-black text-[#1a1f36]">1,240</h4>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl text-left border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Completed %</p>
                <h4 className="text-lg font-black text-white">94%</h4>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl text-left border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Widgets</p>
                <h4 className="text-lg font-black text-white">12 Active</h4>
              </div>
            </div>
            
            {/* Fake Chart Lines */}
            <div className="mt-6 space-y-3">
              <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[70%]" />
              </div>
              <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                <div className="h-full bg-indigo-400 w-[45%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Build Dashboards <br /> Your Way
          </h2>
          <p className="text-blue-100/60 text-sm max-w-xs mx-auto leading-relaxed">
            Drag, drop and configure widgets to visualize your Customer Order data.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN FORM ──────────────────────── */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
        
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          <div className="text-center md:text-left space-y-2">
            <h3 className="text-3xl font-black text-[#1a1f36]">Welcome back 👋</h3>
            <p className="text-gray-500 text-sm font-medium">Sign in to your DashBuilder account</p>
          </div>

          {/* Global Alert Banner */}
          {showAlert && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-shake">
              <span className="text-lg">⚠️</span>
              <p className="font-medium">{alertMessage || "Invalid email or password. Please try again."}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1a1f36] ml-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-4 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 placeholder:text-gray-300'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 leading-none">
                <label className="text-sm font-bold text-[#1a1f36]">Password</label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={`w-full pl-12 pr-12 py-3 border rounded-xl outline-none transition-all focus:ring-4 ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100 placeholder:text-gray-300'}`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? (
                    <span className="text-lg">👁️</span>
                  ) : (
                    <span className="text-lg">🙈</span>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password}</p>}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-500 hover:underline">Forgot Password?</a>
            </div>

            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/20'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* Account Link */}
          <div className="text-center pt-4">
             <p className="text-gray-500 text-sm font-medium">Don't have an account? <a href="#" className="text-blue-500 font-bold hover:underline">Sign up</a></p>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>

    </div>
  );
};

export default LoginPage;
