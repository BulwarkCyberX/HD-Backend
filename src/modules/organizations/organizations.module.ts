import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { EnterpriseSsoModule } from '../enterprise-sso/enterprise-sso.module';

@Module({
  imports: [EnterpriseSsoModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
