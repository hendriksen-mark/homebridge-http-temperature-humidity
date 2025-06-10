import plugin from './index';
import { expect, jest, it, describe } from '@jest/globals';

describe('HttpTemperatureHumidity Plugin', () => {
  it('should export a function', () => {
    expect(typeof plugin).toBe('function');
  });

  it('should register accessory when called with mock API', () => {
    const registerAccessory = jest.fn();
    const api = {
      hap: {
        Service: {},
        Characteristic: {},
      },
      registerAccessory,
    };
    plugin(api as any);
    expect(registerAccessory).toHaveBeenCalled();
  });
});
