package com.example.SAPA.DTOs.Response.fda;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
public class FdaResultDTO {

    private FdaDrugDetailsDTO openfda;

    @JsonProperty("purpose")
    private List<String> purpose;

    @JsonProperty("indications_and_usages")
    private List<String> indicationsAndUsages;

    @JsonProperty("warnings")
    private List<String> warnings;

    @JsonProperty("dosage_and_administration")
    private List<String> dosageAndAdministration;
}
