
package com.example.SAPA.security.config;

import com.example.SAPA.security.filters.JwtAuthenticationFilter;
import com.example.SAPA.security.filters.RestAuthenticationEntryPoint;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@EnableWebSecurity
@EnableMethodSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    private static final String[] PATIENT_AND_DOCTOR = {
            "ROLE_PATIENT", "ROLE_DOCTOR", "PATIENT", "DOCTOR"
    };

    private static final String[] PATIENT_TUTOR_DOCTOR = {
            "ROLE_PATIENT", "ROLE_TUTOR", "ROLE_DOCTOR",
            "PATIENT", "TUTOR", "DOCTOR"
    };

    private static final String[] PATIENT_AND_TUTOR = {
            "ROLE_PATIENT", "ROLE_TUTOR", "PATIENT", "TUTOR"
    };

    private static final String[] ALL_ROLES = {
            "ROLE_PATIENT", "ROLE_TUTOR", "ROLE_DOCTOR", "ROLE_ADMIN",
            "PATIENT", "TUTOR", "DOCTOR", "ADMIN"
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "X-Requested-With"
        ));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)

            .headers(headers ->
                    headers.frameOptions(
                            HeadersConfigurer.FrameOptionsConfig::sameOrigin
                    )
            )

            .sessionManagement(manager ->
                    manager.sessionCreationPolicy(STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Autenticación
                .requestMatchers("/auth/**").permitAll()

                // Archivos y páginas públicas
                .requestMatchers(
                        "/",
                        "/index",
                        "/index.html",
                        "/login.html",
                        "/registro-paciente.html",
                        "/registro-medico.html",
                        "/perfil.html",
                        "/admin.html",
                        "/doctor-panel.html",
                        "/login",
                        "/registro-paciente",
                        "/registro-medico",
                        "/perfil",
                        "/admin",
                        "/doctor-panel",
                        "/error",
                        "/favicon.ico"
                ).permitAll()

                .requestMatchers(
                        "/css/**",
                        "/img/**",
                        "/js/**"
                ).permitAll()

                // WebSocket y archivos del chat
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/uploads/chat/**").permitAll()

                // Especialidades
                .requestMatchers(HttpMethod.GET, "/specialities").permitAll()
                .requestMatchers("/specialities/**").hasAuthority("ROLE_ADMIN")

                // Foros y publicaciones
                .requestMatchers(HttpMethod.GET, "/forums/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/posts/**").permitAll()
                .requestMatchers("/forums/**").hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers("/posts/**").hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Administración
                .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")

                // Medicamentos
                .requestMatchers("/medications/search/**").permitAll()
                .requestMatchers("/medications/patient/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers(HttpMethod.PUT, "/medications/**")
                    .hasAuthority("ROLE_DOCTOR")
                .requestMatchers(HttpMethod.DELETE, "/medications/**")
                    .hasAuthority("ROLE_DOCTOR")

                // Consejos de salud
                .requestMatchers(HttpMethod.GET, "/health-tips/**").permitAll()
                .requestMatchers("/health-tips/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Solicitudes de seguimiento
                .requestMatchers("/follow-requests/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Conversaciones
                .requestMatchers("/conversations/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Cuestionarios y asignaciones
                .requestMatchers("/questionnaires/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers("/assignments/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Historias clínicas y tratamientos
                .requestMatchers(HttpMethod.GET, "/medical-records/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers("/medical-records/**")
                    .hasAuthority("ROLE_DOCTOR")

                .requestMatchers(HttpMethod.GET, "/treatments/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers("/treatments/**")
                    .hasAuthority("ROLE_DOCTOR")

                // Tutela (tutor y paciente)
                .requestMatchers("/tutors/**")
                    .hasAnyAuthority(PATIENT_AND_TUTOR)

                // Notificaciones
                .requestMatchers("/notifications/**")
                    .hasAnyAuthority(ALL_ROLES)

                // Reportes
                .requestMatchers(HttpMethod.POST, "/reports")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)
                .requestMatchers("/reports/**")
                    .hasAuthority("ROLE_ADMIN")

                // Usuarios
                .requestMatchers(
                        HttpMethod.GET,
                        "/users/all",
                        "/users/active",
                        "/users/inactive"
                ).hasAuthority("ROLE_ADMIN")

                .requestMatchers("/users/**")
                    .hasAnyAuthority(ALL_ROLES)

                // Búsqueda de medicamentos FDA
                .requestMatchers(
                        HttpMethod.GET,
                        "/fda/search-medication"
                ).permitAll()

                // Médicos
                .requestMatchers(HttpMethod.GET, "/doctors/**").permitAll()
                .requestMatchers("/doctors/**").hasAuthority("ROLE_DOCTOR")

                // Pacientes vinculados al médico
                .requestMatchers(HttpMethod.GET, "/patients/my-patients")
                    .hasAnyAuthority("ROLE_DOCTOR", "DOCTOR")

                .requestMatchers("/patients/**")
                    .hasAnyAuthority(PATIENT_TUTOR_DOCTOR)

                // Documentación
                .requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/swagger-resources/**",
                        "/webjars/**"
                ).permitAll()

                .anyRequest().authenticated()
            )

            .addFilterBefore(
                    jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class
            )

            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler((request, response, exceptionDenied) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);

                    String jsonResponse = String.format(
                            "{\"error\":\"%s\",\"status\":%d,\"path\":\"%s\"}",
                            "Acceso denegado",
                            HttpServletResponse.SC_FORBIDDEN,
                            request.getRequestURI()
                    );

                    response.getWriter().write(jsonResponse);
                    response.getWriter().flush();
                })
            );

        return http.build();
    }
}
