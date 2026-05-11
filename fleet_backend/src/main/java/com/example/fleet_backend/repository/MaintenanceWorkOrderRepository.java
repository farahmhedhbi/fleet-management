package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.MaintenanceWorkOrder;
import com.example.fleet_backend.model.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceWorkOrderRepository extends JpaRepository<MaintenanceWorkOrder, Long> {

    List<MaintenanceWorkOrder> findTop50ByOrderByCreatedAtDesc();

    List<MaintenanceWorkOrder> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<MaintenanceWorkOrder> findByStatusOrderByCreatedAtDesc(WorkOrderStatus status);
}