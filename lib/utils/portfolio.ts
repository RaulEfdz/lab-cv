import type { Skill } from "@/lib/types/database"

// Group skills by category
export function groupSkillsByCategory(skills: Skill[]): Record<string, Skill[]> {
  return skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)
}

// Format date for display (Spanish locale)
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" })
}

// Get proficiency percentage
export function getProficiencyPercentage(level: string): number {
  switch (level) {
    case "Expert":
      return 95
    case "Advanced":
      return 80
    case "Intermediate":
      return 60
    case "Beginner":
      return 35
    default:
      return 50
  }
}

// Get proficiency color classes
export function getProficiencyColors(level: string): { bg: string; text: string; bar: string } {
  switch (level) {
    case "Expert":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600",
        bar: "from-emerald-400 to-emerald-600"
      }
    case "Advanced":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600",
        bar: "from-blue-400 to-blue-600"
      }
    case "Intermediate":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600",
        bar: "from-amber-400 to-amber-600"
      }
    default:
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-600",
        bar: "from-gray-400 to-gray-600"
      }
  }
}
