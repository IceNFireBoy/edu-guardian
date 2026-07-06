import React, { useState, useEffect, FC, ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMoon, FaInfoCircle, FaUser, FaFlask, FaCamera, FaSpinner } from 'react-icons/fa';
import { useUser } from '../features/user/useUser';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import { uploadAvatarImage } from '../utils/uploadImage';
import { getDevFlags, setDevFlag } from '../utils/devFlags';

interface SettingsCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const SettingsCard: FC<SettingsCardProps> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center mb-4">
      <span className="mr-3 text-primary dark:text-primary-light">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);

const ToggleSwitch: FC<{ on: boolean; onToggle: () => void; label: string }> = ({ on, onToggle, label }) => (
  <button
    onClick={onToggle}
    className="bg-gray-200 dark:bg-gray-700 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light"
    aria-pressed={on}
    aria-label={label}
  >
    <span
      className={`${on ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white dark:bg-slate-400'} inline-block h-4 w-4 transform rounded-full transition-transform`}
    />
  </button>
);

interface SettingsProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

const Settings: FC<SettingsProps> = ({ toggleDarkMode, darkMode }) => {
  const toast = useToast();
  const { profile, updateProfile, loading } = useUser();
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusGuard, setFocusGuard] = useState(() => getDevFlags().focusGuard);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the form once the profile arrives
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBiography(profile.biography ?? '');
    }
  }, [profile]);

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatarImage(file);
      const updated = await updateProfile({ profileImage: url });
      if (updated) toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Could not upload the photo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ name: name.trim(), biography: biography.trim() });
      if (updated) toast.success('Profile saved');
    } finally {
      setSaving(false);
    }
  };

  const toggleFocusGuard = () => {
    const next = !focusGuard;
    setFocusGuard(next);
    setDevFlag('focusGuard', next);
    toast.info(
      next
        ? 'Focus guard ON — switch tabs or click another window to see it in action.'
        : 'Focus guard off.'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize your EduGuardian experience
        </p>
      </div>

      {/* Profile */}
      <SettingsCard title="Profile" icon={<FaUser size={20} />}>
        {loading && !profile ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
            <FaSpinner className="animate-spin" /> Loading profile…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={profile?.profileImage} alt={profile?.name || 'You'} size="xl" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-white
                    shadow hover:bg-primary/90 disabled:opacity-60"
                >
                  {uploading ? <FaSpinner className="animate-spin" size={12} /> : <FaCamera size={12} />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickAvatar(e.target.files?.[0])}
                  data-testid="avatar-file-input"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-medium text-gray-800 dark:text-gray-100">{profile?.username}</p>
                <p>JPG/PNG up to 5 MB. No photo? Your initials are shown instead.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-name" className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Display name</label>
                <input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
                    bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="settings-bio" className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  id="settings-bio"
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Tell classmates a little about yourself…"
                  className="w-full text-sm px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700
                    bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        )}
      </SettingsCard>

      {/* Appearance */}
      <SettingsCard title="Appearance" icon={<FaMoon size={20} />}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Dark Mode</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Switch between light and dark theme
            </p>
          </div>
          <ToggleSwitch on={darkMode} onToggle={toggleDarkMode} label="Toggle Dark Mode" />
        </div>
      </SettingsCard>

      {/* Developer / Demo */}
      <SettingsCard title="Developer / Demo" icon={<FaFlask size={20} />}>
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Anti-cheat focus guard</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Demo mode: blurs the whole app and counts the switch whenever this tab loses focus
              (switching tabs or windows). Browsers don't allow pages to see what's open in OTHER
              tabs, so leaving-the-tab detection is the demonstrable equivalent.
            </p>
          </div>
          <ToggleSwitch on={focusGuard} onToggle={toggleFocusGuard} label="Toggle anti-cheat focus guard" />
        </div>
      </SettingsCard>

      <SettingsCard title="About EduGuardian" icon={<FaInfoCircle size={20} />}>
        <div className="text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none">
          <p>
            EduGuardian is a student-powered, secure, and gamified learning platform built to make quality education more accessible, collaborative, and enjoyable. Designed for uploading, organizing, and discovering academic notes, EduGuardian combines smart filtering, progress tracking, and community-driven features to help learners stay motivated and succeed—no matter where they start.
          </p>
          <p className="mt-4">
            Whether you're reviewing for an exam or contributing your own study materials, EduGuardian ensures that learning is always engaging, inclusive, and within reach.
          </p>
        </div>
      </SettingsCard>
    </motion.div>
  );
};

export default Settings;
