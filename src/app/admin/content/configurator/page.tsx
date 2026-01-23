"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSiteContext } from "@/lib/permissions/site-context";
import { useRequireFeature } from "@/lib/permissions/useRequireFeature";
import { useAdminHeaderActions } from "@/components/admin/AdminHeaderContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2Icon,
  ListIcon,
  CoinsIcon,
  ChevronRightIcon,
} from "lucide-react";
import { t } from "@/config/strings";
import { CONFIGURATOR_PRODUCTS } from "@/config/configurator";
import type { ConfiguratorQuestion, ConfiguratorPricing } from "@/lib/configurator/types";

interface ProductSummary {
  slug: string;
  label: string;
  questionCount: number;
  hasPricing: boolean;
}

export default function ConfiguratorPage() {
  const { currentSite, loading: siteLoading } = useSiteContext();
  const { authorized, loading: permissionLoading } = useRequireFeature("configurator");
  const [activeTab, setActiveTab] = useState("products");
  const [questions, setQuestions] = useState<ConfiguratorQuestion[]>([]);
  const [pricing, setPricing] = useState<ConfiguratorPricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteLoading && currentSite) {
      loadData();
    }
  }, [currentSite, siteLoading]);

  const loadData = async () => {
    if (!currentSite) return;
    setLoading(true);
    try {
      const [questionsRes, pricingRes] = await Promise.all([
        fetch(`/api/admin/configurator/questions?siteId=${currentSite.id}`),
        fetch(`/api/admin/configurator/pricing?siteId=${currentSite.id}`),
      ]);

      if (!questionsRes.ok) throw new Error("Failed to fetch questions");
      if (!pricingRes.ok) throw new Error("Failed to fetch pricing");

      const [questionsData, pricingData] = await Promise.all([
        questionsRes.json(),
        pricingRes.json(),
      ]);

      setQuestions(questionsData);
      setPricing(pricingData);
    } catch (error) {
      console.error("Failed to load configurator data:", error);
      toast.error(t("admin.messages.dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Build product summaries
  const productSummaries: ProductSummary[] = useMemo(() => {
    const pricingMap = new Map(pricing.map((p) => [p.product_slug, p]));

    // Count questions per product
    const questionCounts = new Map<string, number>();
    // Count global questions
    const globalQuestionCount = questions.filter((q) => q.product_slug === null).length;

    for (const q of questions) {
      if (q.product_slug) {
        questionCounts.set(
          q.product_slug,
          (questionCounts.get(q.product_slug) || 0) + 1
        );
      }
    }

    return CONFIGURATOR_PRODUCTS.map((slug) => ({
      slug,
      label: formatProductName(slug),
      // Include global questions in count for each product
      questionCount: (questionCounts.get(slug) || 0) + globalQuestionCount,
      hasPricing: pricingMap.has(slug),
    }));
  }, [questions, pricing]);

  // Global questions count
  const globalQuestionsCount = useMemo(
    () => questions.filter((q) => q.product_slug === null).length,
    [questions]
  );

  // Header actions based on tab
  const headerActions = useMemo(() => {
    if (activeTab === "products") {
      return (
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/content/configurator/global">
            {t("admin.labels.allProducts")} ({globalQuestionsCount})
            <ChevronRightIcon className="size-4" />
          </Link>
        </Button>
      );
    }
    return null;
  }, [activeTab, globalQuestionsCount]);

  useAdminHeaderActions(headerActions);

  if (permissionLoading || !authorized) {
    return null;
  }

  const isLoading = loading || siteLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="products">
          <ListIcon className="size-4" />
          {t("admin.headings.questions")}
        </TabsTrigger>
        <TabsTrigger value="pricing">
          <CoinsIcon className="size-4" />
          {t("admin.headings.pricing")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        <ProductsTable products={productSummaries} />
      </TabsContent>

      <TabsContent value="pricing">
        <PricingTable products={productSummaries} pricing={pricing} />
      </TabsContent>
    </Tabs>
  );
}

function ProductsTable({ products }: { products: ProductSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("admin.labels.product")}</TableHead>
          <TableHead className="text-right">{t("admin.headings.questions")}</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.slug} className="group">
            <TableCell>
              <Link
                href={`/admin/content/configurator/${product.slug}`}
                className="font-medium hover:underline"
              >
                {product.label}
              </Link>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {product.questionCount} {product.questionCount === 1 ? "vraag" : "vragen"}
            </TableCell>
            <TableCell>
              <Button asChild size="icon" variant="ghost" className="size-8">
                <Link href={`/admin/content/configurator/${product.slug}`}>
                  <ChevronRightIcon className="size-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PricingTable({
  products,
  pricing,
}: {
  products: ProductSummary[];
  pricing: ConfiguratorPricing[];
}) {
  const pricingMap = new Map(pricing.map((p) => [p.product_slug, p]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("admin.labels.product")}</TableHead>
          <TableHead>{t("admin.labels.basePriceMin")}</TableHead>
          <TableHead>{t("admin.labels.basePriceMax")}</TableHead>
          <TableHead>{t("admin.labels.status")}</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const p = pricingMap.get(product.slug);
          return (
            <TableRow key={product.slug} className="group">
              <TableCell className="font-medium">{product.label}</TableCell>
              <TableCell>
                {p ? formatPrice(p.base_price_min) : "-"}
              </TableCell>
              <TableCell>
                {p ? formatPrice(p.base_price_max) : "-"}
              </TableCell>
              <TableCell>
                {p ? (
                  <Badge variant="default">{t("admin.misc.active")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("admin.misc.inactive")}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button asChild size="icon" variant="ghost" className="size-8">
                  <Link href={`/admin/content/configurator/pricing?product=${product.slug}`}>
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Helper functions
function formatProductName(slug: string): string {
  const names: Record<string, string> = {
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
  return names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
