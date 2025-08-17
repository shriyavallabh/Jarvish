"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mobile = exports.ReviewMode = exports.EditMode = exports.HindiContent = exports.AIEnhanced = exports.Default = void 0;
const ContentCreator_1 = require("../apps/web/components/ContentCreator");
const meta = {
    title: 'Pages/ContentCreator',
    component: ContentCreator_1.ContentCreator,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'AI-powered content creation studio with real-time SEBI compliance checking, WhatsApp preview, and multi-language support.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['create', 'edit', 'review'],
            description: 'Content creation mode',
        },
        contentType: {
            control: { type: 'select' },
            options: ['market-update', 'educational', 'product-spotlight', 'regulatory'],
            description: 'Type of content being created',
        },
        aiAssistanceLevel: {
            control: { type: 'select' },
            options: ['minimal', 'standard', 'enhanced'],
            description: 'Level of AI assistance',
        },
        language: {
            control: { type: 'select' },
            options: ['en', 'hi', 'mr'],
            description: 'Content language',
        },
    },
};
exports.default = meta;
// Default content creation view
exports.Default = {
    args: {
        mode: 'create',
        contentType: 'market-update',
        aiAssistanceLevel: 'standard',
        language: 'en',
    },
};
// AI-enhanced creation mode
exports.AIEnhanced = {
    args: {
        mode: 'create',
        contentType: 'educational',
        aiAssistanceLevel: 'enhanced',
        language: 'en',
    },
};
// Hindi content creation
exports.HindiContent = {
    args: {
        mode: 'create',
        contentType: 'product-spotlight',
        aiAssistanceLevel: 'standard',
        language: 'hi',
    },
};
// Edit mode with existing content
exports.EditMode = {
    args: {
        mode: 'edit',
        contentType: 'market-update',
        aiAssistanceLevel: 'minimal',
        language: 'en',
    },
};
// Review mode for compliance checking
exports.ReviewMode = {
    args: {
        mode: 'review',
        contentType: 'regulatory',
        aiAssistanceLevel: 'standard',
        language: 'en',
    },
};
// Mobile content creation
exports.Mobile = {
    args: {
        mode: 'create',
        contentType: 'market-update',
        aiAssistanceLevel: 'standard',
        language: 'en',
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
