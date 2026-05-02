import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <>
    <Sonner />
    <BrowserRouter basename={routerBasename || undefined}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
