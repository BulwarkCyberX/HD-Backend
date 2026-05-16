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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/current-user.decorator");
const search_service_1 = require("./search.service");
const saved_search_dto_1 = require("./dto/saved-search.dto");
let SearchController = class SearchController {
    constructor(search) {
        this.search = search;
    }
    projects(user, q) {
        return this.search.searchProjects({
            q: q ?? '',
            requesterId: user.userId,
            role: user.role,
        });
    }
    providers(q) {
        return this.search.searchProviders({ q: q ?? '' });
    }
    savedMine(user) {
        return this.search.listSavedSearches(user.userId);
    }
    saveSearch(user, dto) {
        return this.search.createSavedSearch(user.userId, dto.name, dto.queryJson);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "projects", null);
__decorate([
    (0, common_1.Get)('providers'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "providers", null);
__decorate([
    (0, common_1.Get)('saved/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "savedMine", null);
__decorate([
    (0, common_1.Post)('saved'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, saved_search_dto_1.CreateSavedSearchDto]),
    __metadata("design:returntype", void 0)
], SearchController.prototype, "saveSearch", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map