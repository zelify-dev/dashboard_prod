import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Demo Dashboard Zelify",
  description: "Login to your Zelify Dashboard account",
};

export default function LoginLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}

