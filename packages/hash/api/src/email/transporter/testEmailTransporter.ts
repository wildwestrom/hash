import { SendMailOptions } from "nodemailer";
import { convert } from "html-to-text";
import EmailTransporter from ".";

type TestEmail = {
  from: SendMailOptions["from"];
  to: SendMailOptions["to"];
  subject: SendMailOptions["subject"];
  text: SendMailOptions["text"];
  html: SendMailOptions["html"];
};

class TestEmailTransporter implements EmailTransporter {
  inbox: TestEmail[];

  constructor() {
    this.inbox = [];
  }

  async sendMail({
    from = "HASH <support@hash.ai>",
    to,
    subject,
    text,
    html,
  }: SendMailOptions) {
    this.inbox.push({
      from,
      to,
      subject,
      text: !text && typeof html === "string" ? convert(html) : text,
      html,
    });
  }
}

export default TestEmailTransporter;
