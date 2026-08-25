import * as React from "react";
import { memo } from "react";
import { BrandedLogoMark } from "@/assets/icons/BrandedLogo";

type Props = {
  size?: number;
  className?: string;
};
function NetBirdIcon({ size = 16, className }: Props) {
  return (
    <BrandedLogoMark
      size={size}
      title={"Cloink Icon"}
      className={className}
    />
  );
}

export default memo(NetBirdIcon);
