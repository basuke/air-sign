# air-sign
DIY sign board with API embedded. Change the display by sending a HTTP request.

## Featrue

- It's a wireless sign board to display message. i.e. in the office door, kids room
- Change the display contents by sending a HTTP request to the API.
- mDNS supported. You can name it and locate using `some-name`.local instead of IP.

## Environment

- Moddable One https://github.com/Moddable-OpenSource/moddable/blob/public/documentation/devices/moddable-one.md

## API

The host is displayed to the screen on boot time.

### Change text

Change the displayed text.

Method | Address | BODY | Content-Type
| - | - | - | - |
POST | http://`host`/text | plain text to be displayed. Multi line text is okay with LF. | text/plain

### Change text color

Change the color of text.

Method | Address | BODY | Content-Type
| - | - | - | - |
POST | http://`host`/color | CSS 2 representation of color. i.e. #fcc, black, white, red | text/plain

### Change background color

Change the color of background.

Method | Address | BODY | Content-Type
| - | - | - | - |
POST | http://`host`/background | CSS 2 representation of color. i.e. #fcc, black, white, red | text/plain

### Change background image

Change background image.

Method | Address | BODY | Content-Type
| - | - | - | - |
POST | http://`host`/image | 320 x 240 JPEG image | image/jpeg
