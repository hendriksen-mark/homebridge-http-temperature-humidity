'use strict';

import { configParser, http, PullTimer } from 'homebridge-http-utils';

import PACKAGE_JSON from '../package.json';

import type { API, Logging } from 'homebridge';

const MANUFACTURER: string = PACKAGE_JSON.author.name;
const SERIAL_NUMBER = '001';
const MODEL: string = PACKAGE_JSON.name;
const FIRMWARE_REVISION: string = PACKAGE_JSON.version;

let Service: any, Characteristic: any;

type HttpTemperatureHumidityConfig = {
    name: string;
    url: any;
    manufacturer?: string;
    model?: string;
    serial?: string;
    disableHumidity?: boolean;
    firmwareRevision?: string;
    pullInterval?: number;
};

// Use export default for ESM compatibility
const plugin = (api: API) => {
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;

  // Register using a wrapper to adapt Homebridge's AccessoryConfig to our HttpTemperatureHumidityConfig
  api.registerAccessory(MODEL, 'HttpTemperatureHumidity', class extends HttpTemperatureHumidity {
    constructor(log: Logging, config: any, api: API) {
      // Optionally, validate config here or map fields as needed
      super(log, config as HttpTemperatureHumidityConfig, api);
    }
  });
};

class HttpTemperatureHumidity {
  log: Logging;
  name: string;
  url: any;
  manufacturer?: string;
  model?: string;
  serial?: string;
  disableHumidity?: boolean;
  firmwareRevision?: string;
  humidityService: any;
  humidity: number;
  temperatureService: any;
  temperature: number;
  api: API;
  pullTimer?: PullTimer;
  pullInterval?: number;

  constructor(log: Logging, config: HttpTemperatureHumidityConfig, api: API) {
    this.log = log;
    this.name = config.name;
    this.api = api;

    // Set default values
    this.humidity = 0;
    this.temperature = 0;

    // Config
    this.url = undefined;
    this.validateUrl('url', config, true);
    if (!this.url || !this.url.url) {
      this.log.warn('No valid URL provided in config, aborting...');
      return;
    }
    
    this.manufacturer = config.manufacturer || MANUFACTURER;
    this.model = config.model || MODEL;
    this.serial = config.serial || SERIAL_NUMBER;
    this.firmwareRevision = config.firmwareRevision || FIRMWARE_REVISION;

    this.disableHumidity = config.disableHumidity || false;

    this.temperatureService = new Service.TemperatureSensor(this.name);
    if (!this.disableHumidity) {
      this.humidityService = new Service.HumiditySensor(this.name);
    } else {
      this.humidityService = undefined;
    }

    this.pullInterval = config.pullInterval;

    if (this.pullInterval) {
      this.pullTimer = new PullTimer(
        log,
        this.pullInterval,
        async () => {
          const response = await this.getTemperatureAndHumidity();
          this.temperatureService.updateCharacteristic(Characteristic.CurrentTemperature, response.temperature);
          if (this.humidityService) {
            this.humidityService.updateCharacteristic(Characteristic.CurrentRelativeHumidity, response.humidity);
          }
        },
        undefined,
      );
      this.pullTimer.start();
    }
  }

  validateUrl(url_command: string, config: any, mandatory = false) {
    const value = config[url_command];
    if (
      (typeof value.url === 'string' && value.url.trim() !== '')
    ) {
      try {
        (this as any)[url_command] = configParser.parseUrlProperty(value);
      } catch (error: any) {
        this.log.warn(`Error occurred while parsing '${url_command}': ${error.message}`);
        this.log.warn('Aborting...');
        return;
      }
    } else if (mandatory) {
      this.log.warn(`Property '${url_command}' is required!`);
      this.log.warn('Aborting...');
      return;
    } else {
      // Optional URL missing or not a non-empty string/object with url, just skip
      (this as any)[url_command] = undefined;
    }
  }

  getServices(): any[] {
    const informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(Characteristic.Model, MODEL)
      .setCharacteristic(Characteristic.SerialNumber, SERIAL_NUMBER)
      .setCharacteristic(Characteristic.FirmwareRevision, FIRMWARE_REVISION);

    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature);

    if (this.humidityService) {
      this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .onGet(this.getCurrentHumidity);
      return [informationService, this.temperatureService, this.humidityService];
    }

    return [informationService, this.temperatureService];
  }

  getCurrentTemperature = async (): Promise<number> => {
    try {
      const response = await this.getTemperatureAndHumidity();
      return response.temperature;
    } catch (error: any) {
      this.log.error('getCurrentTemperature() failed: %s', error.message);
      throw error;
    }
  }

  getCurrentHumidity = async (): Promise<number> => {
    if (!this.humidityService) {
      throw new Error('Humidity service is disabled');
    }
    try {
      const response = await this.getTemperatureAndHumidity();
      return response.humidity;
    } catch (error: any) {
      this.log.error('getCurrentHumidity() failed: %s', error.message);
      throw error;
    }
  }

  getTemperatureAndHumidity = async (): Promise<{ temperature: number; humidity: number }> => {
    try {
      const response = await http.httpRequest(this.url);
      if (this.pullInterval && this.pullTimer) {
        this.pullTimer.resetTimer();
      }
      if (response.status !== 200) {
        this.log.error('getTemperatureAndHumidity() returned http error: %s', response.status);
        throw new Error('Got http error code ' + response.status);
      }
      let body = JSON.parse(response.data);
      let temperature = parseFloat(body.temperature);
      let humidity = parseFloat(body.humidity);
      this.log.info('Current temperature (retrieved via http): %s°C', temperature);
      if (this.humidityService) {
        this.log.info('Current humidity (retrieved via http): %s%%', humidity);
      }

      return { temperature, humidity };
    } catch (error: any) {
      this.log.error('getTemperatureAndHumidity() failed: %s', error.message);
      throw error;
    }
  }
}

export default plugin;
