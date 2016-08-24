# ELA RFID Tag Parsing

Parsing data according to ELA
[Reader Communication Protocol](http://www.rfid-ela.eu/Local/ela/files/556/DS_Soft_MCHD_rev_I_UK.pdf).

[ELA Documentation Downloads](http://www.rfid-ela.eu/download.html)

## Usage

This parsing function assumes no knowledge about the particular type of RFID tag
in question. It could be a simple ID tag, or measure temperature, humidity,
movement, or an analog input.

This method simply includes *all* the possible interpretations of the data.  A
full, proper interpretation of the data requires knowledge of the tag type. How
to acheive this is left as an exercise for the reader :-)

```js
const parse = require('ela').getParser()
try {
  let data = parse(buffer) // data delimited by '[' and ']', hex or binary mode
  data.disappeared // boolean, true if tag disappears from reader memory
  data.rssi // number, signal strength
  data.readerId // number, identifies reader
  data.tagIdLong // full tag ID (e.g. for tags without sensors)
  data.tagIdShort // tag ID when sensor data is included
  data.temperature // measured temperature when tag is COIN T tag
  data.humidity // measured RH, when tag is COIN RH tag
  data.movementSensor // 0-1 (nonlinear), 1 = "significant movement" (COIN MV)
  data.analogInput // voltage, when tag is analog input
  data.lowBattHumidity     // tag signalled low battery, exact format
  data.lowBattMovement     // is dependent on type of tag
  data.lowBattAnalogInput
  data.lowBattTemperature
} catch(e) {
  // buffer could not have been valid ELA reader data!
}
```
