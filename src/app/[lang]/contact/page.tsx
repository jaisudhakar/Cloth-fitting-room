import { Suspense } from "react";
import { Contact } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <Contact />
    </Suspense>
  );
}
