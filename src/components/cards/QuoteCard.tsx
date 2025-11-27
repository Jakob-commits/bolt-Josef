import { Card, CardTitle, CardContent } from '../ui/Card';

interface QuoteCardProps {
  quote: string;
  userPlan?: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function QuoteCard({ quote, userPlan = 'basic', className = '' }: QuoteCardProps) {
  const isActive = userPlan !== 'basic' || true;

  return (
    <Card active={isActive} className={className}>
      <CardTitle>Zitat des Tages</CardTitle>
      <CardContent>
        <p className="text-sm text-gray-700 leading-relaxed italic">"{quote}"</p>
      </CardContent>
    </Card>
  );
}
