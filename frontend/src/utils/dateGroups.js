/**
 * utils/dateGroups.js
 * Groups a flat conversation list into date buckets:
 * Today, Yesterday, Last 7 Days, Older.
 *
 * Extracted from Sidebar.jsx to keep the component presentation-only.
 */

/**
 * @param {Array<{updated_at: string}>} conversations
 * @returns {{ Today: Array, Yesterday: Array, "Last 7 Days": Array, Older: Array }}
 */
export function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const groups = { Today: [], Yesterday: [], "Last 7 Days": [], Older: [] };

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (day >= today)          groups["Today"].push(conv);
    else if (day >= yesterday) groups["Yesterday"].push(conv);
    else if (day >= lastWeek)  groups["Last 7 Days"].push(conv);
    else                       groups["Older"].push(conv);
  }

  return groups;
}
