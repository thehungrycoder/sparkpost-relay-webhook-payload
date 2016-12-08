'use strict';

let MailParser = require("mailparser").MailParser,
  mailparser = new MailParser(),
  fs = require('fs'),
  _ = require('lodash'),
  ArgumentsParser = require('argparse').ArgumentParser,
  argsParser = new ArgumentsParser({
    addHelp: true,
    description: "Generate SparkPost relay webhook payload style data"
  }),
  args;

argsParser.addArgument(
  ['-i', '--input'],
  {
    help: 'Specify input .eml file (absolute path).',
    required: true
  }
);

argsParser.addArgument(
  ['-o', '--output'],
  {
    help: 'Specify target  (absolute path) to write the JSON to. Leave blank to output to STDOUT.'
  }
);

argsParser.addArgument(
  ['-r', '--recipient'],
  {
    help: 'Override recipient (to) in the input file to this value.'
  }
);

args = argsParser.parseArgs();

let eml = fs.readFileSync(args.input, 'utf8');

function getRandom(max, min) {
  min = Math.floor(min || 999);
  max = Math.ceil(max || 999999999);
  return Math.floor(Math.random() * (max - min)) + min;
}

function formatAddress(addresses) {
  return _.map(addresses, address => address.address);
}

mailparser.on("end", function (mail_object) {
  let payload = [
    {
      "msys": {
        "relay_message": {
          "content": {
            "email_rfc822": eml,
            "email_rfc822_is_base64": false,
            "headers": [mail_object.headers],
            "html": mail_object.html,
            "subject": "We come in peace",
            "text": mail_object.text,
            "to": (_.isEmpty(args.recipient) ? formatAddress(mail_object.to) : [args.recipient])
          },
          "customer_id": getRandom(9999).toString(),
          "friendly_from": mail_object.from[0].address,
          "msg_from": mail_object.from[0].address, // need to verify if it's correct source
          "rcpt_to": (_.isEmpty(args.recipient) ? _.first(formatAddress(mail_object.to)): args.recipient),
          "webhook_id": getRandom().toString()
        }
      }
    }
  ];

  if (args.output) {
    fs.writeFileSync(args.output, JSON.stringify(payload, null, 2));
  } else {
    console.log(JSON.stringify(payload));
  }
});

mailparser.write(eml);
mailparser.end();