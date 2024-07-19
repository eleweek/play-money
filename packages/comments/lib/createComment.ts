import db, { Comment } from '@play-money/database'
import { getMarket } from '@play-money/markets/lib/getMarket'
import { createNotification } from '@play-money/notifications/lib/createNotification'
import { getUniqueLiquidityProviderIds } from '@play-money/transactions/lib/getUniqueLiquidityProviderIds'

export async function createComment({
  content,
  authorId,
  parentId,
  entityType,
  entityId,
}: Pick<Comment, 'content' | 'authorId' | 'parentId' | 'entityType' | 'entityId'>) {
  const comment = await db.comment.create({
    data: {
      content,
      authorId,
      parentId,
      entityType,
      entityId,
    },
    include: {
      parent: true,
    },
  })

  // TODO: Comment mentions.

  const market = await getMarket({ id: entityId })

  if (parentId && comment.parent && authorId !== comment.parent?.authorId) {
    await createNotification({
      type: 'COMMENT_REPLY',
      actorId: authorId,
      marketId: market.id,
      commentId: comment.id,
      parentCommentId: parentId ?? undefined,
      groupKey: market.id,
      userId: comment.parent.authorId,
      actionUrl: `/questions/${market.id}/${market.slug}#${comment.id}`,
    })
  }

  // TODO switch this to watchers of the market.
  const recipientIds = await getUniqueLiquidityProviderIds(market.id, [authorId, comment.parent?.authorId])

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        type: 'MARKET_COMMENT',
        actorId: authorId,
        marketId: market.id,
        commentId: comment.id,
        parentCommentId: parentId ?? undefined,
        groupKey: market.id,
        userId: recipientId,
        actionUrl: `/questions/${market.id}/${market.slug}#${comment.id}`,
      })
    )
  )

  return comment
}
