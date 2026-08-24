import { cn } from "@utils/helpers";
import Image from "next/image";
import * as React from "react";
import {
  BrandedLogoFull,
  BrandedLogoMark,
} from "@/assets/icons/BrandedLogo";

type Props = {
  size?: "default" | "large";
  mobile?: boolean;
  logoClassName?: string;
  mobileLogoClassName?: string;
  customLogoSrc?: string;
  customDarkLogoSrc?: string;
  customIconSrc?: string;
  alt?: string;
};

const sizes = {
  default: {
    desktop: 22,
    mobile: 30,
  },
  large: {
    desktop: 24,
    mobile: 40,
  },
};

export const NetBirdLogo = ({
  size = "default",
  mobile = true,
  logoClassName,
  mobileLogoClassName,
  customLogoSrc,
  customDarkLogoSrc,
  customIconSrc,
  alt = "Cloink Logo",
}: Props) => {
  if (customLogoSrc || customDarkLogoSrc || customIconSrc) {
    const desktopLogo = customLogoSrc || customIconSrc;
    const desktopDarkLogo = customDarkLogoSrc || desktopLogo;
    const mobileLogo = customIconSrc || customLogoSrc;
    const mobileDarkLogo = customIconSrc || customDarkLogoSrc || customLogoSrc;
    const swapDesktopLogo =
      !!desktopDarkLogo && desktopDarkLogo !== desktopLogo;
    const swapMobileLogo = !!mobileDarkLogo && mobileDarkLogo !== mobileLogo;

    return (
      <>
        {desktopLogo ? (
          <BrandImage
            src={desktopLogo}
            width={180}
            height={sizes[size].desktop}
            alt={alt}
            className={cn(
              logoClassName,
              mobile && "hidden md:block",
              swapDesktopLogo && "dark:hidden",
            )}
          />
        ) : (
          <BrandedLogoFull
            height={sizes[size].desktop}
            title={alt}
            className={cn(
              logoClassName,
              "max-w-[180px]",
              mobile && "hidden md:block",
              swapDesktopLogo && "dark:hidden",
            )}
          />
        )}
        {swapDesktopLogo && desktopDarkLogo && (
          <BrandImage
            src={desktopDarkLogo}
            width={180}
            height={sizes[size].desktop}
            alt={alt}
            className={cn(
              logoClassName,
              "hidden",
              mobile ? "md:dark:block" : "dark:block",
            )}
          />
        )}
        {mobile && (
          <>
            {mobileLogo ? (
              <BrandImage
                src={mobileLogo}
                width={sizes[size].mobile}
                height={sizes[size].mobile}
                alt={alt}
                className={cn(
                  mobileLogoClassName,
                  "md:hidden ml-4",
                  swapMobileLogo && "dark:hidden",
                )}
                square
              />
            ) : (
              <BrandedLogoMark
                size={sizes[size].mobile}
                title={alt}
                className={cn(
                  mobileLogoClassName,
                  "md:hidden ml-4",
                  swapMobileLogo && "dark:hidden",
                )}
              />
            )}
            {swapMobileLogo && mobileDarkLogo && (
              <BrandImage
                src={mobileDarkLogo}
                width={sizes[size].mobile}
                height={sizes[size].mobile}
                alt={alt}
                className={cn(
                  mobileLogoClassName,
                  "hidden dark:block md:dark:hidden ml-4",
                )}
                square
              />
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <BrandedLogoFull
        height={sizes[size].desktop}
        title={alt}
        className={cn(logoClassName, mobile && "hidden md:block")}
      />
      {mobile && (
        <BrandedLogoMark
          size={sizes[size].mobile}
          title={alt}
          className={cn(mobileLogoClassName, mobile && "md:hidden ml-4")}
        />
      )}
    </>
  );
};

function BrandImage({
  src,
  width,
  height,
  alt,
  className,
  square = false,
}: Readonly<{
  src: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  square?: boolean;
}>) {
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={cn("shrink-0 object-contain", className)}
      style={{
        width: square ? height : "auto",
        height,
        maxWidth: square ? height : "min(180px, 45vw)",
      }}
      unoptimized
    />
  );
}
