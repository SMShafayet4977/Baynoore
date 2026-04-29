import { useEffect, useState } from "react";
import { CheckCircle, XCircle, UserCheck, UserX, RefreshCw } from "lucide-react";
import AdminLayout from "../AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../components/Toast";
import { adminApi } from "../../services/adminApi";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function AdminRow({ admin, onApprove, onReject, onToggleStatus, onResetPassword }) {
  const isActive = admin.is_active;
  const isPending = admin.approval_status === "pending";
  const isRejected = admin.approval_status === "rejected";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-muted/20 flex items-center justify-center text-gold-muted text-xs font-bold shrink-0">
            {admin.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{admin.name}</p>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
          admin.role === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        }`}>
          {admin.role?.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isPending ? "bg-amber-100 text-amber-700" :
          isRejected ? "bg-red-100 text-red-700" :
          "bg-green-100 text-green-700"
        }`}>
          {admin.approval_status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(admin.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPending && (
            <>
              <button
                onClick={() => onApprove(admin)}
                className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={12} />
                Approve
              </button>
              <button
                onClick={() => onReject(admin)}
                className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle size={12} />
                Reject
              </button>
            </>
          )}
          {!isPending && admin.role !== "super_admin" && (
            <button
              onClick={() => onToggleStatus(admin)}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
              {isActive ? "Deactivate" : "Activate"}
            </button>
          )}
          {isRejected && (
            <button
              onClick={() => onApprove(admin)}
              className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={12} />
              Re-approve
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsers() {
  const { addToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirm modals
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      adminApi.getAdmins(),
      adminApi.getPendingAdmins(),
    ])
      .then(([allRes, pendingRes]) => {
        setAdmins(allRes.data.data || []);
        setPending(pendingRes.data.data || []);
      })
      .catch(() => addToast("Failed to load admins", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove() {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      await adminApi.approveAdmin(approveTarget.id);
      addToast(`${approveTarget.name} approved`, "success");
      setApproveTarget(null);
      fetchAll();
    } catch {
      addToast("Failed to approve admin", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await adminApi.rejectAdmin(rejectTarget.id, { reason: rejectReason || undefined });
      addToast(`${rejectTarget.name} rejected`, "success");
      setRejectTarget(null);
      setRejectReason("");
      fetchAll();
    } catch {
      addToast("Failed to reject admin", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    setSubmitting(true);
    try {
      await adminApi.updateAdminStatus(toggleTarget.id, { is_active: !toggleTarget.is_active });
      addToast(`Admin ${toggleTarget.is_active ? "deactivated" : "activated"}`, "success");
      setToggleTarget(null);
      fetchAll();
    } catch (err) {
      addToast(err?.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Separate admins by status
  const approvedAdmins = admins.filter((a) => a.approval_status === "approved");
  const rejectedAdmins = admins.filter((a) => a.approval_status === "rejected");

  const tableHeaders = ["Admin", "Role", "Approval", "Status", "Joined", "Actions"];

  function AdminTable({ rows, emptyMsg }) {
    if (rows.length === 0) {
      return <p className="text-sm text-gray-400 py-6 text-center">{emptyMsg}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {tableHeaders.map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((admin) => (
              <AdminRow
                key={admin.id}
                admin={admin}
                onApprove={setApproveTarget}
                onReject={setRejectTarget}
                onToggleStatus={setToggleTarget}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage admin accounts and approvals</p>
        </div>

        {loading ? (
          <LoadingSpinner className="py-20" />
        ) : (
          <>
            {/* Pending Requests */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Pending Requests</h2>
                {pending.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              <AdminTable rows={pending} emptyMsg="No pending admin requests." />
            </div>

            {/* Approved Admins */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Approved Admins</h2>
              </div>
              <AdminTable rows={approvedAdmins} emptyMsg="No approved admins." />
            </div>

            {/* Rejected / Inactive */}
            {rejectedAdmins.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">Rejected Admins</h2>
                </div>
                <AdminTable rows={rejectedAdmins} emptyMsg="No rejected admins." />
              </div>
            )}
          </>
        )}
      </div>

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={!!approveTarget}
        title="Approve Admin"
        message={`Approve ${approveTarget?.name}? They will be able to log in immediately.`}
        confirmLabel={submitting ? "Approving…" : "Approve"}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">
            <h3 className="font-serif text-lg text-brown mb-2">Reject Admin</h3>
            <p className="text-sm text-brown-light mb-4">
              Reject <strong>{rejectTarget.name}</strong>? They will not be able to log in.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full border border-beige rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-muted resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 border border-beige text-brown px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      <ConfirmModal
        isOpen={!!toggleTarget}
        title={toggleTarget?.is_active ? "Deactivate Admin" : "Activate Admin"}
        message={`${toggleTarget?.is_active ? "Deactivate" : "Activate"} ${toggleTarget?.name}?`}
        confirmLabel={submitting ? "Updating…" : toggleTarget?.is_active ? "Deactivate" : "Activate"}
        danger={toggleTarget?.is_active}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
      />
    </AdminLayout>
  );
}
