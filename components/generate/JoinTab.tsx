"use client";

import React from "react";
import JoinPinSection from "./JoinPinSection";

export default function JoinTab() {
  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* Enter Game PIN Section */}
      <section>
        <JoinPinSection />
      </section>
    </div>
  );
}