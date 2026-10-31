import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ApiProvider } from "./api.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { auth } from "./firebase.ts";
import { routes } from "./routes.tsx";
import "./styles.css";

const router = createBrowserRouter(routes);

const container = document.getElementById("root");
if (!container) throw new Error("Élément #root introuvable");

createRoot(container).render(
  <StrictMode>
    <AuthProvider auth={auth}>
      <ApiProvider>
        <RouterProvider router={router} />
      </ApiProvider>
    </AuthProvider>
  </StrictMode>,
);
