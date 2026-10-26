import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROFILES_STORAGE_KEY } from './profiles';
import {
  DEFAULT_SETTINGS,
  DEVICE_SETTING_KEYS,
  DEVICE_SETTINGS_STORAGE_KEY,
  LEARNER_SETTING_KEYS,
  learnerSettingsFrom,
  learnerSettingsOf,
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  useSettings,
} from './settings';

/** What a storage key holds (its state), or null. */
function stored(key: string): Record<string, unknown> | null {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as { state: Record<string, unknown> }).state : null;
}

const save = (key: string, state: Record<string, unknown>) =>
  localStorage.setItem(key, JSON.stringify({ state, version: SETTINGS_VERSION }));

afterEach(() => {
  useSettings.setState({ ...DEFAULT_SETTINGS });
  localStorage.clear();
  vi.resetModules();
});

describe('the settings, the learner’s and the device’s', () => {
  it('splits every setting into one or the other', () => {
    const all = Object.keys(DEFAULT_SETTINGS).sort();
    expect([...LEARNER_SETTING_KEYS, ...DEVICE_SETTING_KEYS].sort()).toEqual(all);
    expect(DEVICE_SETTING_KEYS).toEqual([
      'engineThreads',
      'engineFull',
      'installDismissedAt',
      'notifyLive',
      'notifyCorrespondence',
      'notifyReminder',
      'notifyReminderMinute',
    ]);
  });

  it("keeps the device's settings under a key of their own", () => {
    useSettings.getState().update({ boardTheme: 'blue', engineThreads: false, engineFull: true });
    const learner = stored(SETTINGS_STORAGE_KEY);
    const device = stored(DEVICE_SETTINGS_STORAGE_KEY);
    expect(learner).toMatchObject({ boardTheme: 'blue' });
    for (const key of DEVICE_SETTING_KEYS) expect(learner).not.toHaveProperty(key);
    expect(device).toEqual({
      engineThreads: false,
      engineFull: true,
      installDismissedAt: null,
      notifyLive: false,
      notifyCorrespondence: false,
      notifyReminder: false,
      notifyReminderMinute: 18 * 60,
    });
  });

  it('keeps the notifications on this device, their time in quarter hours', async () => {
    save(DEVICE_SETTINGS_STORAGE_KEY, { notifyReminder: true, notifyReminderMinute: 7 * 60 + 45 });
    await useSettings.persist.rehydrate();
    expect(useSettings.getState()).toMatchObject({
      notifyReminder: true,
      notifyReminderMinute: 7 * 60 + 45,
    });
    for (const odd of [7 * 60 + 5, -15, 24 * 60, '1080']) {
      useSettings.setState({ ...DEFAULT_SETTINGS });
      save(DEVICE_SETTINGS_STORAGE_KEY, { notifyReminderMinute: odd });
      await useSettings.persist.rehydrate();
      expect(useSettings.getState().notifyReminderMinute).toBe(18 * 60);
    }
    // A synced copy carries none of them.
    expect(
      learnerSettingsFrom({ notifyLive: true, notifyReminder: true, boardTheme: 'blue' }),
    ).toEqual({ boardTheme: 'blue' });
  });

  it('reads the two back as one', async () => {
    save(SETTINGS_STORAGE_KEY, { boardTheme: 'green' });
    save(DEVICE_SETTINGS_STORAGE_KEY, { engineFull: true });
    await useSettings.persist.rehydrate();
    expect(useSettings.getState()).toMatchObject({ boardTheme: 'green', engineFull: true });
  });

  it("takes the device's settings from a save made before they were kept apart", async () => {
    save(SETTINGS_STORAGE_KEY, { boardTheme: 'green', engineFull: true, installDismissedAt: 5 });
    await useSettings.persist.rehydrate();
    expect(useSettings.getState()).toMatchObject({
      boardTheme: 'green',
      engineFull: true,
      installDismissedAt: 5,
    });
    // The next save puts them where they belong.
    useSettings.getState().update({ sounds: false });
    expect(stored(DEVICE_SETTINGS_STORAGE_KEY)).toMatchObject({ engineFull: true });
    expect(stored(SETTINGS_STORAGE_KEY)).not.toHaveProperty('engineFull');
  });

  it("gives a backup or a synced copy the learner's settings only, checked", () => {
    expect(learnerSettingsOf(DEFAULT_SETTINGS)).not.toHaveProperty('engineThreads');
    expect(
      learnerSettingsFrom({
        boardTheme: 'green',
        pieceSet: 'not-a-set',
        soundVolume: 4,
        engineFull: true,
        fromTheFuture: 1,
      }),
    ).toEqual({ boardTheme: 'green' });
    // A scheme the app no longer has reads as the nearest it does: black (until 0.32) is dark.
    expect(learnerSettingsFrom({ colorScheme: 'black' })).toEqual({ colorScheme: 'dark' });
    expect(learnerSettingsFrom({ colorScheme: 'sepia' })).toEqual({});
  });
});

describe('settings per profile', () => {
  /** The settings store as another profile loads it (the app reloads into a profile). */
  async function loadAs(activeId: string) {
    localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        profiles: [
          { id: 'default', name: 'Me', createdAt: 0 },
          { id: activeId, name: 'Guest', createdAt: 1 },
        ],
        activeId,
      }),
    );
    vi.resetModules();
    const settings = await import('./settings');
    await settings.useSettings.persist.rehydrate();
    return settings;
  }

  it("keeps each profile's own, and the device's for every profile", async () => {
    save(SETTINGS_STORAGE_KEY, { boardTheme: 'green' });
    save(`${SETTINGS_STORAGE_KEY}:p-guest`, { boardTheme: 'blue' });
    save(DEVICE_SETTINGS_STORAGE_KEY, { engineThreads: false });
    const { useSettings: guest } = await loadAs('p-guest');
    expect(guest.getState()).toMatchObject({ boardTheme: 'blue', engineThreads: false });
    guest.getState().update({ pieceSet: 'merida', engineFull: true });
    expect(stored(`${SETTINGS_STORAGE_KEY}:p-guest`)).toMatchObject({ pieceSet: 'merida' });
    expect(stored(SETTINGS_STORAGE_KEY)).toEqual({ boardTheme: 'green' });
    expect(stored(DEVICE_SETTINGS_STORAGE_KEY)).toMatchObject({ engineFull: true });
  });

  it("starts a profile with none of its own yet from the main profile's", async () => {
    save(SETTINGS_STORAGE_KEY, { boardTheme: 'green', engineFull: true });
    const { useSettings: guest } = await loadAs('p-guest');
    expect(guest.getState()).toMatchObject({ boardTheme: 'green', engineFull: true });
    guest.getState().update({ boardTheme: 'blue' });
    expect(stored(`${SETTINGS_STORAGE_KEY}:p-guest`)).toMatchObject({ boardTheme: 'blue' });
    expect(stored(SETTINGS_STORAGE_KEY)).toMatchObject({ boardTheme: 'green' });
  });
});
