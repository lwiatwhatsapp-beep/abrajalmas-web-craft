import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Edit2, Trash2, Save, X, GripVertical, 
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff 
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/jobs-positions")({
  component: JobsPositionsAdmin,
});

interface JobPosition {
  id: string;
  title_ar: string;
  title_en: string;
  type_ar: string;
  type_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title_ar: string;
  title_en: string;
  type_ar: string;
  type_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: FormData = {
  title_ar: "",
  title_en: "",
  type_ar: "دوام كامل",
  type_en: "Full-time",
  description_ar: "",
  description_en: "",
  is_active: true,
  display_order: 0,
};

function JobsPositionsAdmin() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_positions")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error("Error loading positions:", error);
      showMessage("error", "فشل تحميل الوظائف");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      ...emptyForm,
      display_order: positions.length,
    });
  };

  const handleEdit = (position: JobPosition) => {
    setIsCreating(false);
    setEditingId(position.id);
    setFormData({
      title_ar: position.title_ar,
      title_en: position.title_en,
      type_ar: position.type_ar,
      type_en: position.type_en,
      description_ar: position.description_ar,
      description_en: position.description_en,
      is_active: position.is_active,
      display_order: position.display_order,
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.title_ar || !formData.title_en || !formData.description_ar || !formData.description_en) {
      showMessage("error", "جميع الحقول مطلوبة");
      return;
    }

    try {
      setSaving(true);

      if (isCreating) {
        const { error } = await supabase.from("job_positions").insert([formData]);
        if (error) throw error;
        showMessage("success", "تم إضافة الوظيفة بنجاح");
      } else if (editingId) {
        const { error } = await supabase
          .from("job_positions")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
        showMessage("success", "تم تحديث الوظيفة بنجاح");
      }

      handleCancel();
      loadPositions();
    } catch (error) {
      console.error("Error saving position:", error);
      showMessage("error", "فشل حفظ الوظيفة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوظيفة؟")) return;

    try {
      const { error } = await supabase.from("job_positions").delete().eq("id", id);
      if (error) throw error;
      showMessage("success", "تم حذف الوظيفة بنجاح");
      loadPositions();
    } catch (error) {
      console.error("Error deleting position:", error);
      showMessage("error", "فشل حذف الوظيفة");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("job_positions")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      showMessage("success", "تم تحديث حالة الوظيفة");
      loadPositions();
    } catch (error) {
      console.error("Error toggling active status:", error);
      showMessage("error", "فشل تحديث الحالة");
    }
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
            <h1 className="text-4xl font-bold mb-2">إدارة الوظائف</h1>
            <p className="text-[#e9e9e9]/60">إضافة وتعديل وحذف الوظائف المتاحة</p>
          </div>
          {!isCreating && !editingId && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-[#1d3fba] text-white rounded-xl font-semibold flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <Plus className="w-5 h-5" />
              إضافة وظيفة جديدة
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">
              {isCreating ? "إضافة وظيفة جديدة" : "تعديل الوظيفة"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Arabic Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">عنوان الوظيفة (عربي)</label>
                <input
                  type="text"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
                  placeholder="مثال: مهندس شبكات"
                />
              </div>

              {/* English Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">Job Title (English)</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
                  placeholder="Example: Network Engineer"
                />
              </div>

              {/* Arabic Type */}
              <div>
                <label className="block text-sm font-semibold mb-2">نوع الدوام (عربي)</label>
                <input
                  type="text"
                  value={formData.type_ar}
                  onChange={(e) => setFormData({ ...formData, type_ar: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
                  placeholder="دوام كامل / دوام جزئي"
                />
              </div>

              {/* English Type */}
              <div>
                <label className="block text-sm font-semibold mb-2">Job Type (English)</label>
                <input
                  type="text"
                  value={formData.type_en}
                  onChange={(e) => setFormData({ ...formData, type_en: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
                  placeholder="Full-time / Part-time"
                />
              </div>

              {/* Arabic Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">الوصف (عربي)</label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50 min-h-[100px] resize-y"
                  placeholder="وصف الوظيفة والمهام والمتطلبات..."
                />
              </div>

              {/* English Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Description (English)</label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50 min-h-[100px] resize-y"
                  placeholder="Job description, responsibilities, requirements..."
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold mb-2">ترتيب العرض</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#1d3fba]/50"
                  min="0"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-sm font-semibold mb-2">الحالة</label>
                <div className="flex items-center gap-3 h-[52px]">
                  <button
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      formData.is_active
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {formData.is_active ? "نشطة" : "غير نشطة"}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-[#1d3fba] text-white rounded-xl font-semibold flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-white/5 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                إلغاء
              </button>
            </div>
          </motion.div>
        )}

        {/* Positions List */}
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="text-center py-20 text-[#e9e9e9]/60">
              <p>لا توجد وظائف متاحة. قم بإضافة وظيفة جديدة.</p>
            </div>
          ) : (
            positions.map((position) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 bg-white/5 border rounded-2xl flex items-start gap-4 ${
                  position.is_active ? "border-white/10" : "border-white/5 opacity-60"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {position.title_ar} / {position.title_en}
                      </h3>
                      <p className="text-sm text-[#e9e9e9]/60">
                        {position.type_ar} / {position.type_en}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          position.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {position.is_active ? "نشطة" : "غير نشطة"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-[#e9e9e9]/75">{position.description_ar}</p>
                    <p className="text-sm text-[#e9e9e9]/60">{position.description_en}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(position)}
                      className="px-4 py-2 bg-[#1d3fba]/20 text-[#4d7aff] rounded-lg font-semibold flex items-center gap-2 hover:bg-[#1d3fba]/30 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleToggleActive(position.id, position.is_active)}
                      className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                        position.is_active
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {position.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {position.is_active ? "إخفاء" : "إظهار"}
                    </button>
                    <button
                      onClick={() => handleDelete(position.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold flex items-center gap-2 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
