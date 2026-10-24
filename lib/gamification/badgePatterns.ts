/**
 * Vector background patterns and visual atmospheric effects for Gamification & Achievement Cards.
 */

export const CARD_PATTERNS = {
  hexLattice: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.16'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l11 6.35 11-6.35V17.9l-11-6.35L3 17.9zM0 49l14-8.08L28 49H0zm0-49h28L14 8.08 0 0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  
  cyberHatch: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.15'%3E%3Cpath d='M0 36L36 0M-18 18L18 -18M18 54L54 18'/%3E%3Cpath d='M0 18L18 0M18 36L36 18' stroke-width='0.75' stroke-opacity='0.08' stroke-dasharray='3,3'/%3E%3C/g%3E%3C/svg%3E")`,
  
  diamondMatrix: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'%3E%3Cpolygon points='18,0 36,18 18,36 0,18'/%3E%3Cpolygon points='18,6 30,18 18,30 6,18' stroke-opacity='0.08'/%3E%3Ccircle cx='18' cy='18' r='2' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E")`,
  
  circuitNodes: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.16'%3E%3Cpath d='M0 22h14l6-6h10l6 6h8M22 0v14l6 6v10l-6 6v8'/%3E%3Ccircle cx='22' cy='22' r='3.5' fill='%23ffffff' fill-opacity='0.25'/%3E%3Ccircle cx='14' cy='22' r='2' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='30' cy='22' r='2' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
  
  celestialOrbits: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.14'%3E%3Ccircle cx='24' cy='24' r='20' stroke-width='1'/%3E%3Ccircle cx='24' cy='24' r='12' stroke-width='1' stroke-dasharray='4,3'/%3E%3Ccircle cx='24' cy='24' r='4' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='4' cy='4' r='1.5' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='44' cy='4' r='1.5' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='4' cy='44' r='1.5' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='44' cy='44' r='1.5' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`,
  
  sacredPoly: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'%3E%3Cpolygon points='28,2 54,15 54,41 28,54 2,41 2,15'/%3E%3Cpolygon points='28,10 46,19 46,37 28,46 10,37 10,19' stroke-opacity='0.1'/%3E%3Cline x1='28' y1='2' x2='28' y2='54' stroke-dasharray='3,3' stroke-opacity='0.1'/%3E%3Cline x1='2' y1='15' x2='54' y2='41' stroke-dasharray='3,3' stroke-opacity='0.1'/%3E%3Cline x1='2' y1='41' x2='54' y2='15' stroke-dasharray='3,3' stroke-opacity='0.1'/%3E%3C/g%3E%3C/svg%3E")`,
  
  waveTopo: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.14'%3E%3Cpath d='M0 10 Q 15 25, 30 10 T 60 10 M0 30 Q 15 45, 30 30 T 60 30 M0 50 Q 15 65, 30 50 T 60 50'/%3E%3C/g%3E%3C/svg%3E")`,
};

export type CardPatternKey = keyof typeof CARD_PATTERNS;

export const MILESTONE_PATTERN_MAP: Record<string, CardPatternKey> = {
  Novice: "hexLattice",
  Apprentice: "cyberHatch",
  Scholar: "circuitNodes",
  Warrior: "diamondMatrix",
  Knight: "celestialOrbits",
  Hero: "cyberHatch",
  Champion: "sacredPoly",
  Master: "diamondMatrix",
  Grandmaster: "circuitNodes",
  Elite: "hexLattice",
  Legend: "sacredPoly",
  Mythic: "celestialOrbits",
};

export const BADGE_PATTERN_MAP: Record<string, CardPatternKey> = {
  rookie: "hexLattice",
  skilled: "cyberHatch",
  expert: "diamondMatrix",
  mastermind: "circuitNodes",
  legend: "sacredPoly",
  king: "celestialOrbits",
  student_of_the_week: "celestialOrbits",
  student_of_the_month: "sacredPoly",
  student_of_the_year: "hexLattice",
};
