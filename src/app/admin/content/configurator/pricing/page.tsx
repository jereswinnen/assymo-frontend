"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckIcon,
  CoinsIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CONFIGURATOR_PRODUCTS } from "@/config/configurator";
import type {
  ConfiguratorPricing,
  ConfiguratorQuestion,
  PriceModifier,
} from "@/lib/configurator/types";

const PRODUCT_LABELS: Record<string, string> = {
  poolhouses: "Poolhouses",
  carports: "Carports",
  poorten: "Poorten",
  guesthouse: "Guesthouse",
  tuinkamers: "Tuinkamers",
  "tuinhuizen-op-maat": "Tuinhuizen op maat",
  bijgebouwen: "Bijgebouwen",
  overdekkingen: "Overdekkingen",
  woninguitbreiding: "Woninguitbreiding",
};

function PricingPageContent() {
  const searchParams = useSearchParams();
  const initialProduct = searchParams.get("product") || CONFIGURATOR_PRODUCTS[0];

  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");

  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [pricing, setPricing] = useState<ConfiguratorPricing | null>(null);
  const [questions, setQuestions] = useState<ConfiguratorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [basePriceMin, setBasePriceMin] = useState("");
  const [basePriceMax, setBasePriceMax] = useState("");
  const [priceModifiers, setPriceModifiers] = useState<PriceModifier[]>([]);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({
    basePriceMin: "",
    basePriceMax: "",
    priceModifiers: [] as PriceModifier[],
  });

  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadData();
    }
  }, [currentSite, siteLoading, selectedProduct]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const [pricingRes, questionsRes] = await Promise.all([
        fetch(`/api/admin/configurator/pricing?siteId=${currentSite.id}`),
        fetch(
          `/api/admin/configurator/questions?siteId=${currentSite.id}&productSlug=${selectedProduct}`
        ),
      ]);

      if (!pricingRes.ok) throw new Error("Failed to fetch pricing");
      if (!questionsRes.ok) throw new Error("Failed to fetch questions");

      const [allPricing, questionsData] = await Promise.all([
        pricingRes.json(),
        questionsRes.json(),
      ]);

      const productPricing = (allPricing as ConfiguratorPricing[]).find(
        (p) => p.product_slug === selectedProduct
      );

      setPricing(productPricing || null);
      setQuestions(questionsData);

      // Initialize form state
      if (productPricing) {
        const minStr = (productPricing.base_price_min / 100).toString();
        const maxStr = (productPricing.base_price_max / 100).toString();
        setBasePriceMin(minStr);
        setBasePriceMax(maxStr);
        setPriceModifiers(productPricing.price_modifiers || []);
        setOriginalValues({
          basePriceMin: minStr,
          basePriceMax: maxStr,
          priceModifiers: productPricing.price_modifiers || [],
        });
      } else {
        setBasePriceMin("");
        setBasePriceMax("");
        setPriceModifiers([]);
        setOriginalValues({
          basePriceMin: "",
          basePriceMax: "",
          priceModifiers: [],
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error(t("admin.messages.pricingLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Get select-type questions for modifiers
  const selectQuestions = useMemo(
    () =>
      questions.filter(
        (q) => q.type === "single-select" || q.type === "multi-select"
      ),
    [questions]
  );

  // Check for changes
  const hasChanges = useMemo(() => {
    return (
      basePriceMin !== originalValues.basePriceMin ||
      basePriceMax !== originalValues.basePriceMax ||
      JSON.stringify(priceModifiers) !== JSON.stringify(originalValues.priceModifiers)
    );
  }, [basePriceMin, basePriceMax, priceModifiers, originalValues]);

  const handleSave = useCallback(async () => {
    if (!currentSite) return;

    const minCents = Math.round(parseFloat(basePriceMin || "0") * 100);
    const maxCents = Math.round(parseFloat(basePriceMax || "0") * 100);

    if (minCents <= 0 || maxCents <= 0) {
      toast.error("Vul geldige prijzen in");
      return;
    }

    if (minCents > maxCents) {
      toast.error("Minimumprijs moet lager zijn dan maximumprijs");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/configurator/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: currentSite.id,
          product_slug: selectedProduct,
          base_price_min: minCents,
          base_price_max: maxCents,
          price_modifiers: priceModifiers.filter(
            (m) => m.questionKey && m.optionValue
          ),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(t("admin.messages.pricingSaved"));
      loadData(); // Reload to get updated data
    } catch (error) {
      console.error("Failed to save pricing:", error);
      toast.error(t("admin.messages.pricingSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [currentSite, selectedProduct, basePriceMin, basePriceMax, priceModifiers]);

  const addModifier = () => {
    setPriceModifiers([
      ...priceModifiers,
      { questionKey: "", optionValue: "", modifier: 0 },
    ]);
  };

  const updateModifier = (
    index: number,
    field: keyof PriceModifier,
    value: string | number
  ) => {
    const newModifiers = [...priceModifiers];
    if (field === "modifier") {
      // Convert euro input to cents
      const euros = parseFloat(value as string) || 0;
      newModifiers[index] = {
        ...newModifiers[index],
        modifier: Math.round(euros * 100),
      };
    } else {
      newModifiers[index] = { ...newModifiers[index], [field]: value };
    }
    setPriceModifiers(newModifiers);
  };

  const removeModifier = (index: number) => {
    setPriceModifiers(priceModifiers.filter((_, i) => i !== index));
  };

  // Get options for a question
  const getQuestionOptions = (questionKey: string) => {
    const question = questions.find((q) => q.question_key === questionKey);
    return question?.options || [];
  };

  // Header actions
  const headerActions = useMemo(
    () => (
      <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
        {saving ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {t("admin.loading.saving")}
          </>
        ) : (
          <>
            <CheckIcon className="size-4" />
            {t("admin.buttons.save")}
          </>
        )}
      </Button>
    ),
    [handleSave, saving, hasChanges]
  );
  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  const isLoading = loading || siteLoading;

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/content/configurator">Configurator</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("admin.headings.pricing")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product selector */}
      <Field className="max-w-xs">
        <FieldLabel>{t("admin.labels.product")}</FieldLabel>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONFIGURATOR_PRODUCTS.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {PRODUCT_LABELS[slug] || slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Base Price Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.headings.pricing")}</CardTitle>
              <CardDescription>
                Stel de basis prijsindicatie in voor {PRODUCT_LABELS[selectedProduct]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <Field>
                    <FieldLabel htmlFor="base-price-min">
                      {t("admin.labels.basePriceMin")} (EUR)
                    </FieldLabel>
                    <Input
                      id="base-price-min"
                      type="number"
                      value={basePriceMin}
                      onChange={(e) => setBasePriceMin(e.target.value)}
                      placeholder="35000"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="base-price-max">
                      {t("admin.labels.basePriceMax")} (EUR)
                    </FieldLabel>
                    <Input
                      id="base-price-max"
                      type="number"
                      value={basePriceMax}
                      onChange={(e) => setBasePriceMax(e.target.value)}
                      placeholder="75000"
                    />
                  </Field>
                </FieldSet>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Price Modifiers Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.labels.priceModifiers")}</CardTitle>
              <CardDescription>
                Prijsaanpassingen op basis van antwoorden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectQuestions.length === 0 ? (
                <Empty className="py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CoinsIcon className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">Geen vragen</EmptyTitle>
                    <EmptyDescription>
                      Voeg eerst keuzevragen toe om prijsmodifiers in te stellen.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {priceModifiers.map((modifier, index) => (
                    <div
                      key={index}
                      className="group flex gap-2 p-3 bg-muted/50 rounded-md"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={modifier.questionKey}
                          onValueChange={(v) =>
                            updateModifier(index, "questionKey", v)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecteer vraag" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectQuestions.map((q) => (
                              <SelectItem key={q.question_key} value={q.question_key}>
                                {q.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Select
                            value={modifier.optionValue}
                            onValueChange={(v) =>
                              updateModifier(index, "optionValue", v)
                            }
                            disabled={!modifier.questionKey}
                          >
                            <SelectTrigger className="h-9 flex-1">
                              <SelectValue placeholder="Selecteer optie" />
                            </SelectTrigger>
                            <SelectContent>
                              {getQuestionOptions(modifier.questionKey).map(
                                (opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={modifier.modifier ? modifier.modifier / 100 : ""}
                            onChange={(e) =>
                              updateModifier(index, "modifier", e.target.value)
                            }
                            placeholder="EUR"
                            className="h-9 w-24"
                          />
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeModifier(index)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addModifier}
                  >
                    <PlusIcon className="size-4" />
                    Modifier toevoegen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}
