import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { settingsService } from '@/services/settingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  User,
  Lock,
  Settings,
  Bell,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Loader2,
} from 'lucide-react';

type SettingsTab = 'profile' | 'password' | 'preferences' | 'notifications' | 'danger';

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'password' as const, label: 'Password', icon: Lock },
  { id: 'preferences' as const, label: 'Preferences', icon: Settings, teacherOnly: true },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle },
];

export default function SettingsPage() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Preferences state (Teacher only)
  const [sessionDuration, setSessionDuration] = useState('60');
  const [allowedRadius, setAllowedRadius] = useState([50]);
  const [lateThreshold, setLateThreshold] = useState('15');
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [isNotificationsSaving, setIsNotificationsSaving] = useState(false);

  // Danger Zone state
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'TEACHER';
  const memberSince = user?.createdAt ? new Date(user.createdAt) : new Date();

  const filteredTabs = tabs.filter(tab => !tab.teacherOnly || isTeacher);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings.defaultSessionDuration) setSessionDuration(settings.defaultSessionDuration.toString());
        if (settings.defaultAllowedRadius) setAllowedRadius([settings.defaultAllowedRadius]);
        if (settings.lateThresholdMinutes) setLateThreshold(settings.lateThresholdMinutes.toString());
        if (settings.emailNotifications !== undefined) setEmailNotifications(settings.emailNotifications);
        if (settings.sessionReminders !== undefined) setSessionReminders(settings.sessionReminders);
      } catch (error) {
        // Settings may not exist yet, use defaults
      }
    };
    loadSettings();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabel = passwordStrength <= 1 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';
  const strengthColor = passwordStrength <= 1 ? 'bg-destructive' : passwordStrength <= 3 ? 'bg-warning' : 'bg-success';

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      showToast('error', 'Name is required');
      return;
    }
    setIsProfileSaving(true);
    try {
      const updatedUser = await settingsService.updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
      });
      // Update AuthContext with new user data
      updateUser({ name: updatedUser.name, email: updatedUser.email });
      // Also refresh from server to ensure consistency
      await refreshUser();
      showToast('success', 'Profile updated', 'Your profile has been saved successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      showToast('error', 'Update failed', errorMessage);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast('error', 'Current password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('error', 'Invalid password', 'Current and new password cannot be the same');
      return;
    }
    if (passwordStrength <= 1) {
      showToast('error', 'Password too weak', 'Please use a stronger password');
      return;
    }
    setIsPasswordSaving(true);
    try {
      await settingsService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      showToast('success', 'Password updated', 'You will be logged out shortly');
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      showToast('error', 'Password change failed', errorMessage);
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsPreferencesSaving(true);
    try {
      await settingsService.updateSettings({
        defaultSessionDuration: parseInt(sessionDuration, 10),
        defaultAllowedRadius: allowedRadius[0],
        lateThresholdMinutes: parseInt(lateThreshold, 10),
      });
      showToast('success', 'Preferences saved', 'Your session preferences have been updated');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save preferences';
      showToast('error', 'Save failed', errorMessage);
    } finally {
      setIsPreferencesSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsNotificationsSaving(true);
    try {
      await settingsService.updateSettings({
        emailNotifications,
        sessionReminders,
      });
      showToast('success', 'Notifications updated');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update notifications';
      showToast('error', 'Update failed', errorMessage);
    } finally {
      setIsNotificationsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('success', 'Logged out from all devices');
    setShowLogoutAllModal(false);
    logout();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('error', 'Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      showToast('error', 'Please enter your password');
      return;
    }
    setIsDeleting(true);
    try {
      await settingsService.deleteAccount(deletePassword);
      showToast('success', 'Account deleted');
      setShowDeleteModal(false);
      logout();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete account';
      showToast('error', 'Deletion failed', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <div className="bg-card rounded-xl border border-border shadow-soft p-4">
            <nav className="space-y-1">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === 'danger';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left",
                      isActive && !isDanger && "bg-primary text-primary-foreground",
                      isActive && isDanger && "bg-destructive/10 text-destructive",
                      !isActive && isDanger && "text-destructive hover:bg-destructive/5",
                      !isActive && !isDanger && "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Profile Section */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border shadow-soft p-6"
              >
                <h2 className="text-xl font-display font-semibold mb-6">Profile Settings</h2>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">{user?.name}</p>
                    <p className="text-muted-foreground">{user?.role === 'TEACHER' ? 'Lecturer' : user?.role === 'STUDENT' ? 'Student' : user?.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role === 'TEACHER' ? 'Lecturer' : user?.role === 'STUDENT' ? 'Student' : user?.role || ''}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Member since: {format(memberSince, 'MMMM d, yyyy')}
                  </p>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={isProfileSaving}
                    className="mt-4"
                  >
                    {isProfileSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Password Section */}
            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border shadow-soft p-6"
              >
                <h2 className="text-xl font-display font-semibold mb-6">Change Password</h2>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10 relative z-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10 relative z-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                level <= passwordStrength ? strengthColor : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                        <p className={cn(
                          "text-xs",
                          passwordStrength <= 1 && "text-destructive",
                          passwordStrength > 1 && passwordStrength <= 3 && "text-warning",
                          passwordStrength > 3 && "text-success"
                        )}>
                          Password strength: {strengthLabel}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must contain uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 relative z-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mt-4">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                    <p className="text-sm text-warning">You will be logged out from other devices</p>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="mt-4"
                  >
                    {isPasswordSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Preferences Section (Teacher Only) */}
            {activeTab === 'preferences' && isTeacher && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border shadow-soft p-6"
              >
                <h2 className="text-xl font-display font-semibold mb-6">Session Preferences</h2>
                
                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label>Default Session Duration</Label>
                    <Select value={sessionDuration} onValueChange={setSessionDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">120 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Duration for new attendance sessions</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Default Allowed Radius</Label>
                    <Slider
                      value={allowedRadius}
                      onValueChange={setAllowedRadius}
                      min={10}
                      max={200}
                      step={5}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">10m</span>
                      <span className="font-medium text-primary">{allowedRadius[0]} meters</span>
                      <span className="text-muted-foreground">200m</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Distance students must be within to mark attendance</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Late Threshold</Label>
                    <Select value={lateThreshold} onValueChange={setLateThreshold}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="20">20 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Minutes after session start to mark as "Late"</p>
                  </div>

                  <Button
                    onClick={handleSavePreferences}
                    disabled={isPreferencesSaving}
                    className="mt-4"
                  >
                    {isPreferencesSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Notifications Section */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border shadow-soft p-6"
              >
                <h2 className="text-xl font-display font-semibold mb-6">Notification Preferences</h2>
                
                <div className="space-y-6 max-w-md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about attendance</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Session Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminded before scheduled sessions</p>
                    </div>
                    <Switch
                      checked={sessionReminders}
                      onCheckedChange={setSessionReminders}
                    />
                  </div>

                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isNotificationsSaving}
                    className="mt-4"
                  >
                    {isNotificationsSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Notification Settings
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Danger Zone Section */}
            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-xl font-display font-semibold">Danger Zone</h2>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Log Out From All Devices</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This will log you out from all browsers and devices where you're currently signed in.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setShowLogoutAllModal(true)}
                      >
                        Log Out All Devices
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Delete Account</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        className="mt-4"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Logout All Modal */}
      <Dialog open={showLogoutAllModal} onOpenChange={setShowLogoutAllModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Out From All Devices</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out from all devices? You will need to sign in again on each device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutAllModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogoutAll}>
              Log Out All Devices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm font-medium text-destructive">
                This action is permanent and cannot be undone!
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">All your data will be deleted:</p>
              <ul className="list-disc list-inside space-y-1">
                {isTeacher && <li>Your classes</li>}
                <li>Your attendance records</li>
                <li>Your enrollments</li>
                <li>Your account information</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deletePassword">Enter your password to confirm:</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteConfirm">Type "DELETE" to confirm:</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== 'DELETE' || !deletePassword}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
