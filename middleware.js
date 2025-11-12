import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  // Crear respuesta
  let response = NextResponse.next({
    request: req,
  });

  // Crear cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Obtener sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("🔍 Middleware - Path:", req.nextUrl.pathname);
  console.log(
    "🔍 Middleware - Session:",
    session ? "✅ Autenticado" : "❌ No autenticado"
  );

  // Rutas protegidas
  const protectedRoutes = [
    "/dashboard",
    "/procesos",
    "/clientes",
    "/empleados",
    "/tareas",
    "/impulsos",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Si el usuario no está autenticado y trata de acceder a rutas protegidas
  if (!session && isProtectedRoute) {
    console.log("↩️ Redirigiendo a /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si el usuario está autenticado y trata de acceder al login
  if (session && req.nextUrl.pathname === "/login") {
    console.log("↩️ Redirigiendo a /dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/procesos/:path*",
    "/clientes/:path*",
    "/empleados/:path*",
    "/tareas/:path*",
    "/impulsos/:path*",
    "/login",
  ],
};
