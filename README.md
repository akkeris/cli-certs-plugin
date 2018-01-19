# Akkeris Certificate (https, tls) Command Line Plugin

## Enabling

To add to akkeris run: 

`aka plugins:publish certs -d "Order, install and renew https (tls) certificates" -r https://github.com/akkeris/cli-certs-plugin -e "youremail@exmaple.com" -o "Your name"`


## Installing

Then to install and begin using it (or for others to begin using it) run:

`aka plugins:install certs`


## Usage

```
 $ aka certs
 🎫 akkeris.io (expires: 8/10/2020, 6:00:00 PM)
  Id: 4202b67d-730b-4c6f-9c8e-a97489a386a2
  Common Name: *.akkeris.io
  Type: wildcard 
  Domains: *.akkeris.io

 🎫 www.example.com (expires: 5/28/2020, 6:00:00 PM)
  Id: b8126f2f-eeae-4fe6-7cd7-d026a31c5c62
  Common Name: www.example.com
  Type: ssl_plus 
  Domains: www.example.com

 🎫 prod.example.com (expires: 10/21/2020, 6:00:00 PM)
  Id: 7bd162d6-8996-4005-a0b3-41b9cb9f9760
  Common Name: prod.example.com
  Type: multi_domain 
  Domains: prod-qa.example.com, prod-dev.example.com, prod.example.com

```

