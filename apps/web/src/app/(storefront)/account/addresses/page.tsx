"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
  MapPin,
  X,
  AlertCircle,
} from "lucide-react";

// Types
interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  createdAt: string;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

// Schema
const addressSchema = z.object({
  fullName: z.string().min(2, "Ten phai co it nhat 2 ky tu"),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, "So dien thoai khong hop le"),
  province: z.string().min(1, "Vui long chon tinh/thanh pho"),
  district: z.string().min(1, "Vui long chon quan/huyen"),
  ward: z.string().min(1, "Vui long chon phuong/xa"),
  address: z.string().min(5, "Dia chi phai co it nhat 5 ky tu"),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const PROVINCES_API = "https://provinces.open-api.vn/api";

const inputClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
const selectClass =
  "w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white appearance-none";
const labelClass = "block text-sm font-medium text-neutral-700 font-body mb-1";
const errorClass = "text-xs text-red-500 mt-1";

// Address Form Modal Component
function AddressFormModal({
  isOpen,
  onClose,
  onSuccess,
  editAddress,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAddress: Address | null;
}) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      province: "",
      district: "",
      ward: "",
      address: "",
      isDefault: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const selectedProvince = watch("province");
  const selectedDistrict = watch("district");

  // Reset form when modal opens or editAddress changes
  useEffect(() => {
    if (isOpen) {
      if (editAddress) {
        reset({
          fullName: editAddress.fullName,
          phone: editAddress.phone,
          province: editAddress.province,
          district: editAddress.district,
          ward: editAddress.ward,
          address: editAddress.address,
          isDefault: editAddress.isDefault,
        });
      } else {
        reset({
          fullName: "",
          phone: "",
          province: "",
          district: "",
          ward: "",
          address: "",
          isDefault: false,
        });
      }
      setSubmitError(null);
    }
  }, [isOpen, editAddress, reset]);

  // Fetch provinces on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);
    fetch(`${PROVINCES_API}/p/`)
      .then((res) => res.json())
      .then((data: Province[]) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);

    // Only clear dependent fields when province changes and NOT during initial edit load
    if (!editAddress || selectedProvince !== editAddress.province) {
      setValue("district", "");
      setValue("ward", "");
    }

    fetch(`${PROVINCES_API}/p/${selectedProvince}?depth=2`)
      .then((res) => res.json())
      .then((data: { districts: District[] }) => {
        if (!cancelled) setDistricts(data.districts || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadingWards(true);
    setWards([]);

    // Only clear ward field when district changes and NOT during initial edit load
    if (!editAddress || selectedDistrict !== editAddress.district) {
      setValue("ward", "");
    }

    fetch(`${PROVINCES_API}/d/${selectedDistrict}?depth=2`)
      .then((res) => res.json())
      .then((data: { wards: Ward[] }) => {
        if (!cancelled) setWards(data.wards || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  const onSubmit = async (data: AddressFormData) => {
    setSubmitError(null);
    try {
      if (editAddress) {
        await apiClient.patch(`/auth/addresses/${editAddress.id}`, data);
      } else {
        await apiClient.post("/auth/addresses", data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Da co loi xay ra");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-heading font-bold text-neutral-900">
            {editAddress ? "Cap nhat dia chi" : "Them dia chi moi"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="addr-fullName" className={labelClass}>
              Ho va ten <span className="text-red-500">*</span>
            </label>
            <input
              id="addr-fullName"
              type="text"
              placeholder="Nguyen Van A"
              className={cn(inputClass, errors.fullName && "border-red-400")}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className={errorClass}>{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="addr-phone" className={labelClass}>
              So dien thoai <span className="text-red-500">*</span>
            </label>
            <input
              id="addr-phone"
              type="tel"
              placeholder="0912345678"
              className={cn(inputClass, errors.phone && "border-red-400")}
              {...register("phone")}
            />
            {errors.phone && (
              <p className={errorClass}>{errors.phone.message}</p>
            )}
          </div>

          {/* Province / District / Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="addr-province" className={labelClass}>
                Tinh/Thanh pho <span className="text-red-500">*</span>
              </label>
              <select
                id="addr-province"
                className={cn(
                  selectClass,
                  errors.province && "border-red-400"
                )}
                disabled={loadingProvinces}
                {...register("province")}
              >
                <option value="">
                  {loadingProvinces ? "Dang tai..." : "Chon tinh/thanh"}
                </option>
                {provinces.map((p) => (
                  <option key={p.code} value={String(p.code)}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className={errorClass}>{errors.province.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="addr-district" className={labelClass}>
                Quan/Huyen <span className="text-red-500">*</span>
              </label>
              <select
                id="addr-district"
                className={cn(
                  selectClass,
                  errors.district && "border-red-400"
                )}
                disabled={!selectedProvince || loadingDistricts}
                {...register("district")}
              >
                <option value="">
                  {loadingDistricts ? "Dang tai..." : "Chon quan/huyen"}
                </option>
                {districts.map((d) => (
                  <option key={d.code} value={String(d.code)}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className={errorClass}>{errors.district.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="addr-ward" className={labelClass}>
                Phuong/Xa <span className="text-red-500">*</span>
              </label>
              <select
                id="addr-ward"
                className={cn(selectClass, errors.ward && "border-red-400")}
                disabled={!selectedDistrict || loadingWards}
                {...register("ward")}
              >
                <option value="">
                  {loadingWards ? "Dang tai..." : "Chon phuong/xa"}
                </option>
                {wards.map((w) => (
                  <option key={w.code} value={String(w.code)}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.ward && (
                <p className={errorClass}>{errors.ward.message}</p>
              )}
            </div>
          </div>

          {/* Address detail */}
          <div>
            <label htmlFor="addr-address" className={labelClass}>
              Dia chi chi tiet <span className="text-red-500">*</span>
            </label>
            <textarea
              id="addr-address"
              rows={2}
              placeholder="So nha, ten duong, khu pho..."
              className={cn(
                "w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none",
                errors.address && "border-red-400"
              )}
              {...register("address")}
            />
            {errors.address && (
              <p className={errorClass}>{errors.address.message}</p>
            )}
          </div>

          {/* Default toggle */}
          <div className="flex items-center gap-2">
            <input
              id="addr-isDefault"
              type="checkbox"
              className="w-4 h-4 text-primary-700 border-neutral-300 rounded focus:ring-primary-500"
              {...register("isDefault")}
            />
            <label
              htmlFor="addr-isDefault"
              className="text-sm font-body text-neutral-700"
            >
              Dat lam dia chi mac dinh
            </label>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-sm font-body p-3 rounded-lg bg-red-50 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editAddress ? "Cap nhat" : "Them dia chi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Dialog
function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-heading font-bold text-neutral-900 mb-2">
          Xoa dia chi
        </h3>
        <p className="text-sm font-body text-neutral-600 mb-6">
          Ban co chac chan muon xoa dia chi nay? Hanh dong nay khong the hoan tac.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Huy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Xoa
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Address[]>("/auth/addresses");
      setAddresses(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Khong the tai danh sach dia chi");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEdit = (addr: Address) => {
    setEditAddress(addr);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditAddress(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/auth/addresses/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAddresses();
    } catch {
      // Error handled silently
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefault(addressId);
    try {
      await apiClient.patch(`/auth/addresses/${addressId}/default`);
      fetchAddresses();
    } catch {
      // Error handled silently
    } finally {
      setSettingDefault(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-neutral-900">
          So dia chi
        </h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Them dia chi moi
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-body">{error}</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-neutral-400">
          <MapPin className="h-24 w-24 stroke-1" />
          <h2 className="text-xl font-heading font-bold text-neutral-900">
            Chua co dia chi nao
          </h2>
          <p className="text-neutral-500 font-body text-center max-w-md">
            Them dia chi de su dung khi dat hang.
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Them dia chi moi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "bg-white rounded-xl border p-5 relative",
                addr.isDefault
                  ? "border-primary-300 ring-1 ring-primary-100"
                  : "border-neutral-200"
              )}
            >
              {/* Default badge */}
              {addr.isDefault && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium bg-primary-100 text-primary-700 mb-3">
                  <Star className="w-3 h-3" />
                  Mac dinh
                </span>
              )}

              {/* Address info */}
              <div className="space-y-1">
                <p className="font-body font-semibold text-neutral-900">
                  {addr.fullName}
                </p>
                <p className="text-sm font-body text-neutral-600">
                  {addr.phone}
                </p>
                <p className="text-sm font-body text-neutral-600">
                  {addr.address}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                <button
                  onClick={() => handleEdit(addr)}
                  className="inline-flex items-center gap-1.5 text-sm font-body font-medium text-primary-700 hover:text-primary-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Sua
                </button>
                <button
                  onClick={() => setDeleteTarget(addr)}
                  className="inline-flex items-center gap-1.5 text-sm font-body font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoa
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={settingDefault === addr.id}
                    className="inline-flex items-center gap-1.5 text-sm font-body font-medium text-neutral-600 hover:text-neutral-800 transition-colors ml-auto disabled:opacity-50"
                  >
                    {settingDefault === addr.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Star className="w-3.5 h-3.5" />
                    )}
                    Dat mac dinh
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AddressFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditAddress(null);
        }}
        onSuccess={fetchAddresses}
        editAddress={editAddress}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
