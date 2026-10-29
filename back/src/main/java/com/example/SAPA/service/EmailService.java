package com.example.SAPA.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.application.name:SAPA}")
    private String senderName;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private void enviarCorreo(
            String toEmail,
            String asunto,
            String contenido) {

        SimpleMailMessage mensaje = new SimpleMailMessage();

        mensaje.setFrom(senderEmail);
        mensaje.setTo(toEmail);
        mensaje.setSubject(asunto);
        mensaje.setText(contenido);

        mailSender.send(mensaje);
    }

    public void sendResetPasswordEmail(String toEmail, String token) {

        // Reemplazá esta URL por la ruta real de recuperación
        // de contraseña de tu frontend Angular.
        String url = "http://localhost:4200/resetPassword?token="
                + token;

        String cuerpoMensaje =
                "Hacé clic en el siguiente enlace para restablecer tu contraseña:\n\n"
                        + url
                        + "\n\nEste enlace expira en 15 minutos.";

        enviarCorreo(
                toEmail,
                "Restablecer contraseña - SAPA",
                cuerpoMensaje
        );
    }

    public void sendApprovalEmail(String toEmail, String doctorName) {

        String emailContent =
                "Hola, Dr/a. " + doctorName + ".\n\n"
                        + "Nos alegra informarte que tu perfil y matrícula han sido "
                        + "validados con éxito por la administración.\n"
                        + "Ya podés iniciar sesión en la plataforma utilizando "
                        + "tus credenciales habituales.\n\n"
                        + "Saludos cordiales,\nEl equipo de " + senderName + ".";

        enviarCorreo(
                toEmail,
                "¡Bienvenido/a a " + senderName
                        + "! Tu cuenta de médico ha sido aprobada",
                emailContent
        );
    }

    public void sendRejectionEmail(String toEmail, String doctorName) {

        String emailContent =
                "Hola, Dr/a. " + doctorName + ".\n\n"
                        + "Lamentamos informarte que tu solicitud de ingreso como "
                        + "médico ha sido rechazada por la administración "
                        + "debido a que no se pudieron verificar correctamente "
                        + "los datos o la vigencia de tu matrícula.\n\n"
                        + "Saludos cordiales,\nEl equipo de " + senderName + ".";

        enviarCorreo(
                toEmail,
                "Actualización sobre tu solicitud de registro en "
                        + senderName,
                emailContent
        );
    }
}
