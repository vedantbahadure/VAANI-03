import React, { Suspense, lazy } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Orb } from "@/components/Orb";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Landing = lazy(() => import("@/landing/Landing"));
const AppShell = lazy(() => import("@/app/AppShell"));
const Home = lazy(() => import("@/app/Home"));
const Chat = lazy(() => import("@/app/Chat"));
const Knowledge = lazy(() => import("@/app/Knowledge"));
const Documents = lazy(() => import("@/app/Documents"));
const History = lazy(() => import("@/app/History"));
const Settings = lazy(() => import("@/app/Settings"));
const SystemStatus = lazy(() => import("@/app/SystemStatus"));

function Loader() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Orb state="thinking" size={90} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Home />} />
                <Route path="chat" element={<Chat />} />
                <Route path="chat/:id" element={<Chat />} />
                <Route path="knowledge" element={<Knowledge />} />
                <Route path="documents" element={<Documents />} />
                <Route path="history" element={<History />} />
                <Route path="status" element={<SystemStatus />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </ErrorBoundary>
  );
}
