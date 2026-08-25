import HelpText from "@components/HelpText";
import * as React from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  type?: "user-groups" | "groups";
};
export const GroupPrefixHelpText = ({ type = "groups" }: Props) => {
  const { t } = useI18n();

  return type === "user-groups" ? (
    <HelpText className={"max-w-lg mt-2"}>
      {t("idpSync.defaultPrefix")}{" "}
      <span className={"text-netbird font-semibold"}>
        {t("idpSync.allUsers")}
      </span>{" "}
      {t("idpSync.usersSyncSuffix")} <br />
      {t("idpSync.userGroupHelp")}
    </HelpText>
  ) : (
    <HelpText className={"max-w-lg mt-2"}>
      {t("idpSync.defaultPrefix")}{" "}
      <span className={"text-netbird font-semibold"}>
        {t("idpSync.allGroups")}
      </span>{" "}
      {t("idpSync.groupsSyncSuffix")} <br />
      {t("idpSync.groupPrefixHelp")}
    </HelpText>
  );
};
