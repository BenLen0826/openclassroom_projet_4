import { HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { SessionService } from "../core/service/session.service";
import { inject } from "@angular/core";

/**
 * Ajoute l'en-tête « Authorization: Bearer <token> » à chaque requête quand l'utilisateur est connecté :
 * le back refuse (401) les appels à l'API sans token valide.
 * HttpRequest est immuable, d'où le clone().
 */
export function customJwtInterceptorFn(request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const sessionService = inject(SessionService);
  if (sessionService.isLogged) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${sessionService.sessionInformation!.token}`,
      },
    });
  }
  return next(request);
}
