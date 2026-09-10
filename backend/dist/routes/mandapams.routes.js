"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const mandapams_controller_js_1 = require("../controllers/mandapams.controller.js");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const router = (0, express_1.Router)();
router.get('/featured', mandapams_controller_js_1.getFeaturedMandapams);
router.get('/', mandapams_controller_js_1.getApprovedMandapams);
router.get('/:id', mandapams_controller_js_1.getMandapamById);
router.post('/', upload.single('imageFile'), mandapams_controller_js_1.createMandapamSubmission);
exports.default = router;
