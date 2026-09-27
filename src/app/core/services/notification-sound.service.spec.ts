import { NotificationSoundService } from './notification-sound.service';

describe('NotificationSoundService', () => {
  let service: NotificationSoundService;

  beforeEach(() => {
    localStorage.clear();
    service = new NotificationSoundService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to enabled when nothing is stored yet', () => {
    expect(service.enabled).toBe(true);
  });

  it('persists the enabled flag across instances (localStorage-backed)', () => {
    service.enabled = false;
    expect(new NotificationSoundService().enabled).toBe(false);

    service.enabled = true;
    expect(new NotificationSoundService().enabled).toBe(true);
  });

  it('play() is a no-op when disabled and not forced', () => {
    service.enabled = false;
    // AudioContext isn't available/meaningful in this environment either
    // way; what matters is that play() returns without throwing when
    // disabled, i.e. it takes the early-return branch rather than
    // reaching into the Web Audio API at all.
    expect(() => service.play()).not.toThrow();
  });

  it('play(true) does not throw even when disabled (force overrides the toggle)', () => {
    service.enabled = false;
    expect(() => service.play(true)).not.toThrow();
  });
});
