import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Zelify Dashboard account",
};

export default function LoginLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}

