package com.example.SAPA.exceptions;

public class TokenNotFoundException extends RuntimeException {
    public TokenNotFoundException(String message) {
        super(message);
    }
}
