package com.example.fleet_backend.scheduler;

import com.example.fleet_backend.service.MaintenanceService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MaintenanceScheduler {

    private final MaintenanceService maintenanceService;

    public MaintenanceScheduler(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void checkOverdueMaintenances() {
        maintenanceService.markOverdueMaintenances();
    }
}