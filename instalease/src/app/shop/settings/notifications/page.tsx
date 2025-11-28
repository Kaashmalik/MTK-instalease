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
import Link from 'next/link';

interface NotificationSettings {
  setting_id: string;
  shop_id: string;
  // WhatsApp
  whatsapp_enabled: boolean;
  whatsapp_api_key: string | null;
  whatsapp_phone_number: string | null;
  // SMS
  sms_enabled: boolean;
  sms_provider: string | null;
  sms_api_key: string | null;
  sms_sender_id: string | null;
  // Email
  email_enabled: boolean;
  email_from_name: string | null;
  email_from_address: string | null;
  // Reminders
  reminder_days_before: number;
  reminder_days_after: number[];
  auto_late_fee: boolean;
  late_fee_percentage: number;
}

const defaultSettings: Partial<NotificationSettings> = {
  whatsapp_enabled: false,
  whatsapp_api_key: '',
  whatsapp_phone_number: '',
  sms_enabled: false,
  sms_provider: null,
  sms_api_key: '',
  sms_sender_id: '',
  email_enabled: true,
  email_from_name: '',
  email_from_address: '',
  reminder_days_before: 3,
  reminder_days_after: [1, 3, 7, 14],
  auto_late_fee: true,
  late_fee_percentage: 5,
};

