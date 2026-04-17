"use client";

import { useState } from "react";
import Landing from "@/landing";
import Dashboard from "@/components/dashboard";

export default function Page() {
  // FIX: added state to toggle between landing and dashboard
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard onBackToLanding={() => setShowDashboard(false)} />;
  }

  return <Landing onEnterDashboard={() => setShowDashboard(true)} />;
}
