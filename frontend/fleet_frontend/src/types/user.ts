// src/types/user.ts
export type RoleName =
  | "ROLE_ADMIN"
  | "ROLE_OWNER"
  | "ROLE_DRIVER"
  | "ROLE_API_CLIENT";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  createdAt?: string;
  licenseNumber?: string | null;
  enabled?: boolean;
  lastLoginAt?: string | null;
}

export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RoleName;
}

export type UpdateUserDTO = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: RoleName;
  password?: string;
  licenseNumber?: string;
};

export type InviteOwnerDTO = {
  firstName: string;
  lastName: string;
  email: string;
  role?: "ROLE_OWNER";
};