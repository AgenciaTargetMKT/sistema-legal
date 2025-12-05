"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Search, ListFilter, Check } from "lucide-react";

export default function TareasFilters({
  searchTerm,
  onSearchChange,
  filtroEstado,
  onEstadoChange,
  filtroImportancia,
  onImportanciaChange,
  filtroUrgencia,
  onUrgenciaChange,
  estadosTarea = [],
  openEstado,
  onOpenEstadoChange,
  totalTareas,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Filtros como pills */}
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-gray-400 dark:text-gray-500" />

          <Popover open={openEstado} onOpenChange={onOpenEstadoChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openEstado}
                className="justify-between h-9 border-0 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg px-3 py-2 text-sm transition-all"
              >
                <span>
                  {filtroEstado !== "todos"
                    ? estadosTarea
                        .find((e) => e.id === filtroEstado)
                        ?.nombre?.charAt(0)
                        .toUpperCase() +
                      estadosTarea
                        .find((e) => e.id === filtroEstado)
                        ?.nombre?.slice(1)
                        .replace(/_/g, " ")
                    : "Estado"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start">
              <Command>
                <CommandList className="max-h-[400px]">
                  <CommandGroup>
                    <CommandItem
                      value="todos"
                      onSelect={() => {
                        onEstadoChange("todos");
                        onOpenEstadoChange(false);
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filtroEstado === "todos" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Todos los estados
                    </CommandItem>
                  </CommandGroup>

                  {/* PENDIENTE */}
                  <CommandGroup
                    heading="PENDIENTE"
                    className="text-xs text-gray-500 font-semibold"
                  >
                    {estadosTarea
                      .filter((e) => e.categoria === "pendiente")
                      .sort((a, b) => parseInt(a.orden) - parseInt(b.orden))
                      .map((estado) => (
                        <CommandItem
                          key={estado.id}
                          value={estado.nombre}
                          onSelect={() => {
                            onEstadoChange(estado.id);
                            onOpenEstadoChange(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: estado.color }}
                            />
                            <span className="capitalize text-sm">
                              {estado.nombre.replace(/_/g, " ")}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              filtroEstado === estado.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  {/* EN CURSO */}
                  <CommandGroup
                    heading="EN CURSO"
                    className="text-xs text-gray-500 font-semibold"
                  >
                    {estadosTarea
                      .filter((e) => e.categoria === "en_curso")
                      .sort((a, b) => parseInt(a.orden) - parseInt(b.orden))
                      .map((estado) => (
                        <CommandItem
                          key={estado.id}
                          value={estado.nombre}
                          onSelect={() => {
                            onEstadoChange(estado.id);
                            onOpenEstadoChange(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: estado.color }}
                            />
                            <span className="capitalize text-sm">
                              {estado.nombre.replace(/_/g, " ")}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              filtroEstado === estado.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  {/* COMPLETADO */}
                  <CommandGroup
                    heading="COMPLETADO"
                    className="text-xs text-gray-500 font-semibold"
                  >
                    {estadosTarea
                      .filter((e) => e.categoria === "completado")
                      .sort((a, b) => parseInt(a.orden) - parseInt(b.orden))
                      .map((estado) => (
                        <CommandItem
                          key={estado.id}
                          value={estado.nombre}
                          onSelect={() => {
                            onEstadoChange(estado.id);
                            onOpenEstadoChange(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: estado.color }}
                            />
                            <span className="capitalize text-sm">
                              {estado.nombre.replace(/_/g, " ")}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              filtroEstado === estado.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <select
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            value={filtroImportancia}
            onChange={(e) => onImportanciaChange(e.target.value)}
          >
            <option value="todos">Importancia</option>
            <option value="importante">Importante</option>
            <option value="no importante">No importante</option>
          </select>

          <select
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            value={filtroUrgencia}
            onChange={(e) => onUrgenciaChange(e.target.value)}
          >
            <option value="todos">Urgencia</option>
            <option value="urgente">Urgente</option>
            <option value="no urgente">No urgente</option>
          </select>
        </div>

        <div className="ml-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalTareas} {totalTareas === 1 ? "tarea" : "tareas"}
          </span>
        </div>
      </div>
    </div>
  );
}
