package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class MaintenanceWorkOrderStatusRequest {

    @NotNull
    private WorkOrderStatus status;

    private BigDecimal actualCost;

    public WorkOrderStatus getStatus() {
        return status;
    }

    public BigDecimal getActualCost() {
        return actualCost;
    }
}