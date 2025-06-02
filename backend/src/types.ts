  
  export interface VerifyRequest {
    userId: string;
    token: string;
  }
  
  export interface VerifyResponse {
    verified: boolean;
  }
  
  export interface ValidateRequest {
    userId: string;
    token: string;
  }
  
  export interface ValidateResponse {
    validated: boolean;
  }
  
  export interface ErrorResponse {
    message: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    userId: string;
  }
  

  export interface RegisterResponse {
    id: number;
    secret: string;
  }
  
  export interface ErrorResponse {
    message: string;
  }
  export interface LoginResponse {
    id: number;
    name: string;
    email: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  