package com.example.SAPA.DTOs;

import com.example.SAPA.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDTO {

    private String text;
    private QuestionType type;
    private Integer ordexIndex;
}
