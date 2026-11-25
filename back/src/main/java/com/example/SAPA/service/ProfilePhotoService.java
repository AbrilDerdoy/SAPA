
package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfilePhotoService {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private static final Path BASE_PATH =
            Paths.get("uploads/profiles").toAbsolutePath().normalize();

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp"
    );

    private final UserRepository userRepository;

    @Transactional
    public String uploadProfilePhoto(String email, MultipartFile file) {

        UserEntity user = findUser(email);
        validateUserRole(user);
        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String expectedContentType = ALLOWED_TYPES.get(extension);

        if (!expectedContentType.equals(file.getContentType())) {
            throw new IllegalArgumentException(
                    "El formato de la imagen no coincide con su extensión."
            );
        }

        String fileName = UUID.randomUUID() + "." + extension;
        Path destination = BASE_PATH.resolve(fileName).normalize();

        if (!destination.startsWith(BASE_PATH)) {
            throw new IllegalArgumentException("Ruta de archivo inválida.");
        }

        try {
            Files.createDirectories(BASE_PATH);
            Files.copy(file.getInputStream(), destination);

            String oldImageUrl = user.getProfileImageUrl();
            String newImageUrl = "/uploads/profiles/" + fileName;

            user.setProfileImageUrl(newImageUrl);
            userRepository.save(user);

            deleteStoredPhoto(oldImageUrl);

            return newImageUrl;

        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo guardar la foto de perfil.", e
            );
        }
    }

    @Transactional
    public String removeProfilePhoto(String email) {

        UserEntity user = findUser(email);
        validateUserRole(user);

        String oldImageUrl = user.getProfileImageUrl();

        user.setProfileImageUrl(null);
        userRepository.save(user);

        deleteStoredPhoto(oldImageUrl);

        return null;
    }

    private UserEntity findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new EntityNotFoundException("Usuario no encontrado.")
                );
    }

    private void validateUserRole(UserEntity user) {
        if (user.getRole() != UserCategory.PATIENT
                && user.getRole() != UserCategory.TUTOR
                && user.getRole() != UserCategory.DOCTOR) {
            throw new IllegalArgumentException(
                    "Solamente los pacientes, tutores y médicos pueden tener foto de perfil."
            );
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Tenés que seleccionar una imagen."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "La imagen no puede superar los 5 MB."
            );
        }

        if (file.getOriginalFilename() == null
                || file.getOriginalFilename().isBlank()) {
            throw new IllegalArgumentException(
                    "El nombre del archivo no es válido."
            );
        }
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');

        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            throw new IllegalArgumentException(
                    "El archivo no tiene una extensión válida."
            );
        }

        String extension = fileName.substring(lastDot + 1)
                .toLowerCase(Locale.ROOT);

        if (!ALLOWED_TYPES.containsKey(extension)) {
            throw new IllegalArgumentException(
                    "Formato no permitido. Utilizá JPG, JPEG, PNG o WEBP."
            );
        }

        return extension;
    }

    private void deleteStoredPhoto(String imageUrl) {
        if (imageUrl == null
                || !imageUrl.startsWith("/uploads/profiles/")) {
            return;
        }

        String fileName = imageUrl.substring(
                "/uploads/profiles/".length()
        );

        Path filePath = BASE_PATH.resolve(fileName).normalize();

        if (!filePath.startsWith(BASE_PATH)) {
            throw new IllegalArgumentException("Ruta de archivo inválida.");
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo eliminar la imagen anterior.", e
            );
        }
    }
}
