import React, { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  BookOpen,
  UserPlus,
  Eye,
  EyeOff,
  QrCode,
  MapPin,
  BarChart3,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'STUDENT' | 'TEACHER';
  rememberMe: boolean;
  verificationCode: string;
  resetCode: string;
  newPassword: string;
  confirmNewPassword: string;
  // Student-specific fields
  indexNumber: string;
  session: string;
  program: string;
}

interface LoadingState {
  submit: boolean;
  verify: boolean;
  resend: boolean;
  reset: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const INITIAL_FORM_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  role: 'STUDENT',
  rememberMe: false,
  verificationCode: '',
  resetCode: '',
  newPassword: '',
  confirmNewPassword: '',
  // Student-specific fields
  indexNumber: '',
  session: '',
  program: '',
};

const INITIAL_LOADING_STATE: LoadingState = {
  submit: false,
  verify: false,
  resend: false,
  reset: false,
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// ============================================
// HELPER COMPONENTS
// ============================================

interface FeatureCardProps {
  icon: React.ReactNode;
  text: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, text }) => (
  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <p className="text-sm">{text}</p>
  </div>
);

interface FormErrorProps {
  message: string;
}

const FormError: React.FC<FormErrorProps> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive"
  >
    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <span>{message}</span>
  </motion.div>
);

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  helperText?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder = '••••••••',
  required = true,
  minLength,
  autoComplete = 'current-password',
  helperText,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle toggle with focus preservation for iOS Safari
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent focus loss on iOS
    onToggleShow();
    // Refocus the input after state change (helps iOS Safari)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-20 pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="!pl-12 pr-10 relative z-10 [&::-webkit-textfield-decoration-container]:hidden"
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          // iOS Safari compatibility: prevent autofill issues
          data-lpignore="true"
          data-form-type="other"
        />
        <button
          type="button"
          onClick={handleToggle}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur on iOS Safari
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-30 transition-colors touch-manipulation"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

