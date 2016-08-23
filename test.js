/* eslint-env mocha */

require('should')

let parse = require('./index').getParser()

describe('ELA', function () {
  it('should parse sample temperature (binary mode)', function () {
    let buf = new Buffer([
      0x5b, // [
      110,  // 1 byte for signal strength
      0x12, // id-byte
      0x3E, // id-nibble + first data nibble
      0x6F, // data byte
      1, // 1 byte for reader id
      0x5d  // ]
    ])
    let data = parse(buf)
    data.disappeared.should.equal(false)
    data.rssi.should.equal(110)
    data.readerId.should.equal(1)
    data.tagIdShort.should.equal('123')
    data.temperature.should.equal(-25.0625)
  })
  it('should parse using id of 2/3/4 bytes (hex mode)', function () {
    for (let i = 2; i <= 4; i++) {
      let tagLong = ('1234567890').substr(0, i * 2)
      let buf = new Buffer('[6e' + tagLong + '01]', 'ascii')
      let data = parse(buf)
      data.disappeared.should.equal(false)
      data.rssi.should.equal(0x6e)
      data.readerId.should.equal(1)
      data.tagIdLong.should.equal(tagLong)
    }
  })

  it('should parse all temperatures on p. 7 of protocol manual', function () {
    let expect = {
      '7d0': 125.0,
      '1de': 29.875,
      '050': 5.0,
      '001': 0.0625,
      '000': 0.0,
      'ff8': -0.5,
      'f5e': -10.125,
      'e6f': -25.0625,
      'c90': -55.0
    }
    for (let hex in expect) {
      let buf = new Buffer([
        0x5b,
        110, // signal
        parseInt('1' + hex.substr(0, 1), 16), // tagID=1
        parseInt(hex.substr(1, 2), 16),
        1, // reader ID
        0x5d
      ])
      let data = parse(buf)
      data.tagIdShort.should.equal('1')
      data.temperature.should.equal(expect[hex])
    }
  })

  it('should parse low battery for temperature sensor', function () {
    let buf = new Buffer([
      0x5b,
      110, // signal
      parseInt('17', 16), // tagID=1, data=7ff
      parseInt('ff', 16),
      1, // reader ID
      0x5d
    ])
    let data = parse(buf)
    data.tagIdShort.should.equal('1')
    data.lowBattTemperature.should.equal(true)
  })
  it('should parse low battery (RH/movement/analog input)', function () {
    let buf = new Buffer([
      0x5b,
      110, // signal
      parseInt('1f', 16), // tagID=1, data=fff
      parseInt('ff', 16),
      1, // reader ID
      0x5d
    ])
    let data = parse(buf)
    data.tagIdShort.should.equal('1')
    data.lowBattHumidity.should.equal(true)
    data.lowBattMovement.should.equal(true)
    data.lowBattAnalogInput.should.equal(true)
    data.lowBattTemperature.should.equal(false)
  })
  it('should parse disappeared tag', function () {
    let buf = new Buffer([
      0x5d,
      110, // signal
      0x12,
      0x34,
      1, // reader ID
      0x5b
    ])
    let data = parse(buf)
    data.tagIdLong.should.equal('1234')
    data.disappeared.should.equal(true)
  })
  it.skip('should parse sample RH sensor from manual', function () {
    let buf = new Buffer('[6E14DE01]', 'ascii')
    let data = parse(buf)
    data.tagIdShort.should.equal('1')
    data.humidity.should.be.approximately(41.19, 0.01)
  })
})
