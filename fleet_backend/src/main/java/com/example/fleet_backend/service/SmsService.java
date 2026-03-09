package com.example.fleet_backend.service;

public interface SmsService {
    void sendSms(String phoneNumber, String message);
}