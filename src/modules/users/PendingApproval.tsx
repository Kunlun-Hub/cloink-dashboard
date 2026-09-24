"use client";

import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { NetBirdLogo } from "@components/NetBirdLogo";
import Paragraph from "@components/Paragraph";
import Steps from "@components/Steps";
import { cn } from "@utils/helpers";
import { useI18n } from "@/i18n/I18nProvider";
import {
  CheckIcon,
  Loader2Icon,
  LogOut,
  RefreshCwIcon,
  UserCircleIcon,
} from "lucide-react";
import * as React from "react";

const parseApproverEmail = (message?: string): string =>
  message?.match(/[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] ?? "";

type Props = {
  // The refusal from management, which names the owner who can approve.
  error?: { message?: string } | null;
  onRefresh: () => void;
  onLogout: () => void;
};

export const PendingApproval = ({ error, onRefresh, onLogout }: Props) => {
  const { t } = useI18n();
  const owner = parseApproverEmail(error?.message);

  const steps = [
    {
      label: t("pendingApproval.accountCreated"),
      status: "complete",
      icon: <CheckIcon size={16} />,
    },
    {
      label: t("pendingApproval.waitingForApproval"),
      status: "current",
      icon: <Loader2Icon size={16} className={"animate-spin text-netbird"} />,
    },
    {
      label: t("pendingApproval.joinAccount"),
      status: "upcoming",
      icon: <UserCircleIcon size={16} />,
    },
  ] as const;

  return (
    <div
      className={
        "min-h-screen w-full bg-nb-gray-950 flex flex-col items-center justify-center gap-8 px-4 py-10"
      }
      data-testid={"pending-approval"}
    >
      <NetBirdLogo size={"large"} mobile={false} />

      <div
        className={
          "w-full max-w-2xl bg-nb-gray-940 border border-nb-gray-910 rounded-lg px-6 sm:px-12 py-8 sm:py-9 flex flex-col gap-10"
        }
      >
        <Steps horizontal={true} className={"pt-0 w-full"}>
          {steps.map(({ label, status, icon }, index) => (
            <Steps.Step
              key={label}
              step={icon}
              status={status}
              horizontal={true}
              size={"large"}
              line={index < steps.length - 1}
              className={"flex-1 pb-0"}
            >
              <span
                className={cn(
                  "text-sm text-center",
                  status === "upcoming" ? "text-nb-gray-400" : "text-white",
                )}
              >
                {label}
              </span>
            </Steps.Step>
          ))}
        </Steps>

        <Paragraph className={"block max-w-md mx-auto text-center"}>
          {t("pendingApproval.description")}{" "}
          {owner ? (
            <>
              {t("pendingApproval.askOwnerWithEmail")}{" "}
              <span className={"text-nb-gray-100"}>{owner}</span>{" "}
              {t("pendingApproval.askOwnerSuffix")}
            </>
          ) : (
            t("pendingApproval.askOwner")
          )}
        </Paragraph>

        <div className={"flex flex-col sm:flex-row gap-3 justify-center"}>
          <Button variant={"secondary"} size={"sm"} onClick={onRefresh}>
            <RefreshCwIcon size={16} />
            {t("pendingApproval.refresh")}
          </Button>
          <Button variant={"default-outline"} size={"sm"} onClick={onLogout}>
            <LogOut size={16} />
            {t("pendingApproval.logOut")}
          </Button>
        </div>
      </div>

      <Paragraph className={"text-sm"}>
        {t("pendingApproval.needHelp")}
        <InlineLink
          href={"https://docs.netbird.io/manage/team/approve-users"}
          target={"_blank"}
        >
          {t("pendingApproval.readTheDocs")}
        </InlineLink>
        {t("common.or")}
        <InlineLink
          href={"https://docs.netbird.io/help/netbird-support"}
          target={"_blank"}
        >
          {t("pendingApproval.contactSupport")}
        </InlineLink>
      </Paragraph>
    </div>
  );
};