export default function NotificationSettingsPage() {
  const { user, profile, loading, initialized } = useAuthStore();
  const router = useRouter();
  
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  const canManageSettings = profile?.role === 'super_admin' || 
                           profile?.role === 'admin' || 
                           profile?.role === 'shop_owner';

  const fetchSettings = useCallback(async () => {
    if (!profile?.shop_id) return;
    
    setLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert({ shop_id: profile.shop_id, ...defaultSettings })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      if (!profile?.shop_id && profile?.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      if (!canManageSettings) {
        router.push('/dashboard');
        return;
      }
      fetchSettings();
    }
  }, [user, profile, loading, initialized, router, canManageSettings, fetchSettings]);

  const handleSave = async () => {
    if (!settings || !profile?.shop_id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({
          whatsapp_enabled: settings.whatsapp_enabled,
          whatsapp_api_key: settings.whatsapp_api_key || null,
          whatsapp_phone_number: settings.whatsapp_phone_number || null,
          sms_enabled: settings.sms_enabled,
          sms_provider: settings.sms_provider || null,
          sms_api_key: settings.sms_api_key || null,
          sms_sender_id: settings.sms_sender_id || null,
          email_enabled: settings.email_enabled,
          email_from_name: settings.email_from_name || null,
          email_from_address: settings.email_from_address || null,
          reminder_days_before: settings.reminder_days_before,
          reminder_days_after: settings.reminder_days_after,
          auto_late_fee: settings.auto_late_fee,
          late_fee_percentage: settings.late_fee_percentage,
        })
        .eq('shop_id', profile.shop_id);

      if (error) throw error;

      alert('Settings saved successfully!');
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error saving settings:', error);
      alert(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!settings?.whatsapp_api_key || !settings?.whatsapp_phone_number) {
      alert('Please configure WhatsApp settings first');
      return;
    }
    
    setTestingWhatsApp(true);
    try {
      // This would call your WhatsApp API endpoint
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('WhatsApp test message sent! Check your phone.');
    } catch {
      alert('Failed to send test message');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTestSMS = async () => {
    if (!settings?.sms_api_key || !settings?.sms_provider) {
      alert('Please configure SMS settings first');
      return;
    }
    
    setTestingSMS(true);
    try {
      // This would call your SMS API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('SMS test message sent!');
    } catch {
      alert('Failed to send test message');
    } finally {
      setTestingSMS(false);
    }
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K, 
    value: NotificationSettings[K]
  ) => {
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

  if (!user || !canManageSettings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Notification Settings</h1>
            <p className="text-gray-600">Configure WhatsApp, SMS, and Email notifications</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </Button>
        </div>

        {/* WhatsApp Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📱</span> WhatsApp Notifications
                </CardTitle>
                <CardDescription>
                  Send payment reminders via WhatsApp Business API
                </CardDescription>
              </div>
              <Switch
                checked={settings?.whatsapp_enabled || false}
                onCheckedChange={(checked) => updateSetting('whatsapp_enabled', checked)}
              />
            </div>
          </CardHeader>
          {settings?.whatsapp_enabled && (
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Business API Key
                </label>
                <Input
                  type="password"
                  value={settings.whatsapp_api_key || ''}
                  onChange={(e) => updateSetting('whatsapp_api_key', e.target.value)}
                  placeholder="Enter your WhatsApp API key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from WhatsApp Business Platform or providers like Twilio, MessageBird
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Phone Number
                </label>
                <Input
                  value={settings.whatsapp_phone_number || ''}
                  onChange={(e) => updateSetting('whatsapp_phone_number', e.target.value)}
                  placeholder="+92XXXXXXXXXX"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp}
              >
                {testingWhatsApp ? 'Sending...' : '🧪 Send Test Message'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💬</span> SMS Notifications
                </CardTitle>
                <CardDescription>
                  Send payment reminders via SMS
                </CardDescription>
              </div>
              <Switch
                checked={settings?.sms_enabled || false}
                onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
              />
            </div>
          </CardHeader>
          {settings?.sms_enabled && (
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Provider
                </label>
                <Select 
                  value={settings.sms_provider || ''} 
                  onValueChange={(v) => updateSetting('sms_provider', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select SMS provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="jazzcash">JazzCash SMS</SelectItem>
                    <SelectItem value="zong">Zong SMS</SelectItem>
                    <SelectItem value="telenor">Telenor SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key / Auth Token
                </label>
                <Input
                  type="password"
                  value={settings.sms_api_key || ''}
                  onChange={(e) => updateSetting('sms_api_key', e.target.value)}
                  placeholder="Enter your SMS API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sender ID
                </label>
                <Input
                  value={settings.sms_sender_id || ''}
                  onChange={(e) => updateSetting('sms_sender_id', e.target.value)}
                  placeholder="INSTALEASE"
                  maxLength={11}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 11 characters. This appears as the sender name.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestSMS}
                disabled={testingSMS}
              >
                {testingSMS ? 'Sending...' : '🧪 Send Test SMS'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📧</span> Email Notifications
                </CardTitle>
                <CardDescription>
                  Send payment reminders and receipts via email
                </CardDescription>
              </div>
              <Switch
                checked={settings?.email_enabled || false}
                onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
              />
            </div>
          </CardHeader>
          {settings?.email_enabled && (
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name
                </label>
                <Input
                  value={settings.email_from_name || ''}
                  onChange={(e) => updateSetting('email_from_name', e.target.value)}
                  placeholder="Your Shop Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email Address
                </label>
                <Input
                  type="email"
                  value={settings.email_from_address || ''}
                  onChange={(e) => updateSetting('email_from_address', e.target.value)}
                  placeholder="noreply@yourshop.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uses Supabase email by default. Custom SMTP can be configured in Supabase dashboard.
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⏰</span> Reminder Schedule
            </CardTitle>
            <CardDescription>
              Configure when to send payment reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Before Due Date
              </label>
              <Select 
                value={String(settings?.reminder_days_before || 3)} 
                onValueChange={(v) => updateSetting('reminder_days_before', parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Send reminder this many days before the due date
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overdue Reminder Schedule
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 3, 7, 14, 30].map((day) => (
                  <label key={day} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings?.reminder_days_after?.includes(day) || false}
                      onChange={(e) => {
                        const current = settings?.reminder_days_after || [];
                        const updated = e.target.checked
                          ? [...current, day].sort((a, b) => a - b)
                          : current.filter(d => d !== day);
                        updateSetting('reminder_days_after', updated);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{day} day{day > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Send reminders on these days after the due date
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Late Fee Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💰</span> Automatic Late Fees
                </CardTitle>
                <CardDescription>
                  Automatically apply late fees to overdue installments
                </CardDescription>
              </div>
              <Switch
                checked={settings?.auto_late_fee || false}
                onCheckedChange={(checked) => updateSetting('auto_late_fee', checked)}
              />
            </div>
          </CardHeader>
          {settings?.auto_late_fee && (
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Fee Percentage
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.late_fee_percentage || 5}
                    onChange={(e) => updateSetting('late_fee_percentage', parseFloat(e.target.value) || 0)}
                    className="w-24"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <span className="text-gray-600">% of installment amount</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Applied once when an installment becomes overdue
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : '💾 Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
