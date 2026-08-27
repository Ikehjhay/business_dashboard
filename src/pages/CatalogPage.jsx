import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Image as ImageIcon, X } from "lucide-react";
import { api } from "../lib/api";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

// BUILDFEST DEMO BUILD -- one vertical only (retail_ecommerce), so the
// catalog field list is hardcoded here instead of fetched from
// GET /tenants/verticals (that endpoint lived on the now-deleted
// onboarding.py). Keep this in sync with app/vertical_templates.py's
// retail_ecommerce["fields"] on the backend if you ever change it.
const CATALOG_FIELDS = [
  { name: "product_name", type: "str", required: true },
  { name: "category", type: "str", required: false },
  { name: "price", type: "float", required: true },
  { name: "stock_qty", type: "int", required: true },
  { name: "description", type: "str", required: false },
  { name: "variant", type: "str", required: false },
  { name: "image_url", type: "str", required: false },
  { name: "delivery_fees", type: "location_fees", required: false },
  { name: "status", type: "str", required: false },
];

const NAME_FIELD_CANDIDATES = ["product_name", "item_name", "name", "title"];

function displayName(fields, data) {
  for (const key of NAME_FIELD_CANDIDATES) {
    if (data[key]) return data[key];
  }
  const firstStrField = fields.find((f) => f.type === "str");
  return (firstStrField && data[firstStrField.name]) || "Untitled item";
}

function displayPrice(data) {
  const price = data.price ?? data.price_per_night;
  return price != null ? `₦${Number(price).toLocaleString()}` : null;
}

