import { FRONTEND_ROUTES } from "@/constants/endpoints";
import { resolveSiteUrl } from "@/lib/site";

export function electionPublicPath(slug: string): string {
  return FRONTEND_ROUTES.PUBLIC_ELECTION(slug);
}

export function electionRegisterPath(slug: string): string {
  return FRONTEND_ROUTES.PUBLIC_ELECTION_REGISTER(slug);
}

export function buildElectionPublicUrl(
  slug: string,
  origin = resolveSiteUrl(),
): string {
  return `${origin.replace(/\/$/, "")}${electionPublicPath(slug)}`;
}

export function buildElectionRegisterUrl(
  slug: string,
  origin = resolveSiteUrl(),
): string {
  return `${origin.replace(/\/$/, "")}${electionRegisterPath(slug)}`;
}
