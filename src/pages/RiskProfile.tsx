import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { ShieldCheck, User as UserIcon, Wallet, Activity, Save, Loader2, Sparkles } from 'lucide-react';

const RiskProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    income: 50000,
    age: 25,
    savings: 10000,
    riskTolerance: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const profileRef = doc(db, 'profiles', user.uid);
      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            income: data.income,
            age: data.age,
            savings: data.savings,
            riskTolerance: data.riskTolerance,
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [user]);

  const calculateRiskScore = (data: typeof formData) => {
    let score = 0;
    // Age factor (younger = higher risk tolerance)
    score += Math.max(0, 100 - data.age) * 0.3;
    // Income factor
    score += Math.min(100, (data.income / 100000) * 100) * 0.3;
    // Savings factor
    score += Math.min(100, (data.savings / 50000) * 100) * 0.2;
    // Explicit tolerance
    if (data.riskTolerance === 'high') score += 20;
    else if (data.riskTolerance === 'medium') score += 10;
    
    return Math.min(100, Math.round(score));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);

    const riskScore = calculateRiskScore(formData);

    try {
      // 1. Call ML Prediction API
      const predictRes = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: formData.income,
          age: formData.age,
          risk_score: riskScore,
          investment_amount: formData.savings * 0.5, // Assume 50% of savings for prediction
          tenure: 10, // Default 10 years
        }),
      });
      const predictData = await predictRes.json();
      setPrediction(predictData.predicted_return);

      // 2. Save Profile
      const profileRef = doc(db, 'profiles', user.uid);
      const profileData = {
        uid: user.uid,
        ...formData,
        riskScore,
        updatedAt: Timestamp.now(),
      };
      await setDoc(profileRef, profileData);

      // 3. Generate Recommendation based on risk
      let recType = 'Mutual Funds';
      let reason = 'Based on your medium risk profile, mutual funds offer a balanced growth potential.';
      if (formData.riskTolerance === 'low') {
        recType = 'Fixed Deposits';
        reason = 'Your low risk tolerance suggests stable, guaranteed returns through fixed deposits.';
      } else if (formData.riskTolerance === 'high') {
        recType = 'Stocks';
        reason = 'With high risk tolerance, you can capitalize on market volatility for superior returns.';
      }

      await addDoc(collection(db, 'recommendations'), {
        uid: user.uid,
        type: recType,
        reason,
        predictedReturn: predictData.predicted_return,
        date: Timestamp.now(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tight">Financial Profile</h2>
        <p className="text-zinc-500">Help us understand your financial goals and risk appetite to provide better recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center space-x-2">
                  <Wallet size={16} />
                  <span>Annual Income ($)</span>
                </label>
                <input
                  type="number"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center space-x-2">
                  <UserIcon size={16} />
                  <span>Age</span>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center space-x-2">
                  <Activity size={16} />
                  <span>Current Savings ($)</span>
                </label>
                <input
                  type="number"
                  value={formData.savings}
                  onChange={(e) => setFormData({ ...formData, savings: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center space-x-2">
                  <ShieldCheck size={16} />
                  <span>Risk Tolerance</span>
                </label>
                <select
                  value={formData.riskTolerance}
                  onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                  className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  <option value="low">Low (Conservative)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="high">High (Aggressive)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              <span>{loading ? 'Processing...' : 'Save & Analyze Profile'}</span>
            </button>

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-center font-bold"
              >
                Profile updated successfully! New recommendations generated.
              </motion.div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <Sparkles className="text-emerald-500" size={20} />
              <span>AI Analysis</span>
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-zinc-500 font-medium">Calculated Risk Score</p>
                <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateRiskScore(formData)}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <p className="text-right text-xs font-bold text-emerald-500">{calculateRiskScore(formData)}/100</p>
              </div>

              {prediction && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-1">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Predicted Return</p>
                  <p className="text-3xl font-black text-emerald-500">{prediction}%</p>
                  <p className="text-xs text-zinc-600">Based on ML Linear Regression model</p>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Our AI model analyzes your income, age, and savings to predict the most likely return on your investments over a 10-year horizon.
                </p>
                <div className="flex items-center space-x-2 text-xs text-zinc-500">
                  <ShieldCheck size={14} />
                  <span>Data is encrypted and secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskProfile;
