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

export function buildNotificationMessage({ priority, location, issue }) {
  const prio = priority ? String(priority).toLowerCase() : "medium";
  const capPrio = prio.charAt(0).toUpperCase() + prio.slice(1);
  const loc = location || "assigned location";
  const iss = issue || "maintenance issue";
  return `${capPrio} priority ${iss} work order assigned at ${loc}.`;
}

export function assignmentStatusLabel(workOrder) {
  if (!workOrder) return "Unknown";
  if (workOrder.status === "PENDING") return "Awaiting worker assignment";
  if (workOrder.status === "ASSIGNED" && workOrder.worker) return `Assigned to ${workOrder.worker.name}`;
  if (workOrder.status === "IN_PROGRESS" && workOrder.worker) return `${workOrder.worker.name} is working`;
  if (workOrder.status === "COMPLETED" && workOrder.worker) return `Completed by ${workOrder.worker.name}`;
  if (workOrder.status === "COMPLETED") return "Completed";
  if (workOrder.worker) return `${workOrder.worker.name} · ${workOrder.status}`;
  return "Awaiting worker assignment";
}
