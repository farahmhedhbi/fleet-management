"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { VehicleDTO } from "@/types/vehicle";
import { Driver } from "@/types/driver";
import { toast } from "react-toastify";
import { vehicleService } from "@/lib/services/vehicleService";
import { driverService } from "@/lib/services/driverService";

import VehicleFormView from "./VehicleFormView";

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: VehicleDTO | null;
  onSuccess: () => void;
}

const toLocalDateTimeOrNull = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00`;
  }
  return s;
};

export const VehicleForm: React.FC<VehicleFormProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleDTO>({
    defaultValues: {
      registrationNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      vin: "",
      fuelType: "GASOLINE" as any,
      transmission: "MANUAL" as any,
      status: "AVAILABLE" as any,
      mileage: 0,
      lastMaintenanceDate: undefined as any,
      nextMaintenanceDate: undefined as any,
      driverId: undefined,
    },
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (vehicle) {
      const formattedVehicle: any = {
        ...vehicle,
        lastMaintenanceDate: vehicle.lastMaintenanceDate
          ? String(vehicle.lastMaintenanceDate).split("T")[0]
          : undefined,
        nextMaintenanceDate: vehicle.nextMaintenanceDate
          ? String(vehicle.nextMaintenanceDate).split("T")[0]
          : undefined,
      };
      reset(formattedVehicle);
    } else {
      reset({
        registrationNumber: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        vin: "",
        fuelType: "GASOLINE" as any,
        transmission: "MANUAL" as any,
        status: "AVAILABLE" as any,
        mileage: 0,
        lastMaintenanceDate: undefined as any,
        nextMaintenanceDate: undefined as any,
        driverId: undefined,
      });
    }
  }, [vehicle, reset]);

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const data = await driverService.getAll();
      setDrivers(data);
    } catch (error: any) {
      console.error("Failed to load drivers:", error);
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to load drivers"
      );
    } finally {
      setLoadingDrivers(false);
    }
  };

  const onSubmit = async (data: VehicleDTO) => {
    setLoading(true);
    try {
      const payload: any = {
        ...data,
        year: data.year == null ? null : Number(data.year),
        mileage: data.mileage == null ? 0 : Number(data.mileage),
        driverId: data.driverId == null ? null : Number(data.driverId),
        lastMaintenanceDate: toLocalDateTimeOrNull(
          (data as any).lastMaintenanceDate
        ),
        nextMaintenanceDate: toLocalDateTimeOrNull(
          (data as any).nextMaintenanceDate
        ),
        registrationNumber: data.registrationNumber?.trim(),
        brand: data.brand?.trim(),
        model: data.model?.trim(),
        color: data.color?.trim() ? data.color.trim() : null,
        vin: data.vin?.trim() ? data.vin.trim() : null,
      };

      console.log("Payload sent to backend:", payload);

      if (vehicle?.id) {
        await vehicleService.update(vehicle.id, payload);
        toast.success("Vehicle updated successfully");
      } else {
        await vehicleService.create(payload);
        toast.success("Vehicle created successfully");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <VehicleFormView
      isOpen={isOpen}
      onClose={onClose}
      vehicle={vehicle}
      drivers={drivers}
      loading={loading}
      loadingDrivers={loadingDrivers}
      register={register}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      errors={errors}
    />
  );
};

export default VehicleForm;