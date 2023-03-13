// const AWS = require("aws-sdk");

// const SES_CONFIG = {
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRETE_ACCESS_KEY,
//   region: "us-east-2",
// };

// const AWS_SES = new AWS.SES(SES_CONFIG);

// let sendEmail = (recipientEmail, name) => {
//   let params = {
//     Source: "habittusdev@gmail.com",
//     Destination: {
//       ToAddresses: [recipientEmail],
//     },
//     ReplyToAddresses: [],
//     Message: {
//       Body: {
//         Html: {
//           Charset: "UTF-8",
//           Data: "This is the body of my email! Hello from nodejs!",
//         },
//       },
//       Subject: {
//         Charset: "UTF-8",
//         Data: `Hello, ${name}!`,
//       },
//     },
//   };
//   return AWS_SES.sendEmail(params).promise();
// };

// let sendTemplateEmail = (recipientEmail) => {
//   let params = {
//     Source: "<email address you verified>",
//     Template: "<name of your template>",
//     Destination: {
//       ToAddresse: [recipientEmail],
//     },
//     TemplateData: "{ \"name':'John Doe'}",
//   };
//   return AWS_SES.sendTemplatedEmail(params).promise();
// };

// module.exports = {
//   sendEmail,
//   sendTemplateEmail,
// };
