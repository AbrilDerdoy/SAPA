# SAPA - Sistema de Asistencia para Pacientes y Profesionales de la Salud

## Descripción general del sistema

SAPA (Sistema de Asistencia para Pacientes y Profesionales de la Salud) es una plataforma diseñada para facilitar la comunicación, el seguimiento médico y la gestión de información clínica entre pacientes y profesionales de la salud.

El objetivo principal del sistema es centralizar la información médica de los pacientes, permitiendo que médicos y pacientes interactúen de forma segura mediante funcionalidades como:

* Gestión de fichas médicas.
* Registro de medicamentos y tratamientos.
* Seguimiento entre médicos y pacientes.
* Sistema de cuestionarios médicos.
* Foro de discusión.
* Chat en tiempo real.
* Notificaciones.
* Consejos de salud.
* Reportes de contenido.
* Sistema de autenticación y autorización basado en roles.

---

# Integrantes del grupo

* Camila Danilovich
* Abril Derdoy
* Brittany Marquez
* Bruno Olivera

---

# Tecnologías utilizadas

## Backend

* Java 21
* Spring Boot
* Spring Data JPA
* Spring Security
* JWT (JSON Web Token)
* WebSocket
* Maven

## Base de datos

* MySQL

## Frontend
* Angular 21
* Leaflet + OpenStreetMap + Photon - Mapa interactivo

## Documentación

* Swagger / OpenAPI

## Servicios externos

* Gmail (envío de correos electrónicos)
* Leaflet + OpenStreetMap (Mapa interactivo)
* OpenFDA API (consulta de medicamentos)

---

# Instrucciones para ejecutar el proyecto

## 1. Clonar el repositorio

```bash
git clone https://github.com/AbrilDerdoy/SAPA
cd SAPA
```

* Para el front -> cd front -> ng serve
* Para el back -> cd back -> mvn spring-boot:run

## 2. Crear la base de datos

Ingresar a MySQL y ejecutar:

```sql
CREATE DATABASE sapa;
```
* La API REST-ful crea automaticamente las tablas y las dependencias.

## 3. Configurar application.properties

Ubicado en:

```text
src/main/resources/application.properties
```

Configurar:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/sapa
spring.datasource.username=root
spring.datasource.password=
```

## 4. Configurar GMAIL

Crear una cuenta en GMAIL y configurar

```properties
spring.mail.host=smtp.gmail.io
spring.mail.port=587
spring.mail.username=TU_USERNAME
spring.mail.password=TU_PASSWORD

```

## 5. Ejecutar la aplicación

Desde IntelliJ:

* Abrir el proyecto.
* Esperar la descarga de dependencias Maven.
* Ejecutar:

```java
SapaApplication.java
```
---

# Configuración necesaria

Las siguientes variables deben configurarse antes de iniciar el sistema:

| Parámetro                  | Descripción                      |
| -------------------------- | -------------------------------- |
| spring.datasource.url      | URL de conexión a MySQL          |
| spring.datasource.username | Usuario MySQL                    |
| spring.datasource.password | Contraseña MySQL                 |
| jwt_secret                 | Clave utilizada para generar JWT |
| jwt.expiration             | Duración del Access Token        |
| jwt.refresh-expiration     | Duración del Refresh Token       |
| spring.mail.username       | Usuario SMTP                     |
| spring.mail.password       | Contraseña SMTP                  |

---

# Estructura general del proyecto

El proyecto sigue una arquitectura por capas.

```text
controller
│
├── service
│
├── repositories
│
├── models
│
├── DTOs
│
├── mappers
│
├── security
│
└── config
```

## Capas principales

### Controllers

Exponen los endpoints REST.

### Services

Implementan la lógica de negocio.

### Repositories

Acceso a datos mediante Spring Data JPA.

### Models

Entidades persistidas en la base de datos.

### DTOs

Objetos utilizados para requests y responses.

### Security

Autenticación JWT y control de permisos.

### Config

Configuraciones de Spring, Mail, WebSocket y Swagger.

---

# Descripción de entidades principales

## UserEntity

Entidad base para los usuarios del sistema.

### Especializaciones

* DoctorEntity
* PatientEntity

---

## MedicalRecordEntity

Representa la ficha médica del paciente.

Contiene:

* Medicamentos
* Tratamientos
* Historial clínico

---

## PatientMedicationEntity

Representa un medicamento asociado a una ficha médica.

---

## TreatmentEntity

Representa un tratamiento médico.

Incluye:

* Frecuencia
* Duración

---

## QuestionnaireEntity

Cuestionarios que pueden ser asignados a pacientes.

---

## QuestionnaireAssignmentEntity

Relación entre cuestionarios y pacientes.

---

## ConversationEntity

Conversaciones del sistema de chat.

---

## MessageEntity

Mensajes enviados dentro de una conversación.

---

## ForumEntity

Foros de discusión.

---

## PostEntity

Publicaciones dentro de un foro.

---

## NotificationEntity

Notificaciones generadas por el sistema.

---

## HealthTipEntity

Consejos de salud publicados por profesionales.

---

# Listado de endpoints

## Autenticación

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
```

