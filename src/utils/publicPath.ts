/**
 * 拼接静态资源路径，兼容 GitHub Pages 子目录部署
 */
export function withPublicPath(assetPath: string): string {
  let base = process.env.PUBLIC_PATH || '/';
  // 防御二次 stringify / 错误注入导致的首尾引号
  if (
    (base.startsWith('"') && base.endsWith('"')) ||
    (base.startsWith("'") && base.endsWith("'"))
  ) {
    base = base.slice(1, -1);
  }
  const clean = assetPath.replace(/^\//, '');
  if (base === '/') return `/${clean}`;
  return `${base.replace(/\/?$/, '/')}${clean}`;
}
