"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullQueue = exports.EmptyQueue = exports.Escalations = exports.ReviewDetail = exports.BatchMode = exports.HighRiskFilter = exports.Default = void 0;
const AdminApproval_1 = require("../apps/web/components/AdminApproval");
const meta = {
    title: 'Pages/AdminApproval',
    component: AdminApproval_1.AdminApproval,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Admin approval workflow for reviewing advisor-generated content with compliance scoring, batch operations, and escalation management.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        view: {
            control: { type: 'select' },
            options: ['queue', 'review', 'history', 'escalations'],
            description: 'Admin workflow view',
        },
        priorityFilter: {
            control: { type: 'select' },
            options: ['all', 'high-risk', 'pending', 'escalated'],
            description: 'Content priority filter',
        },
        batchMode: {
            control: 'boolean',
            description: 'Enable batch approval operations',
        },
        queueSize: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Number of items in approval queue',
        },
    },
};
exports.default = meta;
// Default approval queue view
exports.Default = {
    args: {
        view: 'queue',
        priorityFilter: 'all',
        batchMode: false,
        queueSize: 15,
    },
};
// High-risk content filter
exports.HighRiskFilter = {
    args: {
        view: 'queue',
        priorityFilter: 'high-risk',
        batchMode: false,
        queueSize: 8,
    },
};
// Batch approval mode
exports.BatchMode = {
    args: {
        view: 'queue',
        priorityFilter: 'all',
        batchMode: true,
        queueSize: 25,
    },
};
// Content review detail view
exports.ReviewDetail = {
    args: {
        view: 'review',
        priorityFilter: 'all',
        batchMode: false,
        queueSize: 15,
    },
};
// Escalations management
exports.Escalations = {
    args: {
        view: 'escalations',
        priorityFilter: 'escalated',
        batchMode: false,
        queueSize: 3,
    },
};
// Empty queue state
exports.EmptyQueue = {
    args: {
        view: 'queue',
        priorityFilter: 'all',
        batchMode: false,
        queueSize: 0,
    },
};
// Full queue state
exports.FullQueue = {
    args: {
        view: 'queue',
        priorityFilter: 'all',
        batchMode: true,
        queueSize: 100,
    },
};
