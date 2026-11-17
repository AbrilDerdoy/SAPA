
package com.example.SAPA.Models.Questionnaire;

import com.example.SAPA.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "question")
public class QuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "questionnaire_id", nullable = false)
    private QuestionnaireEntity questionnaire;

    @Column(nullable = false)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(nullable = false)
    private Integer orderIndex;

    // Opciones disponibles para las preguntas de opción múltiple.
    @ElementCollection
    @CollectionTable(
            name = "question_option",
            joinColumns = @JoinColumn(name = "question_id")
    )
    @OrderColumn(name = "option_order")
    @Column(name = "option_text", nullable = false, length = 100)
    @Builder.Default
    private List<String> options = new ArrayList<>();

    // Configuración de las preguntas de escala.
    private Integer scaleMin;

    private Integer scaleMax;

    @Column(length = 50)
    private String scaleMinLabel;

    @Column(length = 50)
    private String scaleMaxLabel;
}