interface CodeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  autoFocus?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength = 6,
  autoFocus = true,
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={maxLength}
      value={value}
      onChange={(e) => {
        const sanitized = e.target.value.replace(/\D/g, '').slice(0, maxLength);
        onChange(sanitized);
      }}
      placeholder={'0'.repeat(maxLength)}
      className="text-center text-2xl tracking-[0.5em] font-mono"
      autoFocus={autoFocus}
      autoComplete="one-time-code"
    />
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading: authLoading, isAuthenticated, user } = useAuth();

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState<LoadingState>(INITIAL_LOADING_STATE);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<AuthMode>('login');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Email for verification/reset flows
  const [pendingEmail, setPendingEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

  // ============================================
  // REDIRECT IF AUTHENTICATED
  // ============================================

  if (!authLoading && isAuthenticated && user) {
    const redirectPath = user.role === 'TEACHER' ? '/lecturer' : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // FORM HANDLERS
  // ============================================

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const clearError = () => setError('');

  const showError = (message: string) => {
    setError(message);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!PASSWORD_REGEX.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return null;
  };

  const getRedirectPath = (): string => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData?.role === 'TEACHER' ? '/lecturer' : '/student';
      }
    } catch {
      // Ignore parsing errors
    }
    return '/student';
  };

  // ============================================
  // AUTH HANDLERS
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      await login(form.email, form.password);
      updateForm({ password: '' });
      navigate(getRedirectPath());
    } catch (err: any) {
      updateForm({ password: '' });
      const message = err.response?.data?.message || err.message || 'Invalid email or password';

      // If error is about email verification, switch to verification mode
      if (err.response?.status === 403 && message.toLowerCase().includes('verify')) {
        setPendingEmail(form.email);
        setMode('verify');
        showError('Please enter the verification code sent to your email');
      } else {
        showError(message);
      }
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleSendVerificationCode = async () => {
    clearError();

    // Validation
    if (!form.name.trim() || form.name.length < 2) {
      showError('Name must be at least 2 characters');
      return;
    }

    if (!form.email) {
      showError('Please enter your email address');
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      await authService.sendPreRegistrationCode(form.email, form.name.trim(), form.role);
      setPendingEmail(form.email);
      setVerificationCodeSent(true);
      setMode('verify');
      showError(''); // Clear any errors
    } catch (err: any) {
      let message = err.response?.data?.message || err.message || 'Failed to send verification code';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (!form.name.trim() || form.name.length < 2) {
      showError('Name must be at least 2 characters');
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (!isEmailVerified) {
      showError('Please verify your email first');
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      const result = await register({
        email: form.email,
        password: form.password,
        name: form.name.trim(),
        role: form.role,
        // Student-specific fields
        ...(form.role === 'STUDENT' && {
          indexNumber: form.indexNumber.trim() || undefined,
          session: form.session.trim() || undefined,
          program: form.program.trim() || undefined,
        }),
      });

      updateForm({ password: '', confirmPassword: '' });
      navigate(getRedirectPath());
    } catch (err: any) {
      updateForm({ password: '', confirmPassword: '' });
      let message = err.response?.data?.message || err.message || 'Registration failed';

      // Improve error messages for better UX
      if (err.response?.status === 409) {
        message = 'This email is already registered. Please sign in instead or use a different email.';
      }

      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (form.verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }

    setLoading((prev) => ({ ...prev, verify: true }));

    try {
      await authService.verifyEmail({
        email: pendingEmail,
        code: form.verificationCode,
      });
      setIsEmailVerified(true);
      // If we're in signup flow, go back to signup form
      if (verificationCodeSent) {
        setMode('register');
        updateForm({ verificationCode: '' });
      } else {
        navigate(getRedirectPath());
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Verification failed';
      showError(message);
      updateForm({ verificationCode: '' });
    } finally {
      setLoading((prev) => ({ ...prev, verify: false }));
    }
  };

  const handleResendCode = async () => {
    clearError();
    setLoading((prev) => ({ ...prev, resend: true }));

    try {
      await authService.resendVerificationCode(pendingEmail);
      updateForm({ verificationCode: '' });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to resend code';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, resend: false }));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!form.email) {
      showError('Please enter your email address');
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      await authService.forgotPassword(form.email);
      setPendingEmail(form.email);
      setMode('reset');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to send reset code';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (form.resetCode.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }

    const passwordError = validatePassword(form.newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      showError('Passwords do not match');
      return;
    }

    setLoading((prev) => ({ ...prev, reset: true }));

    try {
      await authService.resetPassword({
        email: pendingEmail,
        code: form.resetCode,
        newPassword: form.newPassword,
      });

      // Reset form and go back to login
      setForm(INITIAL_FORM_STATE);
      setMode('login');
      setPendingEmail('');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to reset password';
      showError(message);
    } finally {
      setLoading((prev) => ({ ...prev, reset: false }));
    }
  };

  const goBack = () => {
    clearError();
    setForm(INITIAL_FORM_STATE);
    setPendingEmail('');
    setMode('login');
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderVerificationForm = () => (
    <motion.div
      key="verify"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit verification code to
          </p>
          <p className="font-medium text-primary mt-1">{pendingEmail}</p>
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && <FormError message={error} />}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleVerifyEmail} className="space-y-4 mt-4">
          <CodeInput
            id="verificationCode"
            label="Verification Code"
            value={form.verificationCode}
            onChange={(value) => updateForm({ verificationCode: value })}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading.verify || form.verificationCode.length !== 6}
          >
            {loading.verify ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify Email
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading.resend}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {loading.resend ? 'Sending...' : "Didn't receive code? Resend"}
            </button>

            <div>
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to registration
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderForgotPasswordForm = () => (
    <motion.div
      key="forgot"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we'll send you a reset code
          </p>
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && <FormError message={error} />}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="forgotEmail">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-0 pointer-events-none" />
              <Input
                id="forgotEmail"
                type="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                className="pl-10 relative z-10"
                required
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading.submit || !form.email}
          >
            {loading.submit ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Code'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to login
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderResetPasswordForm = () => (
    <motion.div
      key="reset"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
          <p className="text-muted-foreground text-sm">
            Enter the code sent to {pendingEmail}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && <FormError message={error} />}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
          <CodeInput
            id="resetCode"
            label="Reset Code"
            value={form.resetCode}
            onChange={(value) => updateForm({ resetCode: value })}
          />

          <PasswordInput
            id="newPassword"
            label="New Password"
            value={form.newPassword}
            onChange={(value) => updateForm({ newPassword: value })}
            show={showNewPassword}
            onToggleShow={() => setShowNewPassword(!showNewPassword)}
            autoComplete="new-password"
            minLength={8}
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          />

          <PasswordInput
            id="confirmNewPassword"
            label="Confirm New Password"
            value={form.confirmNewPassword}
            onChange={(value) => updateForm({ confirmNewPassword: value })}
            show={showConfirmNewPassword}
            onToggleShow={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            autoComplete="new-password"
            minLength={8}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              loading.reset ||
              form.resetCode.length !== 6 ||
              !form.newPassword ||
              !form.confirmNewPassword
            }
          >
            {loading.reset ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to login
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const renderAuthForm = () => {
    const isSignUp = mode === 'register';

    return (
      <motion.div
        key="auth"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-md"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">AttendEase</h1>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
              }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
                !isSignUp
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
              }}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
                isSignUp
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <div>
                <FormError message={error} />
                {error.toLowerCase().includes('verify') && mode === 'login' && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingEmail(form.email);
                        setMode('verify');
                        clearError();
                      }}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Enter verification code →
                    </button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={isSignUp ? handleRegister : handleLogin}
            className="space-y-5 mt-4"
          >
            {/* Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-20 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="!pl-12 relative z-10"
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-20 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.edu"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="!pl-12 relative z-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Role (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-20 pointer-events-none" />
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      updateForm({ role: value as 'STUDENT' | 'TEACHER' })
                    }
                  >
                    <SelectTrigger className="w-full !pl-12 h-10 bg-background border-input ring-offset-background">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Lecturer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Student-specific fields (Sign Up and STUDENT role only) */}
            {isSignUp && form.role === 'STUDENT' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="indexNumber">Index Number</Label>
                  <Input
                    id="indexNumber"
                    type="text"
                    placeholder="e.g., 4211231268"
                    value={form.indexNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateForm({ indexNumber: value });
                    }}
                    className="relative z-10"
                    pattern="\d{10}"
                    title="Please enter a 10-digit index number"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Must be exactly 10 digits
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session">Session</Label>
                  <div className="relative">
                    <Select
                      value={form.session}
                      onValueChange={(value) => updateForm({ session: value })}
                    >
                      <SelectTrigger className="w-full bg-background border-input ring-offset-background relative z-10">
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <div className="relative">
                    <Select
                      value={form.program}
                      onValueChange={(value) => updateForm({ program: value })}
                    >
                      <SelectTrigger className="w-full bg-background border-input ring-offset-background relative z-10">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Degree">Degree</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="MSc">MSc</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="MPhil">MPhil</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <PasswordInput
              id="password"
              label="Password"
              value={form.password}
              onChange={(value) => updateForm({ password: value })}
              show={showPassword}
              onToggleShow={() => setShowPassword(!showPassword)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={isSignUp ? 8 : undefined}
              helperText={
                isSignUp
                  ? 'Must be at least 8 characters with uppercase, lowercase, and number'
                  : undefined
              }
            />

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={(value) => updateForm({ confirmPassword: value })}
                show={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                autoComplete="new-password"
                minLength={8}
              />
            )}

            {/* Remember Me & Forgot Password (Login only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={form.rememberMe}
                    onCheckedChange={(checked) =>
                      updateForm({ rememberMe: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    clearError();
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Send Verification Code Button (Sign Up only, before verification) */}
            {isSignUp && !isEmailVerified && !verificationCodeSent && (
              <Button
                type="button"
                onClick={handleSendVerificationCode}
                className="w-full"
                size="lg"
                disabled={loading.submit || !form.email || !form.name.trim()}
              >
                {loading.submit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            )}

            {/* Email Verified Badge (Sign Up only) */}
            {isSignUp && isEmailVerified && (
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Email verified! You can now create your account.</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading.submit || (isSignUp && !isEmailVerified)}
            >
              {loading.submit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          {!isSignUp && (
            <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>Enter your credentials to continue</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Decorative (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <GraduationCap className="w-10 h-10" />
            </div>

            <h1 className="text-4xl font-bold mb-4">AttendEase</h1>
            <p className="text-xl opacity-90 mb-10">Smart Attendance System</p>

            {/* Features */}
            <div className="flex flex-col gap-4 text-left max-w-sm mx-auto">
              <FeatureCard
                icon={<QrCode className="w-5 h-5" />}
                text="Quick QR-based attendance marking"
              />
              <FeatureCard
                icon={<MapPin className="w-5 h-5" />}
                text="Location-verified attendance"
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                text="Real-time analytics and reports"
              />
            </div>
          </motion.div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {mode === 'verify' && renderVerificationForm()}
          {mode === 'forgot' && renderForgotPasswordForm()}
          {mode === 'reset' && renderResetPasswordForm()}
          {(mode === 'login' || mode === 'register') && renderAuthForm()}
        </AnimatePresence>
      </div>
    </div>
  );
}