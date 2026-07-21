/**
 * 规范化 PUBLIC_PATH（去掉错误注入的引号）
 */
export function getPublicPath(): string {
  let base = process.env.PUBLIC_PATH || '/';
  if (
    (base.startsWith('"') && base.endsWith('"')) ||
    (base.startsWith("'") && base.endsWith("'"))
  ) {
    base = base.slice(1, -1);
  }
  return base || '/';
}

/**
 * 拼接静态资源路径，兼容 GitHub Pages 子目录部署
 */
export function withPublicPath(assetPath: string): string {
  const base = getPublicPath();
  const clean = assetPath.replace(/^\//, '');
  if (base === '/') return `/${clean}`;
  return `${base.replace(/\/?$/, '/')}${clean}`;
}

/**
 * 去掉 GitHub Pages 子路径前缀，得到 history 可用的路由 path。
 * 例如 /digital-marketing-platform-demo/welcome → /welcome
 */
export function stripPublicPath(pathname: string): string {
  const base = getPublicPath().replace(/\/$/, '');
  if (!base || base === '/') return pathname || '/';
  if (pathname === base) return '/';
  if (pathname.startsWith(`${base}/`)) {
    const stripped = pathname.slice(base.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return pathname || '/';
}
