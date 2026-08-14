import { history } from '@umijs/max';
import React, { type ReactNode } from 'react';

export type Crumb = {
  title: string;
  path?: string;
};

/** PageContainer header：返回 + 面包屑（如 数据打标 / 人群标签 / 标签详情） */
export function pageHeader(opts: {
  title: ReactNode;
  backTo: string;
  crumbs: Crumb[];
  extra?: ReactNode;
  subTitle?: ReactNode;
}) {
  return {
    title: opts.title,
    subTitle: opts.subTitle,
    onBack: () => history.push(opts.backTo),
    extra: opts.extra,
    breadcrumb: {
      items: opts.crumbs.map((c, i) => {
        const isLast = i === opts.crumbs.length - 1;
        return {
          title:
            !isLast && c.path
              ? React.createElement(
                  'a',
                  {
                    onClick: (e: React.MouseEvent) => {
                      e.preventDefault();
                      history.push(c.path!);
                    },
                  },
                  c.title,
                )
              : c.title,
        };
      }),
    },
  };
}
