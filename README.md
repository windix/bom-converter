# BOM converter for ESP32-e-Paper-Weather-Display

Convert BOM (Bureau of Meteorology, Australia) data source into **Open Weather Map** format used by [ESP32-e-Paper-Weather-Display](https://github.com/G6EJD/ESP32-e-Paper-Weather-Display)

## GeoHash

Find your geohash at: https://weather.bom.gov.au/

e.g. https://weather.bom.gov.au/location/r1r0fsn-melbourne

Geohash string should be the first 6 characters of `r1r0fsn` -> `r1r0fs`

## Endpoints

### Localhost

http://localhost:8080/weather/r1r1j2

http://localhost:8080/forecast/r1r1j2
### Deployed

_Note: on my own server, can pull off any time without notification_

http://lab.windix.com.au/bom/weather/r1r1j2

http://lab.windix.com.au/bom/forecast/r1r1j2
