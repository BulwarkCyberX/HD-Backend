import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { type RequestUser } from '../../auth/current-user.decorator';
import { FilesService } from './files.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { VdpAttachDto } from './dto/vdp-attach.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
export declare class FilesController {
    private readonly files;
    constructor(files: FilesService);
    upload(user: RequestUser, file: Express.Multer.File, body: UploadAttachmentDto): Promise<{
        id: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedBy: string | null;
        projectId: string | null;
        workspaceReportId: string | null;
        bugReportId: string | null;
        messageId: string | null;
        vdpSubmissionId: string | null;
        createdAt: Date;
    }>;
    vdpPublicAttach(file: Express.Multer.File, body: VdpAttachDto): Promise<{
        id: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedBy: string | null;
        projectId: string | null;
        workspaceReportId: string | null;
        bugReportId: string | null;
        messageId: string | null;
        vdpSubmissionId: string | null;
        createdAt: Date;
    }>;
    presignUpload(user: RequestUser, body: PresignUploadDto): Promise<{
        fileId: string;
        uploadUrl: string;
        method: "PUT";
    }>;
    completePresign(user: RequestUser, id: string): Promise<{
        id: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedBy: string | null;
        projectId: string | null;
        workspaceReportId: string | null;
        bugReportId: string | null;
        messageId: string | null;
        vdpSubmissionId: string | null;
        createdAt: Date;
    }>;
    getFile(id: string, user: RequestUser, res: Response): Promise<StreamableFile>;
}
