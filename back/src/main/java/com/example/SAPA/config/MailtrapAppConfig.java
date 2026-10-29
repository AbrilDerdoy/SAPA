package com.example.SAPA.config;

import io.mailtrap.client.MailtrapClient;
import io.mailtrap.config.MailtrapConfig;
import io.mailtrap.factory.MailtrapClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailtrapAppConfig {

    @Value("${mailtrap.api.token}")
    private String mailtrapToken;

    @Value("${mailtrap.api.inbox-id}")
    private Long mailtrapInboxId; // Captura el ID obligatorio para Sandbox

    @Bean
    public MailtrapClient mailtrapClient() {
        MailtrapConfig config = new MailtrapConfig.Builder()
                .token(mailtrapToken)
                .sandbox(true)
                .inboxId(mailtrapInboxId) // Agregado para solucionar el error
                .build();

        return MailtrapClientFactory.createMailtrapClient(config);
    }
}
