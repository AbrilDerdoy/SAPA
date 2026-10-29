package com.example.SAPA.service;

import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.Repositories.SpecialityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialityService {

    private final SpecialityRepository specialityRepository;

    @Transactional(readOnly = true)
    public List<SpecialityEntity> getAll() {
        return specialityRepository.findAll();
    }
}
