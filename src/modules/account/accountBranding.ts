import { globalMetaTitle } from "@utils/meta";
import chroma from "chroma-js";
import { Account } from "@/interfaces/Account";
import { PublicBranding } from "@/interfaces/PublicBranding";

export const defaultBrandingTitle = globalMetaTitle;
export const defaultBrandingColor = "#f68330";
export const brandColorVariablePrefix = "--cloink-brand";
export const brandColorAppliedEvent = "cloink-brand-color-applied";

export function getBrandingLogoDataURL(branding?: PublicBranding) {
  return branding?.branding_logo_data_url?.trim() ?? "";
}

export function getBrandingDarkLogoDataURL(branding?: PublicBranding) {
  return branding?.branding_logo_dark_data_url?.trim() ?? "";
}

export function getBrandingIconDataURL(branding?: PublicBranding) {
  return branding?.branding_icon_data_url?.trim() ?? "";
}

export function getBrandingTitle(branding?: PublicBranding) {
  return branding?.branding_tab_title?.trim() ?? "";
}

export function getBrandingPrimaryColor(branding?: PublicBranding) {
  return branding?.branding_primary_color?.trim() ?? "";
}

export function getEffectiveBrandingTitleFromSource(branding?: PublicBranding) {
  return getBrandingTitle(branding) || defaultBrandingTitle;
}

export function getAccountBrandingLogoDataURL(account?: Account) {
  return getBrandingLogoDataURL(account?.settings?.extra);
}

export function getAccountBrandingDarkLogoDataURL(account?: Account) {
  return getBrandingDarkLogoDataURL(account?.settings?.extra);
}

export function getAccountBrandingIconDataURL(account?: Account) {
  return getBrandingIconDataURL(account?.settings?.extra);
}

export function getAccountBrandingTitle(account?: Account) {
  return getBrandingTitle(account?.settings?.extra);
}

export function getAccountBrandingPrimaryColor(account?: Account) {
  return getBrandingPrimaryColor(account?.settings?.extra);
}

export function getEffectiveBrandingTitle(account?: Account) {
  return getEffectiveBrandingTitleFromSource(account?.settings?.extra);
}

export function getBrandedDocumentTitle(
  currentTitle: string,
  brandingTitle: string,
  previousBrandingTitle = defaultBrandingTitle,
) {
  const nextBrandingTitle = brandingTitle.trim() || defaultBrandingTitle;
  const title = currentTitle.trim() || defaultBrandingTitle;
  const suffixes = [previousBrandingTitle, defaultBrandingTitle]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const suffix of suffixes) {
    if (title === suffix) return nextBrandingTitle;
    const separatorSuffix = ` - ${suffix}`;
    if (title.endsWith(separatorSuffix)) {
      return `${title.slice(
        0,
        -separatorSuffix.length,
      )} - ${nextBrandingTitle}`;
    }
  }

  return nextBrandingTitle;
}

export function isValidBrandingColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function getBrandingColorPalette(color = defaultBrandingColor) {
  const base = chroma(
    isValidBrandingColor(color) ? color : defaultBrandingColor,
  );
  const shade = (target: string, amount: number) =>
    base.mix(target, amount, "rgb").rgb().join(" ");

  return {
    50: shade("#ffffff", 0.92),
    100: shade("#ffffff", 0.84),
    150: shade("#ffffff", 0.76),
    200: shade("#ffffff", 0.66),
    300: shade("#ffffff", 0.38),
    400: base.rgb().join(" "),
    500: shade("#000000", 0.08),
    600: shade("#000000", 0.18),
    700: shade("#000000", 0.32),
    800: shade("#000000", 0.46),
    900: shade("#000000", 0.58),
    950: shade("#000000", 0.74),
  };
}

export function applyBrandingColor(color = defaultBrandingColor) {
  if (typeof document === "undefined") return;

  const palette = getBrandingColorPalette(color);
  Object.entries(palette).forEach(([shade, value]) => {
    document.documentElement.style.setProperty(
      `${brandColorVariablePrefix}-${shade}`,
      value,
    );
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(brandColorAppliedEvent));
  }
}
