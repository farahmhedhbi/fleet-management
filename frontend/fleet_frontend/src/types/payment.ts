export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE";

export type PaymentStatus =
  | "PENDING_OWNER_PROOF"
  | "PENDING_ADMIN_CASH_PROOF"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "REJECTED";

export type CreateOwnerPaymentRequest = {
  method: PaymentMethod;
  amount: number;
  months: number;
  reference?: string;
  note?: string;
};

export type PaymentDecisionRequest = {
  comment?: string;
};

export type PaymentResponse = {
  id: number;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;

  method: PaymentMethod | string | null;
  status: PaymentStatus | string | null;

  amount: number | null;
  months: number | null;

  reference?: string | null;
  note?: string | null;

  // preuve owner
  proofFileName?: string | null;
  proofFileUrl?: string | null;

  // preuve admin
  adminProofFileName?: string | null;
  adminProofFileUrl?: string | null;

  adminComment?: string | null;

  paidAt?: string | null;
  validatedAt?: string | null;
};