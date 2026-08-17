import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { Textarea } from "@components/Textarea";
import FullScreenLoading from "@components/ui/FullScreenLoading";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import useFetchApi, { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  EyeIcon,
  MailIcon,
  RotateCcwIcon,
  SendIcon,
  ShieldAlertIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import {
  EmailEncryption,
  EmailSettings,
  EmailSettingsUpdate,
  EmailTemplate,
  EmailTemplateKind,
  emailTemplateKinds,
  EmailTemplatePreview,
} from "@/interfaces/EmailSettings";

const emailSettingsPath = "/settings/email";

const emailTemplateLabelKeys: Record<EmailTemplateKind, MessageKey> = {
  invite_user: "emailSettings.templateInviteUser",
  create_user: "emailSettings.templateCreateUser",
  invite_accepted: "emailSettings.templateInviteAccepted",
  user_pending_approval: "emailSettings.templateUserPendingApproval",
  device_pending_approval: "emailSettings.templateDevicePendingApproval",
};

function createDefaultTemplateValues(
  t: (key: MessageKey) => string,
): Record<EmailTemplateKind, EmailTemplate> {
  return {
    invite_user: {
      enabled: true,
      subject: t("emailSettings.defaultInviteSubject"),
      body_html: t("emailSettings.defaultInviteHtml"),
      body_text: t("emailSettings.defaultInviteText"),
    },
    create_user: {
      enabled: true,
      subject: t("emailSettings.defaultCreateUserSubject"),
      body_html: t("emailSettings.defaultCreateUserHtml"),
      body_text: t("emailSettings.defaultCreateUserText"),
    },
    invite_accepted: {
      enabled: true,
      subject: t("emailSettings.defaultInviteAcceptedSubject"),
      body_html: t("emailSettings.defaultInviteAcceptedHtml"),
      body_text: t("emailSettings.defaultInviteAcceptedText"),
    },
    user_pending_approval: {
      enabled: true,
      subject: t("emailSettings.defaultUserPendingApprovalSubject"),
      body_html: t("emailSettings.defaultUserPendingApprovalHtml"),
      body_text: t("emailSettings.defaultUserPendingApprovalText"),
    },
    device_pending_approval: {
      enabled: true,
      subject: t("emailSettings.defaultDevicePendingApprovalSubject"),
      body_html: t("emailSettings.defaultDevicePendingApprovalHtml"),
      body_text: t("emailSettings.defaultDevicePendingApprovalText"),
    },
  };
}

function normalizeSettings(
  settings: EmailSettings | undefined,
  defaultTemplateValues: Record<EmailTemplateKind, EmailTemplate>,
): EmailSettings {
  return {
    enabled: settings?.enabled ?? false,
    host: settings?.host ?? "",
    port: settings?.port ?? 587,
    username: settings?.username ?? "",
    password_configured: settings?.password_configured ?? false,
    from_name: settings?.from_name ?? "Cloink",
    from_email: settings?.from_email ?? "",
    reply_to: settings?.reply_to ?? "",
    encryption: settings?.encryption ?? "starttls",
    insecure_skip_verify: settings?.insecure_skip_verify ?? false,
    admin_recipients: settings?.admin_recipients ?? [],
    templates: {
      ...defaultTemplateValues,
      ...(settings?.templates ?? {}),
    },
  };
}

function stringifyRecipients(recipients: string[]) {
  return recipients.join("\n");
}

function parseRecipients(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EmailSettingsTab() {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const defaultTemplateValues = useMemo(
    () => createDefaultTemplateValues(t),
    [t],
  );
  const { data, mutate, isLoading } = useFetchApi<EmailSettings>(
    emailSettingsPath,
    true,
  );
  const saveRequest = useApiCall<EmailSettings>(emailSettingsPath, true);
  const testRequest = useApiCall<Record<string, never>>(
    `${emailSettingsPath}/test`,
    true,
  );
  const previewRequest = useApiCall<EmailTemplatePreview>(
    `${emailSettingsPath}/templates`,
    true,
  );

  const initial = useMemo(
    () => normalizeSettings(data, defaultTemplateValues),
    [data, defaultTemplateValues],
  );
  const [enabled, setEnabled] = useState(initial.enabled);
  const [host, setHost] = useState(initial.host);
  const [port, setPort] = useState(initial.port);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [fromName, setFromName] = useState(initial.from_name);
  const [fromEmail, setFromEmail] = useState(initial.from_email);
  const [replyTo, setReplyTo] = useState(initial.reply_to);
  const [encryption, setEncryption] = useState<EmailEncryption>(
    initial.encryption,
  );
  const [insecureSkipVerify, setInsecureSkipVerify] = useState(
    initial.insecure_skip_verify,
  );
  const [adminRecipients, setAdminRecipients] = useState(
    stringifyRecipients(initial.admin_recipients),
  );
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>(
    initial.templates,
  );
  const [activeTemplate, setActiveTemplate] =
    useState<EmailTemplateKind>("invite_user");
  const [testRecipient, setTestRecipient] = useState("");
  const [preview, setPreview] = useState<EmailTemplatePreview>();

  const changeState = [
    enabled,
    host,
    port,
    username,
    password,
    clearPassword,
    fromName,
    fromEmail,
    replyTo,
    encryption,
    insecureSkipVerify,
    adminRecipients,
    JSON.stringify(templates),
  ];
  const { hasChanges, updateRef } = useHasChanges(changeState);

  React.useEffect(() => {
    // Do not replace an in-progress edit when SWR revalidates the settings in
    // the background. The first response (and later responses while the form
    // is clean) are safe to use as the source of truth.
    if (!data || hasChanges) return;

    const next = normalizeSettings(data, defaultTemplateValues);
    setEnabled(next.enabled);
    setHost(next.host);
    setPort(next.port);
    setUsername(next.username);
    setPassword("");
    setClearPassword(false);
    setFromName(next.from_name);
    setFromEmail(next.from_email);
    setReplyTo(next.reply_to);
    setEncryption(next.encryption);
    setInsecureSkipVerify(next.insecure_skip_verify);
    setAdminRecipients(stringifyRecipients(next.admin_recipients));
    setTemplates(next.templates);

    // The initial request is asynchronous. Reset the dirty-state baseline
    // after the server values replace the local defaults.
    updateRef([
      next.enabled,
      next.host,
      next.port,
      next.username,
      "",
      false,
      next.from_name,
      next.from_email,
      next.reply_to,
      next.encryption,
      next.insecure_skip_verify,
      stringifyRecipients(next.admin_recipients),
      JSON.stringify(next.templates),
    ]);
  }, [data, defaultTemplateValues, hasChanges, updateRef]);

  const activeTemplateValue =
    templates[activeTemplate] ?? defaultTemplateValues[activeTemplate];

  const updateTemplate = (
    kind: EmailTemplateKind,
    update: Partial<EmailTemplate>,
  ) => {
    setTemplates((current) => ({
      ...current,
      [kind]: {
        ...(current[kind] ?? defaultTemplateValues[kind]),
        ...update,
      },
    }));
    setPreview(undefined);
  };

  const buildPayload = (): EmailSettingsUpdate => ({
    enabled,
    host: host.trim(),
    port: Number(port) || 587,
    username: username.trim(),
    password: password ? password : undefined,
    clear_password: clearPassword,
    from_name: fromName.trim(),
    from_email: fromEmail.trim(),
    reply_to: replyTo.trim(),
    encryption,
    insecure_skip_verify: insecureSkipVerify,
    admin_recipients: parseRecipients(adminRecipients),
    templates,
  });

  const saveChanges = () => {
    const payload = buildPayload();
    notify({
      title: t("emailSettings.notificationsTitle"),
      description: t("emailSettings.updatedDescription"),
      promise: saveRequest.put(payload).then((next) => {
        mutate(next, false);
        const normalized = normalizeSettings(next, defaultTemplateValues);
        setPassword("");
        setClearPassword(false);
        updateRef([
          normalized.enabled,
          normalized.host,
          normalized.port,
          normalized.username,
          "",
          false,
          normalized.from_name,
          normalized.from_email,
          normalized.reply_to,
          normalized.encryption,
          normalized.insecure_skip_verify,
          stringifyRecipients(normalized.admin_recipients),
          JSON.stringify(normalized.templates),
        ]);
      }),
      loadingMessage: t("emailSettings.saving"),
    });
  };

  const sendTestEmail = () => {
    notify({
      title: t("emailSettings.testTitle"),
      description: t("emailSettings.testSent"),
      promise: testRequest.post({ recipient: testRecipient.trim() }),
      loadingMessage: t("emailSettings.sendingTest"),
    });
  };

  const previewTemplate = () => {
    const sampleData = {
      account: { name: "Cloink", domain: "example.com" },
      dashboard: { url: window.location.origin },
      user: {
        name: t("emailSettings.previewSampleUserName"),
        email: "hello@cloink.4w.ink",
        role: "user",
      },
      invite: {
        url: `${window.location.origin}/invite?token=nbi_demo`,
        expires_at: t("emailSettings.previewSampleTime"),
        created_by_name: t("emailSettings.previewSampleInviterName"),
        created_by_email: "admin@example.com",
      },
      device: {
        id: "peer-demo",
        name: "DESKTOP-001",
        hostname: "DESKTOP-001",
        os: "Windows",
        user_email: "hello@cloink.4w.ink",
      },
      approval: { url: `${window.location.origin}/team?status=pending` },
      time: t("emailSettings.previewSampleTime"),
    };
    notify({
      title: t("emailSettings.previewTitle"),
      description: t("emailSettings.previewRendered"),
      promise: previewRequest
        .post({ data: sampleData }, `/${activeTemplate}/preview`)
        .then(setPreview),
      loadingMessage: t("emailSettings.rendering"),
    });
  };

  if (isLoading && !data) {
    return (
      <Tabs.Content value={"email"}>
        <FullScreenLoading />
      </Tabs.Content>
    );
  }

  return (
    <Tabs.Content value={"email"} className={"w-full"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=email"}
            label={t("settings.email")}
            icon={<MailIcon size={14} />}
            active
          />
        </Breadcrumbs>

        <div className={"flex items-start justify-between gap-4"}>
          <div>
            <h1>{t("emailSettings.title")}</h1>
            <p
              className={"text-sm text-neutral-500 dark:text-nb-gray-400 mt-2"}
            >
              {t("emailSettings.description")}
            </p>
          </div>
          <Button
            variant={"primary"}
            disabled={!hasChanges || !permission.settings.update}
            onClick={saveChanges}
            data-cy={"save-email-settings"}
          >
            {t("common.saveChanges")}
          </Button>
        </div>

        <div className={"flex flex-col gap-8 w-full mt-8"}>
          <FancyToggleSwitch
            value={enabled}
            onChange={setEnabled}
            disabled={!permission.settings.update}
            data-testid={"email-enabled"}
            label={
              <>
                <MailIcon size={15} />
                {t("emailSettings.enable")}
              </>
            }
            helpText={t("emailSettings.enableHelp")}
          />

          <section className={"flex flex-col gap-4"}>
            <SectionTitle title={t("emailSettings.smtpSection")} />
            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
              <Field label={t("emailSettings.host")}>
                <Input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={t("emailSettings.hostPlaceholder")}
                />
              </Field>
              <Field label={t("emailSettings.port")}>
                <Input
                  type={"number"}
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  disabled={!permission.settings.update}
                />
              </Field>
              <Field label={t("emailSettings.encryption")}>
                <Select
                  value={encryption}
                  onValueChange={(value) =>
                    setEncryption(value as EmailEncryption)
                  }
                  disabled={!permission.settings.update}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={"starttls"}>STARTTLS</SelectItem>
                    <SelectItem value={"tls"}>TLS</SelectItem>
                    <SelectItem value={"none"}>
                      {t("emailSettings.encryptionNone")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("emailSettings.username")}>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!permission.settings.update}
                />
              </Field>
              <Field label={t("emailSettings.password")}>
                <Input
                  type={"password"}
                  showPasswordToggle
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setClearPassword(false);
                  }}
                  disabled={!permission.settings.update || clearPassword}
                  placeholder={
                    initial.password_configured
                      ? t("emailSettings.passwordConfigured")
                      : t("emailSettings.passwordPlaceholder")
                  }
                />
                {initial.password_configured && (
                  <button
                    type={"button"}
                    className={cn(
                      "mt-2 text-xs font-medium",
                      clearPassword
                        ? "text-red-600"
                        : "text-neutral-500 hover:text-red-600",
                    )}
                    onClick={() => {
                      setClearPassword(!clearPassword);
                      setPassword("");
                    }}
                    disabled={!permission.settings.update}
                  >
                    {clearPassword
                      ? t("emailSettings.clearAfterSave")
                      : t("emailSettings.clearPassword")}
                  </button>
                )}
              </Field>
              <Field label={t("emailSettings.fromName")}>
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={"Cloink"}
                />
              </Field>
              <Field label={t("emailSettings.fromEmail")}>
                <Input
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  disabled={!permission.settings.update}
                  placeholder={"notice@example.com"}
                />
              </Field>
              <Field label={t("emailSettings.replyTo")}>
                <Input
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  disabled={!permission.settings.update}
                />
              </Field>
            </div>
            <FancyToggleSwitch
              value={insecureSkipVerify}
              onChange={setInsecureSkipVerify}
              disabled={!permission.settings.update}
              variant={"blank"}
              label={
                <>
                  <ShieldAlertIcon size={15} />
                  {t("emailSettings.skipTls")}
                </>
              }
              helpText={t("emailSettings.skipTlsHelp")}
            />
            <Field label={t("emailSettings.adminRecipients")}>
              <Textarea
                value={adminRecipients}
                onChange={(e) => setAdminRecipients(e.target.value)}
                disabled={!permission.settings.update}
                placeholder={"admin@example.com\nops@example.com"}
                className={"min-h-[96px]"}
                resize
              />
              <HelpText>{t("emailSettings.adminRecipientsHelp")}</HelpText>
            </Field>
            <div className={"flex gap-3 items-end"}>
              <div className={"flex-1"}>
                <Field label={t("emailSettings.testRecipient")}>
                  <Input
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    disabled={!permission.settings.update}
                    placeholder={"test@example.com"}
                  />
                </Field>
              </div>
              <Button
                variant={"secondary"}
                disabled={
                  !testRecipient.trim() ||
                  hasChanges ||
                  !permission.settings.update
                }
                onClick={sendTestEmail}
              >
                <SendIcon size={15} />
                {t("emailSettings.sendTest")}
              </Button>
            </div>
            {hasChanges && (
              <HelpText>{t("emailSettings.saveBeforeAction")}</HelpText>
            )}
          </section>

          <section className={"flex flex-col gap-4"}>
            <SectionTitle title={t("emailSettings.templatesSection")} />
            <div
              className={
                "grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-4"
              }
            >
              <div className={"flex md:flex-col gap-2 overflow-x-auto"}>
                {emailTemplateKinds.map((kind) => (
                  <button
                    key={kind}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm whitespace-nowrap",
                      activeTemplate === kind
                        ? "border-netbird-300 bg-netbird-50 text-netbird-700 dark:border-netbird-700 dark:bg-netbird-950/30 dark:text-netbird-200"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-nb-gray-800 dark:bg-nb-gray-900 dark:text-nb-gray-300",
                    )}
                    onClick={() => {
                      setActiveTemplate(kind);
                      setPreview(undefined);
                    }}
                    type={"button"}
                  >
                    {t(emailTemplateLabelKeys[kind])}
                  </button>
                ))}
              </div>
              <div className={"flex flex-col gap-4 min-w-0"}>
                <div className={"flex items-center justify-between gap-3"}>
                  <FancyToggleSwitch
                    value={activeTemplateValue.enabled}
                    onChange={(value) =>
                      updateTemplate(activeTemplate, { enabled: value })
                    }
                    disabled={!permission.settings.update}
                    variant={"blank"}
                    label={t(emailTemplateLabelKeys[activeTemplate])}
                    className={"!w-auto"}
                  />
                  <Button
                    variant={"secondary"}
                    onClick={() =>
                      updateTemplate(
                        activeTemplate,
                        defaultTemplateValues[activeTemplate],
                      )
                    }
                    disabled={!permission.settings.update}
                  >
                    <RotateCcwIcon size={15} />
                    {t("emailSettings.restoreDefault")}
                  </Button>
                </div>
                <Field label={t("emailSettings.subject")}>
                  <Input
                    value={activeTemplateValue.subject}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        subject: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                  />
                </Field>
                <Field label={t("emailSettings.htmlBody")}>
                  <Textarea
                    value={activeTemplateValue.body_html}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        body_html: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                    className={
                      "h-[360px] min-h-[220px] overflow-y-auto font-mono leading-relaxed"
                    }
                    resize
                  />
                </Field>
                <Field label={t("emailSettings.textBody")}>
                  <Textarea
                    value={activeTemplateValue.body_text}
                    onChange={(e) =>
                      updateTemplate(activeTemplate, {
                        body_text: e.target.value,
                      })
                    }
                    disabled={!permission.settings.update}
                    className={
                      "h-[220px] min-h-[140px] overflow-y-auto font-mono leading-relaxed"
                    }
                    resize
                  />
                </Field>
                <HelpText>{t("emailSettings.variables")}</HelpText>
                <div>
                  <Button
                    variant={"secondary"}
                    disabled={hasChanges || !permission.settings.update}
                    onClick={previewTemplate}
                  >
                    <EyeIcon size={15} />
                    {t("emailSettings.preview")}
                  </Button>
                </div>
                {preview && (
                  <div
                    className={
                      "rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-nb-gray-800 dark:bg-nb-gray-900"
                    }
                  >
                    <div
                      className={"font-medium text-neutral-900 dark:text-white"}
                    >
                      {preview.subject}
                    </div>
                    {preview.body_html && (
                      <div className="mt-3">
                        <div className="mb-1 text-xs font-medium text-neutral-500 dark:text-nb-gray-400">
                          {t("emailSettings.previewHtml")}
                        </div>
                        <iframe
                          title={t("emailSettings.previewHtml")}
                          sandbox=""
                          srcDoc={preview.body_html}
                          className="h-48 w-full rounded border border-neutral-200 bg-white dark:border-nb-gray-800"
                        />
                      </div>
                    )}
                    {preview.body_text && (
                      <div className="mt-3">
                        <div className="mb-1 text-xs font-medium text-neutral-500 dark:text-nb-gray-400">
                          {t("emailSettings.previewText")}
                        </div>
                        <pre
                          className={
                            "whitespace-pre-wrap rounded bg-white p-3 text-xs text-neutral-700 dark:bg-nb-gray-950 dark:text-nb-gray-200"
                          }
                        >
                          {preview.body_text}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Tabs.Content>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-2"}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className={"border-b border-neutral-200 pb-2 dark:border-nb-gray-800"}>
      <h2 className={"text-sm font-semibold text-neutral-900 dark:text-white"}>
        {title}
      </h2>
    </div>
  );
}
