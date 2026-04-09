import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";

import logoIcon from "../../public/images/logo/logo-icon.svg";

import Image from "next/image";

export function Logo({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="relative h-8 w-8 overflow-hidden">
        <Image
          src={logoIcon}
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
