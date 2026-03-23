"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/authContext";
import { vehicleService } from "@/lib/services/vehicleService";
import { Vehicle } from "@/types/vehicle";
import { useRouter } from "next/navigation";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import VehiclesView from "./VehiclesView";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // ✅ correction ici
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles: HTMLDivElement[] = [];
    const container = containerRef.current;

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 4 + 2;
      const colors = ["#60a5fa", "#38bdf8", "#0ea5e9", "#3b82f6"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.className = "particle absolute rounded-full";
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        opacity: ${Math.random() * 0.15 + 0.05};
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: float-particle ${Math.random() * 20 + 15}s linear infinite;
        animation-delay: ${Math.random() * 3}s;
        filter: blur(1px);
      `;

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchVehicles();
  }, [isAuthenticated, router]);

  useEffect(() => {
    let results = vehicles;

    if (searchQuery) {
      results = results.filter(
        (vehicle) =>
          vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.registrationNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          vehicle.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter !== "all") {
      results = results.filter((vehicle) => vehicle.status === activeFilter);
    }

    setFilteredVehicles(results);
  }, [vehicles, searchQuery, activeFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getAll();
      setVehicles(data);
      setFilteredVehicles(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vehicleService.remove(id);
      setShowDeleteModal(null);
      fetchVehicles();
    } catch {
      alert("Failed to delete vehicle");
    }
  };

  const handleAssignDriver = async (vehicleId: number) => {
    const driverId = prompt("Enter driver ID:");
    if (driverId && !isNaN(parseInt(driverId))) {
      try {
        await vehicleService.assignDriver(vehicleId, parseInt(driverId, 10));
        fetchVehicles();
        alert("Driver assigned successfully!");
      } catch {
        alert("Failed to assign driver");
      }
    }
  };

  const handleExportPDF = () => {
    const data = filteredVehicles.length ? filteredVehicles : vehicles;

    if (!data.length) {
      alert("Aucun véhicule à exporter");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Liste des véhicules", 14, 15);

    doc.setFontSize(10);
    doc.text(`Exporté le : ${new Date().toLocaleString()}`, 14, 22);

    const tableHead = [[
      "ID",
      "Marque",
      "Modèle",
      "Immatriculation",
      "Année",
      "Statut",
      "Kilométrage",
      "Carburant",
      "Conducteur",
    ]];

    const tableBody = data.map((v) => [
      v.id ?? "",
      v.brand ?? "",
      v.model ?? "",
      v.registrationNumber ?? "",
      v.year ?? "",
      v.status?.replace("_", " ") ?? "",
      v.mileage ? `${v.mileage} km` : "",
      v.fuelType ?? "",
      v.driverName ?? "Non assigné",
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 248, 255] },
    });

    const fileName = `vehicules_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  const getVehicleEfficiency = (vehicle: Vehicle) => {
    const currentYear = new Date().getFullYear();
    const vehicleYear = vehicle.year || currentYear;
    const age = currentYear - vehicleYear;
    let baseScore = 100 - age * 5;

    if (vehicle.status === "UNDER_MAINTENANCE") baseScore -= 30;
    if (vehicle.status === "IN_USE") baseScore -= 10;

    return Math.max(30, Math.min(100, baseScore));
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "from-emerald-400 to-emerald-500";
    if (efficiency >= 60) return "from-amber-400 to-amber-500";
    return "from-rose-400 to-rose-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "IN_USE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "UNDER_MAINTENANCE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <VehiclesView
      vehicles={vehicles}
      filteredVehicles={filteredVehicles}
      loading={loading}
      error={error}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      showDeleteModal={showDeleteModal}
      setShowDeleteModal={setShowDeleteModal}
      selectedVehicle={selectedVehicle}
      setSelectedVehicle={setSelectedVehicle}
      viewMode={viewMode}
      setViewMode={setViewMode}
      containerRef={containerRef}
      onDelete={handleDelete}
      onAssignDriver={handleAssignDriver}
      onExportPDF={handleExportPDF}
      onRefresh={fetchVehicles}
      onEdit={(id) => router.push(`/vehicles/edit/${id}`)}
      onCreate={() => router.push("/vehicles/new")}
      onAnalytics={() => router.push("/vehicles/analytics")}
      getVehicleEfficiency={getVehicleEfficiency}
      getEfficiencyColor={getEfficiencyColor}
      getStatusColor={getStatusColor}
    />
  );
}