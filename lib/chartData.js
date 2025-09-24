export const EMPTY_CHART_DATA = { nodes: [], links: [] };

function normalizeString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

export function buildChartData(nodeRows, linkRows) {
  const safeNodeRows = Array.isArray(nodeRows) ? nodeRows : [];
  const nodes = safeNodeRows
    .map((row) => {
      const id = normalizeString(row?.id) ?? normalizeString(row?.name);
      const name = normalizeString(row?.name) ?? normalizeString(row?.id);
      const group = normalizeString(row?.group) ?? normalizeString(row?.group_type);

      if (!id || !name || !group) {
        return null;
      }

      return {
        id,
        name,
        group,
      };
    })
    .filter(Boolean);

  const safeLinkRows = Array.isArray(linkRows) ? linkRows : [];
  const links = safeLinkRows
    .map((row) => {
      const source = normalizeString(row?.source);
      const target = normalizeString(row?.target);
      const type = normalizeString(row?.type) ?? normalizeString(row?.relationship_type);

      if (!source || !target || !type) {
        return null;
      }

      return {
        source,
        target,
        type,
      };
    })
    .filter(Boolean);

  return { nodes, links };
}
