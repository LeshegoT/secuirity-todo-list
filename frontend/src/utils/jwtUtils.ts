
import { jwtDecode } from "jwt-decode";

export interface DecodedUser {
  uuid: string;
  name: string;
  email: string;
  avatar?: string;
  exp?: number;
  roles: string[];
}

export const decodeToken = (token: string): DecodedUser | null => {
  if (!token) return null;
  try {
    return jwtDecode<DecodedUser>(token);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return true

    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  } catch (e) {
    return true
  }
}
 