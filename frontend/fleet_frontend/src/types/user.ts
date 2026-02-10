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
  role: RoleName; // backend: "ROLE_OWNER" etc
  createdAt?: string;
}

export interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RoleName;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string; // optionnel
  role?: RoleName;
}
