package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.ForumRequestDTO;
import com.example.SAPA.DTOs.Response.ForumResponseDTO;
import com.example.SAPA.service.ForumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forums")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Forums", description = "Controlador para la gestión de foros y publicaciones de la comunidad")
public class ForumController {

    private final ForumService forumService;

    @Operation(
            summary = "Obtener todos los foros",
            description = "Devuelve una lista con absolutamente todos los foros registrados en el sistema.")
    @ApiResponse(
            responseCode = "200",
            description = "Lista de foros obtenida correctamente")
    @GetMapping("/all")
    public ResponseEntity<List<ForumResponseDTO>> getAllForums() {
        return ResponseEntity.ok(forumService.getAllForums());
    }

    @Operation(
            summary = "Obtener foros activos",
            description = "Devuelve una lista de los foros que se encuentran actualmente visibles/activos.")
    @ApiResponse(
            responseCode = "200",
            description = "Lista de foros activos obtenida correctamente")
    @GetMapping("/active")
    public ResponseEntity<List<ForumResponseDTO>> getActiveForums() {
        return ResponseEntity.ok(forumService.getActiveForums());
    }

    @Operation(
            summary = "Obtener foros inactivos",
            description = "Devuelve una lista de los foros que fueron dados de baja o están ocultos.")
    @ApiResponse(
            responseCode = "200",
            description = "Lista de foros inactivos obtenida correctamente")
    @GetMapping("/inactive")
    public ResponseEntity<List<ForumResponseDTO>> getInactiveForums() {
        return ResponseEntity.ok(forumService.getInactiveForums());
    }

    @Operation(
            summary = "Filtrar foros por título",
            description = "Busca y devuelve los foros cuyo título coincida parcial o totalmente con el texto enviado.")
    @ApiResponse(
            responseCode = "200",
            description = "Resultados de la búsqueda obtenidos correctamente")
    @GetMapping("/filter")
    public ResponseEntity<List<ForumResponseDTO>> filterForums(
            @Parameter(
                    description = "Título o palabra clave a buscar en los foros", required = true, example = "Diabetes")
            @RequestParam String title) {
        return ResponseEntity.ok(forumService.filterForums(title));
    }

    @Operation(
            summary = "Crear un nuevo foro",
            description = "Registra una nueva publicación en la comunidad. Requiere token de autenticación.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Foro creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT faltante o inválido")
    })
    @PostMapping
    public ResponseEntity<ForumResponseDTO> createForum(@Valid @RequestBody ForumRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(forumService.createForum(request));
    }

    @Operation(
            summary = "Actualizar un foro existente",
            description = "Modifica los datos de un foro específico mediante su ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Foro actualizado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
            @ApiResponse(responseCode = "404", description = "Foro no encontrado con el ID proporcionado")
    })
    @PutMapping("/{forumId}")
    public ResponseEntity<ForumResponseDTO> updateForum(
            @Parameter(description = "ID del foro a modificar", required = true, example = "1")
            @PathVariable Long forumId,
            @Valid @RequestBody ForumRequestDTO request) {
        return ResponseEntity.ok(forumService.updateForum(forumId, request));
    }

    @Operation(
            summary = "Eliminar un foro",
            description = "Borra de forma física o lógica un foro del sistema utilizando su ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Foro eliminado correctamente (Sin contenido en la respuesta)"),
            @ApiResponse(responseCode = "404", description = "Foro no encontrado")
    })
    @DeleteMapping("/{forumId}")
    public ResponseEntity<Void> deleteForum(
            @Parameter(description = "ID del foro a eliminar", required = true, example = "1")
            @PathVariable Long forumId) {
        forumService.deleteForum(forumId);
        return ResponseEntity.noContent().build();
    }
}