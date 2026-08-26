import { useState } from 'react';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true, emailUpdates: true, darkMode: false, twoFactor: false,
    language: 'en', timezone: 'UTC',
  });

  const toggle = (key: string) => setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 mt-1">Manage your preferences</p></motion.div>

      <motion.div variants={item} className="card p-6 space-y-6">
        <div><h3 className="font-semibold text-lg mb-4">Notifications</h3></div>
        {[
          { key: 'notifications', label: 'Push Notifications', desc: 'Receive push notifications for events' },
          { key: 'emailUpdates', label: 'Email Updates', desc: 'Receive email updates about events' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div><p className="font-medium">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
            <button
              onClick={() => toggle(key)}
              className={`w-12 h-6 rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="card p-6 space-y-6">
        <h3 className="font-semibold text-lg">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select className="input-field" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select className="input-field" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="CET">Central European</option>
            </select>
          </div>
        </div>
        {[
          { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div><p className="font-medium">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
            <button
              onClick={() => toggle(key)}
              className={`w-12 h-6 rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex gap-3">
        <button className="btn-primary">Save Settings</button>
        <button className="btn-secondary">Reset to Default</button>
      </motion.div>
    </motion.div>
  );
}
