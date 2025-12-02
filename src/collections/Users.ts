import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Make the first user an admin on create
        if (operation === 'create') {
          const existingUsers = await req.payload.count({ collection: 'users' })
          if (existingUsers.totalDocs === 0) {
            data.roles = ['admin']
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['customer'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Customer', value: 'customer' },
      ],
    },
  ],
}
