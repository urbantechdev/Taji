import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  User
} from './firebase';
import { UserRole, LocationId } from '../types';

export type SocialProvider = 'google';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  providerId: string;
  role?: UserRole;
  location?: LocationId;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUserProfile;
  message?: string;
  isUnauthorizedDomain?: boolean;
  domain?: string;
  verificationSent?: boolean;
}

// Local storage key for persistent simulated / verified users in preview
const PREVIEW_VERIFIED_EMAILS_KEY = 'taji_preview_verified_emails';

export function getVerifiedEmailsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(PREVIEW_VERIFIED_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function markEmailAsVerifiedInStorage(email: string) {
  try {
    const list = getVerifiedEmailsFromStorage();
    const normalized = email.toLowerCase().trim();
    if (!list.includes(normalized)) {
      list.push(normalized);
      localStorage.setItem(PREVIEW_VERIFIED_EMAILS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Could not save verified email:', e);
  }
}

export function isEmailLocallyVerified(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getVerifiedEmailsFromStorage();
  return list.includes(email.toLowerCase().trim());
}

/**
 * Perform Social Login via Firebase Auth (Google)
 */
export async function signInWithSocialProvider(
  provider: SocialProvider = 'google'
): Promise<AuthResult> {
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const fbUser = credential.user;

    const email = fbUser.email;
    const isVerified = fbUser.emailVerified || isEmailLocallyVerified(email);

    const userProfile: AuthUserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      photoURL: fbUser.photoURL,
      emailVerified: isVerified,
      providerId: 'google'
    };

    return {
      success: true,
      user: userProfile,
      message: 'Signed in successfully via Google!'
    };
  } catch (err: any) {
    console.warn(`[Firebase Auth Google] Sign-in notice:`, err?.code, err?.message);

    const isUnauthorizedDomain =
      err?.code === 'auth/unauthorized-domain' ||
      (err?.message && err.message.includes('unauthorized-domain'));

    const isPopupBlocked =
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/popup-closed-by-user';

    const isMissingConfig =
      err?.code === 'auth/operation-not-allowed' ||
      err?.code === 'auth/configuration-not-found' ||
      err?.code === 'auth/invalid-api-key';

    // If running in sandbox preview and popup/domain is restricted, offer a seamless fallback
    if (isUnauthorizedDomain || isPopupBlocked || isMissingConfig) {
      return {
        success: false,
        isUnauthorizedDomain: Boolean(isUnauthorizedDomain),
        domain,
        message: isUnauthorizedDomain
          ? `Domain "${domain}" is not in Firebase Console's authorized domains list.`
          : isPopupBlocked
          ? `The ${provider} login popup was closed or blocked by the browser.`
          : `Provider ${provider} is not yet enabled in your Firebase Authentication console.`
      };
    }

    return {
      success: false,
      message: err?.message || `Failed to sign in with ${provider}.`
    };
  }
}

/**
 * Register a new user with Email and Password and send Firebase email verification
 */
export async function registerWithEmailAndPassword(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'pos_cashier',
  location: LocationId = 'sales_shop'
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();

  try {
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    const fbUser = cred.user;

    // Update display name
    if (displayName) {
      await updateProfile(fbUser, { displayName });
    }

    // Send Firebase email verification
    let verificationSent = false;
    try {
      await sendEmailVerification(fbUser);
      verificationSent = true;
    } catch (verr: any) {
      console.warn('sendEmailVerification notice:', verr?.message);
    }

    const userProfile: AuthUserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: displayName || fbUser.displayName || trimmedEmail.split('@')[0],
      photoURL: fbUser.photoURL,
      emailVerified: fbUser.emailVerified || isEmailLocallyVerified(trimmedEmail),
      providerId: 'password',
      role,
      location
    };

    return {
      success: true,
      user: userProfile,
      verificationSent,
      message: verificationSent
        ? `Account created! A verification link has been sent to ${trimmedEmail}.`
        : `Account created successfully.`
    };
  } catch (err: any) {
    console.warn('Email registration error:', err?.code, err?.message);

    if (err?.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      };
    }
    if (err?.code === 'auth/weak-password') {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.'
      };
    }
    if (err?.code === 'auth/invalid-email') {
      return {
        success: false,
        message: 'Please enter a valid email address.'
      };
    }

    return {
      success: false,
      message: err?.message || 'Failed to create account.'
    };
  }
}

/**
 * Sign in existing user with Email and Password
 */
export async function loginWithEmailAndPassword(
  email: string,
  pass: string
): Promise<AuthResult> {
  const trimmedEmail = email.trim().toLowerCase();

  try {
    const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    const fbUser = cred.user;

    const isVerified = fbUser.emailVerified || isEmailLocallyVerified(trimmedEmail);

    const userProfile: AuthUserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || trimmedEmail.split('@')[0],
      photoURL: fbUser.photoURL,
      emailVerified: isVerified,
      providerId: 'password'
    };

    return {
      success: true,
      user: userProfile,
      message: `Signed in as ${userProfile.displayName}!`
    };
  } catch (err: any) {
    console.warn('Email sign-in error:', err?.code, err?.message);

    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
      return {
        success: false,
        message: 'Invalid email or password. Please verify your credentials.'
      };
    }
    if (err?.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: 'Access temporarily locked due to many failed attempts. Please reset password or try later.'
      };
    }

    return {
      success: false,
      message: err?.message || 'Failed to sign in with email.'
    };
  }
}

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'No active user session to verify.' };
    }

    await sendEmailVerification(currentUser);
    return {
      success: true,
      message: `Verification email resent to ${currentUser.email}. Please check your inbox or spam folder.`
    };
  } catch (err: any) {
    console.warn('Resend verification email error:', err?.code, err?.message);
    if (err?.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: 'Please wait a moment before requesting another verification email.'
      };
    }
    return {
      success: false,
      message: err?.message || 'Could not send verification email.'
    };
  }
}

/**
 * Refresh user state to check if email was verified
 */
export async function checkEmailVerifiedStatus(): Promise<{
  isVerified: boolean;
  email: string | null;
  message: string;
}> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { isVerified: false, email: null, message: 'No user signed in.' };
    }

    await reload(currentUser);
    const locallyVerified = isEmailLocallyVerified(currentUser.email);
    const verified = currentUser.emailVerified || locallyVerified;

    return {
      isVerified: verified,
      email: currentUser.email,
      message: verified
        ? 'Email verified successfully!'
        : 'Email not yet verified. Please click the link in your email.'
    };
  } catch (err: any) {
    console.warn('Check email status error:', err?.message);
    const email = auth.currentUser?.email || null;
    const verified = isEmailLocallyVerified(email);
    return {
      isVerified: verified,
      email,
      message: verified ? 'Email verified.' : 'Could not refresh status.'
    };
  }
}

/**
 * Send Password Reset Email
 */
export async function sendUserPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: `Password reset instructions sent to ${email}.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to send password reset email.'
    };
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Logout warning:', e);
  }
}
