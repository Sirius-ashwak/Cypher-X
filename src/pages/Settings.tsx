import { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    // Trading Settings
    maxPositionSize: 10000,
    stopLossPercentage: 5,
    takeProfitPercentage: 15,
    riskPerTrade: 2,
    maxDailyTrades: 10,
    
    // AI Settings
    model: 'GPT-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    confidenceThreshold: 80,
    
    // Security Settings
    apiKeyEncrypted: true,
    twoFactorAuth: true,
    sessionTimeout: 30,
    
    // Notification Settings
    emailNotifications: true,
    smsAlerts: false,
    pushNotifications: true,
    discordWebhook: '',
    
    // Network Settings
    mastraEndpoint: 'http://localhost:4444',
    recallApiKey: 'encrypted_key_here',
    gaiaNetwork: true,
    litProtocol: true,
  });

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset to default values
      setSettings({
        maxPositionSize: 10000,
        stopLossPercentage: 5,
        takeProfitPercentage: 15,
        riskPerTrade: 2,
        maxDailyTrades: 10,
        model: 'GPT-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
        confidenceThreshold: 80,
        apiKeyEncrypted: true,
        twoFactorAuth: true,
        sessionTimeout: 30,
        emailNotifications: true,
        smsAlerts: false,
        pushNotifications: true,
        discordWebhook: '',
        mastraEndpoint: 'http://localhost:4444',
        recallApiKey: 'encrypted_key_here',
        gaiaNetwork: true,
        litProtocol: true,
      });
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-thin mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Configure your autonomous trading agent
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Trading Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 text-blue-400">Trading Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Max Position Size ($)</label>
                <input
                  type="number"
                  value={settings.maxPositionSize}
                  onChange={(e) => handleInputChange('maxPositionSize', Number(e.target.value))}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Stop Loss (%)</label>
                  <input
                    type="number"
                    value={settings.stopLossPercentage}
                    onChange={(e) => handleInputChange('stopLossPercentage', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Take Profit (%)</label>
                  <input
                    type="number"
                    value={settings.takeProfitPercentage}
                    onChange={(e) => handleInputChange('takeProfitPercentage', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Risk per Trade (%)</label>
                  <input
                    type="number"
                    value={settings.riskPerTrade}
                    onChange={(e) => handleInputChange('riskPerTrade', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Max Daily Trades</label>
                  <input
                    type="number"
                    value={settings.maxDailyTrades}
                    onChange={(e) => handleInputChange('maxDailyTrades', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 text-purple-400">AI Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">AI Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="GPT-4o-mini">GPT-4o-mini</option>
                  <option value="GPT-4o">GPT-4o</option>
                  <option value="Claude-3">Claude-3</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={settings.temperature}
                    onChange={(e) => handleInputChange('temperature', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => handleInputChange('maxTokens', Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Confidence Threshold (%)</label>
                <input
                  type="number"
                  value={settings.confidenceThreshold}
                  onChange={(e) => handleInputChange('confidenceThreshold', Number(e.target.value))}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 text-green-400">Security Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">API Key Encryption</p>
                  <p className="text-sm text-gray-500">Encrypt stored API keys</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.apiKeyEncrypted}
                    onChange={(e) => handleInputChange('apiKeyEncrypted', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require 2FA for sensitive operations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', Number(e.target.value))}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Network & Integrations */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black p-8 rounded-3xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 text-yellow-400">Network & Integrations</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Mastra Endpoint</label>
                <input
                  type="url"
                  value={settings.mastraEndpoint}
                  onChange={(e) => handleInputChange('mastraEndpoint', e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Recall API Key</label>
                <input
                  type="password"
                  value={settings.recallApiKey}
                  onChange={(e) => handleInputChange('recallApiKey', e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">Gaia Network</p>
                  <p className="text-sm text-gray-500">Decentralized AI inference</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.gaiaNetwork}
                    onChange={(e) => handleInputChange('gaiaNetwork', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">Lit Protocol</p>
                  <p className="text-sm text-gray-500">Programmable key management</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.litProtocol}
                    onChange={(e) => handleInputChange('litProtocol', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex justify-center space-x-6">
          <button
            onClick={saveSettings}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-full text-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Save Settings
          </button>
          <button
            onClick={resetToDefaults}
            className="border border-gray-600 text-gray-300 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all duration-300"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Warning Notice */}
        <div className="mt-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/30 rounded-2xl p-6">
          <div className="flex items-start">
            <div className="text-2xl mr-4">⚠️</div>
            <div>
              <h4 className="text-yellow-400 font-semibold mb-2">Important Notice</h4>
              <p className="text-gray-300 text-sm">
                Changing these settings can significantly impact your trading performance and security. 
                Always test new configurations in a safe environment before deploying to live trading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
