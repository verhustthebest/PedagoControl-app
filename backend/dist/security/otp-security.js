"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safelyCompareOtp = exports.hashOtp = void 0;
exports.otpCanBeUsed = otpCanBeUsed;
exports.invalidatePendingOtp = invalidatePendingOtp;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashOtp = (code) => bcrypt_1.default.hash(code, 10);
exports.hashOtp = hashOtp;
const safelyCompareOtp = (code, hash) => bcrypt_1.default.compare(code, hash);
exports.safelyCompareOtp = safelyCompareOtp;
function otpCanBeUsed(record, now = Date.now()) {
    return record.status === 'pending' && record.expires_at.getTime() > now;
}
function invalidatePendingOtp(status) {
    return status === 'pending' ? 'superseded' : status;
}
