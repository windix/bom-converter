const express = require('express')
const axios = require('axios')
const util = require('util')

const app = express()
const port = process.env.PORT || 8080

const convertIcon = bomIcon => {
  switch (bomIcon) {
    case 'sunny':
    case 'clear':
      return '01d' // sunny
    case 'partly_cloudy':
    case 'mostly_sunny':
      return '02d' // mostly sunny
    case 'cloudy':
      return '03d' // cloudy
    case 'light_rain':
    case 'rain':
      return '09d' // chance rain
    case 'shower':
    case 'showers':
    case 'light_shower':
    case 'light_showers':
    case 'heavy_shower':
    case 'heavy_showers':
      return '10d' // rain
    case 'storms':
      return '11d' // tstorms
    case 'snow':
      return '13d' // snow
    case 'haze':
    case 'fog':
    case 'dust':
      return '50d'
    default:
      return '00d' // no-data
  }
}

const logAxiosError = e => {
  // https://stackoverflow.com/questions/10729276/how-can-i-get-the-full-object-in-node-jss-console-log-rather-than-object
  const { status, data } = e.response
  console.error(util.inspect({ status, data }, false, null, true))
}

const validateGeohash = geohash => {
  // The geohash string should be 6 character long
  if (!/^[a-z0-9]{6}$/.test(geohash)) {
    console.error(`Invalid geohash: '${geohash}'`)
    return false
  }

  return geohash
}

app.get('/', (_req, res) => res.send('BOM converter'))

app.get('/weather/:geohash', async (req, res) => {
  const geohash = req.params['geohash']

  if (!validateGeohash(geohash)) {
    return res.status(400).send('Bad Request: Invalid geohash')
  }

  let ob

  try {
    const ob_result = await axios.get(
      `https://api.weather.bom.gov.au/v1/locations/${geohash}/observations`,
    )
    ob = ob_result.data
  } catch (e) {
    logAxiosError(e)
    return res.sendStatus(500)
  }

  let today

  try {
    const daily_result = await axios.get(
      `https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`,
    )
    today = daily_result.data.data[0]
  } catch (e) {
    logAxiosError(e)
    return res.sendStatus(500)
  }

  res.json({
    weather: [
      {
        description: today.short_text,
        bom_icon: `${today.icon_descriptor}${today.now.is_night ? '_night' : ''}`,
        icon: convertIcon(today.icon_descriptor),
      },
    ],
    main: {
      temp: ob.data.temp,
      feels_like: ob.data.temp_feels_like,
      temp_min: today.now.temp_now,
      temp_max: today.now.temp_later,
      humidity: ob.data.humidity,
    },
    wind: {
      speed: ob.data.wind.speed_kilometre,
      direction: ob.data.wind.direction,
      deg: 0,
    },
    timezone: 36000,
  })
})

app.get('/forecast/:geohash', async (req, res) => {
  let forecast

  const geohash = req.params['geohash']

  if (!validateGeohash(geohash)) {
    return res.status(400).send('Bad Request: Invalid geohash')
  }

  try {
    const forecast_result = await axios.get(
      `http://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/3-hourly`,
    )
    forecast = forecast_result.data
  } catch (e) {
    logAxiosError(e)
    return res.sendStatus(500)
  }

  const list = []

  for (let i = 0; i < 4; i++) {
    const item = forecast.data[i]
    list.push({
      dt: Date.parse(item.time) / 1000,
      main: {
        temp_min: item.temp,
        temp_max: 0, // only get temp from BOM
      },
      weather: [
        {
          bom_icon: `${item.icon_descriptor}${item.is_night ? '_night' : ''}`,
          icon: convertIcon(item.icon_descriptor),
        },
      ],
    })
  }

  res.json({
    list,
  })
})

const server = app.listen(port, () => {
  console.log(`BOM converter listening on port ${port}`)
})

// https://stackoverflow.com/questions/46908853/process-onsigint-multiple-termination-signals/46909554
// https://hackernoon.com/graceful-shutdown-in-nodejs-2f8f59d1c357
;['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal =>
  process.on(signal, () => {
    console.info(`Received signal ${signal}`)
    console.log('Closing http server...')
    server.close(() => console.log('Http server closed.'))

    // wait a second and force exit
    setInterval(() => process.exit(0), 1000)
  }),
)
