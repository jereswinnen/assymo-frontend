"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { toast } from "sonner";
import { UserIcon, Loader2Icon, CheckIcon, CameraIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileSection() {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        if (session.user.name) {
          setName(session.user.name);
          setOriginalName(session.user.name);
        }
        if (session.user.image) {
          setImage(session.user.image);
        }
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Alleen afbeeldingen zijn toegestaan");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Afbeelding mag maximaal 2MB zijn");
      return;
    }

    setUploadingImage(true);
    try {
      // Upload to blob storage
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadResponse.json();

      // Update user with new image URL
      const { error } = await authClient.updateUser({
        image: url,
      });

      if (error) {
        throw new Error(error.message);
      }

      setImage(url);
      toast.success("Profielfoto gewijzigd");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Kon profielfoto niet uploaden");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Naam mag niet leeg zijn");
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
      });

      if (error) {
        toast.error(error.message || "Kon naam niet wijzigen");
        return;
      }

      setOriginalName(name.trim());
      toast.success("Naam gewijzigd");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Er is een fout opgetreden");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = name.trim() !== originalName;

  return (
    <FieldSet>
      <FieldLegend className="flex items-center gap-1.5 font-semibold">
        <UserIcon className="size-4 opacity-80" />
        Profiel
      </FieldLegend>

      <Field>
        <FieldLabel>Profielfoto</FieldLabel>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarImage src={image || undefined} asChild>
                {image && (
                  <Image
                    src={image}
                    alt={name || "Profielfoto"}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                )}
              </AvatarImage>
              <AvatarFallback className="text-lg">
                {name ? getInitials(name) : "?"}
              </AvatarFallback>
            </Avatar>
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2Icon className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              <CameraIcon className="size-4" />
              Foto wijzigen
            </Button>
          </div>
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="name">Naam</FieldLabel>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </Field>

      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-fit"
      >
        {saving ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        Opslaan
      </Button>
    </FieldSet>
  );
}
