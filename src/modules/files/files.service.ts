import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileUploadStatus, UserRole, VirusScanStatus } from '@prisma/client';
import { createReadStream, mkdirSync, existsSync } from 'fs';
import { join, posix } from 'path';
import { writeFile } from 'fs/promises';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../storage/object-storage.service';

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

function uploadRoot() {
  return process.env.FILE_UPLOAD_DIR ?? join(process.cwd(), 'uploads');
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStorage: ObjectStorageService,
  ) {
    const dir = uploadRoot();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  validateBuffer(input: { mimeType: string; size: number }) {
    if (input.size > MAX_BYTES) {
      throw new BadRequestException(`File exceeds maximum size of ${MAX_BYTES} bytes`);
    }
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw new BadRequestException('File type is not allowed');
    }
  }

  async saveUploadedFile(input: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedById: string | null;
    projectId?: string;
    workspaceReportId?: string;
    bugReportId?: string;
    messageId?: string;
    vdpSubmissionId?: string;
  }) {
    this.validateBuffer({ mimeType: input.mimeType, size: input.size });

    const targets = [
      input.projectId,
      input.workspaceReportId,
      input.bugReportId,
      input.messageId,
      input.vdpSubmissionId,
    ].filter(Boolean);
    if (targets.length !== 1) {
      throw new BadRequestException('Exactly one attachment target is required');
    }

    const created = await this.prisma.fileAsset.create({
      data: {
        storageKey: '_pending',
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        uploadedById: input.uploadedById,
        projectId: input.projectId,
        workspaceReportId: input.workspaceReportId,
        bugReportId: input.bugReportId,
        messageId: input.messageId,
        vdpSubmissionId: input.vdpSubmissionId,
      },
      select: { id: true },
    });

    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
    const dir = join(uploadRoot(), created.id);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const storageKey = posix.join(created.id, safeName);
    const absolutePath = join(uploadRoot(), created.id, safeName);
    await writeFile(absolutePath, input.buffer);

    await this.prisma.fileAsset.update({
      where: { id: created.id },
      data: { storageKey },
    });

    return this.getMetadata(created.id);
  }

  async getMetadata(id: string) {
    const row = await this.prisma.fileAsset.findUnique({
      where: { id },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        storageKey: true,
        uploadedById: true,
        projectId: true,
        workspaceReportId: true,
        bugReportId: true,
        messageId: true,
        vdpSubmissionId: true,
        createdAt: true,
      },
    });
    if (!row) throw new NotFoundException('File not found');
    const base =
      process.env.PUBLIC_API_URL ?? process.env.WEB_ORIGIN?.split(',')[0]?.trim() ?? 'http://localhost:4000';
    const url = `${base.replace(/\/$/, '')}/files/${row.id}`;
    return {
      id: row.id,
      url,
      originalName: row.originalName,
      mimeType: row.mimeType,
      size: row.size,
      uploadedBy: row.uploadedById,
      projectId: row.projectId,
      workspaceReportId: row.workspaceReportId,
      bugReportId: row.bugReportId,
      messageId: row.messageId,
      vdpSubmissionId: row.vdpSubmissionId,
      createdAt: row.createdAt,
    };
  }

  async assertCanAccess(input: { fileId: string; requesterId: string; role: UserRole }) {
    const row = await this.prisma.fileAsset.findUnique({
      where: { id: input.fileId },
      select: {
        storageKey: true,
        mimeType: true,
        originalName: true,
        projectId: true,
        workspaceReportId: true,
        bugReportId: true,
        messageId: true,
        vdpSubmissionId: true,
      },
    });
    if (!row) throw new NotFoundException('File not found');

    if (input.role === UserRole.ADMIN) {
      return row;
    }

    if (row.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: row.projectId },
        select: { clientId: true, selectedProviderId: true },
      });
      if (!project) throw new NotFoundException('Linked project not found');
      if (project.clientId === input.requesterId || project.selectedProviderId === input.requesterId) {
        return row;
      }
    }

    if (row.workspaceReportId) {
      const report = await this.prisma.report.findUnique({
        where: { id: row.workspaceReportId },
        select: {
          submittedBy: true,
          project: { select: { clientId: true, selectedProviderId: true } },
        },
      });
      if (!report) throw new NotFoundException('Linked report not found');
      const p = report.project;
      if (
        report.submittedBy === input.requesterId ||
        p.clientId === input.requesterId ||
        p.selectedProviderId === input.requesterId
      ) {
        return row;
      }
    }

    if (row.bugReportId) {
      const br = await this.prisma.bugReport.findUnique({
        where: { id: row.bugReportId },
        select: {
          researcherId: true,
          program: { select: { clientId: true } },
        },
      });
      if (!br) throw new NotFoundException('Linked bounty report not found');
      if (
        br.researcherId === input.requesterId ||
        br.program.clientId === input.requesterId
      ) {
        return row;
      }
    }

    if (row.messageId) {
      const msg = await this.prisma.message.findUnique({
        where: { id: row.messageId },
        select: {
          senderId: true,
          project: { select: { clientId: true, selectedProviderId: true } },
        },
      });
      if (!msg) throw new NotFoundException('Linked message not found');
      const p = msg.project;
      if (
        msg.senderId === input.requesterId ||
        p.clientId === input.requesterId ||
        p.selectedProviderId === input.requesterId
      ) {
        return row;
      }
    }

    if (row.vdpSubmissionId) {
      const sub = await this.prisma.vdpSubmission.findUnique({
        where: { id: row.vdpSubmissionId },
        select: {
          contactEmail: true,
          vdp: { select: { clientId: true } },
        },
      });
      if (!sub) throw new NotFoundException('Linked VDP submission not found');
      if (sub.vdp.clientId === input.requesterId) {
        return row;
      }
    }

    throw new ForbiddenException('You cannot access this file');
  }

  openStream(storageKey: string) {
    const absolutePath = join(uploadRoot(), ...storageKey.split('/'));
    return createReadStream(absolutePath);
  }

  async assertUploadPermission(input: {
    requesterId: string;
    role: UserRole;
    projectId?: string;
    workspaceReportId?: string;
    bugReportId?: string;
    messageId?: string;
    vdpSubmissionId?: string;
  }) {
    const targets = [
      input.projectId,
      input.workspaceReportId,
      input.bugReportId,
      input.messageId,
      input.vdpSubmissionId,
    ].filter(Boolean);
    if (targets.length !== 1) {
      throw new BadRequestException('Exactly one attachment target is required');
    }

    if (input.role === UserRole.ADMIN) {
      return;
    }

    if (input.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { clientId: true, selectedProviderId: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.clientId !== input.requesterId && project.selectedProviderId !== input.requesterId) {
        throw new ForbiddenException('Only workspace participants can attach files to this project');
      }
      return;
    }

    if (input.workspaceReportId) {
      const report = await this.prisma.report.findUnique({
        where: { id: input.workspaceReportId },
        select: {
          project: { select: { clientId: true, selectedProviderId: true } },
        },
      });
      if (!report) throw new NotFoundException('Report not found');
      const p = report.project;
      if (p.clientId !== input.requesterId && p.selectedProviderId !== input.requesterId) {
        throw new ForbiddenException('Only workspace participants can attach files to this report');
      }
      return;
    }

    if (input.bugReportId) {
      const br = await this.prisma.bugReport.findUnique({
        where: { id: input.bugReportId },
        select: {
          researcherId: true,
          program: { select: { clientId: true } },
        },
      });
      if (!br) throw new NotFoundException('Bounty report not found');
      if (br.researcherId !== input.requesterId && br.program.clientId !== input.requesterId) {
        throw new ForbiddenException('You cannot attach files to this bounty submission');
      }
      return;
    }

    if (input.messageId) {
      const msg = await this.prisma.message.findUnique({
        where: { id: input.messageId },
        select: {
          project: { select: { clientId: true, selectedProviderId: true } },
        },
      });
      if (!msg) throw new NotFoundException('Message not found');
      const p = msg.project;
      if (p.clientId !== input.requesterId && p.selectedProviderId !== input.requesterId) {
        throw new ForbiddenException('Only workspace participants can attach files to chat');
      }
      return;
    }

    if (input.vdpSubmissionId) {
      const sub = await this.prisma.vdpSubmission.findUnique({
        where: { id: input.vdpSubmissionId },
        select: { vdp: { select: { clientId: true } } },
      });
      if (!sub) throw new NotFoundException('VDP submission not found');
      if (sub.vdp.clientId !== input.requesterId) {
        throw new ForbiddenException('Only the VDP owner can attach files to submissions');
      }
      return;
    }
  }

  async saveVdpPublic(input: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
    vdpSubmissionId: string;
    contactEmail: string;
  }) {
    const sub = await this.prisma.vdpSubmission.findUnique({
      where: { id: input.vdpSubmissionId },
      select: { contactEmail: true },
    });
    if (!sub?.contactEmail) {
      throw new BadRequestException('Submission must include a contact email to attach evidence');
    }
    if (sub.contactEmail.toLowerCase() !== input.contactEmail.toLowerCase()) {
      throw new ForbiddenException('Contact email does not match this submission');
    }

    return this.saveUploadedFile({
      buffer: input.buffer,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      uploadedById: null,
      vdpSubmissionId: input.vdpSubmissionId,
    });
  }

  async presignUpload(input: {
    requesterId: string;
    role: UserRole;
    originalName: string;
    mimeType: string;
    size: number;
    projectId?: string;
    workspaceReportId?: string;
    bugReportId?: string;
    messageId?: string;
    vdpSubmissionId?: string;
  }) {
    if (!this.objectStorage.isRemoteEnabled()) {
      throw new BadRequestException('Remote object storage is not configured; use POST /files/upload');
    }
    this.validateBuffer({ mimeType: input.mimeType, size: input.size });
    await this.assertUploadPermission({
      requesterId: input.requesterId,
      role: input.role,
      projectId: input.projectId,
      workspaceReportId: input.workspaceReportId,
      bugReportId: input.bugReportId,
      messageId: input.messageId,
      vdpSubmissionId: input.vdpSubmissionId,
    });
    const storageKey = this.objectStorage.makeObjectKey('uploads', input.originalName);
    const driver = process.env.STORAGE_DRIVER ?? 's3';
    const created = await this.prisma.fileAsset.create({
      data: {
        storageKey,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        uploadedById: input.requesterId,
        projectId: input.projectId,
        workspaceReportId: input.workspaceReportId,
        bugReportId: input.bugReportId,
        messageId: input.messageId,
        vdpSubmissionId: input.vdpSubmissionId,
        uploadStatus: FileUploadStatus.PENDING_UPLOAD,
        storageProvider: driver,
        virusScanStatus: VirusScanStatus.PENDING,
      },
      select: { id: true },
    });
    const uploadUrl = await this.objectStorage.presignPut(storageKey, input.mimeType);
    return { fileId: created.id, uploadUrl, method: 'PUT' as const };
  }

  async completePresignedUpload(input: { fileId: string; requesterId: string }) {
    const row = await this.prisma.fileAsset.findUnique({
      where: { id: input.fileId },
      select: { id: true, uploadedById: true, uploadStatus: true },
    });
    if (!row) throw new NotFoundException('File not found');
    if (row.uploadedById !== input.requesterId) {
      throw new ForbiddenException('You cannot complete this upload');
    }
    if (row.uploadStatus !== FileUploadStatus.PENDING_UPLOAD) {
      throw new BadRequestException('File is not awaiting upload completion');
    }
    await this.prisma.fileAsset.update({
      where: { id: input.fileId },
      data: {
        uploadStatus: FileUploadStatus.ACTIVE,
        virusScanStatus: VirusScanStatus.SKIPPED,
      },
    });
    return this.getMetadata(input.fileId);
  }
}
