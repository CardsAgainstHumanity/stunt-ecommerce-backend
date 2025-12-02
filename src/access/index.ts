import type { Access, FieldAccess } from 'payload'

// Restricts access to administrators only
export const adminOnly: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

// Field-level restriction for admins only
export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('admin'))

// Admin or owner of the document via customer field
export const adminOrCustomerOwner: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) {
    return true
  }
  if (user?.id) {
    return { customer: { equals: user.id } }
  }
  return false
}

// Admin or published content
export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) {
    return true
  }
  return { _status: { equals: 'published' } }
}

// Field-level access for customers
export const customerOnlyFieldAccess: FieldAccess = ({ req: { user } }) =>
  Boolean(user?.roles?.includes('customer'))