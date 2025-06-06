export const validateEmail = (email: unknown): email is string => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 255;
  };
  
  export const validatePassword = (password: unknown): password is string => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 12 && password.length <= 128;
  };
  
  export const validateName = (name: unknown): name is string => {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length >= 1 && name.trim().length <= 100;
  };
  
  export const validateUserId = (userId: unknown): userId is string => {
    if (!userId || typeof userId !== 'string') return false;
    // Simple UUID validation
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // return uuidRegex.test(userId);
    return /^\d+$/.test(userId);
  };
  export function validateUuid(uuid: string): boolean {
    return /^[0-9a-fA-F-]{36}$/.test(uuid);
  }
  
  export const validateTotpToken = (token: unknown): token is string => {
    if (!token || typeof token !== 'string') return false;
    return /^\d{6}$/.test(token);
  };
  
  export const sanitizeString = (str: unknown): string => {
    if (typeof str !== 'string') return '';
    return str.trim();
  };
  
  // Custom error classes
  export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  export class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
  
  export class DatabaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
    }
  }