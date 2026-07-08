import React from "react";

export default function Footer() {
  return (
    <footer className="text-center text-xs text-gray-400 py-6 mt-8">
      © {new Date().getFullYear()} All Rights Reserved. CRS RatePulse is a brand owned and operated by CRS Chauhan Private Limited.
    </footer>
  );
}
