export type EmailTemplateKind =
  | "invite_user"
  | "create_user"
  | "invite_accepted"
  | "user_pending_approval"
  | "device_pending_approval";

export type EmailEncryption = "none" | "starttls" | "tls";

export interface EmailTemplate {
  enabled: boolean;
  subject: string;
  body_html: string;
  body_text: string;
}

export interface EmailSettings {
  account_id?: string;
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password_configured: boolean;
  from_name: string;
  from_email: string;
  reply_to: string;
  encryption: EmailEncryption;
  insecure_skip_verify: boolean;
  admin_recipients: string[];
  templates: Record<string, EmailTemplate>;
}

export interface EmailSettingsUpdate
  extends Omit<EmailSettings, "account_id" | "password_configured"> {
  password?: string;
  clear_password?: boolean;
}

export interface EmailTemplatePreview {
  subject: string;
  body_html: string;
  body_text: string;
}

export const emailTemplateKinds: EmailTemplateKind[] = [
  "invite_user",
  "create_user",
  "invite_accepted",
  "user_pending_approval",
  "device_pending_approval",
];
