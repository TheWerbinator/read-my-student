import { Card, CardContent } from "@/components/ui/card";

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className='rounded-2xl border-black/5 shadow-sm'>
      <CardContent className='flex items-center gap-4 p-6'>
        <div
          className={`rounded-full p-3 bg-opacity-10 ${color.replace("text-", "bg-")}`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className='text-sm font-medium text-gray-500'>{title}</p>
          <h4 className='text-2xl font-bold text-green-900'>{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}
