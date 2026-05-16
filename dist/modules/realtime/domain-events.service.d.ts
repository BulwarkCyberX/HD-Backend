import { EventEmitter2 } from '@nestjs/event-emitter';
export declare const HD_MESSAGE = "hd.message.created";
export declare const HD_NOTIFICATION = "hd.notification.created";
export declare const HD_BID = "hd.bid.updated";
export declare const HD_MILESTONE = "hd.milestone.updated";
export declare const HD_REPORT = "hd.report.updated";
export declare class DomainEventsService {
    private readonly emitter;
    constructor(emitter: EventEmitter2);
    messageCreated(payload: unknown): void;
    notificationCreated(payload: unknown): void;
    bidUpdated(payload: unknown): void;
    milestoneUpdated(payload: unknown): void;
    reportUpdated(payload: unknown): void;
}
