"use client";

import Breadcrumbs from "@components/Breadcrumbs";
import Button from "@components/Button";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { NetBirdLogo } from "@components/NetBirdLogo";
import { notify } from "@components/Notification";
import { useHasChanges } from "@hooks/useHasChanges";
import * as Tabs from "@radix-ui/react-tabs";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  ImageIcon,
  PaintbrushIcon,
  PaletteIcon,
  RotateCcwIcon,
  TypeIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import SettingsIcon from "@/assets/icons/SettingsIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { Account } from "@/interfaces/Account";
import {
  applyBrandingColor,
  defaultBrandingColor,
  defaultBrandingTitle,
  getAccountBrandingDarkLogoDataURL,
  getAccountBrandingIconDataURL,
  getAccountBrandingLogoDataURL,
  getAccountBrandingPrimaryColor,
  getAccountBrandingTitle,
  isValidBrandingColor,
} from "@/modules/account/accountBranding";

const maxLogoFileSize = 256 * 1024;
const maxTabTitleLength = 80;
const acceptedLogoTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

type Props = {
  account: Account;
};

export default function BrandingSettingsTab({ account }: Readonly<Props>) {
  const { permission } = usePermissions();
  const { t } = useI18n();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const saveRequest = useApiCall<Account>("/accounts/" + account.id, true);

  const initialLogoDataURL = getAccountBrandingLogoDataURL(account);
  const initialDarkLogoDataURL = getAccountBrandingDarkLogoDataURL(account);
  const initialIconDataURL = getAccountBrandingIconDataURL(account);
  const initialTabTitle = getAccountBrandingTitle(account);
  const initialPrimaryColor = getAccountBrandingPrimaryColor(account);
  const [logoDataURL, setLogoDataURL] = useState(initialLogoDataURL);
  const [darkLogoDataURL, setDarkLogoDataURL] = useState(
    initialDarkLogoDataURL,
  );
  const [iconDataURL, setIconDataURL] = useState(initialIconDataURL);
  const [tabTitle, setTabTitle] = useState(initialTabTitle);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [logoError, setLogoError] = useState("");

  const { hasChanges, updateRef } = useHasChanges([
    logoDataURL,
    darkLogoDataURL,
    iconDataURL,
    tabTitle,
    primaryColor,
  ]);

  const tabTitleError = useMemo(() => {
    if (Array.from(tabTitle).length > maxTabTitleLength) {
      return t("brandingSettings.tabTitleLengthError", {
        count: maxTabTitleLength,
      });
    }
    return "";
  }, [tabTitle, t]);

  const primaryColorError = useMemo(() => {
    const value = primaryColor.trim();
    if (value && !isValidBrandingColor(value)) {
      return t("brandingSettings.primaryColorError");
    }
    return "";
  }, [primaryColor, t]);

  const saveChanges = () => {
    const nextLogoDataURL = logoDataURL.trim();
    const nextDarkLogoDataURL = darkLogoDataURL.trim();
    const nextIconDataURL = iconDataURL.trim();
    const nextTabTitle = tabTitle.trim();
    const nextPrimaryColor = primaryColor.trim();

    notify({
      title: t("brandingSettings.notifyTitle"),
      description: t("brandingSettings.updatedDescription"),
      promise: saveRequest
        .put({
          id: account.id,
          settings: {
            ...account.settings,
            extra: {
              ...account.settings?.extra,
              branding_logo_data_url: nextLogoDataURL,
              branding_logo_dark_data_url: nextDarkLogoDataURL,
              branding_icon_data_url: nextIconDataURL,
              branding_tab_title: nextTabTitle,
              branding_primary_color: nextPrimaryColor,
            },
          },
        })
        .then(() => {
          mutate("/accounts");
          applyBrandingColor(nextPrimaryColor || defaultBrandingColor);
          setLogoDataURL(nextLogoDataURL);
          setDarkLogoDataURL(nextDarkLogoDataURL);
          setIconDataURL(nextIconDataURL);
          setTabTitle(nextTabTitle);
          setPrimaryColor(nextPrimaryColor);
          updateRef([
            nextLogoDataURL,
            nextDarkLogoDataURL,
            nextIconDataURL,
            nextTabTitle,
            nextPrimaryColor,
          ]);
        }),
      loadingMessage: t("brandingSettings.updating"),
    });
  };

  const handleLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    onLoad: (dataURL: string) => void,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAcceptedLogoFile(file)) {
      setLogoError(t("brandingSettings.logoTypeError"));
      return;
    }

    if (file.size > maxLogoFileSize) {
      setLogoError(
        t("brandingSettings.logoSizeError", {
          size: Math.round(maxLogoFileSize / 1024),
        }),
      );
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        setLogoError(t("brandingSettings.logoReadError"));
        return;
      }
      setLogoError("");
      onLoad(reader.result);
    });
    reader.addEventListener("error", () => {
      setLogoError(t("brandingSettings.logoReadError"));
    });
    reader.readAsDataURL(file);
  };

  const resetBranding = () => {
    setLogoDataURL("");
    setDarkLogoDataURL("");
    setIconDataURL("");
    setTabTitle("");
    setPrimaryColor("");
    setLogoError("");
  };

  return (
    <Tabs.Content value={"branding"} className={"w-full"}>
      <div className={"p-default py-6 max-w-2xl"}>
        <Breadcrumbs>
          <Breadcrumbs.Item
            href={"/settings"}
            label={t("settings.title")}
            icon={<SettingsIcon size={13} />}
          />
          <Breadcrumbs.Item
            href={"/settings?tab=branding"}
            label={t("settings.branding")}
            icon={<PaletteIcon size={14} />}
            active
          />
        </Breadcrumbs>
        <div className={"flex items-start justify-between gap-4"}>
          <h1>{t("settings.branding")}</h1>
          <div className={"flex items-center gap-2"}>
            <Button
              variant={"secondary"}
              disabled={!permission.settings.update}
              onClick={resetBranding}
              data-cy={"reset-branding-settings"}
            >
              <RotateCcwIcon size={16} />
              {t("brandingSettings.reset")}
            </Button>
            <Button
              variant={"primary"}
              disabled={
                !hasChanges ||
                !permission.settings.update ||
                !!logoError ||
                !!tabTitleError ||
                !!primaryColorError
              }
              onClick={saveChanges}
              data-cy={"save-branding-settings"}
            >
              {t("actions.saveChanges")}
            </Button>
          </div>
        </div>

        <div className={"flex flex-col gap-8 w-full mt-8"}>
          <BrandingImageField
            title={t("brandingSettings.logo")}
            helpText={t("brandingSettings.logoHelp")}
            value={logoDataURL}
            fallback={<NetBirdLogo mobile={false} />}
            inputRef={fileInputRef}
            disabled={!permission.settings.update}
            onUpload={(event) => handleLogoUpload(event, setLogoDataURL)}
            onRemove={() => {
              setLogoDataURL("");
              setLogoError("");
            }}
            uploadText={t("brandingSettings.uploadLogo")}
            removeText={t("brandingSettings.removeLogo")}
            previewAlt={t("brandingSettings.logoPreview")}
            icon={<ImageIcon size={15} />}
            testId={"branding-logo"}
          />

          <BrandingImageField
            title={t("brandingSettings.darkLogo")}
            helpText={t("brandingSettings.darkLogoHelp")}
            value={darkLogoDataURL}
            fallback={
              <NetBirdLogo
                mobile={false}
                logoClassName={"!text-nb-gray-100"}
              />
            }
            inputRef={darkLogoInputRef}
            disabled={!permission.settings.update}
            onUpload={(event) => handleLogoUpload(event, setDarkLogoDataURL)}
            onRemove={() => {
              setDarkLogoDataURL("");
              setLogoError("");
            }}
            uploadText={t("brandingSettings.uploadLogo")}
            removeText={t("brandingSettings.removeLogo")}
            previewAlt={t("brandingSettings.logoPreview")}
            icon={<ImageIcon size={15} />}
            previewClassName={"!bg-nb-gray-950"}
            testId={"branding-dark-logo"}
          />

          <BrandingImageField
            title={t("brandingSettings.icon")}
            helpText={t("brandingSettings.iconHelp")}
            value={iconDataURL}
            fallback={<NetBirdLogo mobile={false} />}
            inputRef={iconInputRef}
            disabled={!permission.settings.update}
            onUpload={(event) => handleLogoUpload(event, setIconDataURL)}
            onRemove={() => {
              setIconDataURL("");
              setLogoError("");
            }}
            uploadText={t("brandingSettings.uploadIcon")}
            removeText={t("brandingSettings.removeIcon")}
            previewAlt={t("brandingSettings.iconPreview")}
            icon={<ImageIcon size={15} />}
            compact
            testId={"branding-icon"}
          />

          {logoError && <p className={"text-xs text-red-500"}>{logoError}</p>}

          <div
            className={
              "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            }
          >
            <div className={"min-w-[260px]"}>
              <Label>
                <TypeIcon size={15} />
                {t("brandingSettings.tabTitle")}
              </Label>
              <HelpText>{t("brandingSettings.tabTitleHelp")}</HelpText>
            </div>
            <div className={"w-full"}>
              <Input
                value={tabTitle}
                maxLength={maxTabTitleLength}
                placeholder={defaultBrandingTitle}
                error={tabTitleError}
                disabled={!permission.settings.update}
                onChange={(event) => setTabTitle(event.target.value)}
                data-cy={"branding-tab-title-input"}
              />
            </div>
          </div>

          <div
            className={
              "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            }
          >
            <div className={"min-w-[260px]"}>
              <Label>
                <PaintbrushIcon size={15} />
                {t("brandingSettings.primaryColor")}
              </Label>
              <HelpText>{t("brandingSettings.primaryColorHelp")}</HelpText>
            </div>
            <div className={"flex gap-3 w-full"}>
              <input
                type="color"
                value={
                  isValidBrandingColor(primaryColor)
                    ? primaryColor
                    : defaultBrandingColor
                }
                className={
                  "h-[42px] w-[52px] rounded-md border border-neutral-200 bg-white p-1 dark:border-nb-gray-700 dark:bg-nb-gray-900"
                }
                disabled={!permission.settings.update}
                onChange={(event) => setPrimaryColor(event.target.value)}
                data-cy={"branding-primary-color-picker"}
              />
              <Input
                value={primaryColor}
                placeholder={defaultBrandingColor}
                error={primaryColorError}
                maxLength={7}
                spellCheck={false}
                disabled={!permission.settings.update}
                onChange={(event) => setPrimaryColor(event.target.value)}
                data-cy={"branding-primary-color-input"}
              />
            </div>
          </div>
        </div>
      </div>
    </Tabs.Content>
  );
}

function isAcceptedLogoFile(file: File) {
  if (acceptedLogoTypes.includes(file.type)) return true;
  return /\.(jpe?g|png|svg|webp)$/i.test(file.name);
}

type BrandingImageFieldProps = {
  title: string;
  helpText: string;
  value: string;
  fallback: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploadText: string;
  removeText: string;
  previewAlt: string;
  icon: React.ReactNode;
  previewClassName?: string;
  compact?: boolean;
  testId?: string;
};

function BrandingImageField({
  title,
  helpText,
  value,
  fallback,
  inputRef,
  disabled,
  onUpload,
  onRemove,
  uploadText,
  removeText,
  previewAlt,
  icon,
  previewClassName,
  compact = false,
  testId,
}: Readonly<BrandingImageFieldProps>) {
  return (
    <div
      className={
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      }
    >
      <div className={"min-w-[260px]"}>
        <Label>
          {icon}
          {title}
        </Label>
        <HelpText>{helpText}</HelpText>
      </div>
      <div className={"flex flex-col gap-3 w-full"}>
        <div
          className={cn(
            "h-20 w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 flex items-center dark:border-nb-gray-800 dark:bg-nb-gray-920",
            compact && "w-24 justify-center px-3",
            previewClassName,
          )}
          data-cy={testId ? `${testId}-preview` : undefined}
        >
          {value ? (
            <Image
              src={value}
              width={compact ? 42 : 180}
              height={compact ? 42 : 48}
              alt={previewAlt}
              className={cn(
                "object-contain",
                compact ? "h-11 w-11" : "max-h-12 w-auto",
              )}
              unoptimized
            />
          ) : (
            fallback
          )}
        </div>
        <div className={"flex flex-wrap gap-2"}>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedLogoTypes.join(",")}
            className={"sr-only"}
            onChange={onUpload}
            data-cy={testId ? `${testId}-input` : undefined}
          />
          <Button
            variant={"secondary"}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            data-cy={testId ? `${testId}-upload` : undefined}
          >
            <UploadIcon size={16} />
            {uploadText}
          </Button>
          <Button
            variant={"default-outline"}
            disabled={disabled || !value}
            onClick={onRemove}
            data-cy={testId ? `${testId}-remove` : undefined}
          >
            <XIcon size={16} />
            {removeText}
          </Button>
        </div>
      </div>
    </div>
  );
}
