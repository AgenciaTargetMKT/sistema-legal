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


  // Rutas protegidas
  const protectedRoutes = [
    "/dashboard",
    "/home",
    "/procesos",
    "/clientes",
    "/empleados",
    "/tareas",
    "/impulsos",
    "/calendario",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Si el usuario no está autenticado y trata de acceder a rutas protegidas
  if (!session && isProtectedRoute) {

    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si el usuario está autenticado y trata de acceder al login o a la raíz
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/")) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Si el usuario no está autenticado y está en la raíz
  if (!session && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/home/:path*",
    "/procesos/:path*",
    "/clientes/:path*",
    "/empleados/:path*",
    "/tareas/:path*",
    "/impulsos/:path*",
    "/calendario/:path*",
    "/login",
  ],
};