function MediaThumbnails({ item, onDeleted }) {
  const [confirmingId, setConfirmingId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (mediaId) => api.deleteCatalogMedia(item.item_id, mediaId),
    onSuccess: () => {
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      onDeleted?.();
    },
  });

  if (item.media.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {item.media.map((m) => (
        <div key={m.media_id} className="group relative h-16 w-16 overflow-hidden rounded-[8px] border border-line">
          {m.media_type === "image" ? (
            <img src={m.url} alt={m.caption || ""} className="h-full w-full object-cover" />
          ) : (
            <video src={m.url} className="h-full w-full object-cover" />
          )}
          {confirmingId === m.media_id ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 p-1">
              <span className="text-center text-[10px] leading-tight text-white">Delete this?</span>
              <div className="flex gap-1">
                <button
                  onClick={() => deleteMutation.mutate(m.media_id)}
                  disabled={deleteMutation.isPending}
                  className="rounded bg-danger px-1.5 py-0.5 text-[10px] text-white"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingId(null)}
                  className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingId(m.media_id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} className="text-white" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AddMediaControl({ itemId }) {
  const [showCaption, setShowCaption] = useState(false);
  const [caption, setCaption] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadCatalogMedia(itemId, pendingFile, caption || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      setPendingFile(null);
      setCaption("");
      setShowCaption(false);
    },
  });

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowCaption(true);
  }

  return (
    <div className="mt-3">
      {!showCaption ? (
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-dashed border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-ink">
          <ImageIcon size={13} />
          Add photo/video
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChosen} />
        </label>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{pendingFile?.name}</span>
          <input
            className="w-40 rounded-[6px] border border-line px-2 py-1 text-xs"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending}
            className="!px-2 !py-1 !text-xs"
          >
            {uploadMutation.isPending ? "Uploading…" : "Upload"}
          </Button>
          <button
            onClick={() => {
              setShowCaption(false);
              setPendingFile(null);
            }}
            className="text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}
      {uploadMutation.isError && (
        <p className="mt-1 text-xs text-danger">
          {uploadMutation.error?.response?.data?.detail || uploadMutation.error?.message}
        </p>
      )}
    </div>
  );
}

function ItemCard({ item, fields }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const queryClient = useQueryClient();
  const thumbnail = item.media.find((m) => m.media_type === "image");

  const deleteItemMutation = useMutation({
    mutationFn: () => api.deleteCatalogItem(item.item_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-items"] }),
  });

  const price = displayPrice(item.data);

  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border border-line bg-paper">
          {thumbnail ? (
            <img src={thumbnail.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <ImageIcon size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{displayName(fields, item.data)}</div>
          {price && <div className="text-sm text-muted">{price}</div>}
        </div>
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="h-fit shrink-0 rounded-[6px] p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
            title="Delete item"
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[11px] text-muted">Delete "{displayName(fields, item.data)}"?</span>
            <div className="flex gap-1">
              <button
                onClick={() => deleteItemMutation.mutate()}
                disabled={deleteItemMutation.isPending}
                className="rounded bg-danger px-2 py-0.5 text-[11px] text-white"
              >
                {deleteItemMutation.isPending ? "…" : "Delete"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded bg-paper px-2 py-0.5 text-[11px] text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <MediaThumbnails item={item} />
      <AddMediaControl itemId={item.item_id} />

      {deleteItemMutation.isError && (
        <p className="mt-2 text-xs text-danger">
          {deleteItemMutation.error?.response?.data?.detail || deleteItemMutation.error?.message}
        </p>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field.type === "bool") {
    return (
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.name.replace(/_/g, " ")}
        {field.required && <span className="text-danger">*</span>}
      </label>
    );
  }
  if (field.type === "location_fees") {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          {field.name.replace(/_/g, " ")} — JSON, e.g. {"{"}"Lagos Mainland": 800, "Lagos Island": 1200{"}"}
        </label>
        <textarea
          className="min-h-16 w-full rounded-[8px] border border-line px-3 py-2 font-mono text-xs"
          placeholder='{"Area name": 800}'
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">
        {field.name.replace(/_/g, " ")}
        {field.required && <span className="text-danger"> *</span>}
      </label>
      <Input
        type={field.type === "int" || field.type === "float" ? "number" : "text"}
        step={field.type === "float" ? "0.01" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AddItemForm({ fields, onDone }) {
  const [values, setValues] = useState({});
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => api.createCatalogItem(payload),
    onSuccess: () => {
      setValues({});
      onDone();
    },
    onError: (err) => setError(err.response?.data?.detail || err.message),
  });

  function handleSubmit() {
    setError("");
    const payload = {};
    for (const field of fields) {
      let v = values[field.name];
      if (v === undefined || v === "") {
        if (field.required) {
          setError(`${field.name.replace(/_/g, " ")} is required`);
          return;
        }
        continue;
      }
      if (field.type === "int") v = parseInt(v, 10);
      else if (field.type === "float") v = parseFloat(v);
      else if (field.type === "location_fees") {
        try {
          v = JSON.parse(v);
        } catch {
          setError(`${field.name.replace(/_/g, " ")} must be valid JSON`);
          return;
        }
      }
      payload[field.name] = v;
    }
    mutation.mutate(payload);
  }

  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.name} className={field.type === "location_fees" ? "col-span-2" : ""}>
            <FieldInput
              field={field}
              value={values[field.name]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Adding…" : "Add item"}
        </Button>
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Add the item first, then attach photos to it — that's a separate step on each item's card below.
      </p>
    </div>
  );
}

function CsvUploadControl({ fields, onDone }) {
  const [pendingFile, setPendingFile] = useState(null);
  const [result, setResult] = useState(null); // { count } on success
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadCatalogCsv(pendingFile),
    onSuccess: (items) => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      setResult({ count: items.length });
      setPendingFile(null);
    },
  });

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setPendingFile(file);
  }

  const columnNames = fields.map((f) => f.name).join(", ");

  return (
    <div className="rounded-[10px] border border-line bg-surface p-4">
      <p className="mb-2 text-sm text-ink">Upload a CSV — one row per item.</p>
      <p className="mb-3 text-xs text-muted">
        Header row with these column names (case-insensitive): <span className="font-mono">{columnNames}</span>.
        Required: {fields.filter((f) => f.required).map((f) => f.name).join(", ") || "none"}.
      </p>

      <div className="flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-line px-3 py-1.5 text-sm text-ink hover:border-accent">
          {pendingFile ? pendingFile.name : "Choose CSV file"}
          <input type="file" accept=".csv" className="hidden" onChange={handleFileChosen} />
        </label>
        {pendingFile && (
          <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading…" : "Upload"}
          </Button>
        )}
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>

      {result && (
        <p className="mt-2 text-sm text-accent-dark">
          Added {result.count} item{result.count === 1 ? "" : "s"}.
        </p>
      )}
      {uploadMutation.isError && (
        <p className="mt-2 text-sm text-danger">
          {uploadMutation.error?.response?.data?.detail || uploadMutation.error?.message}
        </p>
      )}
    </div>
  );
}

export default function CatalogPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const itemsQuery = useQuery({ queryKey: ["catalog-items"], queryFn: () => api.listCatalogItems() });

  if (itemsQuery.isLoading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }
  if (itemsQuery.isError) {
    return (
      <EmptyState
        title="Couldn't load your catalog"
        detail={itemsQuery.error?.message}
      />
    );
  }

  const fields = CATALOG_FIELDS;
  const items = itemsQuery.data;

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Catalog</h1>
        {!showAddForm && !showCsvUpload && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCsvUpload(true)}>
              Upload CSV
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={15} /> Add item
            </Button>
          </div>
        )}
      </div>
      <p className="mb-6 text-sm text-muted">
        {items.length} item{items.length === 1 ? "" : "s"}
      </p>


      {showAddForm && (
        <div className="mb-6">
          <AddItemForm fields={fields} onDone={() => setShowAddForm(false)} />
        </div>
      )}
      {showCsvUpload && (
        <div className="mb-6">
          <CsvUploadControl fields={fields} onDone={() => setShowCsvUpload(false)} />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="No catalog items yet" detail="Add your first item to get started." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard key={item.item_id} item={item} fields={fields} />
          ))}
        </div>
      )}
    </div>
  );
}
