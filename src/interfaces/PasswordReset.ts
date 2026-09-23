export interface PasswordResetLink {
  url: string;
  email: string;
  expires_at: string;
  email_sent: boolean;
  email_error?: string;
}
