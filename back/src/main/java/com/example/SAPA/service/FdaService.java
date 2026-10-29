package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.fda.FdaResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class FdaService {

    private final RestTemplate restTemplate;

    public FdaResponseDTO searchForMedicationByName(String name) {
        String url = "https://api.fda.gov/drug/label.json?search=openfda.brand_name:\"" + name + "\"&limit=1";

        try {
            return restTemplate.getForObject(url, FdaResponseDTO.class);

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Medicamento no encontrado en openFDA: {}", name);
            return null;

        } catch (Exception e) {
            log.error("Error de comunicación con la API de openFDA: {}", e.getMessage());
            throw new RestClientException("El servicio de validación de medicamentos de la FDA no está disponible temporalmente.");
        }
    }
}
