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
public class FileStorageService {
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Path BASE_PATH = Paths.get("uploads/forums").toAbsolutePath().normalize();
    private static final Map<String, Set<String>> ALLOWED_TYPES = Map.of(
            "jpg", Set.of("image/jpeg"),
            "jpeg", Set.of("image/jpeg"),
            "png", Set.of("image/png"),
            "webp", Set.of("image/webp"),
            "gif", Set.of("image/gif"),
            "pdf", Set.of("application/pdf"),
            "doc", Set.of("application/msword"),
            "docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            "xls", Set.of("application/vnd.ms-excel"),
            "xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    );

    public record StoredFile(String fileName,String fileUrl,String contentType,long size) {}

    public StoredFile storeForumImage(MultipartFile file) throws IOException {
        return store(file, "images", true);
    }

    public StoredFile storePostAttachment(MultipartFile file) throws IOException {
        return store(file, "attachments", false);
    }

    private StoredFile store(MultipartFile file, String folder, boolean imageOnly) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El archivo no puede superar los 10 MB.");
        }

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Nombre de archivo inválido.");
        }

        String extension = getExtension(originalName);
        Set<String> allowedMimeTypes = ALLOWED_TYPES.get(extension);

        if (allowedMimeTypes == null || (imageOnly && !allowedMimeTypes.contains("image/" + (extension.equals("jpg") || extension.equals("jpeg") ? "jpeg" : extension)))) {
            throw new IllegalArgumentException("Formato de archivo no permitido.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!allowedMimeTypes.contains(contentType) && !contentType.equals("application/octet-stream"))) {
            throw new IllegalArgumentException("El tipo de archivo no coincide con su extensión.");
        }

        Path directory = BASE_PATH.resolve(folder).normalize();

        Files.createDirectories(directory);

        String uniqueName = UUID.randomUUID() + "." + extension;

        Path destination = directory.resolve(uniqueName).normalize();

        if (!destination.startsWith(directory)) {
            throw new IllegalArgumentException("Ruta de archivo inválida.");
        }

        Files.copy(file.getInputStream(), destination);

        String fileUrl = "/uploads/forums/" + folder + "/" + uniqueName;

        return new StoredFile(originalName, fileUrl, contentType, file.getSize());
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');

        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            throw new IllegalArgumentException("El archivo no tiene una extensión válida.");
        }

        return fileName.substring(lastDot + 1).toLowerCase();
    }

    public void deleteFile(String fileUrl) throws IOException {
        if (fileUrl == null || !fileUrl.startsWith("/uploads/forums/")) {
            return;
        }

        String relativePath = fileUrl.substring("/uploads/forums/".length());

        Path filePath = BASE_PATH.resolve(relativePath).normalize();

        if (!filePath.startsWith(BASE_PATH)) {
            throw new IllegalArgumentException("Ruta de archivo inválida.");
        }

        Files.deleteIfExists(filePath);
    }
}
