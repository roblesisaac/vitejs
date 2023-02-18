// Import the necessary packages
import { params } from "@serverless/cloud"
import nodemailer from "nodemailer";
import { createSSRApp} from "vue";
import { renderToString } from "@vue/server-renderer";

import { proper } from "../../src/utils";

const { GMAIL_USERNAME, GMAIL_SECRET, APP_NAME } = params;

// Define the function to send the email
async function email(to, payload) {
  try {

    const { subject, data, template } = payload;
    // Create a transporter for sending the email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USERNAME,
        pass: GMAIL_SECRET,
      },
    });

    // Create a Vue app to render the email template
    const app = createSSRApp({
        template,
        setup() {
          return data || {}
        },
      })
    
      // Render the app to a string
      const html = await renderToString(app)

    // Send the email
    const mailOptions = {
      from: `${ proper(APP_NAME) }  <${ GMAIL_USERNAME }>`,
      to,
      subject,
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
}

export default {
    email
}