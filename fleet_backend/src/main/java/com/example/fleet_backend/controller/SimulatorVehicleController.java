package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.SimulatorVehicleDTO;
import com.example.fleet_backend.service.SimulatorVehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "*")
public class SimulatorVehicleController {

    private final SimulatorVehicleService simulatorVehicleService;

    public SimulatorVehicleController(SimulatorVehicleService simulatorVehicleService) {
        this.simulatorVehicleService = simulatorVehicleService;
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<SimulatorVehicleDTO>> getVehiclesForSimulation(Authentication auth) {
        return ResponseEntity.ok(simulatorVehicleService.getVehiclesForSimulationSecured(auth));
    }
}