"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./errorHandler");
const validate = (validations) => {
    return async (req, _res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        const extractedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
        }));
        return next(new errorHandler_1.AppError(extractedErrors[0].message, 400));
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map