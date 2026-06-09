export const PERMISSION_RESOURCE_TYPES = [
  'analyze',
  'dashboard',
  'datasource',
  'dataset',
  'folder',
  'scheduled_email'
] as const

export type PermissionResourceType = (typeof PERMISSION_RESOURCE_TYPES)[number]

export const RESOURCE_PERMISSION_LEVELS = ['none', 'view', 'edit', 'manage'] as const

export type ResourcePermissionLevel = (typeof RESOURCE_PERMISSION_LEVELS)[number]
