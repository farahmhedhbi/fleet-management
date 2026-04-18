package com.example.fleet_backend.dto;

public class ObdAlertDTO {
    private String code;
    private String severity;
    private String message;

    public ObdAlertDTO() {
    }

    public ObdAlertDTO(String code, String severity, String message) {
        this.code = code;
        this.severity = severity;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}