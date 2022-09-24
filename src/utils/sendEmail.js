import nodeMailer from "nodemailer";
// import sgMail from "@sendgrid/mail";

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//we are using mailtrap for testing email
export const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);

  // await sgMail.send({
  //   to: options.email,
  //   from: process.env.SMPT_MAIL,
  //   subject: options.subject,
  //   text: options.message,
  //   // html: `<a href="http://localhost:3000/reset-password/${id}">Click here</a>`,
  // });
};
