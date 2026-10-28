package com.example.SAPA.security.config;

import com.example.SAPA.security.filters.JwtAuthenticationFilter;
import com.example.SAPA.security.filters.RestAuthenticationEntryPoint;
import com.example.SAPA.security.repositories.CredentialRepository;
import com.example.SAPA.security.service.UserDetailsService;
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


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager
    authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.authorizeHttpRequests(auth -> auth

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/specialities").permitAll()

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

                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/uploads/chat/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/forums/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/posts/**").permitAll()
                        .requestMatchers("/forums/**").hasAnyRole("PATIENT", "DOCTOR")
                        .requestMatchers("/posts/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        .requestMatchers("/medications/search/**").permitAll()

                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        .requestMatchers(HttpMethod.GET, "/health-tips/**").permitAll()
                        .requestMatchers("/health-tips/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/follow-requests/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/conversations/**").hasAnyRole("PATIENT", "DOCTOR")
                        .requestMatchers("/medications/patient/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/questionnaires/**").hasAnyRole("PATIENT", "DOCTOR")
                        .requestMatchers("/assignments/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/medical-records/**").hasAnyRole("PATIENT", "DOCTOR")
                        .requestMatchers("/treatments/**").hasAnyRole("PATIENT", "DOCTOR")

                        .requestMatchers("/notifications/**").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/reports").hasAnyRole("PATIENT", "DOCTOR")
                        .requestMatchers("/reports/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/medications/patient/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/medications/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/medications/**").hasRole("DOCTOR")

                        .requestMatchers(HttpMethod.GET, "/users/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/users/active").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/users/inactive").hasRole("ADMIN")
                        .requestMatchers("/users/**").hasAnyRole("DOCTOR", "PATIENT", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/fda/search-medication").permitAll()

                        .requestMatchers(HttpMethod.GET, "/doctors/**").permitAll()
                        .requestMatchers("/doctors/**").hasRole("DOCTOR")


                        .requestMatchers(HttpMethod.GET, "/patients/my-patients").hasRole("DOCTOR")
                        .requestMatchers("/patients/**").hasRole("PATIENT")

                        .requestMatchers("/health-tips/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/health-tips/*/hospital-url").permitAll()

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        .anyRequest().authenticated())

                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers
                        -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                )
                .sessionManagement(manager ->
                        manager.sessionCreationPolicy(STATELESS))
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            String jsonResponse = String.format(
                                    "{\"error\": \"%s\", \"status\": %d, \"path\": \"%s\"}",
                                    "Acceso denegado",
                                    HttpServletResponse.SC_FORBIDDEN,
                                    request.getRequestURI()
                            );
                            response.getWriter().write(jsonResponse);
                            response.getWriter().flush();
                        }));

        return http.build();
    }
}

