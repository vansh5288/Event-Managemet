import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import axios from 'axios';
import { User, UserRole } from '../models/User';
import { validate } from '../middleware/validate';
import { generateAccessToken, generateRefreshToken, generateOTP } from '../utils/tokens';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email';
import { AuthRequest, authenticate } from '../middleware/auth';
import { config } from '../config';

const router = Router();

interface OAuthProfile {
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'github';
}

/**
 * Find or create a user from an OAuth profile and return tokens.
 */
const handleOAuthLogin = async (profile: OAuthProfile) => {
  let user = await User.findOne({ email: profile.email });

  if (!user) {
    // Create a new user from the OAuth profile (email is already verified by the provider)
    const generatedPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    user = await User.create({
      name: profile.name,
      email: profile.email,
      password: generatedPassword,
      avatar: profile.avatar,
      isVerified: true,
    });
  } else if (!user.isVerified) {
    // OAuth users are verified by the provider
    user.isVerified = true;
    await user.save();
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  return { user, accessToken, refreshToken };
};

// Signup
router.post(
  '/signup',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const user = await User.create({ name, email, password });
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOTPEmail(email, otp);
      await sendWelcomeEmail(email, name);

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      res.status(201).json({
        success: true,
        message: 'Account created. Please verify your email with OTP.',
        data: { user, accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ success: false, message: 'Please verify your email first' });
      }

      user.lastLogin = new Date();
      await user.save();

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      res.json({
        success: true,
        message: 'Login successful',
        data: { user, accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify OTP
router.post(
  '/verify-otp',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Forgot Password
router.post(
  '/forgot-password',
  validate([body('email').isEmail().normalizeEmail().withMessage('Valid email is required')]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOTPEmail(email, otp);
      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
      next(error);
    }
  }
);

// Reset Password
router.post(
  '/reset-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      user.password = password;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ---- OAuth Routes ----

// Google OAuth login (exchange authorization code for tokens)
router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    if (!config.googleClientId || !config.googleClientSecret) {
      return res.status(400).json({ success: false, message: 'Google OAuth is not configured' });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl,
      grant_type: 'authorization_code',
    });

    const { access_token, id_token } = tokenResponse.data;

    // Verify the ID token to get user profile
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userInfoResponse.data;

    const result = await handleOAuthLogin({
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: 'google',
    });

    res.json({
      success: true,
      message: 'Google login successful',
      data: result,
    });
  } catch (error: any) {
    if (error?.response?.data?.error_description) {
      return res.status(400).json({ success: false, message: error.response.data.error_description });
    }
    next(error);
  }
});

// GitHub OAuth login (exchange authorization code for tokens)
router.post('/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    if (!config.githubClientId || !config.githubClientSecret) {
      return res.status(400).json({ success: false, message: 'GitHub OAuth is not configured' });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Failed to exchange GitHub code' });
    }

    // Get user profile
    const userInfoResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userInfoResponse.data;

    // GitHub emails are not public; fetch them separately
    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const emails = emailsResponse.data as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const email = emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email;

    if (!email) {
      return res.status(400).json({ success: false, message: 'GitHub account has no verified email' });
    }

    const result = await handleOAuthLogin({
      email,
      name: profile.name || profile.login,
      avatar: profile.avatar_url,
      provider: 'github',
    });

    res.json({
      success: true,
      message: 'GitHub login successful',
      data: result,
    });
  } catch (error: any) {
    if (error?.response?.data?.error_description) {
      return res.status(400).json({ success: false, message: error.response.data.error_description });
    }
    next(error);
  }
});

// Get OAuth configuration status (for client to show/hide buttons)
router.get('/oauth-config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      googleConfigured: !!(config.googleClientId && config.googleClientSecret),
      githubConfigured: !!(config.githubClientId && config.githubClientSecret),
    },
  });
});

export default router;
