import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Filter, Download, Mail, Phone, FileText, 
  Loader2, CheckCircle2, Clock, XCircle, Eye, MessageSquare,
  Calendar, Briefcase, GraduationCap, Award, User
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/job-applications")({
  component: JobApplicationsAdmin,
});

interface JobApplication {
  id: string;
  position_id: string | null;
  position_title: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  experience: string;
  education: string;
  specialization: string;
  skills: string;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type StatusType = "new" | "reviewing" | "contacted" | "interview" | "rejected" | "accepted";

const statusConfig: Record<StatusType, { label: string; color: string; icon: any }> = {
  new: { label: "جديد", color: "blue", icon: Clock },
  reviewing: { label: "قيد المراجعة", color: "yellow", icon: Eye },
  contacted: { label: "تم التواصل", color: "purple", icon: Phone },
  interview: { label: "مقابلة", color: "indigo", icon: MessageSquare },
  rejected: { label: "مرفوض", color: "red", icon: XCircle },
  accepted: { label: "مقبول", color: "green", icon: CheckCircle2 },
};

function JobApplicationsAdmin() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.full_name.toLowerCase().includes(search) ||
          app.email.toLowerCase().includes(search) ||
          app.phone.includes(search) ||
          app.position_title.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApps(filtered);
  };

  const handleViewDetails = (app: JobApplication) => {
    setSelectedApp(app);
    setNotes(app.notes || "");
    setShowDetails(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;

    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus, notes })
        .eq("id", selectedApp.id);

      if (error) throw error;

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === selectedApp.id ? { ...app, status: newStatus, notes } : app
        )
      );
      setSelectedApp({ ...selectedApp, status: newStatus, notes });
      alert("تم تحديث الحالة بنجاح");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("فشل تحديث الحالة");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ notes })
        .eq("id", selectedApp.id);

      if (error) throw error;

      setApplications(
        applications.map((app) =>
          app.id === selectedApp.id ? { ...app, notes } : app
        )
      );
      setSelectedApp({ ...selectedApp, notes });
      alert("تم حفظ الملاحظات");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("فشل حفظ الملاحظات");
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["الاسم", "البريد", "الهاتف", "واتساب", "الوظيفة", "الخبرة", "التعليم", "التخصص", "المهارات", "الحالة", "التاريخ"],
      ...filteredApps.map((app) => [
        app.full_name,
        app.email,
        app.phone,
        app.whatsapp,
        app.position_title,
        app.experience,
        app.education,
        app.specialization,
        app.skills,
        statusConfig[app.status as StatusType]?.label || app.status,
        new Date(app.created_at).toLocaleDateString("ar-SA"),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `job-applications-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as StatusType];
    if (!config) return <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">{status}</span>;

    const Icon = config.icon;
    return (
      <span
        className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold ${
          config.color === "blue"
            ? "bg-blue-500/20 text-blue-400"
            : config.color === "yellow"
            ? "bg-yellow-500/20 text-yellow-400"
            : config.color === "purple"
            ? "bg-purple-500/20 text-purple-400"
            : config.color === "indigo"
            ? "bg-indigo-500/20 text-indigo-400"
            : config.color === "red"
            ? "bg-red-500/20 text-red-400"
            : "bg-green-500/20 text-green-400"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#4d7aff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">طلبات التوظيف</h1>
            <p className="text-[#e9e9e9]/60">
              {filteredApps.length} من {applications.length} طلب
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-[#1d3fba] text-white rounded-xl font-semibold flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Download className="w-5 h-5" />
            تصدير CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = applications.filter((app) => app.status === status).length;
            const Icon = config.icon;
            return (
              <div
                key={status}
                className="p-4 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm text-[#e9e9e9]/60">{config.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#e9e9e9]/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بالاسم، البريد، الهاتف، أو الوظيفة..."
              className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#e9e9e9]/30 outline-none focus:border-[#1d3fba]/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#e9e9e9]/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {filteredApps.length === 0 ? (
            <div className="text-center py-20 text-[#e9e9e9]/60">
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold">الاسم</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">الوظيفة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">الخبرة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">التعليم</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">التاريخ</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold">{app.full_name}</div>
                          <div className="text-sm text-[#e9e9e9]/60 flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {app.email}
                          </div>
                          <div className="text-sm text-[#e9e9e9]/60 flex items-center gap-2 mt-1">
                            <Phone className="w-3.5 h-3.5" />
                            {app.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#4d7aff]" />
                          {app.position_title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{app.experience}</td>
                      <td className="px-6 py-4 text-sm">{app.education}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[#e9e9e9]/60">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.created_at).toLocaleDateString("ar-SA")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="px-4 py-2 bg-[#1d3fba]/20 text-[#4d7aff] rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#1d3fba]/30 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedApp.full_name}</h2>
                <p className="text-[#e9e9e9]/60">{selectedApp.position_title}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Status Update */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <label className="block text-sm font-semibold mb-3">تحديث الحالة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={updatingStatus}
                      className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                        selectedApp.status === status
                          ? "bg-[#1d3fba] text-white"
                          : "bg-white/5 text-[#e9e9e9]/70 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm text-[#e9e9e9]/60">البريد الإلكتروني</span>
                </div>
                <a href={`mailto:${selectedApp.email}`} className="text-sm hover:text-[#4d7aff] transition-colors">
                  {selectedApp.email}
                </a>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm text-[#e9e9e9]/60">الهاتف</span>
                </div>
                <a href={`tel:${selectedApp.phone}`} className="text-sm hover:text-[#4d7aff] transition-colors">
                  {selectedApp.phone}
                </a>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm text-[#e9e9e9]/60">واتساب</span>
                </div>
                <a
                  href={`https://wa.me/${selectedApp.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-[#4d7aff] transition-colors"
                >
                  {selectedApp.whatsapp}
                </a>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm text-[#e9e9e9]/60">تاريخ التقديم</span>
                </div>
                <div className="text-sm">{new Date(selectedApp.created_at).toLocaleDateString("ar-SA")}</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm font-semibold">الخبرة</span>
                </div>
                <p className="text-sm text-[#e9e9e9]/75">{selectedApp.experience}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm font-semibold">المؤهل التعليمي</span>
                </div>
                <p className="text-sm text-[#e9e9e9]/75">{selectedApp.education}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm font-semibold">التخصص</span>
                </div>
                <p className="text-sm text-[#e9e9e9]/75">{selectedApp.specialization}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-[#4d7aff]" />
                  <span className="text-sm font-semibold">المهارات</span>
                </div>
                <p className="text-sm text-[#e9e9e9]/75 whitespace-pre-wrap">{selectedApp.skills}</p>
              </div>
              {selectedApp.message && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#4d7aff]" />
                    <span className="text-sm font-semibold">رسالة المتقدم</span>
                  </div>
                  <p className="text-sm text-[#e9e9e9]/75 whitespace-pre-wrap">{selectedApp.message}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">ملاحظات إدارية</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50 min-h-[100px] resize-y"
                placeholder="أضف ملاحظاتك حول هذا المتقدم..."
              />
              <button
                onClick={handleSaveNotes}
                className="mt-3 px-4 py-2 bg-[#1d3fba]/20 text-[#4d7aff] rounded-lg text-sm font-semibold hover:bg-[#1d3fba]/30 transition-all"
              >
                حفظ الملاحظات
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
