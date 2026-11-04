import { Component, inject } from '@angular/core';
import {Router, RouterModule, RouterOutlet} from '@angular/router';
import { Observable } from 'rxjs';
import { SessionService } from './core/service/session.service';
import { AsyncPipe } from "@angular/common";
import {MaterialModule} from "./shared/material.module";

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, MaterialModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private router = inject(Router);
  private sessionService = inject(SessionService);

  public $isLogged(): Observable<boolean> {
    return this.sessionService.$isLogged();
  }

  public logout(): void {
    this.sessionService.logOut();
    this.router.navigate([''])
  }
}
