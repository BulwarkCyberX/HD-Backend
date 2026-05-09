import { Module } from '@nestjs/common';
import { AppMailService } from './app-mail.service';
import { NotificationEmailService } from './notification-email.service';
import { TransactionalEmailService } from './transactional-email.service';

@Module({
  providers: [AppMailService, NotificationEmailService, TransactionalEmailService],
  exports: [AppMailService, NotificationEmailService, TransactionalEmailService],
})
export class EmailModule {}

