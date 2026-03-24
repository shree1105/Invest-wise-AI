import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line,
  ReferenceLine, ZAxis, Legend
} from 'recharts';
import { Activity, TrendingUp, AlertCircle, CheckCircle2, BarChart2, Cpu } from 'lucide-react';
import mlDataset from '../data/ml-dataset.json';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataPoint {
  income: number;
  age: number;
  risk_score: number;
  investment_amount: number;
  tenure: number;
  predicted_return: number; // actual label from dataset (ground truth)
}

interface EvalResult {
  mse: number;
  rmse: number;
  mae: number;
  rSquared: number;
  accuracy: number; // within ±1% tolerance
  predictions: { actual: number; predicted: number; residual: number; index: number }[];
  featureImportance: { feature: string; coefficient: number; absCoeff: number }[];
  trainingSize: number;
  testingSize: number;
}

// ─── Model (mirrors server.ts exactly) ───────────────────────────────────────
const COEFFICIENTS = [0.00002, 0.05, 0.08, 0.00001, 0.1];
const INTERCEPT = 2.5;
const FEATURE_NAMES = ['Income', 'Age', 'Risk Score', 'Inv. Amount', 'Tenure'];

function predictReturn(features: number[]): number {
  return features.reduce((acc, val, i) => acc + val * COEFFICIENTS[i], INTERCEPT);
}

