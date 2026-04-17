"use client";

import Landing from "../../../landing";

export default function Page() {
  // You can customize the onEnterDashboard handler as needed
  const handleEnterDashboard = () => {
    // For example, you could use router.push("/dashboard") if you want navigation
  };
  return <Landing onEnterDashboard={handleEnterDashboard} />;
}
