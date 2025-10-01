"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Payment } from "./types";
import Image from "next/image";

export function createColumns({
  onEditClick,
}: {
  onEditClick: (invoice: Payment) => void;
}): ColumnDef<Payment>[] {
  return [
    {
      accessorKey: "pfp",
      header: "",
      cell: ({ row }) => (
        <div className="h-6 w-6 ml-2 rounded-full bg-gray-200 overflow-hidden">
          {row.getValue("pfp") ? (
            <Image
              src={String(row.getValue("pfp"))}
              height={30}
              width={30}
              alt="users pfp"
            />
          ) : (
            <User2 />
          )}
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: () => <p className="bg-amber-30">Customer</p>,
      cell: ({ row }) => (
        <div className="h-full w-full">
          <div className="capitalize">{row.getValue("customer")}</div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("date")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize bg-amber-30">
          <div
            className={`h-fit w-fit px-2 py-1 rounded-2xl text-xs ${
              row.getValue("status") === true
                ? "bg-green-500 text-white"
                : "bg-neutral-300 text-neutral-600"
            }`}
          >
            {row.getValue("status") ? "Success" : "Pending"}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy Invoice No.
              </DropdownMenuItem>
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditClick(payment)}>
                Edit Row
              </DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
