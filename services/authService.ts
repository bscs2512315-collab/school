import apiInstance from "@/lib/api-instance";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type {
  LoginCredentials,
  StudentRegistrationData,
  SchoolRegistrationData,
  TeacherRegistrationData,
  VerifyOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@/types/auth";
import type {
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  VerifyOtpResponseData,
  ForgotPasswordResponseData,
  ResetPasswordResponseData,
} from "@/types/api";

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  async register(formData: StudentRegistrationData): Promise<ApiResponse<RegisterResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.REGISTER, formData);
  },

  async registerSchool(formData: SchoolRegistrationData): Promise<ApiResponse<RegisterResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.REGISTER_SCHOOL, formData);
  },

  async registerTeacher(formData: TeacherRegistrationData): Promise<ApiResponse<RegisterResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.REGISTER_TEACHER, formData);
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.VERIFY_OTP, payload);
  },

  async forgotPassword(email: string): Promise<ApiResponse<ForgotPasswordResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
    } as ForgotPasswordPayload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<ResetPasswordResponseData>> {
    return await apiInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },
};
