"use client";

import { useState } from "react";
import Landing from "@/components/landing";
import Dashboard from "@/components/dashboard";

export default function Page() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard onBackToLanding={() => setShowDashboard(false)} />;
  }

  return <Landing onEnterDashboard={() => setShowDashboard(true)} />;
}
