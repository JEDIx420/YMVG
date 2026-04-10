import { getOrSyncBusiness } from "@/app/actions/getOrSyncBusiness";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { business, error } = await getOrSyncBusiness();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {!business ? (
        <div className="bg-white shadow rounded-lg p-8 text-center border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Business Found</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            We couldn't find a pre-registered YMI business linked to your email address (<strong>{user.email}</strong>). 
            Please ensure you log in with the exact email provided to your club president.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white shadow rounded-xl p-8 border border-gray-100">
            <h1 className="text-3xl font-extrabold text-blue-900 mb-2">
              Welcome to your Dashboard
            </h1>
            <p className="text-gray-500 text-lg">
              Manage your profile for <strong>{business.brand_name}</strong>
            </p>
          </div>

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
            Edit Profile Form coming soon...
          </div>
        </div>
      )}
    </div>
  );
}
