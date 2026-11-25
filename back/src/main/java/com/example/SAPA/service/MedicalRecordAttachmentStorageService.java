
package com.example.SAPA.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MedicalRecordAttachmentStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Path BASE_PATH =
            Paths.get("uploads/medical-records")
                    .toAbsolutePath()
                    .normalize();

    private static final Map<String, String> ALLOWED_IMAGES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp"
    );

    public record StoredMedicalImage(
            String fileName,
            String fileUrl
    ) {}

    public StoredMedicalImage storeImage(MultipartFile file)
            throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "La imagen está vacía."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "La imagen no puede superar los 5 MB."
            );
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException(
                    "El nombre de la imagen no es válido."
            );
        }

        int lastDot = originalName.lastIndexOf('.');

        if (lastDot < 0 || lastDot == originalName.length() - 1) {
            throw new IllegalArgumentException(
                    "La imagen debe tener una extensión válida."
            );
        }

        String extension = originalName
                .substring(lastDot + 1)
                .toLowerCase();

        String expectedMime = ALLOWED_IMAGES.get(extension);

        if (expectedMime == null) {
            throw new IllegalArgumentException(
                    "Solo se permiten imágenes JPG, JPEG, PNG y WEBP."
            );
        }

        if (!expectedMime.equals(file.getContentType())) {
            throw new IllegalArgumentException(
                    "El tipo de imagen no coincide con su extensión."
            );
        }

        Files.createDirectories(BASE_PATH);

        String storedName = UUID.randomUUID() + "." + extension;

        Path destination = BASE_PATH.resolve(storedName).normalize();

        if (!destination.startsWith(BASE_PATH)) {
            throw new IllegalArgumentException(
                    "Ruta de archivo inválida."
            );
        }

        Files.copy(file.getInputStream(), destination);

        return new StoredMedicalImage(
                originalName,
                "/uploads/medical-records/" + storedName
        );
    }
}
