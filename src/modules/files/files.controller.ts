import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { FilesService } from './files.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { VdpAttachDto } from './dto/vdp-attach.dto';

const MAX_BYTES = 5 * 1024 * 1024;
const memoryUpload = memoryStorage();

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryUpload,
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadAttachmentDto,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    await this.files.assertUploadPermission({
      requesterId: user.userId,
      role: user.role,
      projectId: body.projectId,
      workspaceReportId: body.workspaceReportId,
      bugReportId: body.bugReportId,
      messageId: body.messageId,
      vdpSubmissionId: body.vdpSubmissionId,
    });
    return this.files.saveUploadedFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById: user.userId,
      projectId: body.projectId,
      workspaceReportId: body.workspaceReportId,
      bugReportId: body.bugReportId,
      messageId: body.messageId,
      vdpSubmissionId: body.vdpSubmissionId,
    });
  }

  @Post('vdp-attach')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryUpload,
      limits: { fileSize: MAX_BYTES },
    }),
  )
  vdpPublicAttach(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: VdpAttachDto,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.files.saveVdpPublic({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      vdpSubmissionId: body.vdpSubmissionId,
      contactEmail: body.contactEmail,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const row = await this.files.assertCanAccess({
      fileId: id,
      requesterId: user.userId,
      role: user.role,
    });
    const stream = this.files.openStream(row.storageKey);
    res.set({
      'Content-Type': row.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(row.originalName)}"`,
    });
    return new StreamableFile(stream);
  }
}
