/** Explicit, opt-in architecture policies. Missing annotations remain unknown. */
export function inspectFlows(model) {
  const components = model.components || {},
    policies = Object.entries(model.trustPolicies || {}),
    flows = [];
  for (const [from, c] of Object.entries(components))
    for (const link of c.links || []) {
      const target = Object.hasOwn(components, link.id)
          ? components[link.id]
          : undefined,
        sourceZone = c.trustZone || null,
        targetZone = target?.trustZone || null,
        classification = link.dataClassification || null,
        crossing = !!(sourceZone && targetZone && sourceZone !== targetZone),
        violations = [],
        applied = [];
      if (crossing)
        for (const [id, p] of policies) {
          if (p.classification && p.classification !== classification) continue;
          if (p.fromZone && p.fromZone !== sourceZone) continue;
          if (p.toZone && p.toZone !== targetZone) continue;
          applied.push(id);
          if (p.requireEncryption && link.encrypted !== true)
            violations.push({
              policy: id,
              reason: "Encryption must be explicitly true",
            });
          if (
            p.allowedProtocols?.length &&
            !p.allowedProtocols.includes(link.protocol)
          )
            violations.push({
              policy: id,
              reason: "Protocol is not in allowedProtocols",
            });
          if (p.deny === true)
            violations.push({
              policy: id,
              reason: "Crossing prohibited by policy",
            });
        }
      flows.push({
        from,
        to: link.id,
        title: link.title || "",
        sourceZone,
        targetZone,
        dataClassification: classification,
        protocol: link.protocol || null,
        encrypted: typeof link.encrypted === "boolean" ? link.encrypted : null,
        trustCrossing: crossing,
        unresolved: !target,
        policyStatus:
          !sourceZone || !targetZone || !classification
            ? "unknown"
            : violations.length
              ? "violation"
              : applied.length
                ? "allowed"
                : crossing
                  ? "review"
                  : "internal",
        policies: applied,
        violations,
      });
    }
  return {
    flows,
    findings: flows
      .filter((f) => f.violations.length)
      .map((f) => ({
        from: f.from,
        to: f.to,
        classification: f.dataClassification,
        sourceZone: f.sourceZone,
        targetZone: f.targetZone,
        violations: f.violations,
      })),
  };
}
