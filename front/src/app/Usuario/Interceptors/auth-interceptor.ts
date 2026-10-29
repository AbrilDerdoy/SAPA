import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
   const jwtData = localStorage.getItem('jwt');

  if (jwtData) {
    try {
      // 2. Parseamos el JSON para obtener el AccessToken
      const tokens = JSON.parse(jwtData);
      const token = tokens.AccessToken;

      if (token) {
        // 3. Clonamos la petición original y le agregamos la cabecera Authorization
        const clonarPeticion = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Pasamos la petición clonada con el token integrado
        return next(clonarPeticion);
      }
    } catch (e) {
      console.error("Error al parsear el token para la petición saliente", e);
    }
  }

  // Si no hay token, la petición sigue su curso normal sin cabecera
  return next(req);
};
