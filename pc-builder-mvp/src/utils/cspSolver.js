export function validateBuild(selectedParts) {
  const issues = [];
  const warnings = [];

  const { cpu, motherboard, ram, gpu, psu } = selectedParts;

  // Rule 1: Socket Compatibility (CPU <-> Motherboard)
  if (cpu && motherboard) {
    if (cpu.socket !== motherboard.socket) {
      issues.push(`Socket Conflict: ${cpu.name} (${cpu.socket}) is incompatible with ${motherboard.name} (${motherboard.socket}).`);
    }
  }

  // Rule 2: Memory Type Mismatch (RAM <-> Motherboard)
  if (ram && motherboard) {
    if (ram.type !== motherboard.ramType) {
      issues.push(`RAM Conflict: ${motherboard.name} requires ${motherboard.ramType}, but selected ${ram.name} is ${ram.type}.`);
    }
  }

  // Rule 3: Power Supply Wattage Requirement
  if (psu) {
    const totalTdp = (cpu?.tdp || 0) + (gpu?.tdp || 0);
    const recommendedWattage = Math.ceil(totalTdp * 1.3 + 50); // 30% overhead + system baseline

    if (psu.wattage < totalTdp) {
      issues.push(`Critical Power Deficiency: Total draw (~${totalTdp}W) exceeds PSU limit (${psu.wattage}W).`);
    } else if (psu.wattage < recommendedWattage) {
      warnings.push(`Low Power Headroom: System estimated load is ~${totalTdp}W. Recommended PSU: ${recommendedWattage}W+.`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
}