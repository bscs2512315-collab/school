import { Class, Board } from "./enums";

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Student Registration Data
 */
export interface StudentRegistrationData {
  name: string;
  fatherName: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  class: Class;
  stream?: string;
  schoolName: string;
  city: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * School Registration Data
 */
export interface SchoolRegistrationData {
  schoolName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  username: string;
  studentCount?: string;
  password: string;
  confirmPassword: string;
}

/**
 * Teacher Registration Data
 */
export interface TeacherRegistrationData {
  name: string;
  email: string;
  username: string;
  subjects: string[];
  classes: string[];
  schoolId?: string;
  schoolName: string;
  board: Board;
  password: string;
  confirmPassword: string;
}

/**
 * Verify OTP Payload
 */
export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

/**
 * Forgot Password Payload
 */
export interface ForgotPasswordPayload {
  email: string;
}

/**
 * Reset Password Payload
 */
export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}
