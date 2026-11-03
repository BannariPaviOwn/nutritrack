"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { addFoodAction, type FoodActionState } from "@/lib/data/food";
import {
  compressMealPhoto,
  formatPhotoBytes,
} from "@/lib/compress-meal-photo";
import {
  MEAL_PHOTO_MAX_BYTES,
  MEAL_PHOTO_PICK_MAX_BYTES,
} from "@/lib/meal-photo-limits";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";

const initial: FoodActionState = {};

export function FoodForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(addFoodAction, initial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoSizes, setPhotoSizes] = useState<{
    original: number;
    compressed: number;
    didCompress: boolean;
  } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressedRef = useRef<File | null>(null);
  const photoInputId = useId();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (state.success) {
      clearPhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only clear on successful save
  }, [state.success]);

  function clearPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoName(null);
    setPhotoError(null);
    setPhotoSizes(null);
    setCompressing(false);
    compressedRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onPhotoChange(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoName(null);
    setPhotoError(null);
    setPhotoSizes(null);
    compressedRef.current = null;

    if (!file) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MEAL_PHOTO_PICK_MAX_BYTES) {
      setPhotoError("Photo is too large to process (max 15 MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setCompressing(true);
    try {
      const prepared = await compressMealPhoto(file);
      if (prepared.compressedBytes > MEAL_PHOTO_MAX_BYTES) {
        setPhotoError(
          `Photo is still too large after compression (${formatPhotoBytes(prepared.compressedBytes)}). Try a smaller image.`,
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      compressedRef.current = prepared.file;
      setPhotoName(file.name);
      setPhotoSizes({
        original: prepared.originalBytes,
        compressed: prepared.compressedBytes,
        didCompress: prepared.didCompress,
      });
      setPreviewUrl(URL.createObjectURL(prepared.file));
    } finally {
      setCompressing(false);
    }
  }

  async function handleAction(formData: FormData) {
    const compressed = compressedRef.current;
    if (compressed) {
      formData.set("photo", compressed);
    }
    return formAction(formData);
  }

  return (
    <form action={handleAction} className="space-y-4">
      <div>
        <Label htmlFor="logged_on">Date</Label>
        <Input id="logged_on" name="logged_on" type="date" defaultValue={defaultDate} required />
      </div>
      <div>
        <Label htmlFor="meal_type">Meal</Label>
        <Select id="meal_type" name="meal_type" defaultValue="breakfast" required>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="food_name">Food</Label>
        <Input
          id="food_name"
          name="food_name"
          required
          placeholder="Oatmeal with berries"
        />
      </div>
      <div>
        <Label htmlFor="calories">Calories (optional)</Label>
        <Input
          id="calories"
          name="calories"
          type="number"
          inputMode="numeric"
          min="0"
          max="10000"
          placeholder="320"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Homemade" />
      </div>

      <div>
        <Label htmlFor={photoInputId}>Photo (optional)</Label>
        <div className="rounded-xl border border-dashed border-teal-300/80 bg-teal-50/40 p-3">
          <input
            ref={fileInputRef}
            id={photoInputId}
            name="photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
            onChange={(e) => {
              void onPhotoChange(e.target.files?.[0] ?? null);
            }}
          />
          <p className="mt-2 text-xs text-slate-500">
            Take a photo or pick from your gallery. Compressed before save (max 2 MB).
          </p>
          {compressing ? (
            <p className="mt-2 text-sm text-slate-600">Compressing photo…</p>
          ) : null}
          {previewUrl ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={photoName ? `Preview of ${photoName}` : "Meal photo preview"}
                className="h-20 w-20 rounded-xl object-cover ring-1 ring-teal-900/10"
              />
              <div className="min-w-0 flex-1">
                {photoName ? (
                  <p className="truncate text-sm font-medium text-slate-800">{photoName}</p>
                ) : null}
                {photoSizes ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {photoSizes.didCompress
                      ? `${formatPhotoBytes(photoSizes.original)} → ${formatPhotoBytes(photoSizes.compressed)}`
                      : formatPhotoBytes(photoSizes.compressed)}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-1 text-sm font-semibold text-teal-800"
                >
                  Remove photo
                </button>
              </div>
            </div>
          ) : null}
          {photoError ? <p className="mt-2 text-sm text-rose-700">{photoError}</p> : null}
        </div>
      </div>

      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <Button
        type="submit"
        disabled={pending || compressing || Boolean(photoError)}
        className="w-full"
      >
        {pending ? "Saving…" : "Log meal"}
      </Button>
    </form>
  );
}
