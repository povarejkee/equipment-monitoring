import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { User, UserRole } from '../../../../../core/models/user.model';

function makeComponent(user?: User) {
  const dialogRef = { close: vi.fn() };
  const machineService = { getState: vi.fn(() => of({ status: 'loading' as const })) };
  const userService = { create: vi.fn(), update: vi.fn() };

  const component = new UserFormDialogComponent(
    dialogRef as any,
    { user },
    machineService as any,
    userService as any
  );

  return { component, dialogRef, machineService, userService };
}

describe('UserFormDialogComponent', () => {
  describe('canSubmit — create mode', () => {
    it('is false with no name, email or password', () => {
      const { component } = makeComponent();
      expect(component.canSubmit).toBe(false);
    });

    it('is false when the password is under 6 characters', () => {
      const { component } = makeComponent();
      component.name = 'Ivan';
      component.email = 'ivan@example.com';
      component.password = '12345';
      expect(component.canSubmit).toBe(false);
    });

    it('is false when name or email is only whitespace', () => {
      const { component } = makeComponent();
      component.name = '   ';
      component.email = 'ivan@example.com';
      component.password = '123456';
      expect(component.canSubmit).toBe(false);
    });

    it('is true once name, email and a 6+ char password are present', () => {
      const { component } = makeComponent();
      component.name = 'Ivan';
      component.email = 'ivan@example.com';
      component.password = '123456';
      expect(component.canSubmit).toBe(true);
    });
  });

  describe('canSubmit — edit mode', () => {
    const existing: User = { id: 'u1', name: 'Ivan', email: 'ivan@example.com', role: UserRole.OPERATOR };

    it('is true with an empty password (leaves it unchanged)', () => {
      const { component } = makeComponent(existing);
      expect(component.canSubmit).toBe(true);
    });

    it('is false when a new password is given but under 6 characters', () => {
      const { component } = makeComponent(existing);
      component.password = '123';
      expect(component.canSubmit).toBe(false);
    });

    it('is true when a new password of 6+ characters is given', () => {
      const { component } = makeComponent(existing);
      component.password = '123456';
      expect(component.canSubmit).toBe(true);
    });

    it('prefills fields from the provided user', () => {
      const { component } = makeComponent({ ...existing, assignedMachines: ['m1'] });
      expect(component.name).toBe('Ivan');
      expect(component.email).toBe('ivan@example.com');
      expect(component.assignedMachines).toEqual(['m1']);
      expect(component.isEdit).toBe(true);
    });
  });

  describe('submit()', () => {
    it('does nothing when canSubmit is false', () => {
      const { component, userService } = makeComponent();
      component.submit();
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('creates a user and closes the dialog on success', () => {
      const { component, userService, dialogRef } = makeComponent();
      const created: User = { id: 'u2', name: 'Petr', email: 'petr@example.com', role: UserRole.OPERATOR };
      userService.create.mockReturnValue(of(created));

      component.name = 'Petr';
      component.email = 'petr@example.com';
      component.password = '123456';
      component.submit();

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Petr', email: 'petr@example.com', password: '123456' })
      );
      expect(dialogRef.close).toHaveBeenCalledWith(created);
      expect(component.saving).toBe(false);
    });

    it('strips assignedMachines for non-operator roles', () => {
      const { component, userService } = makeComponent();
      userService.create.mockReturnValue(of({} as User));

      component.name = 'Petr';
      component.email = 'petr@example.com';
      component.password = '123456';
      component.role = UserRole.MANAGER;
      component.assignedMachines = ['m1', 'm2'];
      component.submit();

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ assignedMachines: [] })
      );
    });

    it('keeps the dialog open and surfaces the server error on failure', () => {
      const { component, userService, dialogRef } = makeComponent();
      userService.create.mockReturnValue(throwError(() => ({ error: { error: 'email taken' } })));

      component.name = 'Petr';
      component.email = 'petr@example.com';
      component.password = '123456';
      component.submit();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(component.saving).toBe(false);
      expect(component.error).toBe('email taken');
    });

    it('omits the password from the update payload when left blank', () => {
      const existing: User = { id: 'u1', name: 'Ivan', email: 'ivan@example.com', role: UserRole.OPERATOR };
      const { component, userService } = makeComponent(existing);
      userService.update.mockReturnValue(of(existing));

      component.submit();

      expect(userService.update).toHaveBeenCalledWith(
        'u1',
        expect.not.objectContaining({ password: expect.anything() })
      );
    });
  });
});
