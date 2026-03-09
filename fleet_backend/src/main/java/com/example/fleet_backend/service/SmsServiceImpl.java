package com.example.fleet_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SmsServiceImpl implements SmsService {

    private static final Logger logger = LoggerFactory.getLogger(SmsServiceImpl.class);

    @Override
    public void sendSms(String phoneNumber, String message) {
        // Version mock pour test
        logger.info("=== SMS MOCK ===");
        logger.info("To: {}", phoneNumber);
        logger.info("Message: {}", message);

        // Plus tard: intégrer Twilio / Vonage / Infobip
    }
}