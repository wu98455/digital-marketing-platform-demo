import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Collapse,
  Space,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  HELP_MODULE_CARDS,
  HELP_SECTIONS,
  HELP_TOC,
  type HelpSection,
} from './content';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

const scrollToId = (id: string, replaceHash = true) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (replaceHash) {
    const path = `${history.location.pathname}${history.location.search}#${id}`;
    history.replace(path);
  }
};

const SectionBlock: React.FC<{ section: HelpSection }> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <Title level={3} className={styles.sectionTitle}>
        {section.title}
      </Title>
      {section.summary ? (
        <Paragraph className={styles.summary}>{section.summary}</Paragraph>
      ) : null}
      {section.steps?.length ? (
        <ol className={styles.steps}>
          {section.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : null}
      {section.notes?.length ? (
        <div className={styles.notes}>
          {section.notes.map((n) => (
            <Alert key={n} type="info" showIcon message={n} style={{ marginBottom: 8 }} />
          ))}
        </div>
      ) : null}
      {section.faqs?.length ? (
        <div>
          {section.faqs.map((f) => (
            <div key={f.q} className={styles.faqItem}>
              <div className={styles.q}>Q：{f.q}</div>
              <div className={styles.a}>A：{f.a}</div>
            </div>
          ))}
        </div>
      ) : null}
      {section.links?.length ? (
        <Space wrap className={styles.links}>
          {section.links.map((l) => (
            <Button key={l.path} type="primary" ghost onClick={() => history.push(l.path)}>
              {l.label}
            </Button>
          ))}
        </Space>
      ) : null}
      {/* 画布深链别名：文档可带 #activity-canvas */}
      {section.id === 'activity' ? <div id="activity-canvas" style={{ height: 0 }} /> : null}
    </section>
  );
};

const HelpPage: React.FC = () => {
  const location = useLocation();

  const anchorItems = useMemo(
    () => HELP_TOC.map((t) => ({ key: t.id, href: `#${t.id}`, title: t.title })),
    [],
  );

  const applyHash = useCallback(() => {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return;
    // activity-canvas → 滚到营销活动节
    const id = raw === 'activity-canvas' ? 'activity' : raw;
    const exists = HELP_SECTIONS.some((s) => s.id === id) || raw === 'activity-canvas';
    if (!exists) return;
    // 等布局完成再滚
    requestAnimationFrame(() => {
      const target = document.getElementById(raw === 'activity-canvas' ? 'activity-canvas' : id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  useEffect(() => {
    applyHash();
  }, [applyHash]);

  return (
    <PageContainer
      className={styles.helpPage}
      title="使用文档"
      subTitle="演示环境操作指南 · 打标 → 圈人 → 触达执行"
    >
      <div className={styles.tocMobile}>
        <Collapse
          size="small"
          items={[
            {
              key: 'toc',
              label: '目录',
              children: (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {HELP_TOC.map((t) => (
                    <Button
                      key={t.id}
                      type="link"
                      style={{ paddingInline: 0, height: 'auto' }}
                      onClick={() => scrollToId(t.id)}
                    >
                      {t.title}
                    </Button>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </div>

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <Anchor
            affix={false}
            offsetTop={80}
            items={anchorItems}
            onClick={(e, link) => {
              e.preventDefault();
              const id = (link.href || '').replace(/^#/, '');
              if (id) scrollToId(id);
            }}
          />
        </aside>

        <div className={styles.body}>
          <div className={styles.cards}>
            {HELP_MODULE_CARDS.map((c) => (
              <Card
                key={c.id}
                size="small"
                className={styles.card}
                onClick={() => scrollToId(c.id)}
              >
                <Text strong>{c.title}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {c.desc}
                  </Text>
                </div>
              </Card>
            ))}
          </div>

          {HELP_SECTIONS.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default HelpPage;
