package com.example.SAPA.security.mapping;

import com.example.SAPA.security.enums.Permit;
import com.example.SAPA.security.enums.Role;
import org.springframework.stereotype.Component;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Component
public class RolePermitMapping {

    private final Map<Role, Set<Permit>> rolePermissions = new EnumMap<>(Role.class);

    public RolePermitMapping() {
        initializeMappings();
    }

    private void initializeMappings() {

        rolePermissions.put(Role.ROLE_ADMIN, EnumSet.allOf(Permit.class));

        rolePermissions.put(Role.ROLE_PATIENT, EnumSet.of(

                Permit.SEGUIMIENTO_SOLICITAR,
                Permit.SEGUIMIENTO_DISOLVER,
                Permit.CHAT_ENVIAR,
                Permit.CHAT_LEER,
                Permit.CHAT_SUBIR_ADJUNTOS,
                Permit.CUESTIONARIO_LEER,
                Permit.CUESTIONARIO_RESPONDER,
                Permit.CONSEJO_LEER,
                Permit.FORO_CREAR,
                Permit.FORO_EDITAR,
                Permit.FORO_ELIMINAR,
                Permit.FORO_LEER,
                Permit.POST_CREAR,
                Permit.POST_EDITAR,
                Permit.POST_ELIMINAR,
                Permit.POST_LEER,
                Permit.CONTENIDO_REPORTAR
        ));

        rolePermissions.put(Role.ROLE_DOCTOR, EnumSet.of(

                Permit.SEGUIMIENTO_GESTIONAR,
                Permit.SEGUIMIENTO_DISOLVER,
                Permit.CHAT_ENVIAR,
                Permit.CHAT_LEER,
                Permit.CUESTIONARIO_CREAR,
                Permit.CUESTIONARIO_EDITAR,
                Permit.CUESTIONARIO_ELIMINAR,
                Permit.CUESTIONARIO_LEER,
                Permit.CONSEJO_PUBLICAR,
                Permit.CONSEJO_EDITAR,
                Permit.CONSEJO_ELIMINAR,
                Permit.FORO_CREAR,
                Permit.FORO_EDITAR,
                Permit.FORO_ELIMINAR,
                Permit.FORO_LEER,
                Permit.FORO_FAVORITO,
                Permit.POST_CREAR,
                Permit.POST_EDITAR,
                Permit.POST_ELIMINAR,
                Permit.POST_LEER,
                Permit.CONTENIDO_REPORTAR
        ));
    }

    public Set<Permit> getPermitsForRole(Role role) {
        return rolePermissions.getOrDefault(role, EnumSet.noneOf(Permit.class));
    }
}

