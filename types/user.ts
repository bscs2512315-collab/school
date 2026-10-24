import { UserRole, Board, Class, Gender } from "./enums";

/**
 * Base User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  class?: Class | null;
  board: Board;
  schoolName?: string | null;
  isVerified: boolean;
  points: number;
  rank?: number | null;
  profileImage?: string | null;
  username?: string | null;
  city?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student User interface
 * Extends base User with student-specific fields
 */
export interface StudentUser extends User {
  role: UserRole.STUDENT;
  class: Class;
  fatherName?: string | null;
  dob?: Date | null;
  gender?: Gender | null;
  schoolName: string;
}

/**
 * School User interface
 * Extends base User with school-specific fields
 */
export interface SchoolUser extends User {
  role: UserRole.SCHOOL;
  phone?: string | null;
  address?: string | null;
  studentCount?: string | null;
  class: null; // Schools don't have a class
}

/**
 * Admin User interface
 */
export interface AdminUser extends User {
  role: UserRole.ADMIN;
}

/**
 * User type union
 */
export type UserType = StudentUser | SchoolUser | AdminUser;

/**
 * User data stored in localStorage
 */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  class?: string;
  stream?: string | null;
  role: UserRole;
  board?: string | null;
  schoolName?: string | null;
  points?: number;
  city?: string | null;
  profileImage?: string;
  username?: string;
  phone?: string | null;
  address?: string | null;
  studentCount?: string | null;
  isVerified?: boolean;
  examStrictMode?: boolean;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  class: string | null;
  board: string | null;
  schoolName: string | null;
  phone: string | null;
  address: string | null;
  studentCount: string | null;
  points: number;
  rank: number | null;
  role: string;
  profileImage: string | null;
  username: string | null;
  city: string | null;
  fatherName: string | null;
  dob: string | null;
  gender: string | null;
  stream: string | null;
  subjects?: string[];
  classes?: string[];
  examStrictMode?: boolean;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  username?: string | null;
  profileImage?: string | null;
  points?: number;
  rank?: number | null;
  class?: string | null;
  schoolName?: string | null;
  [key: string]: unknown;
}

export interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  profileImage: string | null;
  city: string | null;
  class: string | null;
  points: number;
  role: string;
  isFollowing: boolean;
}

export interface UserSearchData {
  users: SearchUser[];
  total: number;
}

export interface FollowResponse {
  followersCount: number;
  isFollowing: boolean;
}

export interface UserProfileView {
  id: string;
  name: string;
  username: string | null;
  profileImage: string | null;
  city: string | null;
  class: string | null;
  board: string | null;
  schoolName: string | null;
  schoolLogo: string | null;
  points: number;
  rank: string | null;
  rankPosition: number;
  role: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
}

export interface FollowListUser {
  id: string;
  name: string;
  username: string | null;
  profileImage: string | null;
  city: string | null;
  class: string | null;
  points: number;
  role: string;
  isFollowing: boolean;
}

export interface FollowListData {
  users: FollowListUser[];
  total: number;
}
