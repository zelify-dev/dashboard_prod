import zelifyLogoDark from "../../public/images/logo/zelifyLogo_dark.svg";
import zelifyLogoLight from "../../public/images/logo/zelifyLogo_ligth.svg";

import zelifyIcon from "../../public/images/logo/zelify-icon.svg";

import Image from "next/image";

export function Logo({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="relative h-8 w-8 overflow-hidden">
        <Image
          src={zelifyIcon}
          fill
          className="object-contain"
          alt="Zelify Icon"
          role="presentation"
          quality={100}
        />
      </div>
    );
  }

  return (
    <div className="relative h-8 w-[120px]">
      <Image
        src={zelifyLogoLight}
        fill
        className="object-contain dark:hidden"
        alt="Zelify logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={zelifyLogoDark}
        fill
        className="hidden object-contain dark:block"
        alt="Zelify logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
