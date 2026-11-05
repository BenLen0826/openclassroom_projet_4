import {Injectable} from "@angular/core";
import {CanActivate, Router} from "@angular/router";
import { SessionService } from "../core/service/session.service";

@Injectable({providedIn: 'root'})
export class UnauthGuard implements CanActivate {

  constructor(
    private router: Router,
    private sessionService: SessionService,
  ) {
  }

  public canActivate(): boolean {
    if (this.sessionService.isLogged) {
      // Valeur initiale : ['rentals'], une route qui n'existe pas dans l'application (→ page 404).
      // Un utilisateur déjà connecté qui ouvre /login ou /register est maintenant renvoyé vers la liste des sessions.
      this.router.navigate(['sessions']);
      return false;
    }
    return true;
  }
}
