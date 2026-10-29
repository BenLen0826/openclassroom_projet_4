import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { MaterialModule } from "../../../../shared/material.module";
import { DatePipe, TitleCasePipe, UpperCasePipe } from "@angular/common";
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-detail',
  imports: [DatePipe, TitleCasePipe, UpperCasePipe, MaterialModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  public session: Session | undefined;
  public teacher: Teacher | undefined;
  public isParticipate = false;
  public isAdmin = false;
  public sessionId: string;
  public userId: string;

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private sessionApiService = inject(SessionApiService);
  private teacherService = inject(TeacherService);
  private matSnackBar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.isAdmin = this.sessionService.sessionInformation!.admin;
    this.userId = this.sessionService.sessionInformation!.id.toString();
  }

  ngOnInit(): void {
    this.fetchSession();
  }

  public back(): void {
    window.history.back();
  }

  public delete(): void {
    this.sessionApiService
      .delete(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
          this.matSnackBar.open('Session deleted !', 'Close', { duration: 3000 });
          this.router.navigate(['sessions']);
        }
      );
  }

  public participate(): void {
    this.sessionApiService.participate(this.sessionId, this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(_ => this.fetchSession());
  }

  public unParticipate(): void {
    this.sessionApiService.unParticipate(this.sessionId, this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(_ => this.fetchSession());
  }

  // Charge la session puis son professeur : le second appel dépend du teacher_id renvoyé par le premier.
  // On enchaîne les deux appels dans un seul pipe plutôt que d'imbriquer deux subscribe :
  // un seul abonnement couvre toute la chaîne, donc takeUntilDestroyed annule la requête
  // en cours (session ou professeur) si le composant est détruit avant la fin.
  private fetchSession(): void {
    this.sessionApiService
      .detail(this.sessionId)
      .pipe(
        // tap : effet de bord, on mémorise la session sans modifier la valeur qui circule
        tap((session: Session) => {
          this.session = session;
          this.isParticipate = session.users.some(u => u === this.sessionService.sessionInformation!.id);
        }),
        // switchMap : remplace la session par l'appel du professeur, le subscribe reçoit donc un Teacher
        switchMap((session: Session) => this.teacherService.detail(session.teacher_id.toString())),
        // toujours en dernier, pour couvrir aussi l'appel lancé par switchMap
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((teacher: Teacher) => this.teacher = teacher);
  }

}
