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

export default function InvoiceCreate() {
  return (
    <div className="flex w-full mt-5 mx-7 flex-col gap-6  h-9/11">
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Create Manually</TabsTrigger>
          <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Creation</CardTitle>
              <CardDescription>
                Fill the form to create an entry. Click save when you&apos;re
                done.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-name">Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter the name of your customer"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-username">Email</Label>
                <Input id="customer-email" placeholder="Enter the email " />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-username">Amount</Label>
                <Input
                  id="customer-email"
                  placeholder="Enter the total amount"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-username">
                  Set the invoice status
                </Label>
                <div className="flex gap-5 border border-neutral-200 py-2 rounded-md">
                  <label className="inline-flex items-center ml-5">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-green-500 text-white">
                      Success
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 h-fit w-fit px-2 py-1 rounded-2xl text-xs bg-neutral-300 text-neutral-600">
                      Accept terms
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Create Form</Button>
            </CardFooter>
          </Card>
        </TabsContent>
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
