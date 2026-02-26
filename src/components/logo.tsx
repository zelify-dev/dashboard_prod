import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";

import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 max-w-[10.847rem]">
      <Image
        src={zelifyLogoLight}
        fill
        className="dark:hidden"
        alt="Zelify logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={zelifyLogoDark}
        fill
        className="hidden dark:block"
        alt="Zelify logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
