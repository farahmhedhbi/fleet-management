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
   // optionnel: si tu veux l’afficher / le modifier (si backend le renvoie)
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

  // ✅ IMPORTANT: envoyé si role=ROLE_DRIVER
  licenseNumber?: string;
};

export type InviteUserDTO = {
  firstName: string;
  lastName: string;
  email: string;
  role: RoleName;
  licenseNumber?: string; // obligatoire si ROLE_DRIVER
};
