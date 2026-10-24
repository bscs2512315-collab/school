export interface LeaderboardUser {
  id: string;
  name: string;
  schoolName: string;
  schoolLogo?: string | null;
  points: number;
  class: string;
  city: string;
  profilePicture: string | null;
  username?: string;
}

export interface LeaderboardSchool {
  id: string;
  name: string;
  points: number;
  studentCount: number;
  logoUrl?: string | null;
  city?: string | null;
}
