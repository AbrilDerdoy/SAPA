package com.example.SAPA.security.filters;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.service.AgePolicy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDate;

/**
 * Bloquea el acceso a las funciones del sistema para los pacientes menores de
 * 18 años, tengan o no un tutor activo. El tutor es quien opera en su nombre.
 *
 * <p>Solo se permite el acceso a los endpoints necesarios para autenticarse,
 * consultar los datos propios y gestionar la tutela.</p>
 */
@Component
@RequiredArgsConstructor
public class TutorRequirementFilter extends OncePerRequestFilter {

    private static final String TUTOR_REQUIRED_CODE = "TUTOR_REQUIRED";
    private static final String TUTOR_REQUIRED_MESSAGE =
            "Como paciente menor de edad, tu tutor debe realizar esta acción en tu nombre. "
                    + "Solo podés gestionar tu tutela desde la sección Mi tutor.";

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    @Override
    protected void doFilterInternal(
            @NotNull HttpServletRequest request,
            @NotNull HttpServletResponse response,
            @NotNull FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())
                || isAllowedRequest(request)
                || !isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserEntity user = userRepository.findByEmail(authentication.getName()).orElse(null);

        if (user == null || user.getRole() != UserCategory.PATIENT) {
            filterChain.doFilter(request, response);
            return;
        }

        PatientEntity patient = patientRepository.findByUser(user).orElse(null);

        if (patient == null
                || patient.getBirthDate() == null
                || !AgePolicy.isMinor(patient.getBirthDate(), LocalDate.now())) {
            filterChain.doFilter(request, response);
            return;
        }

        writeTutorRequired(response);
    }

    private boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }

    /**
     * Endpoints imprescindibles para que un paciente restringido pueda
     * autenticarse, ver sus datos y gestionar su tutela.
     */
    private boolean isAllowedRequest(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();

        if (path.startsWith("/auth/") || path.startsWith("/notifications/")
                || path.equals("/error")) {
            return true;
        }

        if ("GET".equalsIgnoreCase(method)
                && (path.equals("/users/me")
                || path.equals("/patients/my-profile")
                || (path.equals("/patients/profile")
                && request.getParameter("patientId") == null)
                || path.equals("/tutors/my-tutor")
                || path.equals("/tutors/invitations/received")
                || path.equals("/tutors/invitations/sent"))) {
            return true;
        }

        if ("POST".equalsIgnoreCase(method)
                && (path.equals("/tutors/invitations")
                || path.matches("^/tutors/invitations/[^/]+/(accept|reject)$"))) {
            return true;
        }

        return "DELETE".equalsIgnoreCase(method)
                && (path.matches("^/tutors/invitations/\\d+$")
                || path.matches("^/tutors/patients/\\d+/link$"));
    }

    private void writeTutorRequired(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");

        String json = String.format(
                "{\"error\":\"%s\",\"status\":%d,\"message\":\"%s\"}",
                TUTOR_REQUIRED_CODE,
                HttpServletResponse.SC_FORBIDDEN,
                TUTOR_REQUIRED_MESSAGE
        );

        response.getWriter().write(json);
        response.getWriter().flush();
    }
}
