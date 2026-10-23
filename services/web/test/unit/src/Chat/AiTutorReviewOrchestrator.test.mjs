import { expect } from 'vitest'

const modulePath =
  '../../../../app/src/Features/Chat/AiTutorReviewOrchestrator.mjs'

describe('AiTutorReviewOrchestrator', function () {
  beforeEach(async function (ctx) {
    ctx.module = await import(modulePath)
  })

  describe('deduplicateComments', function () {
    const mergedTex =
      '\\section{Limitations}\n' +
      'Table 5 shows our model reaches 91.2 F1 on XNLI, which we report here for the first time.\n' +
      'We only evaluate on English data.\n'
    const scope = {
      highlightText: 'Table 5 shows our model reaches 91.2 F1 on XNLI',
      comment:
        'This limitations paragraph reports new results (91.2 F1 on XNLI) that belong in the Results section. Move them there; ARR can desk-reject papers that put main-paper content in Limitations.',
      severity: 'critical',
      category: 'conclusion',
      agentName: 'Conclusion & Supplements Reviewer',
    }
    const venueComment = {
      highlightText: scope.highlightText,
      comment:
        'This limitations paragraph reports new results (91.2 F1 on XNLI) that belong in the main paper. Move them to Results; ARR can desk-reject papers that put main-paper content in Limitations.',
      severity: 'warning',
      category: 'venue',
      agentName: 'Venue Reviewer (acl_2026)',
    }

    it('keeps a scope comment and an unrelated grammar comment on overlapping text', function (ctx) {
      const grammar = {
        highlightText: 'reaches 91.2 F1 on XNLI',
        comment:
          'Grammar: use "achieves" instead of "reaches" when reporting a score.',
        severity: 'suggestion',
        category: 'writing_style',
        agentName: 'Writing Style Reviewer',
      }
      const result = ctx.module.deduplicateComments([scope, grammar], mergedTex)
      expect(result).toHaveLength(2)
      expect(result).toContain(scope)
    })

    it('keeps the critical scope comment over a similar venue warning', function (ctx) {
      const result = ctx.module.deduplicateComments(
        [venueComment, scope],
        mergedTex
      )
      expect(result).toEqual([scope])
    })

    it('keeps comments on non-overlapping text', function (ctx) {
      const other = {
        ...venueComment,
        highlightText: 'We only evaluate on English data.',
      }
      const result = ctx.module.deduplicateComments([scope, other], mergedTex)
      expect(result).toEqual([scope, other])
    })

    it('keeps a comment whose highlightText is not in the document', function (ctx) {
      const missing = {
        ...venueComment,
        highlightText: 'Table 5 reports 91.2 F1',
      }
      const result = ctx.module.deduplicateComments([scope, missing], mergedTex)
      expect(result).toEqual([scope, missing])
    })
  })
})
