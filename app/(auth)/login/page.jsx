"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error de autenticación:", error);
        setError(error.message || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log("✅ Login exitoso!");
        console.log("Session:", data.session);

        // Esperar un momento para que las cookies se sincronicen
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("🔄 Redirigiendo al dashboard...");
        // Usar router.push en lugar de window.location
        router.push("/dashboard");

        // Backup: si no redirige en 2 segundos, forzar con window.location
        setTimeout(() => {
          if (window.location.pathname === "/login") {
            console.log("⚠️ Forzando redirección...");
            window.location.href = "/dashboard";
          }
        }, 2000);
      } else {
        setError("No se pudo establecer la sesión");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error al iniciar sesión: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl rounded-3xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Sistema Legal</CardTitle>
          <CardDescription>
            Inicia sesión para acceder a tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <a
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Regístrate aquí
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
