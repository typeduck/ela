// parsing function
function parse (buf) {
  const len = buf.length
  // create data object & determine whether normal or disappeared
  const data = {}
  if (buf[0] === 0x5D && buf[len - 1] === 0x5B) { // Disappear contextual mode ']AAxxxxxxLL['
    data.disappeared = true
  } else if (buf[0] === 0x5B && buf[len - 1] === 0x5D) { // Normal mode '[AAxxxxxxLL]'
    data.disappeared = false
  } else {
    throw new Error('Invalid Buffer - bad frame')
  }

  // determine binary/hex mode
  let inner // BINARY buffer of data excluding frame delimiters
  if (len === 6 || len === 7 || len === 8) {
    inner = buf.slice(1, -1)
  } else if (len === 10 || len === 12 || len === 14) {
    // hex mode: translate to binary
    inner = new Buffer(buf.slice(1, -1).toString('ascii'), 'hex')
  } else {
    throw new Error('Buffer length must be 6/7/8 (binary) or 10/12/14 (hex)')
  }

  // Read the actual data
  data.rssi = inner[0]
  data.readerId = inner[inner.length - 1]

  // peel the onion back further - actual data portion
  data.tagIdLong = inner.slice(1, -1).toString('hex').toUpperCase()
  // for 'short' tag ID, last 3 nibbles are used for sensor data!
  data.tagIdShort = data.tagIdLong.slice(0, -3)

  // get the (unsigned) decimal value from final 12 bits
  const decVal = parseInt(data.tagIdLong.slice(-3), 16)
  // temperature granularity (p.7 of docs) & 2's complement
  if (decVal >= 2048) {
    data.temperature = (decVal - 4096) * 0.0625
  } else {
    data.temperature = decVal * 0.0625
  }
  // humidity interpretation
  data.humidity = -2.0468 + 0.0367 * decVal - 1.5955e-6 * decVal * decVal
  // movement interpretation
  data.movementSensor = decVal / 0xFFE
  // analog input
  data.analogInput = 3 * decVal / 4096
  // low battery interpretations
  data.lowBattHumidity = decVal === 0xFFF
  data.lowBattMovement = decVal === 0xFFF
  data.lowBattAnalogInput = decVal === 0xFFF
  data.lowBattTemperature = decVal === 0x7FF

  return data
}

module.exports = parse
