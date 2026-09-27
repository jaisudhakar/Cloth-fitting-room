import { Suspense } from "react";
import { TrackOrder } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <TrackOrder />
    </Suspense>
  );
}
