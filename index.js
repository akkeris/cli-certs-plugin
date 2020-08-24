function format_endpoint(ssl_endpoint) {
  return `** 🎫  ${ssl_endpoint.name} (expires: ${(new Date(ssl_endpoint.expires)).toLocaleString()})**
  ***Id:*** ${ssl_endpoint.id}
  ***Common Name:*** ${ssl_endpoint.common_name}
  ***Type:*** ${return_type(ssl_endpoint)} 
  ***Domains:*** ${ssl_endpoint.domain_names.join(', ')}\n`; 
}

function format_order(ssl_order) {
  return `** 🎫  ${ssl_order.name} (status: ${ssl_order.status})**
  ***Id:*** ${ssl_order.id}
  ***Common Name:*** ${ssl_order.common_name}
  ***Type:*** ${return_type(ssl_order)} 
  ***Domains:*** ${ssl_order.domain_names.join(', ')}\n`; 
}

function list(appkit, args) {
  appkit.api.get('/ssl-endpoints', 
    appkit.terminal.format_objects.bind(null, format_endpoint, 
      appkit.terminal.markdown('###===### No ssl/tls endpoints were found.')));
}

function info(appkit, args) {
  appkit.api.get('/ssl-endpoints/' + args.ID_OR_NAME, 
    appkit.terminal.format_objects.bind(null, format_endpoint, 
      appkit.terminal.markdown('###===### SSL/TLS endpoint were found.')));
}

function check_create(payload) {
  // The payload is checked on submission,
  // but lets do a softer check here so a user
  // doesnt waste their time.
  console.assert(payload.name && /(^[A-z0-9\-\.]+$)/.exec(payload.name) !== null, 'The name of a certificate must be an alpha numeric.');
  console.assert(payload.common_name && /(^[A-z0-9\.\-\*]+$)/.exec(payload.common_name) !== null, 'The domain name was invalid, it must be an alpha numeric string.');
  console.assert(payload.domain_names &&
    !payload.domain_names.some((domain_name) => { return /(^[A-z0-9\.\-\*]+$)/.exec(domain_name) === null; }), 
    'One or more of the specified alternative domain names was invalid, it must be an alpha numeric string.');
  console.assert(payload.domain_names.indexOf(payload.common_name) !== -1, 'The common name must be in the list of domain names.');
  console.assert(!payload.comments || (payload.comments && payload.comments.length < 2048), 'The specified comments were too long.');
}

function return_type(obj) {
  return obj.common_name.startsWith("*.") ? 
    "wildcard" : 
    ((obj.domain_names.length === 1 || obj.domain_names === obj.common_name) ?  
      "ssl_plus" : 
      "multi_domain"
    )
}

function create_order(appkit, args) {
  let payload = {
    "name":args.NAME,
    "common_name":args.DOMAIN,
    "domain_names":args.san ? [args.DOMAIN].concat(args.san) : [args.DOMAIN],
    "comments":args.comments,
    "org":args.organization
  }
  // If args.region is not specified the controller
  // will automatically select the default region.
  if(args.region) {
    payload.region = args.region;
  }
  try {
    check_create(payload);
  } catch (e) {
    return console.error(e.message);
  }
  let go = function() {
    let task = appkit.terminal.task(`Creating certificate **🎫  ${args.DOMAIN}**`);
    task.start();
    appkit.api.post(JSON.stringify(payload), '/ssl-orders', (err, result) => {
      if(err) {
        task.end('error');
        return appkit.terminal.error(err);
      } else {
        task.end('ok');
        console.log(appkit.terminal.markdown(format_order(result)))
      }
    });
  }
  if(args.confirm) {
    go()
  } else {
    console.log()
    console.log("Name:\t\t" + args.NAME)
    console.log("Domain (CN):\t" + args.DOMAIN);
    if(args.san) {
      console.log("Alts (SAN):\t" + args.san.join(', '));
    }
    if(args.region) {
      console.log("Region:\t" + args.region);
    }
    console.log("Type:\t\t" +  return_type(payload));
    console.log("Duration:\t2-year")
    console.log("Org:\t\t" + args.organization)
    console.log()
    appkit.terminal.confirm("Create TLS certificate? (N/y)", (response) => {
      if(response.toLowerCase()[0] === 'y') {
        go()
      } else {
        console.log('Abort!')
      }
    });
  }
}


function list_orders(appkit, args) {
  appkit.api.get('/ssl-orders', 
    appkit.terminal.format_objects.bind(null, format_order, 
      appkit.terminal.markdown('###===### No ssl/tls orders were found.')));
}

function info_order(appkit, args) {
  appkit.api.get('/ssl-orders/' + args.ID_OR_NAME, (err, data) => {
    if(err) {
      return appkit.terminal.error(err);
    } else {
      return console.log(appkit.terminal.markdown(format_order(data)));
    }
  });
}

function install_order(appkit, args) {
  appkit.api.put(null, '/ssl-orders/' + args.ID_OR_NAME, (err, data) => {
    if(err) {
      return appkit.terminal.error(err);
    } else {
      return console.log(appkit.terminal.markdown(format_endpoint(data)));
    }
  });
}

module.exports = {
  init:function(appkit) {
    let create_options = {
      'san':{
        'alias':'s',
        'description':'Alternative names for your domain, e.g. other domain names other than the common name (CN) to allow. Use this flag multiple times for multiple alternative domains',
        'type':'array',
      },
      'comments':{
        'alias':'m',
        'type':'string',
        'description':'Place comments on the certificate order to let approvers know why you\'re requesting it.',
        'default':''
      },
      'confirm':{
        'alias':'c',
        'type':'boolean',
        'description':'The confirm flag disables confirmation before submitting the order.',
        'default':false
      },
      'organization':{
        'alias':'o',
        'type':'string',
        'demandOption': true,
        'description':'The name or UUID of the organization who is requesting this certificate.'
      },
      'region':{
        'region':'r',
        'type':'string',
        'description':'The region to request and install this region on.'
      }
    };
    appkit.args
      .command('certs', 'list available https (tls) certificates', {}, list.bind(null, appkit))
      .command(`certs:info ID_OR_NAME`,'get information on an https (tls) certificate', {}, () => info.bind(null, appkit))
      .command(`certs:create NAME DOMAIN`, 'create a https (tls) certificate, the NAME is a human friendly name (no spaces or dashes)', create_options, create_order.bind(null, appkit))
      .command(`certs:orders`, 'list https/tls outstanding orders', {}, list_orders.bind(null, appkit))
      .command(`certs:orders:status ID_OR_NAME`, 'Check the status of a https (tls) certificate order', {}, info_order.bind(null, appkit))
      .command(`certs:orders:install ID_OR_NAME`,'Install the certificate, this can only be done if its status is "issued".',{}, install_order.bind(null, appkit))
      .command(`certs:orders:create NAME DOMAIN`, false, create_options, create_order.bind(null, appkit))
      .command(`certs:status ID_OR_NAME`, false, {}, info_order.bind(null, appkit))
      .command(`certs:install ID_OR_NAME`,false,{}, install_order.bind(null, appkit));
  },
  update:function(){},
  group:'certs',
  help:'Manage https/tls certificates',
  primary:true
};
