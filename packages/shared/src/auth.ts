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
