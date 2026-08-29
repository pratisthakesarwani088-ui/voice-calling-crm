/**
 * Shared, non-secret config for Knowledge Base Management — mirrors
 * utils/customerOptions.js's pattern from Module 5.
 */

// Matches backend/app/models/enums.py:KnowledgeBaseStatus values.
export const KNOWLEDGE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const KNOWLEDGE_STATUS_VARIANT = {
  draft: "neutral",
  published: "success",
  archived: "danger",
};

// Matches backend/app/models/enums.py:KnowledgeBasePriority values.
export const KNOWLEDGE_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const KNOWLEDGE_PRIORITY_VARIANT = {
  low: "neutral",
  medium: "info",
  high: "danger",
};

export const KNOWLEDGE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

// Matches backend/app/schemas/knowledge_base.py:KNOWLEDGE_DEFAULT_PAGE_SIZE.
export const KNOWLEDGE_PAGE_SIZE = 10;
