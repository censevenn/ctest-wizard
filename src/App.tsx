import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeProvider";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const routerBasename = (() => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (base) return base;
  return typeof window !== "undefined" && window.location.pathname.startsWith("/ctest-wizard")
    ? "/ctest-wizard"
    : undefined;
})();

const App = () => (
  <ThemeProvider>
    <Sonner />
    <BrowserRouter basename={routerBasename || undefined}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
