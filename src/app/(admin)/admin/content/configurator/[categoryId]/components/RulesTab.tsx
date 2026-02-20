"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { toast } from "sonner";
import {
  EyeIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { t } from "@/config/strings";
import type { ConfiguratorQuestion } from "@/lib/configurator/types";
import type {
  VisibilityConfig,
  VisibilityOperator,
  VisibilityRule,
} from "@/lib/configurator/types";

// =============================================================================
// Types
// =============================================================================

interface Condition {
  id: string;
  sourceQuestionKey: string;
  operator: VisibilityOperator;
  value?: string | number;
}

interface Target {
  questionId: string;
  optionValue?: string;
  action: "show" | "hide";
}

interface SourceCard {
  id: string;
  logic: "all" | "any";
  conditions: Condition[];
  targets: Target[];
}

// =============================================================================
// Helpers
// =============================================================================

const OPS: Record<VisibilityOperator, string> = {
  equals: t("admin.misc.operatorEquals"),
  not_equals: t("admin.misc.operatorNotEquals"),
  includes: t("admin.misc.operatorIncludes"),
  not_includes: t("admin.misc.operatorNotIncludes"),
  is_empty: t("admin.misc.operatorIsEmpty"),
  is_not_empty: t("admin.misc.operatorIsNotEmpty"),
  greater_than: t("admin.misc.operatorGreaterThan"),
  less_than: t("admin.misc.operatorLessThan"),
};

const NO_VALUE: VisibilityOperator[] = ["is_empty", "is_not_empty"];

function opsFor(type: string): VisibilityOperator[] {
  switch (type) {
    case "single-select":
      return ["equals", "not_equals", "is_not_empty", "is_empty"];
    case "multi-select":
      return ["includes", "not_includes", "is_not_empty", "is_empty"];
    case "number":
      return ["greater_than", "less_than", "equals", "not_equals", "is_not_empty", "is_empty"];
    default:
      return ["is_not_empty", "is_empty"];
  }
}

let _id = 0;
const uid = (p: string) => `${p}-${++_id}`;
const emptyCond = (): Condition => ({
  id: uid("c"),
  sourceQuestionKey: "",
  operator: "equals",
  value: undefined,
});

function tk(t: Target) {
  return t.optionValue ? `${t.questionId}:${t.optionValue}` : t.questionId;
}

function tLabel(t: Target, qm: Map<string, ConfiguratorQuestion>) {
  const q = qm.get(t.questionId);
  if (!q) return "?";
  if (!t.optionValue) return q.label;
  const o = q.options?.find((x) => x.value === t.optionValue);
  return `${q.label} → ${o?.label ?? t.optionValue}`;
}

// Serialize conditions only (not action) for grouping
function serializeConditions(c: VisibilityConfig): string {
  const s = [...c.rules].sort((a, b) =>
    `${a.questionKey}|${a.operator}|${a.value}`.localeCompare(
      `${b.questionKey}|${b.operator}|${b.value}`,
    ),
  );
  return JSON.stringify({ logic: c.logic, rules: s });
}

function buildCards(questions: ConfiguratorQuestion[]): SourceCard[] {
  const g = new Map<string, { logic: "all" | "any"; conditions: Condition[]; targets: Target[] }>();

  const addTarget = (cfg: VisibilityConfig, target: Target) => {
    const key = serializeConditions(cfg);
    if (!g.has(key)) {
      g.set(key, {
        logic: cfg.logic,
        conditions: cfg.rules.map((r) => ({
          id: uid("c"),
          sourceQuestionKey: r.questionKey,
          operator: r.operator,
          value: r.value,
        })),
        targets: [],
      });
    }
    g.get(key)!.targets.push(target);
  };

  for (const q of questions) {
    if (q.visibility_rules?.rules?.length) {
      addTarget(q.visibility_rules, {
        questionId: q.id,
        action: q.visibility_rules.action ?? "show",
      });
    }
    for (const opt of q.options ?? []) {
      if (opt.visibility_rules?.rules?.length) {
        addTarget(opt.visibility_rules, {
          questionId: q.id,
          optionValue: opt.value,
          action: opt.visibility_rules.action ?? "show",
        });
      }
    }
  }

  return [...g.values()].map((e) => ({ id: uid("card"), ...e }));
}

function toConfig(
  card: SourceCard,
  action: "show" | "hide",
): VisibilityConfig | null {
  const v = card.conditions.filter(
    (c) =>
      c.sourceQuestionKey &&
      c.operator &&
      (NO_VALUE.includes(c.operator) || c.value !== undefined),
  );
  if (!v.length) return null;
  return {
    logic: card.logic,
    rules: v.map(
      (c): VisibilityRule => ({
        questionKey: c.sourceQuestionKey,
        operator: c.operator,
        ...(c.value !== undefined && !NO_VALUE.includes(c.operator)
          ? { value: c.value }
          : {}),
      }),
    ),
    ...(action === "hide" ? { action: "hide" } : {}),
  };
}

// =============================================================================
// Main
// =============================================================================

export function RulesTab({
  questions,
  siteId,
}: {
  questions: ConfiguratorQuestion[];
  siteId: string | undefined;
}) {
  const qMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const qByKey = useMemo(() => new Map(questions.map((q) => [q.question_key, q])), [questions]);
  const [cards, setCards] = useState(() => buildCards(questions));
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const usedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const c of cards) for (const t of c.targets) s.add(tk(t));
    return s;
  }, [cards]);

  // ── Persistence ──

  const persist = useCallback(
    async (targets: Target[], card: SourceCard) => {
      if (!siteId) return;
      const byQ = new Map<string, Target[]>();
      for (const t of targets) byQ.set(t.questionId, [...(byQ.get(t.questionId) ?? []), t]);
      await Promise.all(
        [...byQ.entries()].map(async ([qId, ts]) => {
          const q = qMap.get(qId);
          if (!q) return;
          const body: Record<string, unknown> = { siteId };
          // Question-level targets
          const qTarget = ts.find((t) => !t.optionValue);
          if (qTarget) {
            body.visibility_rules = toConfig(card, qTarget.action);
          }
          // Option-level targets
          const optTargets = ts.filter((t) => t.optionValue);
          if (optTargets.length && q.options) {
            const optMap = new Map(optTargets.map((t) => [t.optionValue!, t.action]));
            body.options = q.options.map((opt) => {
              const action = optMap.get(opt.value);
              if (action === undefined) return opt;
              const { visibility_rules: _, ...rest } = opt;
              const cfg = toConfig(card, action);
              return cfg ? { ...rest, visibility_rules: cfg } : rest;
            });
          }
          const r = await fetch(`/api/admin/configurator/questions/${qId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!r.ok) throw new Error("Save failed");
        }),
      );
    },
    [siteId, qMap],
  );

  const clearTargets = useCallback(
    async (targets: Target[]) => {
      if (!siteId) return;
      const byQ = new Map<string, Target[]>();
      for (const t of targets) byQ.set(t.questionId, [...(byQ.get(t.questionId) ?? []), t]);
      await Promise.all(
        [...byQ.entries()].map(async ([qId, ts]) => {
          const q = qMap.get(qId);
          if (!q) return;
          const body: Record<string, unknown> = { siteId };
          if (ts.some((t) => !t.optionValue)) body.visibility_rules = null;
          const optVals = new Set(ts.filter((t) => t.optionValue).map((t) => t.optionValue!));
          if (optVals.size && q.options) {
            body.options = q.options.map((opt) => {
              if (!optVals.has(opt.value)) return opt;
              const { visibility_rules: _, ...rest } = opt;
              return rest;
            });
          }
          const r = await fetch(`/api/admin/configurator/questions/${qId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!r.ok) throw new Error("Save failed");
        }),
      );
    },
    [siteId, qMap],
  );

  const saveCard = useCallback(
    async (card: SourceCard) => {
      setSaving((s) => new Set(s).add(card.id));
      try {
        await persist(card.targets, card);
        toast.success(t("admin.misc.ruleSaved"));
      } catch {
        toast.error(t("admin.misc.ruleSaveFailed"));
      }
      setSaving((s) => { const n = new Set(s); n.delete(card.id); return n; });
    },
    [persist],
  );

  // ── Card CRUD ──

  const addCard = () =>
    setCards((p) => [...p, { id: uid("card"), logic: "all", conditions: [emptyCond()], targets: [] }]);

  const removeCard = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    setCards((p) => p.filter((c) => c.id !== id));
    if (card.targets.length && siteId) {
      setSaving((s) => new Set(s).add(id));
      try { await clearTargets(card.targets); toast.success(t("admin.misc.ruleDeleted")); }
      catch { toast.error(t("admin.misc.ruleSaveFailed")); }
      setSaving((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  // ── Condition CRUD ──

  const addCondition = (cardId: string) =>
    setCards((p) => p.map((c) => c.id === cardId ? { ...c, conditions: [...c.conditions, emptyCond()] } : c));

  const removeCondition = async (cardId: string, condId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.conditions.length <= 1) return removeCard(cardId);
    let updated: SourceCard | undefined;
    setCards((p) =>
      p.map((c) => {
        if (c.id !== cardId) return c;
        const u = { ...c, conditions: c.conditions.filter((x) => x.id !== condId) };
        updated = u;
        return u;
      }),
    );
    if (updated?.targets.length) await saveCard(updated);
  };

  const updateCondition = async (
    cardId: string,
    condId: string,
    field: string,
    value: string | number | undefined,
  ) => {
    let updated: SourceCard | undefined;
    setCards((p) =>
      p.map((c) => {
        if (c.id !== cardId) return c;
        const u = {
          ...c,
          conditions: c.conditions.map((cond) => {
            if (cond.id !== condId) return cond;
            if (field === "sourceQuestionKey") {
              const sq = qByKey.get(value as string);
              return { ...cond, sourceQuestionKey: value as string, operator: (opsFor(sq?.type ?? "")[0] ?? "equals") as VisibilityOperator, value: undefined };
            }
            if (field === "operator") {
              return { ...cond, operator: value as VisibilityOperator, ...(NO_VALUE.includes(value as VisibilityOperator) ? { value: undefined } : {}) };
            }
            return { ...cond, value };
          }),
        };
        updated = u;
        return u;
      }),
    );
    if (updated?.targets.length) {
      const cond = updated.conditions.find((c) => c.id === condId);
      if (cond?.sourceQuestionKey && cond.operator && (NO_VALUE.includes(cond.operator) || cond.value !== undefined)) {
        await saveCard(updated);
      }
    }
  };

  const updateLogic = async (cardId: string, logic: "all" | "any") => {
    let updated: SourceCard | undefined;
    setCards((p) => p.map((c) => { if (c.id !== cardId) return c; const u = { ...c, logic }; updated = u; return u; }));
    if (updated?.targets.length) await saveCard(updated);
  };

  // ── Target CRUD ──

  const addTarget = async (cardId: string, questionId: string, optionValue?: string) => {
    const newT: Target = { questionId, optionValue, action: "show" };
    let updated: SourceCard | undefined;
    setCards((p) => p.map((c) => { if (c.id !== cardId) return c; const u = { ...c, targets: [...c.targets, newT] }; updated = u; return u; }));
    if (updated) {
      const cfg = toConfig(updated, "show");
      if (cfg) {
        setSaving((s) => new Set(s).add(cardId));
        try { await persist([newT], updated); toast.success(t("admin.misc.ruleSaved")); }
        catch { toast.error(t("admin.misc.ruleSaveFailed")); }
        setSaving((s) => { const n = new Set(s); n.delete(cardId); return n; });
      }
    }
  };

  const removeTarget = async (cardId: string, target: Target) => {
    setCards((p) => p.map((c) => c.id === cardId ? { ...c, targets: c.targets.filter((x) => tk(x) !== tk(target)) } : c));
    if (siteId) {
      setSaving((s) => new Set(s).add(cardId));
      try { await clearTargets([target]); toast.success(t("admin.misc.ruleSaved")); }
      catch { toast.error(t("admin.misc.ruleSaveFailed")); }
      setSaving((s) => { const n = new Set(s); n.delete(cardId); return n; });
    }
  };

  const updateTargetAction = async (cardId: string, target: Target, action: "show" | "hide") => {
    let updated: SourceCard | undefined;
    setCards((p) =>
      p.map((c) => {
        if (c.id !== cardId) return c;
        const u = { ...c, targets: c.targets.map((x) => tk(x) === tk(target) ? { ...x, action } : x) };
        updated = u;
        return u;
      }),
    );
    if (updated) {
      setSaving((s) => new Set(s).add(cardId));
      try { await persist([{ ...target, action }], updated); toast.success(t("admin.misc.ruleSaved")); }
      catch { toast.error(t("admin.misc.ruleSaveFailed")); }
      setSaving((s) => { const n = new Set(s); n.delete(cardId); return n; });
    }
  };

  // ── Render ──

  if (questions.length < 2) {
    return (
      <Empty className="border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon"><EyeIcon className="size-5" /></EmptyMedia>
          <EmptyTitle>{t("admin.empty.noRules")}</EmptyTitle>
          <EmptyDescription>Voeg minimaal twee vragen toe voordat je regels kunt instellen.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!cards.length) {
    return (
      <Empty className="border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon"><EyeIcon className="size-5" /></EmptyMedia>
          <EmptyTitle>{t("admin.empty.noRules")}</EmptyTitle>
          <EmptyDescription>{t("admin.empty.noRulesDesc")}</EmptyDescription>
        </EmptyHeader>
        <Button size="sm" variant="outline" onClick={addCard}>
          <PlusIcon className="size-4" /> {t("admin.misc.addRule")}
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <RuleCard
          key={card.id}
          card={card}
          questions={questions}
          qMap={qMap}
          qByKey={qByKey}
          usedKeys={usedKeys}
          isSaving={saving.has(card.id)}
          onLogicChange={(l) => updateLogic(card.id, l)}
          onAddCondition={() => addCondition(card.id)}
          onRemoveCondition={(cId) => removeCondition(card.id, cId)}
          onUpdateCondition={(cId, f, v) => updateCondition(card.id, cId, f, v)}
          onAddTarget={(qId, ov) => addTarget(card.id, qId, ov)}
          onRemoveTarget={(tgt) => removeTarget(card.id, tgt)}
          onUpdateTargetAction={(tgt, a) => updateTargetAction(card.id, tgt, a)}
          onRemove={() => removeCard(card.id)}
        />
      ))}
      <Button size="sm" variant="outline" onClick={addCard}>
        <PlusIcon className="size-4" /> {t("admin.misc.addRule")}
      </Button>
    </div>
  );
}

// =============================================================================
// Rule Card — reads as "if [condition] then [show/hide] [target]"
// =============================================================================

function RuleCard({
  card,
  questions,
  qMap,
  qByKey,
  usedKeys,
  isSaving,
  onLogicChange,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onAddTarget,
  onRemoveTarget,
  onUpdateTargetAction,
  onRemove,
}: {
  card: SourceCard;
  questions: ConfiguratorQuestion[];
  qMap: Map<string, ConfiguratorQuestion>;
  qByKey: Map<string, ConfiguratorQuestion>;
  usedKeys: Set<string>;
  isSaving: boolean;
  onLogicChange: (l: "all" | "any") => void;
  onAddCondition: () => void;
  onRemoveCondition: (id: string) => void;
  onUpdateCondition: (id: string, field: string, value: string | number | undefined) => void;
  onAddTarget: (questionId: string, optionValue?: string) => void;
  onRemoveTarget: (t: Target) => void;
  onUpdateTargetAction: (t: Target, action: "show" | "hide") => void;
  onRemove: () => void;
}) {
  const multi = card.conditions.length > 1;

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <EyeIcon className="size-4 text-muted-foreground" />
          {isSaving && <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ── IF ── */}
        {multi && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Als</span>
            <Select value={card.logic} onValueChange={(v) => onLogicChange(v as "all" | "any")}>
              <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.misc.logicAll")}</SelectItem>
                <SelectItem value="any">{t("admin.misc.logicAny")}</SelectItem>
              </SelectContent>
            </Select>
            <span>{t("admin.misc.logicSuffix")}</span>
          </div>
        )}

        <div className="space-y-2">
          {card.conditions.map((cond, i) => (
            <ConditionRow
              key={cond.id}
              condition={cond}
              prefix={!multi && i === 0 ? "Als" : undefined}
              questions={questions}
              qByKey={qByKey}
              showRemove={multi}
              onUpdate={(f, v) => onUpdateCondition(cond.id, f, v)}
              onRemove={() => onRemoveCondition(cond.id)}
            />
          ))}
        </div>

        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onAddCondition}>
          <PlusIcon className="size-3.5" /> {t("admin.misc.addCondition")}
        </Button>

        {/* ── THEN ── */}
        <div className="space-y-2 border-t pt-3">
          {card.targets.map((target) => (
            <div key={tk(target)} className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
              <Select
                value={target.action}
                onValueChange={(v) => onUpdateTargetAction(target, v as "show" | "hide")}
              >
                <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs font-medium shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">{t("admin.misc.actionShow")}</SelectItem>
                  <SelectItem value="hide">{t("admin.misc.actionHide")}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm truncate">{tLabel(target, qMap)}</span>
              <Button size="icon" variant="ghost" className="size-6 shrink-0 text-muted-foreground hover:text-destructive ml-auto" onClick={() => onRemoveTarget(target)}>
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}

          <TargetAdder questions={questions} qMap={qMap} usedKeys={usedKeys} onAdd={onAddTarget} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Target Adder — two dropdowns: pick question, then pick scope
// =============================================================================

function TargetAdder({
  questions,
  qMap,
  usedKeys,
  onAdd,
}: {
  questions: ConfiguratorQuestion[];
  qMap: Map<string, ConfiguratorQuestion>;
  usedKeys: Set<string>;
  onAdd: (questionId: string, optionValue?: string) => void;
}) {
  const [selQ, setSelQ] = useState("");

  const available = useMemo(
    () =>
      questions.filter((q) => {
        if (!usedKeys.has(q.id)) return true;
        const hasOpts = q.options && (q.type === "single-select" || q.type === "multi-select");
        return hasOpts && q.options!.some((o) => !usedKeys.has(`${q.id}:${o.value}`));
      }),
    [questions, usedKeys],
  );

  const selectedQ = qMap.get(selQ);
  const hasOpts = selectedQ?.options && (selectedQ.type === "single-select" || selectedQ.type === "multi-select");

  const scopeItems = useMemo(() => {
    if (!selectedQ) return [];
    const items: { key: string; label: string; optionValue?: string }[] = [];
    if (!usedKeys.has(selectedQ.id)) items.push({ key: "__q__", label: "Hele vraag" });
    if (hasOpts) {
      for (const o of selectedQ.options!) {
        if (!usedKeys.has(`${selectedQ.id}:${o.value}`)) {
          items.push({ key: o.value, label: o.label, optionValue: o.value });
        }
      }
    }
    return items;
  }, [selectedQ, hasOpts, usedKeys]);

  if (!available.length) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selQ}
        onValueChange={(qId) => {
          const q = qMap.get(qId);
          if (!q) return;
          const isSelect = q.type === "single-select" || q.type === "multi-select";
          if (!isSelect || !q.options?.length) {
            onAdd(q.id);
            setSelQ("");
          } else {
            setSelQ(qId);
          }
        }}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder={t("admin.misc.ruleSelectQuestion")} />
        </SelectTrigger>
        <SelectContent>
          {available.map((q) => (
            <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selQ && scopeItems.length > 0 && (
        <Select
          value=""
          onValueChange={(key) => {
            onAdd(selectedQ!.id, key === "__q__" ? undefined : key);
            setSelQ("");
          }}
        >
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder={t("admin.misc.selectTarget")} />
          </SelectTrigger>
          <SelectContent>
            {scopeItems.map((i) => (
              <SelectItem key={i.key} value={i.key}>{i.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selQ && (
        <Button size="icon" variant="ghost" className="size-7" onClick={() => setSelQ("")}>
          <XIcon className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// Condition Row
// =============================================================================

function ConditionRow({
  condition,
  prefix,
  questions,
  qByKey,
  showRemove,
  onUpdate,
  onRemove,
}: {
  condition: Condition;
  prefix?: string;
  questions: ConfiguratorQuestion[];
  qByKey: Map<string, ConfiguratorQuestion>;
  showRemove: boolean;
  onUpdate: (field: string, value: string | number | undefined) => void;
  onRemove: () => void;
}) {
  const src = qByKey.get(condition.sourceQuestionKey);
  const ops = src ? opsFor(src.type) : [];
  const needsValue = !NO_VALUE.includes(condition.operator);
  const isSel = src?.type === "single-select" || src?.type === "multi-select";
  const isNum = src?.type === "number";

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-2">
      {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}

      <Select value={condition.sourceQuestionKey} onValueChange={(v) => onUpdate("sourceQuestionKey", v)}>
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder={t("admin.misc.ruleSelectQuestion")} />
        </SelectTrigger>
        <SelectContent>
          {questions.map((q) => (
            <SelectItem key={q.question_key} value={q.question_key}>{q.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={(v) => onUpdate("operator", v)} disabled={!condition.sourceQuestionKey}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder={t("admin.misc.ruleSelectOperator")} />
        </SelectTrigger>
        <SelectContent>
          {ops.map((op) => (
            <SelectItem key={op} value={op}>{OPS[op]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        <>
          {isSel && src?.options ? (
            <Select value={condition.value !== undefined ? String(condition.value) : ""} onValueChange={(v) => onUpdate("value", v)}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder={t("admin.misc.ruleSelectValue")} />
              </SelectTrigger>
              <SelectContent>
                {src.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : isNum ? (
            <Input type="number" className="h-8 w-[100px] text-xs" placeholder="0"
              value={condition.value !== undefined ? String(condition.value) : ""}
              onChange={(e) => onUpdate("value", e.target.value === "" ? undefined : Number(e.target.value))}
            />
          ) : (
            <Input type="text" className="h-8 w-[150px] text-xs"
              value={condition.value !== undefined ? String(condition.value) : ""}
              onChange={(e) => onUpdate("value", e.target.value === "" ? undefined : e.target.value)}
            />
          )}
        </>
      )}

      {showRemove ? (
        <Button size="icon" variant="ghost" className="size-7 shrink-0 text-muted-foreground hover:text-destructive ml-auto" onClick={onRemove}>
          <Trash2Icon className="size-3.5" />
        </Button>
      ) : (
        <div className="ml-auto" />
      )}
    </div>
  );
}
