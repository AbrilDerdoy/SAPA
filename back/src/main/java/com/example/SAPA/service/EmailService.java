package com.example.SAPA.service;

import io.mailtrap.client.MailtrapClient;
import io.mailtrap.model.request.emails.Address;
import io.mailtrap.model.request.emails.MailtrapMail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EmailService {

    private final MailtrapClient mailtrapClient;
    @Value("${spring.application.name:SAPA}")
    private String senderName;
    private final String senderEmail = "no-reply@sapa.com";

    public EmailService(MailtrapClient mailtrapClient) {
        this.mailtrapClient = mailtrapClient;
    }

    public void sendResetPasswordEmail(String toEmail, String token) {

        String url = "https://sapa.com" + token;

        String cuerpoMensaje = "Hacé click en el siguiente enlace para restablecer tu contraseña:\n\n"
                + url + "\n\nEste enlace expira en 15 minutos.";

        MailtrapMail mail = MailtrapMail.builder()
                .from(new Address("no-reply@sapa.com", "SAPA Sistema"))
                .to(List.of(new Address(toEmail)))
                .subject("Restablecer contraseña - SAPA")
                .text(cuerpoMensaje)
                .build();

        try {
            mailtrapClient.send(mail);
        } catch (Exception e) {
            System.err.println("Error al enviar con el SDK de Mailtrap: " + e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo de recuperación", e);
        }
    }

    public void sendApprovalEmail(String toEmail, String doctorName) {

        Address from = new Address(senderEmail, senderName);
        Address to = new Address(toEmail, doctorName);

        String emailContent = "Hola, Dr/a. " + doctorName + ".\n\n" +
                "Nos alegra informarte que tu perfil y matrícula han sido validados con éxito por la administración.\n" +
                "Ya podés iniciar sesión en la plataforma utilizando tus credenciales habituales.\n\n" +
                "Saludos cordiales,\nEl equipo de " + senderName + ".";

        MailtrapMail mail = MailtrapMail.builder()
                .from(from)
                .to(List.of(to))
                .subject("¡Bienvenido/a a " + senderName + "! Tu cuenta de médico ha sido aprobada")
                .text(emailContent)
                .build();

        mailtrapClient.send(mail);
    }

    public void sendRejectionEmail(String toEmail, String doctorName) {
        Address from = new Address(senderEmail, senderName);
        Address to = new Address(toEmail, doctorName);

        String emailContent = "Hola, Dr/a. " + doctorName + ".\n\n" +
                "Lamentamos informarte que tu solicitud de ingreso como médico ha sido rechazada por la administración " +
                "debido a que no se pudieron verificar correctamente los datos o la vigencia de tu matrícula.\n\n" +
                "Saludos cordiales,\nEl equipo de " + senderName + ".";

        MailtrapMail mail = MailtrapMail.builder()
                .from(from)
                .to(List.of(to))
                .subject("Actualización sobre tu solicitud de registro en " + senderName)
                .text(emailContent)
                .build();

        mailtrapClient.send(mail);
    }
}
