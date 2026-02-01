/**
 * Local ESLint plugin used by `eslint.config.js`.
 *
 * This is intentionally lightweight and self-contained so the repo doesn't
 * rely on unpublished packages. Rules are primarily best-practice warnings.
 */

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  rules: {
    'max-file-lines': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Warn when a file exceeds a maximum number of lines.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              max: { type: 'number' },
            },
            additionalProperties: false,
          },
        ],
        messages: {
          tooManyLines:
            'File has {{count}} lines which exceeds the maximum of {{max}}.',
        },
      },
      create(context) {
        const option = (context.options && context.options[0]) || {}
        const max = typeof option.max === 'number' ? option.max : 500

        return {
          Program(node) {
            const source = context.getSourceCode()
            const count = source.lines.length
            if (count > max) {
              context.report({
                node,
                messageId: 'tooManyLines',
                data: { count: String(count), max: String(max) },
              })
            }
          },
        }
      },
    },

    'import-order': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Warn when import declarations are not ordered alphabetically by module specifier.',
        },
        schema: [],
        messages: {
          outOfOrder:
            "Import statements are not ordered alphabetically by module specifier ('{{expected}}' should come before '{{actual}}').",
        },
      },
      create(context) {
        return {
          Program(node) {
            // Only checks top-level static imports.
            const body = node.body || []
            const imports = body.filter((n) => n && n.type === 'ImportDeclaration')

            if (imports.length < 2) return

            const sources = imports
              .map((n) => ({ node: n, value: String(n.source && n.source.value) }))
              .filter((x) => x.value)

            const sorted = [...sources]
              .map((x) => x.value)
              .sort((a, b) => a.localeCompare(b))

            for (let i = 0; i < sources.length; i++) {
              if (sources[i].value !== sorted[i]) {
                const expected = sorted[i]
                const actual = sources[i].value
                context.report({
                  node: sources[i].node,
                  messageId: 'outOfOrder',
                  data: { expected, actual },
                })
                // One warning per file is enough; otherwise it gets noisy.
                return
              }
            }
          },
        }
      },
    },
  },
}

export default plugin
