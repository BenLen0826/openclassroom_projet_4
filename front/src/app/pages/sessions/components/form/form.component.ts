import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../../core/service/session.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { Session } from '../../../../core/models/session.interface';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { MaterialModule } from "../../../../shared/material.module";
import { AsyncPipe } from "@angular/common";

interface SessionForm {
  name: FormControl<string>;
  date: FormControl<string>;
  teacher_id: FormControl<number | null>;
  description: FormControl<string>;
}

@Component({
  selector: 'app-form',
  imports: [AsyncPipe, MaterialModule],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private matSnackBar = inject(MatSnackBar);
  private sessionApiService = inject(SessionApiService);
  private sessionService = inject(SessionService);
  private teacherService = inject(TeacherService);
  private router = inject(Router);

  public onUpdate: boolean = false;
  public sessionForm: FormGroup<SessionForm> | undefined;
  public teachers$ = this.teacherService.all();
  private id: string | undefined;

  ngOnInit(): void {
    if (!this.sessionService.sessionInformation!.admin) {
      this.router.navigate(['/sessions']);
    }
    const url = this.router.url;
    if (url.includes('update')) {
      this.onUpdate = true;
      this.id = this.route.snapshot.paramMap.get('id')!;
      this.sessionApiService
        .detail(this.id)
        .subscribe((session: Session) => this.initForm(session));
    } else {
      this.initForm();
    }
  }

  public submit(): void {
    const { name, date, teacher_id, description } = this.sessionForm!.getRawValue();
    const session = { name, date: new Date(date), teacher_id: teacher_id!, description } as Session;

    if (!this.onUpdate) {
      this.sessionApiService
        .create(session)
        .subscribe((_: Session) => this.exitPage('Session created !'));
    } else {
      this.sessionApiService
        .update(this.id!, session)
        .subscribe((_: Session) => this.exitPage('Session updated !'));
    }
  }

  private initForm(session?: Session): void {
    this.sessionForm = this.fb.group<SessionForm>({
      name: this.fb.nonNullable.control(
        session ? session.name : '',
        [Validators.required]
      ),
      date: this.fb.nonNullable.control(
        session ? new Date(session.date).toISOString().split('T')[0] : '',
        [Validators.required]
      ),
      teacher_id: this.fb.control<number | null>(
        session ? session.teacher_id : null,
        [Validators.required]
      ),
      description: this.fb.nonNullable.control(
        session ? session.description : '',
        [
          Validators.required,
          Validators.max(2000)
        ]
      ),
    });
  }

  private exitPage(message: string): void {
    this.matSnackBar.open(message, 'Close', { duration: 3000 });
    this.router.navigate(['sessions']);
  }
}
