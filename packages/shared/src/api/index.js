"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.createApiClient = createApiClient;
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(status, message, data) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.message = message;
        _this.data = data;
        _this.name = "ApiError";
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
function createApiClient(config) {
    var baseUrl = config.baseUrl, getToken = config.getToken;
    function request(path_1) {
        return __awaiter(this, arguments, void 0, function (path, options) {
            var _a, method, body, params, url, query_1, qs, headers, token, res, errData;
            var _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = options.method, method = _a === void 0 ? "GET" : _a, body = options.body, params = options.params;
                        url = "".concat(baseUrl).concat(path);
                        if (params) {
                            query_1 = new URLSearchParams();
                            Object.entries(params).forEach(function (_a) {
                                var k = _a[0], v = _a[1];
                                if (v !== undefined)
                                    query_1.set(k, String(v));
                            });
                            qs = query_1.toString();
                            if (qs)
                                url += "?".concat(qs);
                        }
                        headers = {
                            "Content-Type": "application/json",
                        };
                        token = getToken === null || getToken === void 0 ? void 0 : getToken();
                        if (token)
                            headers["Authorization"] = "Bearer ".concat(token);
                        return [4 /*yield*/, fetch(url, {
                                method: method,
                                headers: headers,
                                body: body ? JSON.stringify(body) : undefined,
                            })];
                    case 1:
                        res = _c.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                    case 2:
                        errData = _c.sent();
                        throw new ApiError(res.status, (_b = errData.message) !== null && _b !== void 0 ? _b : res.statusText, errData);
                    case 3:
                        if (res.status === 204)
                            return [2 /*return*/, null];
                        return [2 /*return*/, res.json()];
                }
            });
        });
    }
    return {
        // Auth
        auth: {
            login: function (data) {
                return request("/api/auth/login", { method: "POST", body: data });
            },
            register: function (data) {
                return request("/api/auth/register", { method: "POST", body: data });
            },
            logout: function () { return request("/api/auth/logout", { method: "POST" }); },
            me: function () { return request("/api/auth/me"); },
        },
        // Tenants
        tenants: {
            get: function () { return request("/api/tenants/me"); },
            update: function (data) { return request("/api/tenants/me", { method: "PUT", body: data }); },
        },
        // Users
        users: {
            list: function () { return request("/api/users"); },
            create: function (data) { return request("/api/users", { method: "POST", body: data }); },
            update: function (id, data) { return request("/api/users/".concat(id), { method: "PUT", body: data }); },
            delete: function (id) { return request("/api/users/".concat(id), { method: "DELETE" }); },
        },
        // Menu
        menu: {
            categories: {
                list: function () { return request("/api/menu/categories"); },
                create: function (data) { return request("/api/menu/categories", { method: "POST", body: data }); },
                update: function (id, data) { return request("/api/menu/categories/".concat(id), { method: "PUT", body: data }); },
                delete: function (id) { return request("/api/menu/categories/".concat(id), { method: "DELETE" }); },
            },
            items: {
                list: function (params) {
                    return request("/api/menu/items", { params: params });
                },
                create: function (data) { return request("/api/menu/items", { method: "POST", body: data }); },
                update: function (id, data) { return request("/api/menu/items/".concat(id), { method: "PUT", body: data }); },
                delete: function (id) { return request("/api/menu/items/".concat(id), { method: "DELETE" }); },
            },
        },
        // Tables
        tables: {
            list: function () { return request("/api/tables"); },
            create: function (data) { return request("/api/tables", { method: "POST", body: data }); },
            update: function (id, data) { return request("/api/tables/".concat(id), { method: "PUT", body: data }); },
            delete: function (id) { return request("/api/tables/".concat(id), { method: "DELETE" }); },
        },
        // Orders
        orders: {
            list: function (params) {
                return request("/api/orders", { params: params });
            },
            get: function (id) { return request("/api/orders/".concat(id)); },
            create: function (data) { return request("/api/orders", { method: "POST", body: data }); },
            update: function (id, data) { return request("/api/orders/".concat(id), { method: "PUT", body: data }); },
        },
        // KOT
        kot: {
            board: function () { return request("/api/kot"); },
            updateStatus: function (id, status) {
                return request("/api/kot/".concat(id, "/status"), { method: "PATCH", body: { status: status } });
            },
            setPriority: function (id, isPriority) {
                return request("/api/kot/".concat(id, "/priority"), { method: "PATCH", body: { isPriority: isPriority } });
            },
        },
        // Billing
        billing: {
            list: function (params) { return request("/api/billing", { params: params }); },
            get: function (id) { return request("/api/billing/".concat(id)); },
            createForOrder: function (orderId) {
                return request("/api/billing/order/".concat(orderId), { method: "POST" });
            },
            recordPayment: function (id, data) {
                return request("/api/billing/".concat(id, "/payment"), { method: "POST", body: data });
            },
        },
        // Dashboard
        dashboard: {
            summary: function () { return request("/api/dashboard/summary"); },
            topItems: function (params) { return request("/api/dashboard/top-items", { params: params }); },
            hourlyRevenue: function () { return request("/api/dashboard/hourly-revenue"); },
        },
    };
}
