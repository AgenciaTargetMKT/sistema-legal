"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Bell, Search } from "lucide-react";

const HeaderComponent = ({ onMenuClick, empleado }) => {
  const displayName = empleado
    ? `${empleado.nombre} ${empleado.apellido}`
    : "Usuario";

  return (
    <header className="sticky top-0 z-30 p-4 md:px-6">
      <div className="flex h-16 items-center gap-4 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border px-4 md:px-6">
        {/* Botón menú móvil */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb o título de página */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold md:text-xl truncate">
            Bienvenido, {displayName}
          </h2>
          <p className="text-sm text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-2">
          {/* Barra de búsqueda */}
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 bg-white/50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Botón de notificaciones */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {/* Badge de notificaciones */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </div>
      </div>
    </header>
  );
};

// Exportar con memo para evitar re-renders innecesarios
export const Header = memo(HeaderComponent);
