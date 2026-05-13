/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AppProvider, useAppContext } from "./store/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { OnboardingPage } from "./pages/OnboardingPage";
import { HomePage } from "./pages/HomePage";
import { LogPage } from "./pages/LogPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ChatPage } from "./pages/ChatPage";
import { LearnPage } from "./pages/LearnPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GoalsPage } from "./pages/GoalsPage";
import { ToolsPage } from "./pages/ToolsPage";
import MethodPage from "./pages/MethodPage";
import InhalerPage from "./pages/InhalerPage";
import { ShopPage } from "./pages/ShopPage";
import { AuthPage } from "./pages/AuthPage";
import { useBluetoothInhaler } from "./hooks/useBluetoothInhaler";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

type Tab =
  | "home"
  | "log"
  | "analytics"
  | "chat"
  | "learn"
  | "goals"
  | "settings"
  | "tools"
  | "method"
  | "inhaler"
  | "inhaler_log"
  | "shop";

function MainApp() {
  const { state } = useAppContext();
  const { session, isGuest, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // Mount the Bluetooth listener globally for the web app
  const { notification } = useBluetoothInhaler();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If not authenticated and not a guest, show auth page
  if (!session && !isGuest) {
    return <AuthPage />;
  }

  // Either guest or authenticated user from here on
  if (!state.profile?.isOnboarded) {
    return <OnboardingPage />;
  }

  return (
    <Layout
      activeTab={
        activeTab === "log"
          ? "home"
          : activeTab === "inhaler_log"
            ? "inhaler"
            : activeTab
      }
      setActiveTab={setActiveTab}
    >
      {(activeTab === "home" || activeTab === "log") && (
        <HomePage setActiveTab={setActiveTab} />
      )}
      {activeTab === "analytics" && <AnalyticsPage />}
      {activeTab === "chat" && <ChatPage setActiveTab={setActiveTab} />}
      {activeTab === "learn" && <LearnPage />}
      {activeTab === "goals" && <GoalsPage />}
      {activeTab === "settings" && <SettingsPage />}
      {activeTab === "tools" && <ToolsPage setActiveTab={setActiveTab} />}
      {activeTab === "method" && <MethodPage />}
      {(activeTab === "inhaler" || activeTab === "inhaler_log") && (
        <InhalerPage startLogging={activeTab === "inhaler_log"} setActiveTab={setActiveTab} />
      )}
      {activeTab === "shop" && <ShopPage setActiveTab={setActiveTab} />}

      {/* Log Craving Bottom Sheet Overlay */}
      {activeTab === "log" && (
        <div className="absolute inset-0 z-[100] bg-black/60 flex flex-col justify-end">
          <div
            className="bg-white rounded-t-3xl border-t-2 border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full h-[90vh] overflow-y-auto pt-6 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <LogPage setActiveTab={setActiveTab} />
          </div>
          <button
            onClick={() => setActiveTab("home")}
            className="absolute top-4 right-4 text-white font-bold bg-black/50 p-2 rounded-full z-[110]"
          >
             Close
          </button>
        </div>
      )}

      {/* Bluetooth Inhaler Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none"
          >
            <div className="bg-white border-2 border-brand-dark shadow-[0_4px_0_var(--color-brand-dark)] rounded-2xl p-4 flex items-center gap-3 w-full max-w-sm">
               <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-6 h-6 text-brand" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 text-sm">Inhaler Logged!</h4>
                  <p className="text-xs text-brand font-bold uppercase tracking-wider">Breathe Smart Inhaler by Patchouni</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
