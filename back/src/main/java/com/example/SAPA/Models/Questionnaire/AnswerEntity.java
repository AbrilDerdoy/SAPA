package com.example.SAPA.Models.Questionnaire;

import jakarta.persistence.*;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "answer")
public class AnswerEntity {
    // Respuesta a cada pregunta individual del formulario.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="answer_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "response_id", nullable = false)
    private QuestionnaireResponseEntity response;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionEntity question;

    @Column(nullable = false, length = 2000)
    private String value;

}
