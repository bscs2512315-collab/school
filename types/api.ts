/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: string | ApiErrorDetail[];
  details?: unknown;
}

/**
 * API Error Detail (for validation errors)
 */
export interface ApiErrorDetail {
  message: string;
  path?: string[];
  code?: string;
}

/**
 * Standard API Response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Login API Response Data
 */
export interface LoginResponseData {
  user: {
    id: string;
    name: string;
    email: string;
    class?: string;
    role: string;
  };
}

/**
 * Register API Response Data
 */
export interface RegisterResponseData {
  email: string;
}

/**
 * Verify OTP Response Data
 */
export interface VerifyOtpResponseData {
  message: string;
}

/**
 * Forgot Password Response Data
 */
export interface ForgotPasswordResponseData {
  message: string;
}

/**
 * Reset Password Response Data
 */
export interface ResetPasswordResponseData {
  message: string;
}
