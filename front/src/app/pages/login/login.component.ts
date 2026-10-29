import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionInformation } from 'src/app/core/models/sessionInformation.interface';
import { SessionService } from 'src/app/core/service/session.service';
import { LoginRequest } from '../../core/models/loginRequest.interface';
import { AuthService } from '../../core/service/auth.service';
import {MaterialModule} from "../../shared/material.module";

@Component({
  selector: 'app-login',
  imports: [MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private sessionService = inject(SessionService);
  private destroyRef = inject(DestroyRef);

  public hide = true;
  public onError = false;

  public form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.min(3)
      ]
    ]
  });

  public submit(): void {
    const loginRequest = this.form.value as LoginRequest;
    this.authService.login(loginRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: SessionInformation) => {
          this.sessionService.logIn(response);
          this.router.navigate(['/sessions']);
        },
        error: () => this.onError = true,
      });
  }
}
