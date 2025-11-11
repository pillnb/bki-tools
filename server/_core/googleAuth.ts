// Google Auth is deprecated - using simplified auth system
// This file is kept for backwards compatibility but not actively used

export async function verifyGoogleToken(token: string) {
  console.warn('verifyGoogleToken is deprecated');
  return null;
}

export async function getGoogleUserInfo(code: string) {
  console.warn('getGoogleUserInfo is deprecated');
  return null;
}