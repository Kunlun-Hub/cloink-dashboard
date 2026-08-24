"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  applyBrandingColor,
  defaultBrandingColor,
  defaultBrandingTitle,
  getAccountBrandingIconDataURL,
  getAccountBrandingLogoDataURL,
  getAccountBrandingPrimaryColor,
  getBrandedDocumentTitle,
  getEffectiveBrandingTitle,
} from "@/modules/account/accountBranding";
import { useAccount } from "@/modules/account/useAccount";

export default function AccountBrandingTitle() {
  const account = useAccount();
  const pathname = usePathname();
  const previousBrandingTitle = useRef(defaultBrandingTitle);

  const brandingTitle = useMemo(
    () => getEffectiveBrandingTitle(account),
    [account],
  );
  const faviconDataURL = useMemo(() => {
    return (
      getAccountBrandingIconDataURL(account) ||
      getAccountBrandingLogoDataURL(account)
    );
  }, [account]);
  const primaryColor = useMemo(() => {
    return getAccountBrandingPrimaryColor(account) || defaultBrandingColor;
  }, [account]);

  useEffect(() => {
    document.title = getBrandedDocumentTitle(
      document.title,
      brandingTitle,
      previousBrandingTitle.current,
    );
    previousBrandingTitle.current = brandingTitle;
  }, [brandingTitle, pathname]);

  useEffect(() => {
    setFavicon(faviconDataURL);
  }, [faviconDataURL]);

  useEffect(() => {
    applyBrandingColor(primaryColor);
  }, [primaryColor]);

  return null;
}

function setFavicon(iconDataURL: string) {
  const href = iconDataURL || "/favicon.ico";
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = href;
}
