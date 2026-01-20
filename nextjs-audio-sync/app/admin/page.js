import AdminTimingEditor from '@/app/components/AdminTimingEditor';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <AdminTimingEditor />
    </div>
  );
}

export const metadata = {
  title: 'Admin - Create Text Timings',
  description: 'Create and manage audio text synchronization',
};
