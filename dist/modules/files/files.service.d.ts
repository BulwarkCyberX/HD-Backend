import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../storage/object-storage.service';
export declare class FilesService {
    private readonly prisma;
    private readonly objectStorage;
    constructor(prisma: PrismaService, objectStorage: ObjectStorageService);
    validateBuffer(input: {
        mimeType: string;
        size: number;
    }): void;
    saveUploadedFile(input: {
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
    }): Promise<{
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
    getMetadata(id: string): Promise<{
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
    assertCanAccess(input: {
        fileId: string;
        requesterId: string;
        role: UserRole;
    }): Promise<{
        messageId: string | null;
        projectId: string | null;
        storageKey: string;
        originalName: string;
        mimeType: string;
        workspaceReportId: string | null;
        bugReportId: string | null;
        vdpSubmissionId: string | null;
    }>;
    openStream(storageKey: string): import("fs").ReadStream;
    assertUploadPermission(input: {
        requesterId: string;
        role: UserRole;
        projectId?: string;
        workspaceReportId?: string;
        bugReportId?: string;
        messageId?: string;
        vdpSubmissionId?: string;
    }): Promise<void>;
    saveVdpPublic(input: {
        buffer: Buffer;
        originalName: string;
        mimeType: string;
        size: number;
        vdpSubmissionId: string;
        contactEmail: string;
    }): Promise<{
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
    presignUpload(input: {
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
    }): Promise<{
        fileId: string;
        uploadUrl: string;
        method: "PUT";
    }>;
    completePresignedUpload(input: {
        fileId: string;
        requesterId: string;
    }): Promise<{
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
}
