import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Directive({ selector: '[roleVisible]', standalone: true })
export class RoleVisibleDirective implements OnInit {
  @Input('roleVisible') roles: UserRole | UserRole[] = [];

  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const allowed = Array.isArray(this.roles) ? this.roles : [this.roles];
    if (this.auth.hasRole(allowed)) this.vcr.createEmbeddedView(this.tpl);
  }
}
