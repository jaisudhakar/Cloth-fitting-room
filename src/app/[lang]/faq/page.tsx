import { Suspense } from "react";
import { Faq } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <Faq />
    </Suspense>
  );
}
