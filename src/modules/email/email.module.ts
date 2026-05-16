import { Module } from '@nestjs/common';
import { AppMailService } from './app-mail.service';
import { NotificationEmailService } from './notification-email.service';
import { TransactionalEmailService } from './transactional-email.service';
import { EmailTemplateService } from './email-template.service';

@Module({
  providers: [AppMailService, NotificationEmailService, TransactionalEmailService, EmailTemplateService],
  exports: [AppMailService, NotificationEmailService, TransactionalEmailService, EmailTemplateService],
})
export class EmailModule {}

