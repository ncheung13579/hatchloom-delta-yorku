import { useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';

const pageInfo: Record<string, { title: string; description: string }> = {
  '/admin/curriculum': {
    title: 'Curriculum Alignment',
    description: 'This screen (305) maps experiences and courses to provincial/state curriculum standards. It is planned for a future release and is not part of Team Delta\'s current demo scope.',
  },
  '/admin/credentials': {
    title: 'Credentials',
    description: 'This screen (306) manages student credentials and achievement tracking. It is planned for a future release and is not part of Team Delta\'s current demo scope.',
  },
  '/admin/settings': {
    title: 'Settings',
    description: 'School account settings and configuration. This screen is planned for a future release.',
  },
};

export default function PlaceholderPage() {
  const location = useLocation();
  const info = pageInfo[location.pathname] ?? {
    title: 'Coming Soon',
    description: 'This feature is planned for a future release.',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.65rem] font-bold text-charcoal">{info.title}</h1>
      </div>
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4 text-soft opacity-50">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal">Not Available in This Demo</h3>
          <p className="mt-2 text-sm text-soft max-w-lg">{info.description}</p>
        </div>
      </Card>
    </div>
  );
}
