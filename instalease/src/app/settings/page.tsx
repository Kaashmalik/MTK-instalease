'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Footer } from '@/components/ui/footer';
import Link from 'next/link';

interface UserSettings {
  setting_id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  primary_color: string;
  sidebar_collapsed: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  language: string;
  date_format: string;
  currency_format: string;
  timezone: string;
}

const defaultSettings: Partial<UserSettings> = {
  theme: 'system',
  primary_color: 'blue',
  sidebar_collapsed: false,
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  language: 'en',
  date_format: 'DD/MM/YYYY',
  currency_format: 'PKR',
  timezone: 'Asia/Karachi',
};

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
];

export default function SettingsPage() {
  const { user, profile, loading, initialized, refreshProfile } = useAuthStore();
  const router = useRouter();
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    
    setLoadingSettings(true);
    try {
      // Try to get or create settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ...defaultSettings })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use defaults if fetch fails
      setSettings({ user_id: user.id, ...defaultSettings } as UserSettings);
    } finally {
      setLoadingSettings(false);
    }
  }, [user]);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchSettings();
      // Initialize profile form
      if (profile) {
        setProfileForm({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
        });
      }
    }
  }, [user, profile, loading, initialized, router, fetchSettings]);

  const handleSaveSettings = async () => {
    if (!settings || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: settings.theme,
          primary_color: settings.primary_color,
          sidebar_collapsed: settings.sidebar_collapsed,
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          sms_notifications: settings.sms_notifications,
          language: settings.language,
          date_format: settings.date_format,
          currency_format: settings.currency_format,
          timezone: settings.timezone,
        });

      if (error) throw error;

      // Apply theme
      applyTheme(settings.theme);
      
      alert('Settings saved successfully!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error saving settings:', error);
      alert(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase.rpc('update_user_profile', {
        p_full_name: profileForm.full_name || null,
        p_phone: profileForm.phone || null,
        p_avatar_url: profileForm.avatar_url || null,
      });

      if (error) throw error;

      await refreshProfile();
      alert('Profile updated successfully!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error saving profile:', error);
      alert(`Error: ${err.message || 'Failed to save profile'}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileForm({ ...profileForm, avatar_url: urlData.publicUrl });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error uploading avatar:', error);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading || !initialized || loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
            <TabsTrigger value="appearance">🎨 Appearance</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {profileForm.avatar_url ? (
                        <img 
                          src={profileForm.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-gray-400">👤</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <div>
                    <label htmlFor="avatar-upload">
                      <Button variant="outline" disabled={uploadingAvatar} asChild>
                        <span>{uploadingAvatar ? 'Uploading...' : 'Change Avatar'}</span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      value={profile?.username || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      value={user.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>
                </div>

                {/* Role & Shop Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Role:</span>
                      <span className="font-medium capitalize">{profile?.role?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shop:</span>
                      <span className="font-medium">{profile?.shop_id ? 'Assigned' : 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Member Since:</span>
                      <span className="font-medium">
                        {profile?.created_at && new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : '💾 Save Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how InstalEase looks for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['light', 'dark', 'system'].map((theme) => (
                      <div
                        key={theme}
                        onClick={() => updateSetting('theme', theme as 'light' | 'dark' | 'system')}
                        className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${
                          settings?.theme === theme
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">
                          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
                        </div>
                        <span className="font-medium capitalize">{theme}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Primary Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        onClick={() => updateSetting('primary_color', color.value)}
                        className={`w-12 h-12 rounded-full cursor-pointer transition-all ${color.class} ${
                          settings?.primary_color === color.value
                            ? 'ring-4 ring-offset-2 ring-gray-400'
                            : 'hover:scale-110'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Collapsed Sidebar
                    </label>
                    <p className="text-xs text-gray-500">
                      Start with a minimized sidebar
                    </p>
                  </div>
                  <Switch
                    checked={settings?.sidebar_collapsed || false}
                    onCheckedChange={(checked) => updateSetting('sidebar_collapsed', checked)}
                  />
                </div>

                {/* Regional Settings */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <Select 
                      value={settings?.language || 'en'} 
                      onValueChange={(v) => updateSetting('language', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">اردو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <Select 
                      value={settings?.date_format || 'DD/MM/YYYY'} 
                      onValueChange={(v) => updateSetting('date_format', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <Select 
                      value={settings?.currency_format || 'PKR'} 
                      onValueChange={(v) => updateSetting('currency_format', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">PKR (₨)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Appearance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        📧 Email Notifications
                      </label>
                      <p className="text-xs text-gray-500">
                        Receive updates and reminders via email
                      </p>
                    </div>
                    <Switch
                      checked={settings?.email_notifications || false}
                      onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        🔔 Push Notifications
                      </label>
                      <p className="text-xs text-gray-500">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings?.push_notifications || false}
                      onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        💬 SMS Notifications
                      </label>
                      <p className="text-xs text-gray-500">
                        Receive important alerts via SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings?.sms_notifications || false}
                      onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Notifications'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer variant="dashboard" />
    </div>
  );
}
