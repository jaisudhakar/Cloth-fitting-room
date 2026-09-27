import { Suspense } from "react";
import { Account } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <Account />
    </Suspense>
  );
}
