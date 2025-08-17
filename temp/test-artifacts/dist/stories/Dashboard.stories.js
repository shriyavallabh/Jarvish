"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = exports.Mobile = exports.HighRisk = exports.TodayView = exports.Default = void 0;
const Dashboard_1 = require("../apps/web/components/Dashboard");
const meta = {
    title: 'Pages/Dashboard',
    component: Dashboard_1.Dashboard,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Main advisor dashboard with daily content overview, compliance status, and quick actions for content creation and delivery management.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        advisorId: {
            control: 'text',
            description: 'Unique advisor identifier for personalization',
        },
        view: {
            control: { type: 'select' },
            options: ['overview', 'today', 'pending', 'analytics'],
            description: 'Dashboard view mode',
        },
        complianceLevel: {
            control: { type: 'select' },
            options: ['low', 'medium', 'high', 'critical'],
            description: 'Current compliance risk level',
        },
    },
};
exports.default = meta;
// Default advisor dashboard view
exports.Default = {
    args: {
        advisorId: 'advisor-001',
        view: 'overview',
        complianceLevel: 'low',
    },
};
// Today's content focus view
exports.TodayView = {
    args: {
        advisorId: 'advisor-001',
        view: 'today',
        complianceLevel: 'low',
    },
};
// High compliance risk state
exports.HighRisk = {
    args: {
        advisorId: 'advisor-001',
        view: 'overview',
        complianceLevel: 'high',
    },
};
// Mobile viewport
exports.Mobile = {
    args: {
        advisorId: 'advisor-001',
        view: 'overview',
        complianceLevel: 'low',
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
// Analytics view
exports.Analytics = {
    args: {
        advisorId: 'advisor-001',
        view: 'analytics',
        complianceLevel: 'low',
    },
};
