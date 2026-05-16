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
exports.DomainEventsService = exports.HD_REPORT = exports.HD_MILESTONE = exports.HD_BID = exports.HD_NOTIFICATION = exports.HD_MESSAGE = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
exports.HD_MESSAGE = 'hd.message.created';
exports.HD_NOTIFICATION = 'hd.notification.created';
exports.HD_BID = 'hd.bid.updated';
exports.HD_MILESTONE = 'hd.milestone.updated';
exports.HD_REPORT = 'hd.report.updated';
let DomainEventsService = class DomainEventsService {
    constructor(emitter) {
        this.emitter = emitter;
    }
    messageCreated(payload) {
        this.emitter.emit(exports.HD_MESSAGE, payload);
    }
    notificationCreated(payload) {
        this.emitter.emit(exports.HD_NOTIFICATION, payload);
    }
    bidUpdated(payload) {
        this.emitter.emit(exports.HD_BID, payload);
    }
    milestoneUpdated(payload) {
        this.emitter.emit(exports.HD_MILESTONE, payload);
    }
    reportUpdated(payload) {
        this.emitter.emit(exports.HD_REPORT, payload);
    }
};
exports.DomainEventsService = DomainEventsService;
exports.DomainEventsService = DomainEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], DomainEventsService);
//# sourceMappingURL=domain-events.service.js.map