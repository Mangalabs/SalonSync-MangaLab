import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import Appointments from "./Appointments";
import AppointmentHistory from "@/components/custom/appointment/AppointmentHistory";

export default function NewAppointment() {
  const [mode, setMode] = useState<"schedule" | "register">("schedule");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Atendimentos</h2>
            <p className="text-gray-600 mt-1">
              Agende novos horários ou visualize dados de atendimentos
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode("schedule")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                mode === "schedule"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Atendimento
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                mode === "register"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-purple-600"
              }`}
            >
              <Clock className="w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Modo {mode === "schedule" ? "Atendimento" : "Histórico"}:</strong>{" "}
            {mode === "schedule"
              ? "Visualize e gerencie a agenda, e crie novos agendamentos ou atendimentos imediatos."
              : "Visualize histórico e estatísticas dos atendimentos."}
          </div>
        </div>
      </div>

      {mode === "schedule" ? <Appointments /> : <AppointmentHistory />}
    </div>
  );
}
