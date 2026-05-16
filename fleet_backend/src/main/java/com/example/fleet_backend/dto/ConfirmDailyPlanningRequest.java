package com.example.fleet_backend.dto;

public class ConfirmDailyPlanningRequest {
    private DispatchSuggestionDTO suggestion;

    public DispatchSuggestionDTO getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(DispatchSuggestionDTO suggestion) {
        this.suggestion = suggestion;
    }
}