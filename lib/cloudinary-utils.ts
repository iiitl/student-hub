//Copied from coderabbit because its just a helper
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.findIndex((p) => p === 'upload')
    if (uploadIdx === -1) return null
    // parts: [..., "<resource_type>", "upload", "v123", "folder", "file.ext"]
    const rest = parts.slice(uploadIdx + 1)
    const withoutVersion = rest[0]?.match(/^v\d+$/) ? rest.slice(1) : rest
    if (!withoutVersion.length) return null
    const last = withoutVersion[withoutVersion.length - 1]
    const nameNoExt = last.includes('.')
      ? last.slice(0, last.lastIndexOf('.'))
      : last
    const folder = withoutVersion.slice(0, -1).join('/')
    return folder ? `${folder}/${nameNoExt}` : nameNoExt
  } catch (e) {
    console.error('Failed to extract public_id from URL:', e)
    return null
  }
}
