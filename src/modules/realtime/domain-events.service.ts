import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const HD_MESSAGE = 'hd.message.created';
export const HD_NOTIFICATION = 'hd.notification.created';
export const HD_BID = 'hd.bid.updated';
export const HD_MILESTONE = 'hd.milestone.updated';
export const HD_REPORT = 'hd.report.updated';

@Injectable()
export class DomainEventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  messageCreated(payload: unknown) {
    this.emitter.emit(HD_MESSAGE, payload);
  }

  notificationCreated(payload: unknown) {
    this.emitter.emit(HD_NOTIFICATION, payload);
  }

  bidUpdated(payload: unknown) {
    this.emitter.emit(HD_BID, payload);
  }

  milestoneUpdated(payload: unknown) {
    this.emitter.emit(HD_MILESTONE, payload);
  }

  reportUpdated(payload: unknown) {
    this.emitter.emit(HD_REPORT, payload);
  }
}