// ─── Evaluation Engine ────────────────────────────────────────────────────────
function evaluateModel(data: DataPoint[]): EvalResult {
  // 80/20 split
  const splitIdx = Math.floor(data.length * 0.8);
  const testSet = data.slice(splitIdx); // last 20% as test

  const predictions = testSet.map((d, i) => {
    const predicted = parseFloat(
      predictReturn([d.income, d.age, d.risk_score, d.investment_amount, d.tenure]).toFixed(2)
    );
    const actual = d.predicted_return; // ground truth label
    return { actual, predicted, residual: parseFloat((actual - predicted).toFixed(3)), index: splitIdx + i + 1 };
  });

  const n = predictions.length;
  const mse = predictions.reduce((sum, p) => sum + Math.pow(p.actual - p.predicted, 2), 0) / n;
  const mae = predictions.reduce((sum, p) => sum + Math.abs(p.actual - p.predicted), 0) / n;
  const meanActual = predictions.reduce((sum, p) => sum + p.actual, 0) / n;
  const ssTot = predictions.reduce((sum, p) => sum + Math.pow(p.actual - meanActual, 2), 0);
  const ssRes = predictions.reduce((sum, p) => sum + Math.pow(p.actual - p.predicted, 2), 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  // Accuracy: % of predictions within ±1% of actual
  const accurate = predictions.filter(p => Math.abs(p.actual - p.predicted) <= 1).length;
  const accuracy = (accurate / n) * 100;

  const featureImportance = FEATURE_NAMES.map((feature, i) => ({
    feature,
    coefficient: COEFFICIENTS[i],
    absCoeff: Math.abs(COEFFICIENTS[i]),
  })).sort((a, b) => b.absCoeff - a.absCoeff);

  return {
    mse: parseFloat(mse.toFixed(4)),
    rmse: parseFloat(Math.sqrt(mse).toFixed(4)),
    mae: parseFloat(mae.toFixed(4)),
    rSquared: parseFloat(rSquared.toFixed(4)),
    accuracy: parseFloat(accuracy.toFixed(1)),
    predictions,
    featureImportance,
    trainingSize: splitIdx,
    testingSize: n,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  status: 'good' | 'warn' | 'bad';
  icon: React.ReactNode;
  delay: number;
}> = ({ title, value, subtitle, status, icon, delay }) => {
  const colors = {
    good: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    warn: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    bad: 'text-red-500 bg-red-500/10 border-red-500/20',
  };
  const iconColors = { good: 'text-emerald-500', warn: 'text-amber-400', bad: 'text-red-500' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[status].split(' ').slice(1).join(' ')}`}>
          <span className={iconColors[status]}>{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${colors[status]}`}>
          {status === 'good' ? 'GOOD' : status === 'warn' ? 'FAIR' : 'NEEDS WORK'}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-zinc-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        <p className="text-xs text-zinc-600">{subtitle}</p>
      </div>
    </motion.div>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="space-y-1">
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-sm text-zinc-500">{subtitle}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ModelEvaluation: React.FC = () => {
  const [result, setResult] = useState<EvalResult | null>(null);

  useEffect(() => {
    const data = mlDataset as DataPoint[];
    setResult(evaluateModel(data));
  }, []);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Actual vs Predicted for scatter plot
  const scatterData = result.predictions.map(p => ({ x: p.actual, y: p.predicted, name: `Sample ${p.index}` }));

  // Perfect prediction reference line data
  const minVal = Math.min(...result.predictions.map(p => Math.min(p.actual, p.predicted)));
  const maxVal = Math.max(...result.predictions.map(p => Math.max(p.actual, p.predicted)));

  // Residuals bar chart
  const residualData = result.predictions.map(p => ({
    name: `S${p.index}`,
    residual: p.residual,
  }));

  // Feature importance bar chart
  const importanceData = result.featureImportance.map(f => ({
    name: f.feature,
    value: parseFloat((f.absCoeff * 1000).toFixed(3)), // scale for readability
    raw: f.coefficient,
  }));

  // Prediction comparison line chart
  const comparisonData = result.predictions.map((p, i) => ({
    sample: `S${p.index}`,
    actual: p.actual,
    predicted: p.predicted,
  }));

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Model Evaluation</h2>
          <p className="text-zinc-500 max-w-xl">
            Performance metrics for the Linear Regression model on the held-out test set.
            Dataset split: <span className="text-zinc-300 font-semibold">{result.trainingSize} training</span> /
            <span className="text-zinc-300 font-semibold"> {result.testingSize} testing</span> samples (80/20).
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-sm font-medium text-emerald-500">
          <Cpu size={16} />
          <span>Linear Regression</span>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Mean Squared Error (MSE)"
          value={result.mse.toFixed(4)}
          subtitle="Average squared difference between actual and predicted returns"
          status={result.mse < 2 ? 'good' : result.mse < 5 ? 'warn' : 'bad'}
          icon={<BarChart2 size={20} />}
          delay={0.05}
        />
        <MetricCard
          title="Root MSE (RMSE)"
          value={result.rmse.toFixed(4)}
          subtitle="RMSE in same units as return (%). Lower is better."
          status={result.rmse < 1.5 ? 'good' : result.rmse < 3 ? 'warn' : 'bad'}
          icon={<Activity size={20} />}
          delay={0.1}
        />
        <MetricCard
          title="R² Score"
          value={result.rSquared.toFixed(4)}
          subtitle="Proportion of variance explained. Closer to 1.0 is better."
          status={result.rSquared > 0.8 ? 'good' : result.rSquared > 0.5 ? 'warn' : 'bad'}
          icon={<TrendingUp size={20} />}
          delay={0.15}
        />
        <MetricCard
          title="Accuracy (±1% tol.)"
          value={`${result.accuracy}%`}
          subtitle="% of predictions within ±1% of the actual return value"
          status={result.accuracy >= 70 ? 'good' : result.accuracy >= 40 ? 'warn' : 'bad'}
          icon={<CheckCircle2 size={20} />}
          delay={0.2}
        />
      </div>

      {/* MAE badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center space-x-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl"
      >
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Mean Absolute Error (MAE)</p>
          <p className="text-xs text-zinc-500">Average absolute deviation between actual and predicted returns</p>
        </div>
        <span className="text-2xl font-black text-indigo-400">{result.mae.toFixed(4)}</span>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Actual vs Predicted Scatter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-5"
        >
          <SectionHeader
            title="Actual vs. Predicted Returns"
            subtitle="Points on the diagonal line indicate perfect predictions"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number" dataKey="x" name="Actual"
                  domain={[minVal - 0.5, maxVal + 0.5]}
                  stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                  label={{ value: 'Actual (%)', position: 'insideBottom', offset: -12, fill: '#71717a', fontSize: 10 }}
                />
                <YAxis
                  type="number" dataKey="y" name="Predicted"
                  domain={[minVal - 0.5, maxVal + 0.5]}
                  stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                  label={{ value: 'Predicted (%)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: 12 }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                {/* Perfect prediction diagonal */}
                <ReferenceLine
                  segment={[{ x: minVal - 0.5, y: minVal - 0.5 }, { x: maxVal + 0.5, y: maxVal + 0.5 }]}
                  stroke="#10b981" strokeDasharray="6 3" strokeOpacity={0.4}
                  label={{ value: 'Perfect', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }}
                />
                <Scatter data={scatterData} fill="#6366f1" opacity={0.85} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Residuals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-5"
        >
          <SectionHeader
            title="Residuals (Actual − Predicted)"
            subtitle="Values close to 0 indicate low error. No pattern = good fit."
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residualData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                  label={{ value: 'Residual (%)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }}
                />
                <ReferenceLine y={0} stroke="#52525b" strokeWidth={1.5} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Residual']}
                />
                <Bar dataKey="residual" radius={[4, 4, 0, 0]}>
                  {residualData.map((entry, index) => (
                    <Cell key={index} fill={entry.residual >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center space-x-6 text-xs text-zinc-500">
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> <span>Over-prediction (actual &gt; predicted)</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> <span>Under-prediction</span></span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Prediction Comparison Line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-5"
        >
          <SectionHeader
            title="Actual vs. Predicted (Line)"
            subtitle="How closely the model tracks actual returns across test samples"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="sample" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#71717a' }} />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: '#6366f1', r: 4 }} name="Predicted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Feature Importance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-5"
        >
          <SectionHeader
            title="Feature Importance (|Coefficient|)"
            subtitle="Which input features have the most influence on the prediction"
          />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={importanceData}
                layout="vertical"
                margin={{ top: 10, right: 30, bottom: 10, left: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false}
                  label={{ value: '|Coeff| × 1000', position: 'insideBottom', offset: -8, fill: '#71717a', fontSize: 10 }}
                />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v: number, _: string, props: any) => [
                    `Coeff: ${props.payload.raw}`,
                    props.payload.name
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {importanceData.map((_, index) => (
                    <Cell key={index} fill={['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Predictions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800">
          <SectionHeader
            title="Test Set — Sample-by-Sample Predictions"
            subtitle={`${result.testingSize} test samples with actual vs. predicted return and residual error`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Sample</th>
                <th className="px-6 py-4">Actual Return (%)</th>
                <th className="px-6 py-4">Predicted Return (%)</th>
                <th className="px-6 py-4">Residual (%)</th>
                <th className="px-6 py-4">Abs. Error (%)</th>
                <th className="px-6 py-4 text-right">Within ±1%?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {result.predictions.map((p) => {
                const absErr = Math.abs(p.residual);
                const withinTol = absErr <= 1;
                return (
                  <tr key={p.index} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-400">#{p.index}</td>
                    <td className="px-6 py-4 font-bold">{p.actual}%</td>
                    <td className="px-6 py-4 text-indigo-400 font-bold">{p.predicted}%</td>
                    <td className={`px-6 py-4 font-bold ${p.residual >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {p.residual >= 0 ? '+' : ''}{p.residual}%
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{absErr.toFixed(3)}%</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${withinTol ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {withinTol ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Interpretation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6"
      >
        <SectionHeader
          title="Interpretation & Limitations"
          subtitle="Understanding what these metrics mean for this model"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm text-zinc-400 leading-relaxed">
          <div className="space-y-2">
            <p className="font-bold text-zinc-200">MSE / RMSE</p>
            <p>MSE = <strong className="text-zinc-300">{result.mse}</strong> — low value relative to the return range (4–13%) suggests reasonable prediction accuracy. RMSE of <strong className="text-zinc-300">{result.rmse}%</strong> means predictions are off by ~{result.rmse}% on average.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-zinc-200">R² Score</p>
            <p>R² = <strong className="text-zinc-300">{result.rSquared}</strong> — {result.rSquared > 0.8 ? 'strong fit, the model explains most variance in the test data.' : result.rSquared > 0.5 ? 'moderate fit. The model captures general trends but misses some patterns.' : 'weak fit. The hardcoded coefficients do not align well with this dataset.'} A trained model would likely improve this significantly.</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-zinc-200">Accuracy (±1% Tolerance)</p>
            <p>Accuracy = <strong className="text-zinc-300">{result.accuracy}%</strong> — {result.accuracy >= 70 ? 'most predictions land within 1% of actual, which is acceptable for a return estimate.' : 'improvement needed. Consider training the model on more data or using a more complex algorithm like Gradient Boosting.'}</p>
          </div>
        </div>
        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl text-xs text-amber-300 leading-relaxed">
          <strong>Note:</strong> The current model uses hardcoded coefficients (not trained via gradient descent). For production use, consider training on a larger dataset using a proper ML pipeline (scikit-learn, TensorFlow.js, etc.) to optimize these coefficients and improve all metrics.
        </div>
      </motion.div>
    </div>
  );
};

export default ModelEvaluation;