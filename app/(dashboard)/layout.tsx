import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ssbs-admin')?.value;

  if (!token) {
    redirect('/login');
  }

  return <>{children}</>;
}