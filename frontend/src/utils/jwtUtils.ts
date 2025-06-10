
import { jwtDecode } from "jwt-decode";

export interface DecodedUser {
  uuid: string;
  name: string;
  email: string;
  avatar?: string;
  exp?: number;
}

export const decodeToken = (token: string): DecodedUser | null => {
  if (!token) return null;
  try {
    console.log(jwtDecode<DecodedUser>(token))
    return jwtDecode<DecodedUser>(token);
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
};

 