"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ClockIcon,
  ListTreeIcon,
  SquareDashedMousePointerIcon,
} from "lucide-react";
import { AppointmentsList } from "./AppointmentsList";
import { AppointmentSettings } from "./AppointmentSettings";
import { DateOverrides } from "./DateOverrides";

export function AppointmentsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Card className="h-full overflow-auto">
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <ListTreeIcon className="size-4" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="settings">
              <ClockIcon className="size-4" />
              Openingsuren
            </TabsTrigger>
            <TabsTrigger value="overrides">
              <SquareDashedMousePointerIcon className="size-4" />
              Uitzonderingen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AppointmentsList />
          </TabsContent>

          <TabsContent value="settings">
            <AppointmentSettings />
          </TabsContent>

          <TabsContent value="overrides">
            <DateOverrides />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
