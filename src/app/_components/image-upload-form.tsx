"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { usePostHog } from "posthog-js/react";
import { api } from "~/trpc/react";

// Form schema for image upload
const imageUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    "File size must be less than 10MB"
  ),
  description: z.string().max(1000).optional(),
});

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
};

interface ImageUploadFormProps {
  onSuccess?: (assetId: string, publicUrl: string) => void;
  onError?: (error: string) => void;
  asChild?: boolean; // When true, renders without form wrapper
}

export function ImageUploadForm({ onSuccess, onError, asChild = false }: ImageUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const posthog = usePostHog();

  const generateUploadUrl = api.asset.generateUploadUrl.useMutation();
  const confirmUpload = api.asset.confirmUpload.useMutation();

  const handleUpload = async (file: File, description: string) => {
    if (!file) return;

    // Validate the form data
    const validationResult = imageUploadSchema.safeParse({ file, description });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      setUploadError(errorMessage);
      
      // Report validation error to PostHog
      posthog?.capture("image_upload_validation_error", {
        error: errorMessage,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        validationErrors: validationResult.error.errors,
      });
      
      onError?.(errorMessage);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // Track upload start
    posthog?.capture("image_upload_started", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasDescription: !!description,
    });

    try {
      // Get image dimensions
      const { width, height } = await getImageDimensions(file);

      // Step 1: Generate presigned URL
      const uploadUrlResult = await generateUploadUrl.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        description,
      });

      if (!uploadUrlResult.success) {
        throw new Error("Failed to generate upload URL");
      }

      // Step 2: Upload file to R2 using presigned URL
      const uploadResponse = await fetch(uploadUrlResult.data.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Confirm upload and save to database
      const confirmResult = await confirmUpload.mutateAsync({
        objectKey: uploadUrlResult.data.objectKey,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        description,
      });

      if (!confirmResult.success) {
        throw new Error("Failed to confirm upload");
      }

      // Success!
      posthog?.capture("image_upload_success", {
        assetId: confirmResult.data.assetId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        width,
        height,
        hasDescription: !!description,
      });
      
      onSuccess?.(confirmResult.data.assetId, confirmResult.data.publicUrl ?? "");
      
      // Reset form
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);
      
      // Report upload error to PostHog
      posthog?.capture("image_upload_error", {
        error: errorMessage,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const form = useForm({
    defaultValues: {
      file: undefined as File | undefined,
      description: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.file) return;
      await handleUpload(value.file, value.description);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        form.setFieldValue("file", file);
        
        // Track file selection
        posthog?.capture("image_file_selected", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      }
    },
    [form, posthog]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const content = (
    <>
      <div>
        <label htmlFor="file">Image Upload</label>
        <div
          {...getRootProps()}
          style={{
            border: "2px dashed #ccc",
            borderRadius: "4px",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "#f0f0f0" : "transparent",
          }}
        >
          <input {...getInputProps()} />
          {form.state.values.file ? (
            <div>
              <p>Selected: {form.state.values.file.name}</p>
              <p>Size: {(form.state.values.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <p>
              {isDragActive
                ? "Drop the image here..."
                : "Drag & drop an image here, or click to select"}
            </p>
          )}
        </div>
        {uploadError?.includes("file") && (
          <div style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>
            {uploadError}
          </div>
        )}
      </div>

      <div style={{ marginTop: "16px" }}>
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={form.state.values.description}
          onChange={(e) => form.setFieldValue("description", e.target.value)}
          placeholder="Enter a description for the image (used as alt text)"
          rows={3}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical",
          }}
        />
        {uploadError?.includes("description") && (
          <div style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>
            {uploadError}
          </div>
        )}
      </div>

      {uploadError && (
        <div style={{ color: "red", fontSize: "14px", marginTop: "8px" }}>
          Error: {uploadError}
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        <button
          type={asChild ? "button" : "submit"}
          disabled={!form.state.values.file || isUploading}
          onClick={asChild ? () => {
            if (form.state.values.file) {
              handleUpload(form.state.values.file, form.state.values.description);
            }
          } : undefined}
          style={{
            padding: "8px 16px",
            backgroundColor: isUploading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
    </>
  );

  if (asChild) {
    return content;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {content}
    </form>
  );
}
