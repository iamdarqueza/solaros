import { redirect } from "next/navigation";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/technician/jobs/${id}`);
}
