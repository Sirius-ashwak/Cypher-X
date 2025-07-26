import { useState } from 'react';

const Dashboard = () => {
  const [metrics] = useState({
    totalReturn: '+23.8%',
    sharpeRatio: '1.47',
    tradesExecuted: 142,
    winRate: '78.3%',
    portfolioValue: '$125,847',
    dailyPnL: '+$2,341',
    activeTrades: 7,
    botStatus: 'Active'
  });

  const [recentTrades] = useState([
    { symbol: 'ETH/USDT', side: 'BUY', amount: '2.5 ETH', price: '$2,340', pnl: '+$234', time: '2 min ago' },
    { symbol: 'BTC/USDT', side: 'SELL', amount: '0.1 BTC', price: '$43,200', pnl: '+$420', time: '5 min ago' },
    { symbol: 'SOL/USDT', side: 'BUY', amount: '15 SOL', price: '$98.50', pnl: '+$145', time: '8 min ago' },
    { symbol: 'AVAX/USDT', side: 'SELL', amount: '25 AVAX', price: '$35.20', pnl: '-$89', time: '12 min ago' },
  ]);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-thin mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Mission Control
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Real-time monitoring and control of your autonomous trading agent
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-2xl border border-gray-800">
            <div className="text-3xl font-bold text-green-400 mb-2">{metrics.totalReturn}</div>
            <div className="text-gray-400">Total Return</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-2xl border border-gray-800">
            <div className="text-3xl font-bold text-blue-400 mb-2">{metrics.portfolioValue}</div>
            <div className="text-gray-400">Portfolio Value</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-2xl border border-gray-800">
            <div className="text-3xl font-bold text-purple-400 mb-2">{metrics.dailyPnL}</div>
            <div className="text-gray-400">Daily P&L</div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-2xl border border-gray-800">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{metrics.winRate}</div>
            <div className="text-gray-400">Win Rate</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Agent Status */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
              Agent Status
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Model</span>
                  <span className="text-blue-400 font-mono">GPT-4o-mini</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Status</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Confidence</span>
                  <span className="text-yellow-400">85.7%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Active Trades</span>
                  <span className="text-cyan-400">{metrics.activeTrades}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Tools</span>
                  <span className="text-purple-400">7 Active</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Workflows</span>
                  <span className="text-cyan-400">Ready</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Security</span>
                  <span className="text-green-400">Protected</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-black/50 rounded-xl">
                  <span className="text-gray-300">Sharpe Ratio</span>
                  <span className="text-blue-400">{metrics.sharpeRatio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <a 
                href="http://localhost:4444" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-center hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                🎮 Agent Playground
              </a>
              <button className="w-full bg-gradient-to-r from-green-500 to-teal-600 p-4 rounded-xl text-center hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105">
                🧠 Train Model
              </button>
              <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl text-center hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105">
                📊 Analytics
              </button>
              <button className="w-full bg-gradient-to-r from-red-500 to-pink-600 p-4 rounded-xl text-center hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                ⛔ Emergency Stop
              </button>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800 mb-12">
          <h3 className="text-2xl font-semibold mb-6">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-400">Side</th>
                  <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Price</th>
                  <th className="text-left py-3 px-4 text-gray-400">P&L</th>
                  <th className="text-left py-3 px-4 text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                    <td className="py-3 px-4 font-mono text-white">{trade.symbol}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{trade.amount}</td>
                    <td className="py-3 px-4 text-gray-300">{trade.price}</td>
                    <td className="py-3 px-4">
                      <span className={trade.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                        {trade.pnl}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{trade.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
          <h3 className="text-2xl font-semibold mb-6">Performance Chart</h3>
          <div className="h-64 bg-black/50 rounded-xl flex items-center justify-center border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <p className="text-gray-400">Real-time performance chart coming soon</p>
              <p className="text-sm text-gray-500 mt-2">Integration with TradingView or Chart.js</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
