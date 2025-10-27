/**
 * Avatar utility functions
 * Handles avatar validation, generation, and default assignment
 */

/**
 * Validates if a given string is a valid avatar URL
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's a valid HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
    
    // Check if it's an image URL (basic check)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    // Check if it's a data URL (base64 image)
    const isDataUrl = url.startsWith('data:image/');
    
    // Check if it's a UI Avatars URL (our default service)
    const isUIAvatars = url.includes('ui-avatars.com');
    
    return hasImageExtension || isDataUrl || isUIAvatars;
  } catch {
    return false;
  }
}

/**
 * Generates a personalized avatar URL based on user's name and gender
 */
export function generatePersonalizedAvatar(name: string, gender?: string | null): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  // Choose background color based on gender
  let backgroundColor = '4caf50'; // Default green
  if (gender === 'male') backgroundColor = '2196f3'; // Blue
  if (gender === 'female') backgroundColor = 'e91e63'; // Pink
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=fff&size=200&bold=true&format=png`;
}

/**
 * Gets a default avatar URL based on gender
 */
export function getDefaultAvatarByGender(gender?: string | null): string {
  switch (gender) {
    case 'male':
      return 'https://ui-avatars.com/api/?name=User&background=2196f3&color=fff&size=200&bold=true';
    case 'female':
      return 'https://ui-avatars.com/api/?name=User&background=e91e63&color=fff&size=200&bold=true';
    default:
      return 'https://ui-avatars.com/api/?name=User&background=4caf50&color=fff&size=200&bold=true';
  }
}

/**
 * Processes avatar URL for profile updates
 * Returns a valid avatar URL, assigning default if needed
 */
export function processAvatarForUpdate(
  avatarUrl: string | null | undefined,
  currentProfile?: { full_name?: string | null; gender?: string | null; email?: string | null }
): string {
  // If valid avatar provided, use it
  if (avatarUrl && isValidAvatarUrl(avatarUrl)) {
    return avatarUrl;
  }
  
  // Generate personalized avatar if user has name
  if (currentProfile?.full_name) {
    return generatePersonalizedAvatar(currentProfile.full_name, currentProfile.gender);
  }
  
  // Use email prefix if available
  if (currentProfile?.email) {
    const nameFromEmail = currentProfile.email.split('@')[0];
    return generatePersonalizedAvatar(nameFromEmail, currentProfile.gender);
  }
  
  // Fallback to gender-based default
  return getDefaultAvatarByGender(currentProfile?.gender);
}

/**
 * Avatar color constants
 */
export const AVATAR_COLORS = {
  MALE: '2196f3',      // Blue
  FEMALE: 'e91e63',    // Pink
  NEUTRAL: '4caf50',   // Green
  DEFAULT: 'cccccc'    // Gray
} as const;

/**
 * Avatar size constants
 */
export const AVATAR_SIZES = {
  SMALL: 64,
  MEDIUM: 128,
  LARGE: 200,
  XLARGE: 256
} as const;
