import React from 'react';
import { loginWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, PieChart, Zap } from 'lucide-react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm"
  >
    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-500">
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/40">
              <TrendingUp className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">InvestWise AI</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-black leading-tight tracking-tighter">
              The Smarter Way to <span className="text-emerald-500">Grow Your Wealth.</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-md leading-relaxed">
              Personalized investment recommendations powered by machine learning and your unique financial profile.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<ShieldCheck />}
              title="Secure"
              desc="Bank-grade security for your financial data."
            />
            <FeatureCard
              icon={<Zap />}
              title="AI-Powered"
              desc="ML models predict returns based on profile."
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl space-y-8 relative"
        >
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold">Welcome Back</h3>
            <p className="text-zinc-400">Sign in to access your personalized portfolio.</p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-3 bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-lg shadow-white/5"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">Trusted by 10k+ investors</span>
            </div>
          </div>

          <div className="flex justify-center space-x-8 opacity-50 grayscale">
            <PieChart size={24} />
            <TrendingUp size={24} />
            <ShieldCheck size={24} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
