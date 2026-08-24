"use client";

import { NetBirdLogo } from "@components/NetBirdLogo";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import { PublicBranding } from "@/interfaces/PublicBranding";
import {
  applyBrandingColor,
  defaultBrandingColor,
  defaultBrandingTitle,
  getBrandedDocumentTitle,
  getBrandingDarkLogoDataURL,
  getBrandingIconDataURL,
  getBrandingLogoDataURL,
  getBrandingPrimaryColor,
  getEffectiveBrandingTitleFromSource,
} from "@/modules/account/accountBranding";
import { fetchInstanceBranding } from "@/utils/unauthenticatedApi";

type PublicBrandingContextValue = {
  branding?: PublicBranding;
  title: string;
  logoDataURL: string;
  darkLogoDataURL: string;
  iconDataURL: string;
};

const PublicBrandingContext = createContext<PublicBrandingContextValue>({
  title: defaultBrandingTitle,
  logoDataURL: "",
  darkLogoDataURL: "",
  iconDataURL: "",
});

export function usePublicBranding() {
  return useContext(PublicBrandingContext);
}

export default function PublicBrandingProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const previousBrandingTitle = useRef(defaultBrandingTitle);
  const [branding, setBranding] = useState<PublicBranding>();
  const shouldApplyDocumentBranding = isPublicBrandingPath(pathname);

  useEffect(() => {
    let active = true;
    fetchInstanceBranding()
      .then((value) => {
        if (active) setBranding(value);
      })
      .catch(() => {
        if (active) setBranding({});
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<PublicBrandingContextValue>(() => {
    return {
      branding,
      title: getEffectiveBrandingTitleFromSource(branding),
      logoDataURL: getBrandingLogoDataURL(branding),
      darkLogoDataURL: getBrandingDarkLogoDataURL(branding),
      iconDataURL: getBrandingIconDataURL(branding),
    };
  }, [branding]);

  const primaryColor = useMemo(() => {
    return getBrandingPrimaryColor(branding) || defaultBrandingColor;
  }, [branding]);

  useEffect(() => {
    if (!shouldApplyDocumentBranding) return;

    document.title = getBrandedDocumentTitle(
      document.title,
      value.title,
      previousBrandingTitle.current,
    );
    previousBrandingTitle.current = value.title;
  }, [pathname, shouldApplyDocumentBranding, value.title]);

  useEffect(() => {
    if (!shouldApplyDocumentBranding) return;

    setFavicon(value.iconDataURL || value.logoDataURL);
  }, [shouldApplyDocumentBranding, value.iconDataURL, value.logoDataURL]);

  useEffect(() => {
    if (!shouldApplyDocumentBranding) return;

    applyBrandingColor(primaryColor);
  }, [primaryColor, shouldApplyDocumentBranding]);

  return (
    <PublicBrandingContext.Provider value={value}>
      {children}
    </PublicBrandingContext.Provider>
  );
}

export function PublicBrandingLogo({
  size = "large",
  mobile = false,
}: Readonly<{
  size?: "default" | "large";
  mobile?: boolean;
}>) {
  const branding = usePublicBranding();
  return (
    <NetBirdLogo
      size={size}
      mobile={mobile}
      customLogoSrc={branding.logoDataURL}
      customDarkLogoSrc={branding.darkLogoDataURL}
      customIconSrc={branding.iconDataURL}
      alt={`${branding.title} Logo`}
    />
  );
}

export function PublicBrandingIcon({ size = 24 }: Readonly<{ size?: number }>) {
  const branding = usePublicBranding();
  const src = branding.iconDataURL || branding.logoDataURL;

  if (!src) return <NetBirdIcon size={size} />;

  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt={`${branding.title} Logo`}
      className={"object-contain"}
      style={{ width: "auto", height: size, maxWidth: size }}
      unoptimized
    />
  );
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

function isPublicBrandingPath(pathname: string | null) {
  return (
    pathname === "/install" ||
    pathname === "/setup" ||
    pathname === "/error" ||
    pathname?.startsWith("/invite")
  );
}
