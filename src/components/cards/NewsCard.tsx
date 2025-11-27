import { Card, CardTitle, CardContent } from '../ui/Card';

interface NewsCardProps {
  newsItems?: Array<{ title: string; date: string; content: string }>;
  className?: string;
}

export function NewsCard({ newsItems = [], className = '' }: NewsCardProps) {
  return (
    <Card active={true} className={className}>
      <CardTitle>News</CardTitle>
      <CardContent>
        {newsItems.length === 0 ? (
          <p className="text-sm text-gray-600">Aktuell gibt es keine News.</p>
        ) : (
          <div className="space-y-2.5">
            {newsItems.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
