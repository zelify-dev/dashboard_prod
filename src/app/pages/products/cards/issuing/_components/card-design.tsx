"use client";

import { cn } from "@/lib/utils";

type CardDesignProps = {
  design: {
    id: string;
    name: string;
    description: string;
    gradient: string;
    textColor: string;
    previewImage?: string;
    cardNetwork?: "visa" | "mastercard";
  };
};

function VisaLogo() {
  return (
    <img
      src="https://www.pngmart.com/files/22/Visa-Card-Logo-PNG-Isolated-Transparent-Picture.png"
      alt="Visa"
      className="h-5 w-auto object-contain brightness-0 invert"
    />
  );
}

function MastercardLogo() {
  return (
    <svg
      width="32"
      height="20"
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="8" fill="#EB001B" />
      <circle cx="22" cy="10" r="8" fill="#F79E1B" />
      <path
        d="M16 6.5C17.2 7.6 18 9.2 18 11C18 12.8 17.2 14.4 16 15.5C14.8 14.4 14 12.8 14 11C14 9.2 14.8 7.6 16 6.5Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function CardDesign({ design }: CardDesignProps) {
  return (
    <div className="group cursor-pointer rounded-lg border border-stroke bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-dark-2">
      {/* Card Preview */}
      <div className="mb-4 aspect-[85.6/53.98] w-full overflow-hidden rounded-xl p-2">
        {design.previewImage ? (
          <div className="h-full w-full rounded-xl">
            <img
              src={design.previewImage}
              alt={design.name}
              className="h-full w-full rounded-xl object-contain shadow-lg transition-transform group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div
            className={cn(
              "relative h-full w-full rounded-xl bg-gradient-to-br p-4 shadow-lg transition-transform group-hover:scale-[1.02]",
              design.gradient,
              design.textColor
            )}
          >
            {/* Zelify Logo - Superior derecha */}
            <div className="absolute top-2 right-2">
              <div className="flex items-center drop-shadow-md">
                <img
                  src="/images/logo/zelifyLogo_dark.svg"
                  alt="Zelify"
                  className="h-7 w-auto opacity-95 filter drop-shadow-lg"
                />
              </div>
            </div>

            {/* Chip - Centro izquierda (más arriba y más a la izquierda) */}
            <div className="absolute top-8 left-4">
              <div className="h-8 w-12 rounded bg-white/20 backdrop-blur-sm"></div>
            </div>

            {/* Name - Izquierda inferior */}
            <div className="absolute bottom-4 left-4">
              <div className="text-xs font-medium">CARLOS MENDOZA</div>
            </div>

            {/* Network logo - Inferior derecha */}
            <div className="absolute bottom-4 right-4">
              {design.cardNetwork === "visa" ? (
                <VisaLogo />
              ) : design.cardNetwork === "mastercard" ? (
                <MastercardLogo />
              ) : (
                <div className="text-xs font-medium opacity-80">VISA</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-dark dark:text-white">
          {design.name}
        </h3>
        <p className="text-xs text-dark-6 dark:text-dark-6">
          {design.description}
        </p>
      </div>
    </div>
  );
}
