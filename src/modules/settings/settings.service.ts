import { CafeSettings } from '../../models';
import type { ICafeSettings } from '../../models';
import type { UpdateSettingsInput } from './settings.validation';

export const settingsService = {
  /** Return the singleton settings doc, creating it with defaults on first read. */
  async get(): Promise<ICafeSettings> {
    const existing = await CafeSettings.findOne();
    if (existing) return existing;
    return CafeSettings.create({});
  },

  async update(input: UpdateSettingsInput): Promise<ICafeSettings> {
    const settings = await this.get();
    Object.assign(settings, input);
    await settings.save();
    return settings;
  },
};
