"use client";

import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { Dashboard } from "./ui/Dashboard";
import { CommodityPage } from "./ui/CommodityPage";

export default function Page() {
  const Router = typeof window === "undefined" ? MemoryRouter : BrowserRouter;
  const baseUrl = import.meta.env.BASE_URL;
  const basename = baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/commodity/:slug" element={<CommodityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