## Usuarios

```http
GET /users/all
GET /users/active
GET /users/inactive
GET /users/profile
GET /users/me
```

## Pacientes

```http
PUT /patients/profile
GET /patients/my-patients
```

## Médicos

```http
PUT /doctors/profile
GET /doctors/{doctorId}/hospital-url
```

## Fichas médicas

```http
GET /medical-records/my
GET /medical-records/patient/{patientId}
```

## Medicamentos

```http
POST /medications/patient/{patientId}
PUT /medications/{medicationId}
DELETE /medications/{medicationId}
GET /medications/patient/{patientId}
```

## Tratamientos

```http
POST /treatments/patient/{patientId}
PUT /treatments/{treatmentId}
DELETE /treatments/{treatmentId}
GET /treatments/patient/{patientId}
GET /treatments/patient/{patientId}/filter
```

## Cuestionarios

```http
POST /questionnaires
PUT /questionnaires/{id}
DELETE /questionnaires/{id}
GET /questionnaires/my-questionnaires
```

## Asignaciones

```http
POST /assignments/{id}
GET /assignments/my-assignments
GET /assignments/{id}/responses
GET /assignments/patient/{patientId}/responses
POST /assignments/{assignmentId}/submit
```

## Chat

```http
GET /conversations
GET /conversations/{id}/messages
POST /conversations/{id}/attachments
```

## Foro

```http
GET /forums/all
GET /forums/active
GET /forums/inactive
POST /forums
PUT /forums/{forumId}
DELETE /forums/{forumId}
```

## Publicaciones

```http
GET /posts/{forumId}
GET /posts/{forumId}/filter
POST /posts/{forumId}/create
PUT /posts/{postId}
DELETE /posts/{postId}
```

## Consejos de salud

```http
POST /health-tips
PUT /health-tips/{healthId}
DELETE /health-tips/{healthId}
GET /health-tips
GET /health-tips/doctor/{doctorId}
GET /health-tips/my-tips
```

## Notificaciones

```http
GET /notifications
GET /notifications/unread
DELETE /notifications/{id}
```

---

# Ejemplos de requests y responses

## Login

### Request

```json
{
  "email": "paciente@sapa.com",
  "password": "123456"
}
```

### Response

```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

---

## Crear medicamento

### Request

```json
{
  "name": "Ibuprofeno",
  "dose": "600mg",
  "observations": "Tomar después de las comidas"
}
```

### Response

```json
{
  "id": 1,
  "name": "Ibuprofeno",
  "dose": "600mg"
}
```

---

# Sistema de autenticación y autorización

El sistema utiliza:

* Spring Security
* JWT
* Refresh Tokens
* Lista negra de tokens revocados

## Roles disponibles

### ROLE_ADMIN

Acceso total al sistema.

### ROLE_DOCTOR

Puede:

* Gestionar pacientes seguidos.
* Crear tratamientos.
* Crear medicamentos.
* Asignar cuestionarios.
* Publicar consejos de salud.

### ROLE_PATIENT

Puede:

* Gestionar su perfil.
* Consultar su ficha médica.
* Completar cuestionarios.
* Participar en foros.
* Utilizar el chat.

---

# Usuarios de prueba

## Administrador

```text
Email: admin@sapa.com
Password: Admin123*
Rol: ROLE_ADMIN
```

## Médico

```text
Email: doctor@sapa.com
Password: Doctor123*
Rol: ROLE_DOCTOR
```

## Paciente

```text
Email: paciente@sapa.com
Password: Paciente123*
Rol: ROLE_PATIENT
```

**Importante:** Si estos usuarios no se generan automáticamente, deberán crearse manualmente antes de la corrección.

---

# Enlace al despliegue

```text
Pendiente
```
---

# Aclaraciones importantes para la corrección

* La documentación interactiva de la API se encuentra disponible en:

```text
/swagger-ui.html
```

* El sistema implementa autenticación JWT con refresh tokens.
* La base de datos se genera automáticamente mediante Hibernate utilizando:

```properties
spring.jpa.hibernate.ddl-auto=update
```

* Algunas funcionalidades requieren credenciales válidas según el rol del usuario.
* El envío de correos electrónicos utiliza Mailtrap para entornos de desarrollo y pruebas, NO envia correos reales, la idea migrar (en el futuro) a la API de Gmail.
* La integración con OpenFDA permite consultar información pública sobre medicamentos.
* El proyecto implementa WebSockets para el sistema de mensajería en tiempo real.
