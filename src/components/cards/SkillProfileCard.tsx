import { Card, CardTitle, CardContent } from '../ui/Card';

interface Skill {
  name: string;
  value: number;
}

interface SkillProfileCardProps {
  skills: Skill[];
  className?: string;
}

export function SkillProfileCard({ skills, className = '' }: SkillProfileCardProps) {
  return (
    <Card active={true} className={className}>
      <CardTitle>Skill-Profil</CardTitle>
      <CardContent className="space-y-5">
        {skills.map((skill, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{skill.name}</span>
              <span className="text-sm font-semibold text-gray-900">{skill.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                style={{ width: `${skill.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
