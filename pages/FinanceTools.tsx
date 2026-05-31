// @ts-nocheck
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, PieChart as PieIcon, Calculator } from 'lucide-react';
import { Card, Button, Input, ComingSoon } from '../components/CommonUI';

const FinanceTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emi'>('dashboard');

  // --- Dashboard Data ---
  const spendingData = [
    { name: 'Rent', value: 1200, color: '#3b82f6' },
    { name: 'Food', value: 400, color: '#22c55e' },
    { name: 'Transport', value: 200, color: '#eab308' },
    { name: 'Ent', value: 300, color: '#ef4444' },
  ];

  const savingsTrend = [
    { month: 'Jan', amount: 5000 },
    { month: 'Feb', amount: 5500 },
    { month: 'Mar', amount: 5300 },
    { month: 'Apr', amount: 6000 },
    { month: 'May', amount: 6800 },
  ];

  // --- EMI Calculator Logic ---
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(10);
  const [tenure, setTenure] = useState(2); // years

  const calculateEMI = () => {
    const principal = loanAmount;
    const rate = interestRate / 12 / 100;
    const time = tenure * 12;
    if (principal <= 0 || rate <= 0 || time <= 0) return 0;
    const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
    return Math.round(emi);
  };

  const emi = calculateEMI();
  const totalAmount = emi * (tenure * 12);
  const totalInterest = totalAmount - loanAmount;

  return <ComingSoon title="Finance Tools" />;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Finance<span className="font-signature text-4xl text-primary-400">Hub</span></h1>
          <p className="text-gray-400"><span className="font-signature text-lg text-cyan-300">Manage wealth.</span> Plan futures.</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
          >Dashboard</button>
          <button
            onClick={() => setActiveTab('emi')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'emi' ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
          >Calculators</button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex items-center gap-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
              <div className="p-3 bg-white/20 rounded-lg"><DollarSign className="w-8 h-8" /></div>
              <div>
                <p className="text-blue-100 text-sm">Total Balance</p>
                <p className="text-2xl font-bold">$12,450.00</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="w-8 h-8" /></div>
              <div>
                <p className="text-gray-500 text-sm">Monthly Savings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">+$800.00</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><PieIcon className="w-8 h-8" /></div>
              <div>
                <p className="text-gray-500 text-sm">Budget Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">On Track</p>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-bold mb-4 font-heading text-white">Monthly <span className="font-signature text-xl text-indigo-300">Expenses</span></h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendingData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-sm mt-2">
                {spendingData.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-bold mb-4 font-heading text-white">Net Worth <span className="font-signature text-xl text-cyan-300">Trend</span></h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <div className="flex items-center gap-2 mb-6 text-primary-400">
              <Calculator />
              <h2 className="text-xl font-bold font-heading">EMI <span className="font-signature text-2xl">Calculator</span></h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Loan Amount ($)</label>
                <Input type="number" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} />
                <input type="range" min="1000" max="1000000" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                <Input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} />
                <input type="range" min="1" max="20" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tenure (Years)</label>
                <Input type="number" value={tenure} onChange={e => setTenure(Number(e.target.value))} />
                <input type="range" min="1" max="30" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full mt-2" />
              </div>
            </div>
          </Card>

          <Card className="bg-primary-50 dark:bg-gray-800 border-primary-100 dark:border-gray-700 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider font-signature text-lg">Monthly EMI</p>
                <p className="text-4xl font-bold text-primary-400 font-heading">${emi.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div>
                  <p className="text-gray-500 text-xs">Total Interest</p>
                  <p className="font-semibold text-red-500">${Math.round(totalInterest).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total Amount</p>
                  <p className="font-semibold text-gray-900 dark:text-white">${Math.round(totalAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full">Save Calculation</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinanceTools;