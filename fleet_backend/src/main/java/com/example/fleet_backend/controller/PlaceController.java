package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.PlaceSuggestionDTO;
import com.example.fleet_backend.service.PlaceSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/places")
@CrossOrigin(origins = "*")
public class PlaceController {

    private final PlaceSearchService placeSearchService;

    public PlaceController(PlaceSearchService placeSearchService) {
        this.placeSearchService = placeSearchService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<PlaceSuggestionDTO>> search(@RequestParam("q") String query) {
        return ResponseEntity.ok(placeSearchService.search(query));
    }
}