export interface TeamInfo {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
}

export interface MemberInfo {
  id: number;
  displayName: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  password: string;
  displayName: string;
}

export interface JoinTeamRequest {
  inviteCode: string;
  displayName: string;
  /** Personal credential for this member - re-using an existing display name
   * re-authenticates as that member if it matches, instead of creating a
   * duplicate. */
  password: string;
}

/** Re-enter a team as its owner after losing the local session (e.g. a
 * reinstall) - uses the team password set at creation, not a per-member one. */
export interface OwnerLoginRequest {
  inviteCode: string;
  password: string;
}

export interface TeamAuthResponse {
  accessToken: string;
  team: TeamInfo;
  member: MemberInfo;
}

export interface RegenerateInviteRequest {
  password: string;
}

export interface UpdateMemberNameRequest {
  displayName: string;
}

export interface SetMemberAdminRequest {
  isAdmin: boolean;
}
