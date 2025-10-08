import React from "react";
import { AppWindowIcon, CodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@radix-ui/react-checkbox";
import CreateInvoice from "./ui/createInvoice";

export default function InvoiceCreate() {
  return (
    <div className="flex w-30/31 mt-5 mx-3  sm:mx-7 sm:w-full flex-col gap-10  sm:h-9/11">
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Create Manually</TabsTrigger>
          <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
        </TabsList>
        <CreateInvoice />
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Invoice</CardTitle>
              <CardDescription>
                Upload the invoice here. After uploading your invoice entry will
                be created automatically.
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button>Upload Invoice pdf</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
