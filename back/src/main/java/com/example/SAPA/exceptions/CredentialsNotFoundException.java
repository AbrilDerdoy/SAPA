package com.example.SAPA.exceptions;

public class CredentialsNotFoundException extends RuntimeException {
    public CredentialsNotFoundException(String message) {
        super(message);
    }
}
