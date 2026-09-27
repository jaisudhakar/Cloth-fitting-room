import { Suspense } from "react";
import { About } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <About />
    </Suspense>
  );
}
