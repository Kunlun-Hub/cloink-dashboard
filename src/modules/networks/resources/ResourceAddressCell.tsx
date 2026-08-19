import CopyToClipboardText from "@components/CopyToClipboardText";
import React from "react";
import { NetworkResource } from "@/interfaces/Network";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  resource: NetworkResource;
};
export default function ResourceAddressCell({ resource }: Readonly<Props>) {
  const { t } = useI18n();

  return (
    <CopyToClipboardText
      message={t("networkResources.copiedToClipboard", {
        address: resource.address,
      })}
    >
      <div
        className={
          "font-mono dark:text-nb-gray-300 pt-1 flex gap-2 items-center text-[.82rem]"
        }
      >
        {resource.address}
      </div>
    </CopyToClipboardText>
  );
}
