"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TicketManagementViewPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("#");
  }, [router]);

  return (
    <>
        <h1>Ticket Management View Page</h1>
    </>
  )
}