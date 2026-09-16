export const PRIORITY_SLA = {
  CRITICAL: 2,
  HIGH: 4,
  MEDIUM: 12,
  LOW: 24,
};

export function getPriorityForSeverity(severity) {
  if (!severity) return "MEDIUM";
  const s = String(severity).toUpperCase();
  if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(s)) return s;
  return "MEDIUM";
}

export function getSlaHoursForPriority(priority) {
  return PRIORITY_SLA[priority] ?? 12;
}

export function isWorkerEligibleForCategory(worker, category) {
  if (!worker || !category) return false;
  const skillsLower = worker.skills.toLowerCase();
  const catLower = String(category).toLowerCase();
  return skillsLower.includes(catLower);
}

export function findEligibleWorker(workers, incident, excludeWorkerId = null) {
  if (!workers || !incident?.category) return null;

  let eligible = workers.filter((w) => {
    if (excludeWorkerId && w.id === excludeWorkerId) return false;
    if (w.status !== "AVAILABLE") return false;
    return isWorkerEligibleForCategory(w, incident.category);
  });

  if (eligible.length === 0) return null;

  // Prefer location match
  const incidentLocation = (incident.location || "").toLowerCase();
  const locationMatches = eligible.filter((w) =>
    incidentLocation.includes(w.location.toLowerCase())
  );

  if (locationMatches.length > 0) {
    return locationMatches[0];
  }

  return eligible[0];
}

export function buildNotificationMessage({ priority, location, issue, recommendedAction }) {
  const prio = priority ? String(priority).toLowerCase() : "medium";
  const loc = location || "assigned location";
  const iss = issue || "maintenance issue";
  const action = recommendedAction ? ` ${recommendedAction}` : "";
  return `${prio.charAt(0).toUpperCase() + prio.slice(1)} priority ${iss} work order assigned in ${loc}.${action}`.trim();
}
