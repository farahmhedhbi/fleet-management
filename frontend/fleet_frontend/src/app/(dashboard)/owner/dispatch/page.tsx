"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import SmartAssignmentForm from "@/components/dispatch/SmartAssignmentForm";
import SmartDailyPlanningForm from "@/components/dispatch/SmartDailyPlanningForm";
import DispatchResult from "@/components/dispatch/DispatchResult";

import { missionService } from "@/lib/services/missionService";
import { confirmDailyPlanning } from "@/lib/services/dispatchService";

import type {
  DispatchSuggestionDTO,
  SmartAssignmentRequest,
  SmartDailyPlanningRequest,
} from "@/types/dispatch";
import type { MissionDTO } from "@/types/mission";

type DispatchMode = "ASSIGNMENT" | "DAILY";

export default function OwnerDispatchPage() {
  const [mode, setMode] = useState<DispatchMode>("ASSIGNMENT");
  const [result, setResult] = useState<DispatchSuggestionDTO | null>(null);
  const [lastForm, setLastForm] = useState<
    SmartAssignmentRequest | SmartDailyPlanningRequest | null
  >(null);
  const [creating, setCreating] = useState(false);

  function resetMode(newMode: DispatchMode) {
    setMode(newMode);
    setResult(null);
    setLastForm(null);
  }

  async function confirmMission() {
    if (!result) {
      toast.warn("Génère d'abord une suggestion.");
      return;
    }

    if (!lastForm) {
      toast.warn("Données mission manquantes.");
      return;
    }

    if (!result.vehicleId || !result.driverId) {
      toast.warn("Véhicule ou driver invalide.");
      return;
    }

    setCreating(true);

    try {
      if (mode === "ASSIGNMENT") {
        const assignmentForm = lastForm as SmartAssignmentRequest;

        const payload: MissionDTO = {
          title: `${assignmentForm.startCity} → ${assignmentForm.destinationCity}`,
          description: "Mission créée depuis Smart Assignment",
          departure: assignmentForm.startCity,
          destination: assignmentForm.destinationCity,
          startDate: assignmentForm.startTime,
          endDate: assignmentForm.expectedEndTime,
          vehicleId: result.vehicleId,
          driverId: result.driverId,
        };

        await missionService.create(payload);
        toast.success("Mission créée avec succès");
      }

      if (mode === "DAILY") {
        await confirmDailyPlanning(result);
        toast.success("Planning créé avec succès");
      }

      setResult(null);
      setLastForm(null);

      window.location.href = "/missions";
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Erreur création mission"
      );
    } finally {
      setCreating(false);
    }
  }

  const confirmLabel =
    mode === "DAILY"
      ? "Confirmer et créer le planning"
      : "Confirmer et créer la mission";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-2xl font-bold text-gray-900">
            Smart Dispatch Center
          </h1>

          <p className="mt-1 text-gray-500">
            Planification intelligente des missions, véhicules et chauffeurs.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => resetMode("ASSIGNMENT")}
              className={`rounded-xl px-4 py-3 font-semibold transition ${
                mode === "ASSIGNMENT"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mode 2 : Smart Assignment
            </button>

            <button
              type="button"
              onClick={() => resetMode("DAILY")}
              className={`rounded-xl px-4 py-3 font-semibold transition ${
                mode === "DAILY"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mode 1 : Smart Daily Planning
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            {mode === "ASSIGNMENT" ? (
              <SmartAssignmentForm
                onResult={(res, formData) => {
                  setResult(res);
                  setLastForm(formData);
                }}
              />
            ) : (
              <SmartDailyPlanningForm
                onResult={(res, formData) => {
                  setResult(res);
                  setLastForm(formData);
                }}
              />
            )}
          </div>

          <div className="space-y-4">
            <DispatchResult result={result} />

            <button
              type="button"
              onClick={confirmMission}
              disabled={creating || !result}
              className={`w-full rounded-xl px-4 py-3 font-bold text-white transition ${
                result
                  ? "bg-green-600 hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-400"
              } disabled:opacity-70`}
            >
              {creating ? "Création en cours..." : confirmLabel}
            </button>

            {!result && (
              <p className="text-center text-sm text-gray-500">
                Génère une proposition intelligente avant de confirmer.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}