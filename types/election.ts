import { ElectionStatus, Gender } from "@/types/enums";

export interface ElectionCandidate {
  id: string;
  electionId: string;
  name: string;
  category: string | null;
  gender: Gender | null;
  classLevel: string;
  profileImageUrl: string;
  symbolUrl: string | null;
  symbolName: string | null;
  voteCount?: number;
  createdAt: string;
}

export interface ElectionEvent {
  id: string;
  teacherId: string;
  name: string;
  slug: string;
  publicUrl: string;
  logoUrl: string | null;
  startsAt: string;
  endsAt: string;
  status: ElectionStatus;
  candidateCount: number;
  voteCount: number;
  categories: string[];
  registrationClosed: boolean;
  showLiveResults: boolean;
  resultsApprovedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionVote {
  id: string;
  electionId: string;
  candidateId: string;
  candidateName: string;
  candidateClassLevel: string;
  candidateCategory: string | null;
  candidateGender: Gender | null;
  candidateProfileImageUrl: string;
  voterName: string;
  voterRollNumber: string;
  voterSelfieUrl: string | null;
  discardedAt: string | null;
  discardedReason: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ElectionDetail extends ElectionEvent {
  candidates: ElectionCandidate[];
}

export interface ElectionTally {
  candidateId: string;
  candidateName: string;
  category: string | null;
  gender: Gender | null;
  profileImageUrl: string;
  symbolUrl: string | null;
  symbolName: string | null;
  voteCount: number;
  percentage: number;
}

export interface ElectionAnalytics {
  totalVotes: number;
  updatedAt: string;
  tallies: ElectionTally[];
}

export interface ElectionVotesPayload {
  votes: ElectionVote[];
  tallies: ElectionTally[];
}

export interface PublicElectionCandidate {
  id: string;
  name: string;
  classLevel: string;
  category: string | null;
  gender: Gender | null;
  profileImageUrl: string;
  symbolUrl: string | null;
  symbolName: string | null;
}

export interface PublicCandidateRegistration {
  name: string;
  slug: string;
  logoUrl: string | null;
  startsAt: string;
  endsAt: string;
  status: ElectionStatus;
  categories: string[];
  registrationClosed: boolean;
  showLiveResults?: boolean;
  resultsApprovedAt: string | null;
  candidates: PublicElectionCandidate[];
}

export interface PublicElection {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  startsAt: string;
  endsAt: string;
  status: ElectionStatus;
  categories: string[];
  registrationClosed: boolean;
  showLiveResults: boolean;
  resultsApprovedAt: string | null;
  candidates: PublicElectionCandidate[];
}
