import { useState, useEffect } from 'react';

const AgentUI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'system', content: 'Agent initialized successfully', timestamp: '10:30:45' },
    { type: 'info', content: 'Connected to Mastra framework', timestamp: '10:30:46' },
    { type: 'success', content: 'All tools loaded and ready', timestamp: '10:30:47' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [agentStatus] = useState({
    model: 'GPT-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    isActive: true,
    confidence: 85.7
  });

  useEffect(() => {
    // Simulate connection to agent
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Simulate agent response
    setTimeout(() => {
      const responses = [
        'Analyzing market conditions...',
        'Based on current data, I recommend a cautious approach.',
        'ETH showing strong bullish momentum. Consider long position.',
        'Risk management protocols activated.',
        'Portfolio rebalancing suggested.',
      ];
      
      const agentResponse = {
        type: 'agent',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, agentResponse]);
    }, 1500);
  };

  const handleQuickCommand = (command: string) => {
    const commandMessage = {
      type: 'user',
      content: command,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, commandMessage]);
    
    // Simulate agent response based on command
    setTimeout(() => {
      let response = '';
      switch (command) {
        case '🔍 Analyze Market':
          response = 'Market analysis complete. Current trend: Bullish. BTC: $43,200 (+2.3%), ETH: $2,340 (+1.8%)';
          break;
        case '💼 Check Portfolio':
          response = 'Portfolio Status: $125,847 total value. Active positions: 7. Today\'s P&L: +$2,341';
          break;
        case '⚖️ Risk Assessment':
          response = 'Risk Level: MODERATE. Current exposure: 65% of max position. Stop losses active on all trades.';
          break;
        case '🎯 Set Strategy':
          response = 'Strategy updated: Conservative DCA with 2% position sizing. Risk management active.';
          break;
        default:
          response = 'Command executed successfully.';
      }
      
      const agentResponse = {
        type: 'agent',
        content: response,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, agentResponse]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-thin mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Agent Interface
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Direct communication with your autonomous trading agent
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-black rounded-3xl border border-gray-800 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <h3 className="text-xl font-semibold">Agent Cypher</h3>
                  </div>
                  <div className="text-sm text-gray-400">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'agent'
                        ? 'bg-purple-600/20 border border-purple-500/30 text-white'
                        : message.type === 'success'
                        ? 'bg-green-600/20 border border-green-500/30 text-green-300'
                        : message.type === 'system'
                        ? 'bg-gray-700/50 border border-gray-600/30 text-gray-300'
                        : 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-800">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message to the agent..."
                    className="flex-1 bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !inputMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Controls */}
          <div className="space-y-6">
            {/* Status Panel */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-3xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">Agent Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Model</span>
                  <span className="text-blue-400 font-mono">{agentStatus.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className={agentStatus.isActive ? 'text-green-400' : 'text-red-400'}>
                    {agentStatus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Confidence</span>
                  <span className="text-yellow-400">{agentStatus.confidence}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Temperature</span>
                  <span className="text-purple-400">{agentStatus.temperature}</span>
                </div>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-3xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">Quick Commands</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleQuickCommand('🔍 Analyze Market')}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-xl text-sm hover:from-green-600 hover:to-teal-700 transition-all duration-300"
                >
                  🔍 Analyze Market
                </button>
                <button 
                  onClick={() => handleQuickCommand('💼 Check Portfolio')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  💼 Check Portfolio
                </button>
                <button 
                  onClick={() => handleQuickCommand('⚖️ Risk Assessment')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-xl text-sm hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
                >
                  ⚖️ Risk Assessment
                </button>
                <button 
                  onClick={() => handleQuickCommand('🎯 Set Strategy')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl text-sm hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                >
                  🎯 Set Strategy
                </button>
              </div>
            </div>

            {/* External Links */}
            <div className="bg-gradient-to-br from-gray-900/80 to-black p-6 rounded-3xl border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">External Tools</h3>
              <div className="space-y-3">
                <a 
                  href="http://localhost:4444" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-indigo-500 to-blue-600 p-3 rounded-xl text-sm text-center hover:from-indigo-600 hover:to-blue-700 transition-all duration-300"
                >
                  🎮 Mastra Playground
                </a>
                <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 p-3 rounded-xl text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-300">
                  📊 TradingView
                </button>
                <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 p-3 rounded-xl text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-300">
                  🔗 Blockchain Explorer
                </button>
              </div>
            </div>

            {/* Emergency Controls */}
            <div className="bg-gradient-to-br from-red-900/30 to-black p-6 rounded-3xl border border-red-800/50">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Emergency Controls</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300">
                  🛑 Stop All Trading
                </button>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl text-sm hover:from-orange-600 hover:to-red-600 transition-all duration-300">
                  ⚠️ Close All Positions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentUI;
