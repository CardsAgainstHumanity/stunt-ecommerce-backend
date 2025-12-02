import type { CollectionConfig } from 'payload'

export const productsOverride = ({
  defaultCollection,
}: {
  defaultCollection: CollectionConfig
}): CollectionConfig => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: 'title',
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeValidate: [
      ...(defaultCollection.hooks?.beforeValidate || []),
      ({ data, operation }) => {
        // Auto-generate slug from title if not provided
        if (operation === 'create' || operation === 'update') {
          if (data?.title && !data?.slug) {
            data.slug = data.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sku',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'copy',
      type: 'richText',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    ...defaultCollection.fields,
  ],
})
