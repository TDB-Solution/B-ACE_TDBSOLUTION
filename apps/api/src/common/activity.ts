import { AuthUser } from './auth';

type ActivityClient = {
  activity: {
    create: (args: {
      data: {
        tenantId: string;
        type: string;
        subject: string;
        content?: string;
        relatedType?: string;
        relatedId?: string;
        userId: string;
      };
    }) => Promise<unknown>;
  };
};

export function logActivity(
  tx: ActivityClient,
  user: AuthUser,
  input: { type: string; subject: string; content?: string; relatedType?: string; relatedId?: string },
) {
  return tx.activity.create({
    data: {
      tenantId: user.tenantId,
      type: input.type,
      subject: input.subject,
      content: input.content,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      userId: user.sub,
    },
  });
}
