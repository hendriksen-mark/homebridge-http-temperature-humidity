# Homebridge Advanced Http Temperature Humidity

## Installation

1. Install homebridge using: npm install -g homebridge
2. Install homebridge-advanced-http-temperature-humidity using: npm install -g homebridge-advanced-http-temperature-humidity
3. Update your configuration file. See [Example Config](#example-config) for a sample.

## Configuration

### Parameters
| parameter       | description                                                | default                 | required |
|-----------------|------------------------------------------------------------|-------------------------|----------|
| url             | The url to fetch temperature (and humidity)                | /                       | true     |
| http_method     | The http method                                            | GET                     | false    |
| username        | Username for http-authentication                           | /                       | false    |
| password        | Password for http-authentication                           | /                       | false    |
| name            | Name of the homekit accessory                              | /                       | true     |
| manufacturer    | Name of the manufacturer of the accessory                  | Mark Hendriksen         | false    |
| model           | Name of the model of the accessory                         | Default                 | false    |
| serial          | Serial of the accessory                                    | "18981898"              | false    |
| disableHumidity | Should humidity be disabled?                               | false                   | false    |
| pullInterval    | Interval in milliseconds to pull temperature and humidity  |                         | false    |

### Example Config

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CD:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-156"
  },

  "description": "Example",

  "platforms": [],

  "accessories": [
    {
      "name": "TemperatureHumidity",
      "url": {
          "url": "http://my-sensor.local/api/v1/temperature-humidity",
          "http_method": "GET",
          "auth": {
            "username": "",
            "password": ""
          }
      },
      "manufacturer": "Mark Hendriksen",
      "model": "Default",
      "pullInterval": 5000,
      "serial": "18981898",
      "disableHumidity": false,
      "accessory": "HttpTemperatureHumidity",
    }
  ]
}
```
## Response
The response must be in the following format:
```json
{
    "temperature": 25.8,
    "humidity": 38
}
```