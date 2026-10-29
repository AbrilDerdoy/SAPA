package com.example.SAPA.DTOs.Response.fda;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter @Setter @ToString
@AllArgsConstructor
@NoArgsConstructor
public class FdaDrugDetailsDTO {
    @JsonProperty("brand_name")
    private List<String> brandName;
    @JsonProperty("generic_name")
    private List<String> genericName;
}
