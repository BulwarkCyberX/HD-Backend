"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs_1 = require("fs");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const prisma_service_1 = require("../../prisma/prisma.service");
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
    return process.env.FILE_UPLOAD_DIR ?? (0, path_1.join)(process.cwd(), 'uploads');
}
let FilesService = class FilesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
        const dir = uploadRoot();
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
    }
    validateBuffer(input) {
        if (input.size > MAX_BYTES) {
            throw new common_1.BadRequestException(`File exceeds maximum size of ${MAX_BYTES} bytes`);
        }
        if (!ALLOWED_MIME.has(input.mimeType)) {
            throw new common_1.BadRequestException('File type is not allowed');
        }
    }
    async saveUploadedFile(input) {
        this.validateBuffer({ mimeType: input.mimeType, size: input.size });
        const targets = [
            input.projectId,
            input.workspaceReportId,
            input.bugReportId,
            input.messageId,
            input.vdpSubmissionId,
        ].filter(Boolean);
        if (targets.length !== 1) {
            throw new common_1.BadRequestException('Exactly one attachment target is required');
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
        const dir = (0, path_1.join)(uploadRoot(), created.id);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        const storageKey = path_1.posix.join(created.id, safeName);
        const absolutePath = (0, path_1.join)(uploadRoot(), created.id, safeName);
        await (0, promises_1.writeFile)(absolutePath, input.buffer);
        await this.prisma.fileAsset.update({
            where: { id: created.id },
            data: { storageKey },
        });
        return this.getMetadata(created.id);
    }
    async getMetadata(id) {
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
        if (!row)
            throw new common_1.NotFoundException('File not found');
        const base = process.env.PUBLIC_API_URL ?? process.env.WEB_ORIGIN?.split(',')[0]?.trim() ?? 'http://localhost:4000';
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
    async assertCanAccess(input) {
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
        if (!row)
            throw new common_1.NotFoundException('File not found');
        if (input.role === client_1.UserRole.ADMIN) {
            return row;
        }
        if (row.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: row.projectId },
                select: { clientId: true, selectedProviderId: true },
            });
            if (!project)
                throw new common_1.NotFoundException('Linked project not found');
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
            if (!report)
                throw new common_1.NotFoundException('Linked report not found');
            const p = report.project;
            if (report.submittedBy === input.requesterId ||
                p.clientId === input.requesterId ||
                p.selectedProviderId === input.requesterId) {
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
            if (!br)
                throw new common_1.NotFoundException('Linked bounty report not found');
            if (br.researcherId === input.requesterId ||
                br.program.clientId === input.requesterId) {
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
            if (!msg)
                throw new common_1.NotFoundException('Linked message not found');
            const p = msg.project;
            if (msg.senderId === input.requesterId ||
                p.clientId === input.requesterId ||
                p.selectedProviderId === input.requesterId) {
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
            if (!sub)
                throw new common_1.NotFoundException('Linked VDP submission not found');
            if (sub.vdp.clientId === input.requesterId) {
                return row;
            }
        }
        throw new common_1.ForbiddenException('You cannot access this file');
    }
    openStream(storageKey) {
        const absolutePath = (0, path_1.join)(uploadRoot(), ...storageKey.split('/'));
        return (0, fs_1.createReadStream)(absolutePath);
    }
    async assertUploadPermission(input) {
        const targets = [
            input.projectId,
            input.workspaceReportId,
            input.bugReportId,
            input.messageId,
            input.vdpSubmissionId,
        ].filter(Boolean);
        if (targets.length !== 1) {
            throw new common_1.BadRequestException('Exactly one attachment target is required');
        }
        if (input.role === client_1.UserRole.ADMIN) {
            return;
        }
        if (input.projectId) {
            const project = await this.prisma.project.findUnique({
                where: { id: input.projectId },
                select: { clientId: true, selectedProviderId: true },
            });
            if (!project)
                throw new common_1.NotFoundException('Project not found');
            if (project.clientId !== input.requesterId && project.selectedProviderId !== input.requesterId) {
                throw new common_1.ForbiddenException('Only workspace participants can attach files to this project');
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
            if (!report)
                throw new common_1.NotFoundException('Report not found');
            const p = report.project;
            if (p.clientId !== input.requesterId && p.selectedProviderId !== input.requesterId) {
                throw new common_1.ForbiddenException('Only workspace participants can attach files to this report');
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
            if (!br)
                throw new common_1.NotFoundException('Bounty report not found');
            if (br.researcherId !== input.requesterId && br.program.clientId !== input.requesterId) {
                throw new common_1.ForbiddenException('You cannot attach files to this bounty submission');
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
            if (!msg)
                throw new common_1.NotFoundException('Message not found');
            const p = msg.project;
            if (p.clientId !== input.requesterId && p.selectedProviderId !== input.requesterId) {
                throw new common_1.ForbiddenException('Only workspace participants can attach files to chat');
            }
            return;
        }
        if (input.vdpSubmissionId) {
            const sub = await this.prisma.vdpSubmission.findUnique({
                where: { id: input.vdpSubmissionId },
                select: { vdp: { select: { clientId: true } } },
            });
            if (!sub)
                throw new common_1.NotFoundException('VDP submission not found');
            if (sub.vdp.clientId !== input.requesterId) {
                throw new common_1.ForbiddenException('Only the VDP owner can attach files to submissions');
            }
            return;
        }
    }
    async saveVdpPublic(input) {
        const sub = await this.prisma.vdpSubmission.findUnique({
            where: { id: input.vdpSubmissionId },
            select: { contactEmail: true },
        });
        if (!sub?.contactEmail) {
            throw new common_1.BadRequestException('Submission must include a contact email to attach evidence');
        }
        if (sub.contactEmail.toLowerCase() !== input.contactEmail.toLowerCase()) {
            throw new common_1.ForbiddenException('Contact email does not match this submission');
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
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FilesService);
//# sourceMappingURL=files.service.js.map