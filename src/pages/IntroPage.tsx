import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const IntroPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className={`text-center z-10 max-w-6xl mx-auto px-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <h1 className="text-7xl md:text-9xl font-thin mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Project
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-light">
              Cypher
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Autonomous AI Trading Agent
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Competing in the Autonomous Apes AI Agent Trading Hackathon with cutting-edge LSTM neural networks, 
            decentralized inference, and bulletproof security protocols.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/dashboard"
              className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              View Dashboard
            </Link>
            <Link 
              to="/agent"
              className="border border-white/30 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              Test Agent →
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-thin mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Engineered for Excellence
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Every component designed for maximum performance, security, and autonomous intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="group">
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl border border-gray-800 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="text-5xl mb-6">🧠</div>
                <h3 className="text-2xl font-semibold mb-4 text-white">LSTM Neural Networks</h3>
                <p className="text-gray-400 leading-relaxed">
                  Advanced long short-term memory networks trained on historical market data for precise price prediction and trend analysis.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl border border-gray-800 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="text-5xl mb-6">🔒</div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Lit Protocol Security</h3>
                <p className="text-gray-400 leading-relaxed">
                  Programmable key pairs and decentralized access control ensuring your trades are executed with military-grade security.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl border border-gray-800 hover:border-green-500/50 transition-all duration-500 transform hover:scale-105">
                <div className="text-5xl mb-6">⚡</div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Gaia Inference</h3>
                <p className="text-gray-400 leading-relaxed">
                  Decentralized model inference on the Gaia network for censorship-resistant and high-performance AI computations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900/50 to-black relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-thin mb-8">
                <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Technology Stack
                </span>
              </h2>
              
              <div className="space-y-8">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Mastra Framework</h3>
                  <p className="text-gray-400">Advanced AI agent orchestration and tool management</p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold text-white mb-2">GPT-4o Mini</h3>
                  <p className="text-gray-400">State-of-the-art language model for trading decisions</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Vincent AI Tools</h3>
                  <p className="text-gray-400">Secure blockchain interactions with policy guardrails</p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Recall Network</h3>
                  <p className="text-gray-400">Performance tracking and leaderboard integration</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-3xl border border-gray-700">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/50 p-6 rounded-2xl">
                    <div className="text-3xl font-bold text-green-400 mb-2">99.7%</div>
                    <div className="text-gray-300">Uptime</div>
                  </div>
                  <div className="bg-black/50 p-6 rounded-2xl">
                    <div className="text-3xl font-bold text-blue-400 mb-2">&lt;50ms</div>
                    <div className="text-gray-300">Latency</div>
                  </div>
                  <div className="bg-black/50 p-6 rounded-2xl">
                    <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                    <div className="text-gray-300">Monitoring</div>
                  </div>
                  <div className="bg-black/50 p-6 rounded-2xl">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">∞</div>
                    <div className="text-gray-300">Scalability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-thin mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Ready to Launch?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Experience the future of autonomous trading with Project Cypher.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/dashboard"
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-full text-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Enter Dashboard
            </Link>
            <Link 
              to="/agent"
              className="border border-white/30 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              Test Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntroPage;
