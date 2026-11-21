
package com.example.SAPA.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/uploads/chat/**")
                .addResourceLocations("file:uploads/chat/");

        registry.addResourceHandler("/uploads/forums/**")
                .addResourceLocations("file:uploads/forums/");

        registry.addResourceHandler("/uploads/profiles/**")
                .addResourceLocations("file:uploads/profiles/");
    }

    public void configureClientInboundChannel(
            ChannelRegistration registration
    ) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(
                    Message<?> message,
                    MessageChannel channel
            ) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(
                                message,
                                StompHeaderAccessor.class
                        );

                if (accessor != null
                        && StompCommand.CONNECT.equals(accessor.getCommand())) {

                    String authHeader =
                            accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null
                            && authHeader.startsWith("Bearer ")) {

                        String token = authHeader.substring(7);

                        // La autenticación STOMP existente se mantiene
                        // sin modificar el flujo actual de JWT.
                    }
                }

                return message;
            }
        });
    }
}
