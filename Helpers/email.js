const nodemailer = require("nodemailer");
const config = require("../config");
const hbs = require("nodemailer-express-handlebars");
const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');


// RabbitMQ connection URL
const rabbitMQ = config.rabbitMQ_URL   
const sendEmailWithTemplate = async (templateContent) => {
  const [name, templatetobeused, url] = templateContent;
  let templatePath = "";
  let template = "";

  try {
    if (templatetobeused === "confirmEmail") {
      templatePath = path.join(__dirname, "../views/manifold_2023-07-19T204428.156967/manifold.hbs");
    } else if (templatetobeused === "resetPassword") {
      templatePath = path.join(__dirname, "../views/manifold_2023-07-19T204428.156967/manifolds.hbs");
    } else {
      // Handle unsupported templateContent value
      res. status(400).json({ status: false,   message: "Unsupported templateContent: " + templateContent} );
    }

    template = fs.readFileSync(templatePath, 'utf-8');

    const replace = {
      username:name,
      url: url,
    };

    const sendhtmlpath = template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, p1) => replace[p1] || "");
    return sendhtmlpath; // Return the rendered HTML template content
  } catch (error) {
    console.log(error);
  }
};

 

async function sendEmail(to, subject, body, details) {
  try {

    // Create a RabbitMQ connection
   const connection = await amqp.connect(rabbitMQ)
 const channel = await connection.createChannel()
 
   // Declare a queue for email messages
   const queue = 'email_queue';
  const connect =  await channel.assertQueue(queue, { durable: true });


  if(!connect){
    res. status(400).json({status: false,  message: 'unable to connect'})
  }
   console. log(connect)
  // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: config.STMP_HOST,
      port: config.STMP_PORT,
      secure: true, // upgrade later with STARTTLS
      tls: {
        ciphers: 'SSLv3',
      },
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });

    console.log('transporter: ' ,transporter)
    // Setup Handlebars as the template engine
    transporter.use('compile', hbs({
      viewEngine: {
        extName: '.hbs',
        partialsDir: path.join(__dirname, '../views/manifold_2023-07-19T204428.156967'),
        layoutsDir: path.join(__dirname, '../views/manifold_2023-07-19T204428.156967'),
      },
      viewPath: 'templatePath',
      extName: '.hbs',
    }));



    const templateContent = await sendEmailWithTemplate(details.templateContent);

    const message = {
      from: config.EMAIL_FROM,
      to: to,
      subject:subject,
      text:  body,
      html: templateContent,
      context: details,
    };

    // Send an email message to the queue
     channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    // Consume the message from the queue
    channel.consume(queue, (message) => {
     try {
      if (message !== null) {
        // Your code to handle the received message goes here
        console.log('Received message:', message.content.toString());

        // Acknowledge the message to remove it from the queue
        channel.ack(message);
      } else {
        console.error('No message received within the specified timeframe.');
        // Handle the case when no message is received
      }
      setTimeout(()=>{
          console. log("No message received within the specified timeframe.")
      },2000)
     } catch (error) {
      console.error('Error in message handling:', error);
      // Handle any errors that occur during message processing
     }

    });

    const result = await  transporter.sendMail(message);
     // Close the RabbitMQ connection when done
     await channel.close();
     await connection.close();
 
    return result;
 
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}


module.exports = {
  sendEmail: sendEmail,
  sendEmailWithTemplate
};
