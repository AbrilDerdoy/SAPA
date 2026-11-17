
package com.example.SAPA.config;

import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/", "/index.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        String uploadsPath = Paths.get("uploads")
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        if (!uploadsPath.endsWith("/")) {
            uploadsPath += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath);
    }
}
