import { Suspense } from "react";
import { Wishlist } from "@/components/pages/Info";

export default function Page() {
  return (
    <Suspense>
      <Wishlist />
    </Suspense>
  );
}
